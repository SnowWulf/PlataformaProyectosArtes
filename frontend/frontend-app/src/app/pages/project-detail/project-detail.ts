import {
  Component,
  inject,
  afterNextRender,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
  OnInit,
  OnDestroy
} from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { DatePipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

// Models
import { Project } from '../../models/project';
import { Document } from '../../models/document';
import { ProjectDelivery } from '../../models/project-delivery';
import { DeliverySubmission as BaseDeliverySubmission } from '../../models/delivery-submission';

// Services
import { ProjectService } from '../../services/project-service';
import { DocumentService } from '../../services/document';
import { DocumentReviewService } from '../../services/document-review';
import { Auth } from '../../services/auth';
import { ProjectDeliveryService } from '../../services/project-delivery-service';
import { DeliverySubmissionService } from '../../services/delivery-submission';

// Components
import { DocumentForm } from '../../components/document-form/document-form';
import { DocumentReviewForm } from '../../components/document-review-form/document-review-form';
import { DeliverySubmissionModal } from '../../components/delivery-submission-modal/delivery-submission-modal';
import { ProjectAiChatbotComponent } from '../../components/project-ai-chatbot/project-ai-chatbot';

// Interfaz extendida para soportar notas, revisiones y campos de formulario dinámicos
export interface ExtendedSubmission extends Omit<BaseDeliverySubmission, 'estado'> {
  nota?: string | number | null;
  estado?: 'submitted' | 'reviewed' | 'approved' | 'rejected' | string;
  nuevaObservacion?: string;
  nuevaNota?: string | number | null;
  estudiante?: any;
  archivo_url?: string;
  observaciones?: string | null;
  [key: string]: any;
}

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    DocumentForm,
    DocumentReviewForm,
    DatePipe,
    FormsModule,
    DeliverySubmissionModal,
    ProjectAiChatbotComponent,
  
  ],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.scss'
})
export class ProjectDetail implements OnInit, OnDestroy {

  private readonly API_BASE_URL = 'http://localhost:8000';

  ultimaLecturaChat: Date = new Date(0);
  private http = inject(HttpClient);

  miEntrega: ExtendedSubmission | null = null;
  usuarioActualId: number | null = null;

  deliveries: (ProjectDelivery & { respuestas_count?: number; respuesta?: ExtendedSubmission })[] = [];
  respuestasEntrega: ExtendedSubmission[] = [];

  mostrarFormularioDocumento = false;
  documents: Document[] = [];
  documentoSeleccionado: Document | null = null;

  private route = inject(ActivatedRoute);
  private intervalId: any;
  projectId: number | null = null;
  project: Project | null = null;

  mostrarFormularioRevision = false;
  documentoRevision: any = null;
  tabActiva = 'informacion';

  mostrarModalEstado = false;
  estadoSeleccionado = '';
  proyectoEstado: Project | null = null;

  // CHAT HUMANO
  mensajes: any[] = [];
  nuevoMensaje = '';
  chatAbierto = false;
  mensajesNoLeidos = 0;

  // CHATBOT IA
  iaChatOpen = false;

  actividadProyecto: any[] = [];

  // ENTREGAS (TAREAS)
  mostrarModalEntrega = false;
  modoEdicionEntrega = false;
  entregaActual: any = {
    titulo: '',
    descripcion: '',
    fecha_limite: '',
    obligatorio: true
  };
  guardandoEntrega = false;

  mostrarModalRespuesta = false;
  entregaResponder: ProjectDelivery | null = null;

  // REVISIÓN Y RETROALIMENTACIÓN DE ENTREGAS (TUTOR / COORDINADOR)
  entregaParaRevisar: (ProjectDelivery & { respuestas_count?: number }) | null = null;
  guardandoRetroalimentacion = false;
  revisionesAbiertas: Record<number, boolean> = {};

  @ViewChild('chatMessages') chatMessages!: ElementRef;

  constructor(
    private projectService: ProjectService,
    private documentService: DocumentService,
    private documentReviewService: DocumentReviewService,
    private cdr: ChangeDetectorRef,
    public auth: Auth,
    private deliveryService: ProjectDeliveryService,
    private submissionService: DeliverySubmissionService
  ) {
    this.projectId = Number(this.route.snapshot.paramMap.get('id'));

    afterNextRender(() => {
      this.cargarProyecto();
      this.cargarDocumentos();
    });
  }

  ngOnInit(): void {
    this.intervalId = setInterval(() => {
      if (this.projectId) {
        this.cargarMensajes();
      }
    }, 5000);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.usuarioActualId = user?.id || null;
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  // ==========================================
  // CARGA DE PROYECTO Y ACTIVIDAD
  // ==========================================

  obtenerUltimaLectura(): Date {
    if (!this.projectId) return new Date(0);
    const guardado = localStorage.getItem(`chat_last_read_project_${this.projectId}`);
    return guardado ? new Date(guardado) : new Date(0);
  }

  cargarProyecto(): void {
    if (!this.projectId) return;

    this.projectService.getProject(this.projectId).subscribe({
      next: (project) => {
        this.cargarActividad();
        this.project = project;
        this.cargarEntregas();
        this.cargarMensajes();
        this.cdr.detectChanges();
      },
      error: (error: any) => console.error('Error al cargar proyecto:', error)
    });
  }

  cargarActividad(): void {
    if (!this.project?.id) return;

    this.projectService.getProjectActivity(this.project.id).subscribe({
      next: (data) => {
        this.actividadProyecto = data;
      },
      error: (err: any) => console.error('Error cargando actividad:', err)
    });
  }

  // ==========================================
  // DOCUMENTOS Y REVISIONES
  // ==========================================

  cargarDocumentos(): void {
    if (!this.projectId) return;

    this.documentService.getByProject(this.projectId).subscribe({
      next: (documents: any) => {
        this.documents = documents;
        this.documents.forEach((document: any) => {
          this.cargarRevisiones(document);
        });
        this.cdr.detectChanges();
      },
      error: (error: any) => console.error('Error al cargar documentos:', error)
    });
  }

  abrirFormularioDocumento(document: Document | null = null): void {
    this.documentoSeleccionado = document;
    this.mostrarFormularioDocumento = true;
  }

  cerrarFormularioDocumento(): void {
    this.mostrarFormularioDocumento = false;
    this.documentoSeleccionado = null;
  }

  puedeSubirDocumento(): boolean {
    const usuario = this.auth.obtenerUsuario();
    if (!usuario || !this.project) return false;
    return usuario.id === this.project.owner?.id;
  }

  documentoGuardado(): void {
    this.cerrarFormularioDocumento();
    this.cargarDocumentos();
  }

  eliminarDocumento(document: Document): void {
    const confirmar = confirm(`¿Eliminar "${document.nombre}"?`);
    if (!confirmar) return;

    this.documentService.delete(document.id).subscribe({
      next: () => this.cargarDocumentos(),
      error: (error: any) => console.error('Error al eliminar documento:', error)
    });
  }

  abrirFormularioRevision(document: any): void {
    this.documentoRevision = document;
    this.mostrarFormularioRevision = true;
  }

  cerrarFormularioRevision(): void {
    this.mostrarFormularioRevision = false;
    this.documentoRevision = null;
  }

  revisionGuardada(): void {
    this.cerrarFormularioRevision();
    this.cargarDocumentos();
  }

  cargarRevisiones(document: any): void {
    this.documentReviewService.getByDocument(document.id).subscribe({
      next: (reviews: any) => {
        document.reviews = reviews;
        this.cdr.detectChanges();
      },
      error: (error: any) => console.error('Error al cargar revisiones:', error)
    });
  }

  obtenerClaseEstado(estado: string): string {
    switch (estado) {
      case 'Aprobado': return 'estado-aprobado';
      case 'Requiere correcciones': return 'estado-correcciones';
      case 'En revisión': return 'estado-revision';
      case 'Rechazado': return 'estado-rechazado';
      default: return 'estado-pendiente';
    }
  }

  contarPendientesProyecto(projectId: number): number {
    return this.documents.filter(
      doc => doc.estado === 'Pendiente revisión' || doc.estado === 'En revisión'
    ).length;
  }

  toggleRevisiones(documentId: number): void {
    this.revisionesAbiertas[documentId] = !this.revisionesAbiertas[documentId];
  }

  puedeEditarDocumento(document: any): boolean {
    const usuario = this.auth.obtenerUsuario();
    if (!usuario) return false;

    const esAutor = document.user?.id === usuario.id;
    const esPropietario = this.project?.owner?.id === usuario.id;

    return esAutor || esPropietario;
  }

  puedeCrearDocumento(): boolean {
    const usuario = this.auth.obtenerUsuario();
    if (!usuario || !this.project) return false;

    const esPropietario = this.project.owner?.id === usuario.id;
    const esColaborador = this.project.collaborators?.some((c: any) => c.id === usuario.id) ?? false;

    return esPropietario || esColaborador;
  }

  // ==========================================
  // ESTADO Y COLABORADORES DEL PROYECTO
  // ==========================================

  esPropietarioProyecto(): boolean {
    const usuario = this.auth.obtenerUsuario();
    if (!usuario || !this.project) return false;
    return usuario.id === this.project.owner_id;
  }

  actualizarEstadoProyecto(): void {
    if (!this.proyectoEstado) return;

    this.projectService
      .updateProject(this.proyectoEstado.id!, {
        titulo: this.proyectoEstado.titulo,
        descripcion: this.proyectoEstado.descripcion,
        tipo_proyecto: this.proyectoEstado.tipo_proyecto,
        estado: this.estadoSeleccionado
      })
      .subscribe({
        next: (projectActualizado) => {
          this.project = projectActualizado;
          this.cerrarModalEstado();
          this.cdr.detectChanges();
        }
      });
  }

abrirModalEstado(project?: Project): void {
  // Si le pasas un proyecto lo usa, si no, usa this.project de la vista
  const targetProject = project || this.project;

  if (targetProject) {
    this.proyectoEstado = targetProject;
    this.estadoSeleccionado = targetProject.estado;
    this.mostrarModalEstado = true;
  }
}

  cerrarModalEstado(): void {
    this.mostrarModalEstado = false;
    this.proyectoEstado = null;
  }

  eliminarColaborador(userId: number): void {
    if (!confirm('¿Eliminar colaborador?')) return;

    this.projectService.removeCollaborator(this.project!.id, userId).subscribe({
      next: () => {
        if (this.project?.collaborators) {
          this.project.collaborators = this.project.collaborators.filter(c => c.id !== userId);
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Error eliminando colaborador:', err)
    });
  }

  // ==========================================
  // CHAT DEL PROYECTO (HUMANO)
  // ==========================================

  cargarMensajes(): void {
    if (!this.project?.id) return;

    this.projectService.getMessages(this.project.id).subscribe({
      next: (data) => {
        this.mensajes = data || [];

        if (!this.chatAbierto) {
          const usuarioActual = this.auth.obtenerUsuario();
          const fechaUltimaLectura = this.obtenerUltimaLectura();

          this.mensajesNoLeidos = this.mensajes.filter((m) => {
            const esDeOtro = m.user?.id !== usuarioActual?.id;
            const fechaMensaje = new Date(m.created_at);
            return esDeOtro && fechaMensaje > fechaUltimaLectura;
          }).length;
        }

        this.scrollAlFinal();
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Error cargando mensajes:', err)
    });
  }

  enviarMensaje(): void {
    const texto = this.nuevoMensaje?.trim();
    if (!texto || !this.project?.id) return;

    const usuarioActual = this.auth.obtenerUsuario();

    const mensajeTemp: any = {
      id: 'temp-' + Date.now(),
      mensaje: texto,
      created_at: new Date().toISOString(),
      user: usuarioActual ? { id: usuarioActual.id, name: usuarioActual.name || 'Tú' } : { id: 0, name: 'Tú' },
      enviando: true
    };

    this.mensajes = [...this.mensajes, mensajeTemp];
    this.nuevoMensaje = '';
    this.scrollAlFinal();
    this.cdr.detectChanges();

    this.projectService.sendMessage(this.project.id, texto).subscribe({
      next: (mensajeReal: any) => {
        mensajeTemp.id = mensajeReal.id || mensajeTemp.id;
        mensajeTemp.created_at = mensajeReal.created_at || mensajeTemp.created_at;
        mensajeTemp.enviando = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error al enviar mensaje:', err);
        mensajeTemp.enviando = false;
        mensajeTemp.error = true;
        this.cdr.detectChanges();
      }
    });
  }

  toggleChat(): void {
    this.chatAbierto = !this.chatAbierto;

    if (this.chatAbierto) {
      this.mensajesNoLeidos = 0;

      if (this.projectId) {
        localStorage.setItem(
          `chat_last_read_project_${this.projectId}`,
          new Date().toISOString()
        );
      }

      this.scrollAlFinal();
    }

    this.cdr.detectChanges();
  }

  recibirNuevoMensaje(mensajeNuevo: any): void {
    const usuarioActual = this.auth.obtenerUsuario();

    if (mensajeNuevo.user?.id !== usuarioActual?.id) {
      if (!this.chatAbierto) {
        this.mensajesNoLeidos++;
      } else {
        this.scrollAlFinal();
      }
    }

    this.mensajes.push(mensajeNuevo);
    this.cdr.detectChanges();
  }

  esMismoAutor(index: number): boolean {
    if (index === 0 || !this.mensajes[index] || !this.mensajes[index - 1]) return false;
    return this.mensajes[index]?.user?.id === this.mensajes[index - 1]?.user?.id;
  }

  esMiMensaje(mensaje: any): boolean {
    if (!mensaje?.user) return false;
    const usuario = this.auth.obtenerUsuario();
    return usuario?.id === mensaje.user.id;
  }

  mostrarHora(index: number): boolean {
    const actual = this.mensajes[index];
    const siguiente = this.mensajes[index + 1];

    if (!siguiente || !actual) return true;
    if (actual.user?.id !== siguiente.user?.id) return true;

    const actualFecha = new Date(actual.created_at);
    const siguienteFecha = new Date(siguiente.created_at);
    const diferencia = (siguienteFecha.getTime() - actualFecha.getTime()) / 60000;

    return diferencia > 5;
  }

  scrollAlFinal(): void {
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (this.chatMessages?.nativeElement) {
          this.chatMessages.nativeElement.scrollTop = this.chatMessages.nativeElement.scrollHeight;
        }
      }, 50);
    });
  }

  // ==========================================
  // ENTREGAS Y RESPUESTAS (TAREAS)
  // ==========================================

  esVencida(fechaLimite: string | Date | null | undefined): boolean {
    if (!fechaLimite) return false;
    return new Date(fechaLimite) < new Date();
  }

  cargarEntregas(): void {
    if (!this.project?.id) return;

    this.deliveryService.getDeliveries(this.project.id).subscribe({
      next: (data: any) => {
        const rawDeliveries = Array.isArray(data) ? data : (data.deliveries || data.data || []);
        this.deliveries = rawDeliveries.map((item: any) => ({
          ...item,
          respuestas_count: item.respuestas_count ?? item.submissions_count ?? item.submissions?.length ?? 0
        }));
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Error al cargar entregas:', err)
    });
  }

  abrirNuevaEntrega(): void {
    this.modoEdicionEntrega = false;
    this.entregaActual = {
      titulo: '',
      descripcion: '',
      fecha_limite: '',
      obligatorio: true
    };
    this.mostrarModalEntrega = true;
  }

  editarEntrega(entrega: ProjectDelivery): void {
    this.modoEdicionEntrega = true;
    this.entregaActual = { ...entrega };
    this.mostrarModalEntrega = true;
  }

  cerrarModalEntrega(): void {
    this.mostrarModalEntrega = false;
    this.guardandoEntrega = false;
    this.cdr.detectChanges();
  }

  guardarEntrega(): void {
    if (!this.project || this.guardandoEntrega) return;

    this.guardandoEntrega = true;

    const request = this.modoEdicionEntrega
      ? this.deliveryService.updateDelivery(this.entregaActual.id, this.entregaActual)
      : this.deliveryService.createDelivery(this.project.id, this.entregaActual);

    request.subscribe({
      next: () => {
        this.cargarEntregas();
        this.cerrarModalEntrega();
      },
      error: (err: any) => {
        console.error('Error guardando entrega:', err);
        this.guardandoEntrega = false;
        this.cdr.detectChanges();
      }
    });
  }

  eliminarEntrega(id: number): void {
    if (!confirm('¿Eliminar esta entrega?')) return;

    this.deliveryService.deleteDelivery(id).subscribe({
      next: () => {
        this.cargarEntregas();
        this.cerrarModalEntrega();
      },
      error: (err: any) => console.error('Error al eliminar entrega:', err)
    });
  }

  abrirRespuesta(entrega: ProjectDelivery): void {
    this.entregaResponder = entrega;
    this.mostrarModalRespuesta = true;
  }

  cerrarRespuesta(): void {
    this.mostrarModalRespuesta = false;
    this.entregaResponder = null;
  }

  guardarRespuesta(formData: FormData): void {
    if (!this.entregaResponder) return;

    const idEntregaActual = this.entregaResponder.id;

    this.submissionService.submitDelivery(idEntregaActual, formData).subscribe({
      next: (res: any) => {
        alert('Entrega enviada correctamente.');

        this.deliveries = this.deliveries.map((entrega) => {
          if (entrega.id === idEntregaActual) {
            return {
              ...entrega,
              respuesta: res || {
                id: Date.now(),
                delivery_id: idEntregaActual,
                student_id: this.usuarioActualId || 0,
                file_path: '',
                estado: 'submitted',
                created_at: new Date().toISOString()
              }
            };
          }
          return entrega;
        });

        this.cerrarRespuesta();
        this.cargarEntregas();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error al enviar entrega:', err);
        alert(err.error?.message ?? 'Error al enviar la respuesta.');
      }
    });
  }

  // ==========================================
  // REVISIÓN Y CALIFICACIÓN DE ENTREGAS (TUTORES/COORDINADORES)
  // ==========================================

  verRespuestasTutor(entrega: ProjectDelivery & { respuestas_count?: number }): void {
    this.entregaParaRevisar = entrega;
    this.cargarRespuestas(entrega.id);
  }

  cerrarModalRevision(): void {
    this.entregaParaRevisar = null;
    this.respuestasEntrega = [];
  }

  private normalizarUrlArchivo(rawUrl: string): string {
    if (!rawUrl) return '';
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      return rawUrl;
    }
    let cleaned = rawUrl.startsWith('/') ? rawUrl.substring(1) : rawUrl;
    if (!cleaned.startsWith('storage/')) {
      cleaned = `storage/${cleaned}`;
    }
    return `${this.API_BASE_URL}/${cleaned}`;
  }

  cargarRespuestas(entregaId: number): void {
    const serviceAny = this.submissionService as any;
    const request$ = typeof serviceAny.getSubmissionsByDelivery === 'function'
      ? serviceAny.getSubmissionsByDelivery(entregaId)
      : (typeof serviceAny.getSubmissions === 'function'
        ? serviceAny.getSubmissions(entregaId)
        : serviceAny.getSubmissionByDelivery(entregaId));

    if (request$) {
      request$.subscribe({
        next: (data: any) => {
          const lista = Array.isArray(data) ? data : (data.data || []);

          this.respuestasEntrega = lista.map((sub: any) => {
            const rawUrl = sub.archivo_url || sub.file_url || sub.file_path || '';
            const observacionExistente = sub.comentario || sub.observaciones || sub.comentario_tutor || sub.feedback || '';
            const notaExistente = sub.nota || sub.calificacion || sub.grade || '';

            return {
              ...sub,
              estudiante: sub.estudiante || sub.student || sub.user || { name: 'Estudiante' },
              archivo_url: this.normalizarUrlArchivo(rawUrl),
              comentario: observacionExistente,
              observaciones: observacionExistente,
              nota: notaExistente,
              nuevaObservacion: observacionExistente,
              nuevaNota: notaExistente,
              estado: sub.estado || 'submitted'
            };
          });
          this.cdr.detectChanges();
        },
        error: (err: any) => console.error('Error al obtener respuestas de entrega:', err)
      });
    }
  }

  guardarRetroalimentacion(respuesta: ExtendedSubmission): void {
    if (!respuesta?.id) return;

    this.guardandoRetroalimentacion = true;

    const payload = {
      comentario: respuesta.nuevaObservacion,
      nota: respuesta.nuevaNota,
      estado: 'reviewed'
    };

    const url = `${this.API_BASE_URL}/api/delivery-submissions/${respuesta.id}`;

    this.http.put(url, payload).subscribe({
      next: () => {
        respuesta.comentario = respuesta.nuevaObservacion;
        respuesta.observaciones = respuesta.nuevaObservacion;
        respuesta.nota = respuesta.nuevaNota;
        respuesta.estado = 'reviewed';

        this.guardandoRetroalimentacion = false;
        alert('Calificación guardada con éxito.');
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error al guardar retroalimentación:', err);
        this.guardandoRetroalimentacion = false;
        alert('Ocurrió un error al guardar la calificación.');
        this.cdr.detectChanges();
      }
    });
  }

  cargarEntregaEstudiante(entregaId: number): void {
    const serviceAny = this.submissionService as any;

    if (typeof serviceAny.getSubmissionsByDelivery === 'function') {
      serviceAny.getSubmissionsByDelivery(entregaId).subscribe({
        next: (res: any) => {
          const lista = Array.isArray(res) ? res : (res.data || []);

          if (lista.length > 0) {
            const miEntregaObj = lista.find((sub: any) => sub.student_id === this.usuarioActualId) || lista[0];
            const rawUrl = miEntregaObj.archivo_url || miEntregaObj.file_url || miEntregaObj.file_path || '';

            this.miEntrega = {
              ...miEntregaObj,
              archivo_url: this.normalizarUrlArchivo(rawUrl),
              comentario: miEntregaObj.comentario || '',
              nota: miEntregaObj.nota || null,
              estado: miEntregaObj.estado || 'submitted'
            };
          } else {
            this.miEntrega = null;
          }
          this.cdr.detectChanges();
        },
        error: (err: any) => console.error('Error al cargar la entrega del estudiante:', err)
      });
    }
  }
}