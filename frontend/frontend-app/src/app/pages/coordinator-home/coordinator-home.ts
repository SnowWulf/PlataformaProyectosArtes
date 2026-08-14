import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { UserService } from '../../services/user-service';
import { ProjectService } from '../../services/project-service';
import { DocumentService } from '../../services/document';

import { User } from '../../models/user';
import { Project } from '../../models/project';

import jsPDF from 'jspdf';

@Component({
  selector: 'app-coordinator-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './coordinator-home.html',
  styleUrl: './coordinator-home.scss'
})
export class CoordinatorHome implements OnInit {

  tabActiva = 'inicio';

  totalEstudiantes = 0;
  totalTutores = 0;
  totalProyectos = 0;
  totalDocumentos = 0;
  proyectosSinTutor = 0;
  pendientesRevision = 0;

  usuarios: User[] = [];
  proyectos: Project[] = [];
  filtroCoordinador = 'proyectos';

  estudiantes: any[] = [];
  tutores: any[] = [];
  documentosSistema: any[] = [];

  filtroProyectos = 'todos';
  fechaReporte = new Date();

  // Variables para filtros de búsqueda y ordenación
  busquedaGeneral: string = '';
  busquedaProyecto: string = '';
  busquedaEstudiante: string = '';
  busquedaTutor: string = '';
  busquedaDocumento: string = '';
  criterioOrden: string = 'reciente';

  constructor(
    private userService: UserService,
    private projectService: ProjectService,
    private documentService: DocumentService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.cargarIndicadores();
  }

  cargarIndicadores(): void {
    this.cargarUsuarios();
    this.cargarProyectos();
  }

  cargarUsuarios(): void {
    this.userService
      .getUsers()
      .subscribe({
        next: (users: User[]) => {
          this.estudiantes = users.filter(
            user => user.role?.nombre === 'Estudiante'
          );

          this.tutores = users.filter(
            user => user.role?.nombre === 'Tutor'
          );

          this.totalEstudiantes = this.estudiantes.length;
          this.totalTutores = this.tutores.length;
        }
      });
  }

  cargarProyectos(): void {
    this.projectService
      .getProjects()
      .subscribe({
        next: (projects: Project[]) => {
          this.proyectos = projects;
          this.totalProyectos = projects.length;

          this.proyectosSinTutor = projects.filter(
            project => !project.tutor_id
          ).length;

          projects.forEach(
            project => {
              this.documentService
                .getByProject(project.id)
                .subscribe({
                  next: (documents: any) => {
                    documents.forEach((document: any) => {
                      this.documentosSistema.push({
                        ...document,
                        proyectoId: project.id,
                        proyectoTitulo: project.titulo
                      });
                    });

                    this.totalDocumentos += documents.length;

                    this.pendientesRevision += documents.filter(
                      (document: any) =>
                        document.estado === 'Pendiente revisión' ||
                        document.estado === 'submitted'
                    ).length;

                    this.cdr.detectChanges();
                  },
                  error: (error) => {
                    console.error('Error cargando documentos', error);
                  }
                });
            }
          );
        },
        error: (error) => {
          console.error('Error cargando proyectos', error);
        }
      });
  }

  // --- MÉTODOS DE BÚSQUEDA, FILTRADO Y ORDENACIÓN ---

  filtrarTablaGlobal(): void {
    // Método activado por la plantilla en (input)="filtrarTablaGlobal()"
  }

  ordenarTablaGlobal(): void {
    // Método activado por la plantilla en (change)="ordenarTablaGlobal()"
  }

  obtenerElementosFiltrados() {
    let resultado: any[] = [];

    switch (this.filtroCoordinador) {
      case 'estudiantes':
        resultado = this.estudiantes;
        break;
      case 'tutores':
        resultado = this.tutores;
        break;
      case 'proyectos':
        resultado = this.proyectos;
        break;
      case 'documentos':
        resultado = this.documentosSistema;
        break;
      case 'pendientes':
        resultado = this.documentosSistema.filter(
          document => document.estado === 'Pendiente revisión' || document.estado === 'submitted'
        );
        break;
      case 'sintutor':
        resultado = this.proyectos.filter(
          project => !project.tutor_id
        );
        break;
      default:
        resultado = [];
    }

    // Filtrar según busquedaGeneral
    if (this.busquedaGeneral.trim()) {
      const q = this.busquedaGeneral.toLowerCase();
      resultado = resultado.filter(item => {
        const nombre = item.name || item.nombre || item.titulo || '';
        const email = item.email || '';
        const proyecto = item.proyectoTitulo || '';
        return (
          nombre.toLowerCase().includes(q) ||
          email.toLowerCase().includes(q) ||
          proyecto.toLowerCase().includes(q)
        );
      });
    }

    // Ordenar resultados
    if (this.criterioOrden === 'nombre') {
      resultado.sort((a, b) => {
        const nameA = (a.name || a.nombre || a.titulo || '').toLowerCase();
        const nameB = (b.name || b.nombre || b.titulo || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
    } else if (this.criterioOrden === 'antiguo') {
      resultado.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (this.criterioOrden === 'reciente') {
      resultado.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return resultado;
  }

  obtenerProyectosFiltrados() {
    let lista: Project[] = [];

    switch (this.filtroProyectos) {
      case 'sintutor':
        lista = this.proyectos.filter(project => !project.tutor_id);
        break;
      case 'endesarrollo':
        lista = this.proyectos.filter(project => project.estado === 'En desarrollo');
        break;
      case 'finalizados':
        lista = this.proyectos.filter(project => project.estado === 'Finalizado');
        break;
      default:
        lista = this.proyectos;
    }

    if (this.busquedaProyecto.trim()) {
      const q = this.busquedaProyecto.toLowerCase();
      lista = lista.filter(p =>
        p.titulo?.toLowerCase().includes(q) ||
        p.descripcion?.toLowerCase().includes(q) ||
        p.owner?.name?.toLowerCase().includes(q) ||
        p.tutor?.name?.toLowerCase().includes(q)
      );
    }

    return lista;
  }

  // --- CÁLCULO DE PROGRESO DE PROYECTOS ---

  calcularProgresoProyecto(proyectoId: number | string): number {
    const totalDocs = this.contarDocumentosProyecto(proyectoId);
    if (totalDocs === 0) return 10;
    const aprobados = this.contarAprobadosProyecto(proyectoId);
    return Math.min(100, Math.round((aprobados / Math.max(totalDocs, 3)) * 100));
  }

  // --- CONTADORES Y AUXILIARES CON SOPORTE DE TIPOS (NUMBER | STRING) ---

  contarProyectosEstudiante(estudianteId: number | string): number {
    return this.proyectos.filter(
      project => project.owner_id == estudianteId
    ).length;
  }

  contarProyectosTutor(tutorId: number | string): number {
    return this.proyectos.filter(
      project => project.tutor_id == tutorId
    ).length;
  }

  contarDocumentosProyecto(proyectoId: number | string): number {
    return this.documentosSistema.filter(
      document => document.proyectoId == proyectoId
    ).length;
  }

  obtenerTutorEstudiante(estudianteId: number | string): string {
    const proyecto = this.proyectos.find(
      project => project.owner_id == estudianteId
    );
    return proyecto?.tutor?.name ?? 'Sin tutor';
  }

  obtenerTutoresEstudiante(estudianteId: number | string): string {
    const tutores = this.proyectos
      .filter(project => project.owner_id == estudianteId)
      .map(project => project.tutor?.name)
      .filter((name): name is string => !!name);

    const unicos = [...new Set(tutores)];
    return unicos.length > 0 ? unicos.join(', ') : 'Sin tutor';
  }

  contarEstudiantesTutor(tutorId: number | string): number {
    const estudiantes = this.proyectos
      .filter(project => project.tutor_id == tutorId)
      .map(project => project.owner_id);

    return [...new Set(estudiantes)].length;
  }

  contarDocumentosTutor(tutorId: number | string): number {
    const proyectosTutor = this.proyectos
      .filter(project => project.tutor_id == tutorId)
      .map(project => project.id);

    return this.documentosSistema.filter(
      document => proyectosTutor.includes(document.proyectoId)
    ).length;
  }

  contarPendientesTutor(tutorId: number | string): number {
    const proyectosTutor = this.proyectos
      .filter(project => project.tutor_id == tutorId)
      .map(project => project.id);

    return this.documentosSistema.filter(
      document =>
        proyectosTutor.includes(document.proyectoId) &&
        (document.estado === 'submitted' || document.estado === 'Pendiente revisión')
    ).length;
  }

  contarPendientesProyecto(proyectoId: number | string): number {
    return this.documentosSistema.filter(
      document =>
        document.proyectoId == proyectoId &&
        (document.estado === 'Pendiente revisión' || document.estado === 'submitted')
    ).length;
  }

  contarAprobadosProyecto(proyectoId: number | string): number {
    return this.documentosSistema.filter(
      document =>
        document.proyectoId == proyectoId &&
        document.estado === 'Aprobado'
    ).length;
  }

  obtenerEstudianteDocumento(proyectoId: number | string): string {
    const proyecto = this.proyectos.find(
      project => project.id == proyectoId
    );
    return proyecto?.owner?.name ?? 'Sin estudiante';
  }

  obtenerTutorDocumento(proyectoId: number | string): string {
    const proyecto = this.proyectos.find(
      project => project.id == proyectoId
    );
    return proyecto?.tutor?.name ?? 'Sin tutor';
  }

  diasPendiente(fecha: string): number {
    if (!fecha) return 0;
    const hoy = new Date();
    const creada = new Date(fecha);
    const diferencia = hoy.getTime() - creada.getTime();
    return Math.floor(diferencia / (1000 * 60 * 60 * 24));
  }

  diasSinTutor(fecha: string): number {
    if (!fecha) return 0;
    const hoy = new Date();
    const creado = new Date(fecha);
    return Math.floor((hoy.getTime() - creado.getTime()) / (1000 * 60 * 60 * 24));
  }

  contarDocumentosEstudiante(estudianteId: number | string): number {
    const proyectosEstudiante = this.proyectos
      .filter(project => project.owner_id == estudianteId)
      .map(project => project.id);

    return this.documentosSistema.filter(
      document => proyectosEstudiante.includes(document.proyectoId)
    ).length;
  }

  contarPendientesEstudiante(estudianteId: number | string): number {
    const proyectosEstudiante = this.proyectos
      .filter(project => project.owner_id == estudianteId)
      .map(project => project.id);

    return this.documentosSistema.filter(
      document =>
        proyectosEstudiante.includes(document.proyectoId) &&
        (document.estado === 'submitted' || document.estado === 'Pendiente revisión')
    ).length;
  }

  contarAprobadosEstudiante(estudianteId: number | string): number {
    const proyectosEstudiante = this.proyectos
      .filter(project => project.owner_id == estudianteId)
      .map(project => project.id);

    return this.documentosSistema.filter(
      document =>
        proyectosEstudiante.includes(document.proyectoId) &&
        document.estado === 'Aprobado'
    ).length;
  }

  contarRevisionesTutor(tutorId: number | string): number {
    const proyectosTutor = this.proyectos
      .filter(project => project.tutor_id == tutorId)
      .map(project => project.id);

    return this.documentosSistema.filter(
      document =>
        proyectosTutor.includes(document.proyectoId) &&
        (
          document.estado === 'Aprobado' ||
          document.estado === 'Requiere correcciones' ||
          document.estado === 'Rechazado'
        )
    ).length;
  }

  // --- REPORTES ---

  contarEstado(estado: string): number {
    return this.documentosSistema.filter(
      document => document.estado === estado
    ).length;
  }

  estudiantesSinProyecto(): number {
    return this.estudiantes.filter(
      estudiante => !this.proyectos.some(project => project.owner_id === estudiante.id)
    ).length;
  }

  porcentajeAprobacion(): number {
    if (this.totalDocumentos === 0) return 0;
    const aprobados = this.documentosSistema.filter(
      document => document.estado === 'Aprobado'
    ).length;

    return Math.round((aprobados * 100) / this.totalDocumentos);
  }

  contarPendientesGlobal(): number {
    return this.documentosSistema.filter(
      document => document.estado === 'Pendiente revisión' || document.estado === 'submitted'
    ).length;
  }

  descargarReportePDF(): void {
    const pdf = new jsPDF();
    let y = 20;

    pdf.setFontSize(18);
    pdf.text('REPORTE GENERAL DEL SISTEMA', 20, y);
    y += 15;

    pdf.setFontSize(11);
    pdf.text(`Fecha: ${new Date().toLocaleString()}`, 20, y);
    y += 15;

    pdf.setFontSize(14);
    pdf.text('RESUMEN EJECUTIVO', 20, y);
    y += 10;

    pdf.setFontSize(11);
    pdf.text(`Estudiantes: ${this.totalEstudiantes}`, 20, y);
    y += 8;
    pdf.text(`Tutores: ${this.totalTutores}`, 20, y);
    y += 8;
    pdf.text(`Proyectos: ${this.totalProyectos}`, 20, y);
    y += 8;
    pdf.text(`Documentos: ${this.totalDocumentos}`, 20, y);
    y += 15;

    pdf.setFontSize(14);
    pdf.text('ESTADO DOCUMENTAL', 20, y);
    y += 10;

    pdf.setFontSize(11);
    pdf.text(`Aprobados: ${this.contarEstado('Aprobado')}`, 20, y);
    y += 8;
    pdf.text(`Pendientes: ${this.contarPendientesGlobal()}`, 20, y);
    y += 8;
    pdf.text(`Correcciones: ${this.contarEstado('Requiere correcciones')}`, 20, y);
    y += 8;
    pdf.text(`Rechazados: ${this.contarEstado('Rechazado')}`, 20, y);
    y += 8;
    pdf.text(`Tasa de aprobacion: ${this.porcentajeAprobacion()}%`, 20, y);
    y += 15;

    pdf.setFontSize(14);
    pdf.text('ALERTAS', 20, y);
    y += 10;

    pdf.setFontSize(11);
    pdf.text(`Proyectos sin tutor: ${this.proyectosSinTutor}`, 20, y);
    y += 8;
    pdf.text(`Estudiantes sin proyecto: ${this.estudiantesSinProyecto()}`, 20, y);
    y += 8;
    pdf.text(`Documentos pendientes: ${this.pendientesRevision}`, 20, y);
    y += 15;

    pdf.setFontSize(14);
    pdf.text('RENDIMIENTO DE TUTORES', 20, y);
    y += 10;

    pdf.setFontSize(10);
    this.tutores.forEach(tutor => {
      pdf.text(
        `${tutor.name} | Proyectos: ${this.contarProyectosTutor(tutor.id)} | Pendientes: ${this.contarPendientesTutor(tutor.id)}`,
        20,
        y
      );
      y += 7;
      if (y > 270) {
        pdf.addPage();
        y = 20;
      }
    });

    pdf.save('Reporte-Coordinador.pdf');
  }

}