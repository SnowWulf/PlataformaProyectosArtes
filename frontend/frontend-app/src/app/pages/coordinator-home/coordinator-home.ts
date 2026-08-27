import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';

import { UserService } from '../../services/user-service';
import { ProjectService } from '../../services/project-service';
import { DocumentService } from '../../services/document';
import { NotificationService } from '../../services/notification-service';

import { User } from '../../models/user';
import { Project } from '../../models/project';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-coordinator-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './coordinator-home.html',
  styleUrl: './coordinator-home.scss'
})
export class CoordinatorHome implements OnInit, OnDestroy {

  enviandoRecordatorioMap: { [key: number]: boolean } = {};
  recordatoriosEnviadosMap: { [key: number]: number } = {};
  mostrarModalProyectosTutor: boolean = false;
  tutorSeleccionadoVer: User | null = null;
  proyectosDelTutor: Project[] = []; 
  desvinculandoProyectoMap: { [key: number]: boolean } = {};

  private destroy$ = new Subject<void>();

  vistaActiva: string = 'alertas';

  totalEstudiantes = 0;
  totalTutores = 0;
  totalProyectos = 0;
  totalDocumentos = 0;
  proyectosSinTutorCount = 0;
  pendientesRevision = 0;
  revisionesDemoradas = 0;
  tutoresSobrecargados = 0;

  usuarios: User[] = [];
  proyectos: Project[] = [];
  estudiantes: User[] = [];
  tutores: User[] = [];
  documentosSistema: any[] = [];

  busquedaKanban: string = '';
  busquedaGeneral: string = '';
  criterioOrden: string = 'reciente';

  busquedaArchivo: string = '';
  filtroAnio: string = '';
  repositorioList: any[] = [];

  // --- ESTADOS PARA MODALES Y NOTIFICACIONES ---
  mostrarModalTutor: boolean = false;
  proyectoSeleccionadoModal: Project | null = null;
  tutorSeleccionadoId: number | string = '';
  guardandoTutor: boolean = false;

  mensajeToast: string = '';
  tipoToast: 'exito' | 'error' | 'info' = 'exito';
  mostrarToast: boolean = false;

  constructor(
    private userService: UserService,
    private projectService: ProjectService,
    private documentService: DocumentService,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.cargarRecordatoriosLocales();
    this.cargarDatosGenerales();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- CONTROL DE COOLDOWN 24H CON LOCALSTORAGE ---

  cargarRecordatoriosLocales(): void {
    const data = localStorage.getItem('recordatorios_tutores');
    if (data) {
      try {
        this.recordatoriosEnviadosMap = JSON.parse(data);
      } catch (e) {
        this.recordatoriosEnviadosMap = {};
      }
    }
  }

  guardarRecordatorioLocal(docId: number): void {
    this.recordatoriosEnviadosMap[docId] = Date.now();
    localStorage.setItem('recordatorios_tutores', JSON.stringify(this.recordatoriosEnviadosMap));
  }

  esRecordatorioReciente(docId: number): boolean {
    const ultimoEnvio = this.recordatoriosEnviadosMap[docId];
    if (!ultimoEnvio) return false;

    const horasTranscurridas = (Date.now() - ultimoEnvio) / (1000 * 60 * 60);
    return horasTranscurridas < 24; // Retorna true si pasaron menos de 24 horas
  }

  // --- CARGA DE DATOS Y MÉTODOS GENERALES ---

  cargarDatosGenerales(): void {
    forkJoin({
      users: this.userService.getUsers().pipe(catchError(() => of([]))),
      projects: this.projectService.getProjects().pipe(catchError(() => of([])))
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ users, projects }) => {
          this.usuarios = users || [];
          this.estudiantes = this.usuarios.filter(u => u.role?.nombre?.toLowerCase() === 'estudiante');
          this.tutores = this.usuarios.filter(u => u.role?.nombre?.toLowerCase() === 'tutor');
          this.totalEstudiantes = this.estudiantes.length;
          this.totalTutores = this.tutores.length;

          this.proyectos = projects || [];
          this.totalProyectos = this.proyectos.length;
          this.proyectosSinTutorCount = this.proyectos.filter(p => !p.tutor_id).length;

          this.evaluarTutoresSobrecargados();

          if (this.proyectos.length > 0) {
            this.cargarDocumentosProyectos(this.proyectos);
          } else {
            this.documentosSistema = [];
            this.totalDocumentos = 0;
            this.cdr.detectChanges();
          }
        },
        error: err => console.error('Error al cargar datos generales:', err)
      });
  }

  private cargarDocumentosProyectos(projects: Project[]): void {
    const pms = projects.map(project =>
      this.documentService.getByProject(project.id).pipe(
        catchError(() => of([]))
      )
    );

    forkJoin(pms)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (docsPorProyecto: any[]) => {
          const todosLosDocs: any[] = [];
          let revDemoradas = 0;
          let pendientes = 0;

          docsPorProyecto.forEach((documents, idx) => {
            const project = projects[idx];
            const docsArray: any[] = Array.isArray(documents) ? documents : [];

            docsArray.forEach(doc => {
              const docNormalizado = {
                ...doc,
                proyectoId: project.id,
                proyectoTitulo: project.titulo
              };
              todosLosDocs.push(docNormalizado);

              const esPendiente = doc.estado === 'Pendiente revisión' || doc.estado === 'submitted' || doc.estado === 'Pendiente';
              if (esPendiente) {
                pendientes++;
                if (this.diasPendiente(doc.created_at) > 7) {
                  revDemoradas++;
                }
              }
            });
          });

          this.documentosSistema = todosLosDocs;
          this.totalDocumentos = todosLosDocs.length;
          this.pendientesRevision = pendientes;
          this.revisionesDemoradas = revDemoradas;

          this.cdr.detectChanges();
        },
        error: err => console.error('Error procesando documentos:', err)
      });
  }

  get totalAlertas(): number {
    return this.proyectosEsperandoTutor.length + this.revisionesDemoradas + this.tutoresSobrecargados;
  }

  get proyectosEsperandoTutor(): Project[] {
    if (!this.proyectos) return [];
    return this.proyectos.filter(p => {
      const sinTutor = !p.tutor_id;
      const tieneSolicitudTutor = (p as any).tutor_requests && (p as any).tutor_requests.length > 0;
      return sinTutor && tieneSolicitudTutor;
    });
  }

  get proyectosSinTutorList(): Project[] {
    return this.proyectos.filter(p => !p.tutor_id);
  }

  // Lista de documentos estancados ordenada de mayor a menor tiempo en espera
  // 1. Getter ajustado: Mantiene primero los NO enviados (ordenados por días de retraso) 
  // y manda AL FINAL los que ya fueron notificados hoy.
  get documentosEstancadosList(): any[] {
    const filtrados = this.documentosSistema.filter(d => {
      const esPendiente = d.estado === 'Pendiente revisión' || d.estado === 'submitted' || d.estado === 'Pendiente';
      return esPendiente && this.diasPendiente(d.created_at) > 7;
    });

    return filtrados.sort((a, b) => {
      const enviadoA = this.esRecordatorioReciente(a.id);
      const enviadoB = this.esRecordatorioReciente(b.id);

      // Si uno ya fue enviado y el otro no, enviar al fondo el ya enviado
      if (enviadoA && !enviadoB) return 1;  // 'a' pasa abajo
      if (!enviadoA && enviadoB) return -1; // 'b' pasa abajo

      // Si ambos están en el mismo estado, ordenar por días de retraso (el mayor primero)
      return this.diasPendiente(b.created_at) - this.diasPendiente(a.created_at);
    });
  }

  getProyectosPorEtapa(columna: string): Project[] {
    if (!this.proyectos) return [];
    return this.proyectos.filter(p => {
      const estado = (p.estado || '').trim();
      if (estado.toLowerCase() === 'borrador') return false;

      const coincideBusqueda = !this.busquedaKanban ||
        p.titulo?.toLowerCase().includes(this.busquedaKanban.toLowerCase()) ||
        p.owner?.name?.toLowerCase().includes(this.busquedaKanban.toLowerCase());

      if (!coincideBusqueda) return false;

      switch (columna) {
        case 'propuesta': return estado === 'Propuesta Inicial' || estado === 'Pendiente';
        case 'anteproyecto': return estado === 'Anteproyecto' || estado === 'En progreso';
        case 'desarrollo': return estado === 'En Desarrollo' || estado === 'Desarrollo';
        case 'finalizado': return estado === 'Sustentación & Finalizado' || estado === 'Aprobado' || estado === 'Finalizado';
        default: return false;
      }
    });
  }

  evaluarTutoresSobrecargados(): void {
    if (!this.tutores.length) return;
    this.tutoresSobrecargados = this.tutores.filter(
      t => this.contarProyectosTutor(t.id) >= 6
    ).length;
  }

  // =========================================================================
  // ACCIONES DE BOTONES DE ALERTAS Y MODALES
  // =========================================================================

  abrirModalAsignarTutor(proyecto: Project): void {
    this.proyectoSeleccionadoModal = proyecto;
    this.tutorSeleccionadoId = proyecto.tutor_id || '';
    this.mostrarModalTutor = true;
  }

  cerrarModalAsignarTutor(): void {
    this.mostrarModalTutor = false;
    this.proyectoSeleccionadoModal = null;
    this.tutorSeleccionadoId = '';
  }

  confirmarAsignacionTutor(): void {
    if (!this.proyectoSeleccionadoModal || !this.tutorSeleccionadoId) {
      this.notificar('Seleccione un tutor válido', 'error');
      return;
    }

    const tutorId = Number(this.tutorSeleccionadoId);
    const tutor: any = this.tutores?.find((d: any) => d.id === tutorId);

    if (tutor && tutor.proyectosAsignados >= tutor.maxProyectos) {
      const nombreTutor = tutor.nombre || tutor.first_name || 'seleccionado';
      const asignados = tutor.proyectosAsignados ?? 0;
      const maximo = tutor.maxProyectos ?? 0;

      this.notificar(
        `El docente ${nombreTutor} ya tiene la carga máxima permitida (${asignados}/${maximo}).`,
        'error'
      );
      return;
    }

    this.guardandoTutor = true;
    const proyectoId = this.proyectoSeleccionadoModal.id;

    this.projectService.updateProject(proyectoId, { tutor_id: tutorId })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.guardandoTutor = false;
          this.cerrarModalAsignarTutor();
          this.notificar('Tutor asignado con éxito al proyecto', 'exito');
          this.cargarDatosGenerales();
        },
        error: (err) => {
          this.guardandoTutor = false;
          console.error(err);
          this.notificar('Ocurrió un error al asignar el tutor', 'error');
        }
      });
  }



  // 2. Método de envío corregido
  enviarRecordatorioTutor(doc: any): void {
    const proyecto = this.proyectos?.find((p: any) => p.id === doc.proyectoId || p.id === doc.project_id);
    const tutorId = proyecto?.tutor_id || proyecto?.tutor?.id;

    if (!tutorId) {
      this.notificar('Este proyecto no tiene un tutor asignado.', 'error');
      return;
    }

    // Indicar carga activando la bandera del documento
    this.enviandoRecordatorioMap[doc.id] = true;

    const payload = {
      user_id: Number(tutorId),
      title: '⚠️ Recordatorio de Revisión Pendiente',
      message: `El coordinador solicita tu revisión para la entrega "${doc.nombre || doc.titulo}". Llevas ${this.diasPendiente(doc.created_at)} días sin respuesta.`,
      type: 'RECORDATORIO',
      link: `/proyectos/${proyecto.id}`
    };

    this.notificationService.sendNotification(payload).subscribe({
      next: () => {
        // A) Quitar de inmediato el estado "Enviando..."
        this.enviandoRecordatorioMap[doc.id] = false;

        // B) Registrar el timestamp localmente
        this.recordatoriosEnviadosMap[doc.id] = Date.now();

        // C) Forzar asignación de nueva referencia para que Angular detecte el cambio en el Mapa
        this.recordatoriosEnviadosMap = { ...this.recordatoriosEnviadosMap };
        localStorage.setItem('recordatorios_tutores', JSON.stringify(this.recordatoriosEnviadosMap));

        // D) Notificar al usuario y forzar refresco de la interfaz
        this.notificar('Recordatorio enviado correctamente al tutor.', 'exito');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.enviandoRecordatorioMap[doc.id] = false;
        console.error('Error al enviar recordatorio:', err);
        this.notificar('Ocurrió un error al enviar el recordatorio.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  private notificar(mensaje: string, tipo: 'exito' | 'error' | 'info' = 'exito'): void {
    this.mensajeToast = mensaje;
    this.tipoToast = tipo;
    this.mostrarToast = true;

    setTimeout(() => {
      this.mostrarToast = false;
      this.cdr.detectChanges();
    }, 4000);

    this.cdr.detectChanges();
  }

  // --- AUXILIARES Y CÁLCULOS ---

  calcularProgresoProyecto(proyectoId: number | string): number {
    const totalDocs = this.contarDocumentosProyecto(proyectoId);
    if (totalDocs === 0) return 10;
    const aprobados = this.contarAprobadosProyecto(proyectoId);
    return Math.min(100, Math.round((aprobados / Math.max(totalDocs, 3)) * 100));
  }

  contarProyectosTutor(tutorId: number | string): number {
    return this.proyectos.filter(p => String(p.tutor_id) === String(tutorId)).length;
  }

  contarEstudiantesTutor(tutorId: number | string): number {
    const ids = this.proyectos
      .filter(p => String(p.tutor_id) === String(tutorId))
      .map(p => p.owner_id);
    return [...new Set(ids)].length;
  }

  contarPendientesTutor(tutorId: number | string): number {
    const proyectosTutorIds = this.proyectos
      .filter(p => String(p.tutor_id) === String(tutorId))
      .map(p => String(p.id));

    return this.documentosSistema.filter(d => {
      const esPendiente = d.estado === 'submitted' || d.estado === 'Pendiente revisión' || d.estado === 'Pendiente';
      return proyectosTutorIds.includes(String(d.proyectoId)) && esPendiente;
    }).length;
  }

  contarDocumentosProyecto(proyectoId: number | string): number {
    return this.documentosSistema.filter(d => String(d.proyectoId) === String(proyectoId)).length;
  }

  contarAprobadosProyecto(proyectoId: number | string): number {
    return this.documentosSistema.filter(
      d => String(d.proyectoId) === String(proyectoId) && (d.estado === 'Aprobado' || d.estado === 'approved')
    ).length;
  }

  obtenerTutorDocumento(proyectoId: number | string): string {
    const proyecto = this.proyectos.find(p => String(p.id) === String(proyectoId));
    return proyecto?.tutor?.name ?? 'Sin tutor';
  }

  diasPendiente(fecha: string): number {
    if (!fecha) return 0;
    const hoy = new Date();
    const creada = new Date(fecha);
    const diff = Math.floor((hoy.getTime() - creada.getTime()) / (1000 * 60 * 60 * 24));
    return isNaN(diff) || diff < 0 ? 0 : diff;
  }

  diasSinTutor(fechaCreacion?: string): number {
    if (!fechaCreacion) return 0;
    const hoy = new Date();
    const creada = new Date(fechaCreacion);
    const diff = Math.floor((hoy.getTime() - creada.getTime()) / (1000 * 60 * 60 * 24));
    return isNaN(diff) || diff < 0 ? 0 : diff;
  }

  contarEstado(estado: string): number {
    return this.documentosSistema.filter(d =>
      String(d.estado).toLowerCase() === String(estado).toLowerCase()
    ).length;
  }

  porcentajeAprobacion(): number {
    if (this.totalDocumentos === 0) return 0;
    const aprobados = this.documentosSistema.filter(d =>
      d.estado === 'Aprobado' || d.estado === 'approved'
    ).length;
    return Math.round((aprobados * 100) / this.totalDocumentos);
  }

  verDetalleTutor(tutor: User): void {
    this.tutorSeleccionadoVer = tutor;
    this.actualizarListaProyectosTutor(tutor.id);
    this.mostrarModalProyectosTutor = true;
  }

  cerrarModalProyectosTutor(): void {
    this.mostrarModalProyectosTutor = false;
    this.tutorSeleccionadoVer = null;
    this.proyectosDelTutor = [];
  }

  private actualizarListaProyectosTutor(tutorId: number | string): void {
    this.proyectosDelTutor = this.proyectos.filter(
      p => String(p.tutor_id) === String(tutorId)
    );
  }

  desvincularTutorDelProyecto(proyecto: Project): void {
  if (!confirm(`¿Estás seguro de desvincular a este tutor del proyecto "${proyecto.titulo}"?`)) {
    return;
  }

  this.desvinculandoProyectoMap[proyecto.id] = true;
  this.cdr.detectChanges();

  const payloadActualizacion: Partial<Project> = { tutor_id: null as any };

  this.projectService.updateProject(proyecto.id, payloadActualizacion)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.desvinculandoProyectoMap[proyecto.id] = false;

        // 1. Actualizar el proyecto específico en el arreglo global en memoria
        this.proyectos = this.proyectos.map(p => {
          if (p.id === proyecto.id) {
            return {
              ...p,
              tutor_id: undefined,
              tutor: undefined
            };
          }
          return p;
        });

        // 2. Forzar actualización inmediata del sub-arreglo que alimenta el modal
        if (this.tutorSeleccionadoVer) {
          const tutorIdActual = this.tutorSeleccionadoVer.id;
          
          // Filtramos directamente desde el arreglo general recién actualizado
          this.proyectosDelTutor = this.proyectos.filter(p => {
            const pTutorId = p.tutor_id ?? (p as any).tutor?.id;
            return String(pTutorId) === String(tutorIdActual);
          });

          // Si el docente ya no tiene proyectos, cerramos el modal opcionalmente o dejamos el empty-state
          if (this.proyectosDelTutor.length === 0) {
            // Opcional: descomentar si prefieres cerrar el modal automáticamente
            // this.cerrarModalProyectosTutor();
          }
        }

        // 3. Recalcular métricas generales del dashboard
        this.evaluarTutoresSobrecargados();
        this.proyectosSinTutorCount = this.proyectos.filter(p => !p.tutor_id && !(p as any).tutor?.id).length;

        this.notificar('Tutor desvinculado del proyecto con éxito', 'exito');

        // 4. Forzar la detección de cambios para actualizar el HTML inmediatamente
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.desvinculandoProyectoMap[proyecto.id] = false;
        console.error('Error al desvincular tutor:', err);
        this.notificar('Ocurrió un error al desvincular al tutor', 'error');
        this.cdr.detectChanges();
      }
    });
}
  descargarReportePDF(): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const verdeEsmeralda: [number, number, number] = [13, 148, 136];
    const grisOscuro: [number, number, number] = [15, 23, 42];
    const grisClaro: [number, number, number] = [248, 250, 252];
    const rojoAlerta: [number, number, number] = [239, 68, 68];

    doc.setFillColor(...verdeEsmeralda);
    doc.rect(0, 0, 210, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('FACULTAD DE ARTES - SISTEMA DE GESTIÓN ACADÉMICA', 14, 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('INFORME EJECUTIVO DE COORDINACIÓN Y ESTADO DE PROYECTOS', 14, 20);

    const fechaActual = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.setFontSize(8);
    doc.text(`Fecha: ${fechaActual}`, 196, 13, { align: 'right' });
    doc.text('Estado: Confidencial / Operativo', 196, 18, { align: 'right' });

    let currentY = 36;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...grisOscuro);
    doc.text('1. RESUMEN GENERAL Y MÉTRICAS CLAVE', 14, currentY);
    currentY += 6;

    const kpis = [
      { label: 'Proyectos Activos', val: `${this.totalProyectos}`, color: verdeEsmeralda },
      { label: 'Sin Tutor Asignado', val: `${this.proyectosEsperandoTutor.length}`, color: this.proyectosEsperandoTutor.length > 0 ? rojoAlerta : verdeEsmeralda },
      { label: 'Documentos Totales', val: `${this.totalDocumentos}`, color: verdeEsmeralda },
      { label: 'Tasa Aprobación', val: `${this.porcentajeAprobacion()}%`, color: verdeEsmeralda }
    ];

    const cardWidth = 43;
    const cardHeight = 18;
    const gap = 3.5;

    kpis.forEach((kpi, idx) => {
      const x = 14 + idx * (cardWidth + gap);
      doc.setFillColor(...grisClaro);
      doc.roundedRect(x, currentY, cardWidth, cardHeight, 2, 2, 'F');

      doc.setFillColor(...kpi.color);
      doc.rect(x, currentY, 2, cardHeight, 'F');

      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.text(kpi.label, x + 5, currentY + 6);

      doc.setFontSize(13);
      doc.setTextColor(...grisOscuro);
      doc.setFont('helvetica', 'bold');
      doc.text(kpi.val, x + 5, currentY + 14);
    });

    currentY += cardHeight + 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...grisOscuro);
    doc.text('2. ALERTAS OPERATIVAS: PROYECTOS ESPERANDO TUTOR', 14, currentY);
    currentY += 4;

    const huerfanosData = this.proyectosEsperandoTutor.map(p => [
      p.titulo || 'Sin Título',
      p.owner?.name || 'No registrado',
      p.tipo_proyecto || 'Grado',
      `${this.diasSinTutor(p.created_at)} días`
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Título del Proyecto', 'Estudiante', 'Modalidad', 'Tiempo de Espera']],
      body: huerfanosData.length > 0 ? huerfanosData : [['Todos los proyectos cuentan con tutor asignado', '-', '-', '-']],
      theme: 'striped',
      headStyles: { fillColor: verdeEsmeralda, textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: 50 },
      margin: { left: 14, right: 14 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...grisOscuro);
    doc.text('3. BALANCE Y CAPACIDAD DE LA PLANTA DOCENTE', 14, currentY);
    currentY += 4;

    const tutoresData = this.tutores.map(t => {
      const proyectos = this.contarProyectosTutor(t.id);
      const pendientes = this.contarPendientesTutor(t.id);
      const estadoCarga = proyectos >= 6 ? 'SOBRECARGA' : proyectos >= 4 ? 'ALTA' : 'NORMAL';

      return [
        t.name || 'Sin nombre',
        t.email || '-',
        `${proyectos} / 6`,
        `${pendientes} entregas`,
        estadoCarga
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['Nombre del Docente', 'Correo Electrónico', 'Proyectos Asignados', 'Rev. Pendientes', 'Estado Carga']],
      body: tutoresData,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 4) {
          const val = data.cell.raw;
          if (val === 'SOBRECARGA') {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = 'bold';
          } else if (val === 'ALTA') {
            data.cell.styles.textColor = [217, 119, 6];
          } else {
            data.cell.styles.textColor = [5, 150, 105];
          }
        }
      }
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);

      doc.line(14, 282, 196, 282);
      doc.text('Sistema de Gestión Académica - Facultad de Artes', 14, 287);
      doc.text(`Página ${i} de ${pageCount}`, 196, 287, { align: 'right' });
    }

    doc.save(`Reporte-Ejecutivo-Coordinacion-${new Date().toISOString().slice(0, 10)}.pdf`);
  }



// --- GETTER PARA REPOSITORIO DE AUDITORÍA CON FILTROS DINÁMICOS ---
get repositorioFiltrado(): any[] {
  // Construimos el repositorio consolidando proyectos aprobados/finalizados con sus documentos
  const repositorio: any[] = [];

  this.proyectos.forEach(p => {
    // Filtramos proyectos que representen un historial de cierre/aprobación o entregas registradas
    const docsProyecto = this.documentosSistema.filter(d => String(d.proyectoId) === String(p.id));
    
    // Generamos un código de acta único de auditoría si no existe
    const anio = p.created_at ? new Date(p.created_at).getFullYear() : new Date().getFullYear();
    const codigoActa = `ACTA-${anio}-${String(p.id).padStart(4, '0')}`;

    const fechaCierre = (p as any).updated_at || p.created_at || new Date().toISOString();

    repositorio.push({
      id: p.id,
      codigo: codigoActa,
      titulo: p.titulo,
      estudiante: p.owner?.name || 'Estudiante No Registrado',
      tutor: p.tutor?.name || 'Sin Tutor Asignado',
      tipoProyecto: p.tipo_proyecto || 'Trabajo de Grado',
      estadoProyecto: p.estado || 'Finalizado',
      fechaCierre: fechaCierre,
      documentos: docsProyecto
    });
  });

  // Aplicar filtros de Búsqueda y Año
  return repositorio.filter(item => {
    const texto = this.busquedaArchivo.toLowerCase().trim();
    const coincideTexto = !texto ||
      item.codigo.toLowerCase().includes(texto) ||
      item.titulo.toLowerCase().includes(texto) ||
      item.estudiante.toLowerCase().includes(texto) ||
      item.tutor.toLowerCase().includes(texto);

    const anioItem = new Date(item.fechaCierre).getFullYear().toString();
    const coincideAnio = !this.filtroAnio || anioItem === this.filtroAnio;

    return coincideTexto && coincideAnio;
  });
}

// --- DESCARGA DE EXPEDIENTE DIGITAL DE AUDITORÍA (PDF) ---
descargarExpediente(item: any): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const verdeEsmeralda: [number, number, number] = [13, 148, 136];
  const grisOscuro: [number, number, number] = [15, 23, 42];
  const grisClaro: [number, number, number] = [248, 250, 252];

  // Encabezado institucional
  doc.setFillColor(...verdeEsmeralda);
  doc.rect(0, 0, 210, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('FACULTAD DE ARTES - REPOSITORIO DE AUDITORÍA ACADÉMICA', 14, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('EXPEDIENTE DIGITAL DE TRAZABILIDAD DOCUMENTAL', 14, 20);

  const fechaEmision = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.setFontSize(8);
  doc.text(`Fecha Emisión: ${fechaEmision}`, 196, 13, { align: 'right' });
  doc.text(`Código Único: ${item.codigo}`, 196, 18, { align: 'right' });

  let currentY = 38;

  // Ficha Técnica del Proyecto
  doc.setFillColor(...grisClaro);
  doc.roundedRect(14, currentY, 182, 36, 2, 2, 'F');

  doc.setFontSize(10);
  doc.setTextColor(...grisOscuro);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMACIÓN GENERAL DEL PROYECTO', 18, currentY + 7);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Título: ${item.titulo}`, 18, currentY + 14);
  doc.text(`Estudiante: ${item.estudiante}`, 18, currentY + 20);
  doc.text(`Tutor Asignado: ${item.tutor}`, 18, currentY + 26);
  doc.text(`Modalidad: ${item.tipoProyecto}`, 115, currentY + 20);
  doc.text(`Estado Final: ${item.estadoProyecto}`, 115, currentY + 26);

  currentY += 44;

  // Tabla de Trazabilidad Documental
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TRAZABILIDAD Y REGISTRO DE ENTREGABLES HISTÓRICOS', 14, currentY);
  currentY += 4;

  const docsTableData = item.documentos.map((d: any, idx: number) => [
    `#${idx + 1}`,
    d.nombre || d.titulo || 'Entregable Sin Nombre',
    d.estado || 'Registrado',
    d.created_at ? new Date(d.created_at).toLocaleDateString('es-CO') : 'Sin fecha',
    d.observaciones || 'Sin observaciones registradas'
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['N°', 'Documento / Entregable', 'Estado', 'Fecha Registro', 'Observaciones de Auditoría']],
    body: docsTableData.length > 0 ? docsTableData : [['-', 'No se registran archivos adjuntos asociados al proyecto.', '-', '-', '-']],
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: 50 },
    margin: { left: 14, right: 14 }
  });

  // Pie de Página
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.line(14, 282, 196, 282);
    doc.text('Documento oficial generado automáticamente por la Plataforma de Proyectos de Artes', 14, 287);
    doc.text(`Página ${i} de ${pageCount}`, 196, 287, { align: 'right' });
  }

  doc.save(`Expediente_${item.codigo}_${item.estudiante.replace(/\s+/g, '_')}.pdf`);
  this.notificar(`Expediente ${item.codigo} generado con éxito.`, 'exito');
}
}