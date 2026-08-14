import {
  Component,
  afterNextRender,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Project } from '../../models/project';
import { ProjectService } from '../../services/project-service';
import { ProjectForm } from '../project-form/project-form';
import { Auth } from '../../services/auth';
import { TutorRequestForm } from '../tutor-request-form/tutor-request-form';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ProjectForm,
    TutorRequestForm
  ],
  templateUrl: './projects.html',
  styleUrl: './projects.scss'



})
export class Projects {
  mostrarFormulario = false;
  proyectoSeleccionado: Project | null = null;
  mostrarSolicitudTutor = false;
  proyectoSolicitud: Project | null = null;
  projects: Project[] = [];
  mostrarModalEliminar = false;

  proyectoEliminar: Project | null = null;

  nombreConfirmacion = '';

  // Estados de acordeón (inicialmente abiertos)
seccionMisProyectosAbierta: boolean = true;
seccionColaborandoAbierta: boolean = true;
seccionExternosAbierta: boolean = true;

// Filtros de búsqueda individual
busquedaMisProyectos: string = '';
busquedaColaborando: string = '';
busquedaExternos: string = '';

// Getters para filtrado dinamico
get misProyectosFiltrados() {
  if (!this.misProyectos) return [];
  if (!this.busquedaMisProyectos.trim()) return this.misProyectos;
  const q = this.busquedaMisProyectos.toLowerCase();
  return this.misProyectos.filter(p =>
    p.titulo?.toLowerCase().includes(q) ||
    p.descripcion?.toLowerCase().includes(q) ||
    p.tutor?.name?.toLowerCase().includes(q)
  );
}

get colaborandoFiltrados() {
  if (!this.proyectosColaborando) return [];
  if (!this.busquedaColaborando.trim()) return this.proyectosColaborando;
  const q = this.busquedaColaborando.toLowerCase();
  return this.proyectosColaborando.filter(p =>
    p.titulo?.toLowerCase().includes(q) ||
    p.descripcion?.toLowerCase().includes(q) ||
    p.owner?.name?.toLowerCase().includes(q)
  );
}

get externosFiltrados() {
  if (!this.proyectosExternos) return [];
  if (!this.busquedaExternos.trim()) return this.proyectosExternos;
  const q = this.busquedaExternos.toLowerCase();
  return this.proyectosExternos.filter(p =>
    p.titulo?.toLowerCase().includes(q) ||
    p.descripcion?.toLowerCase().includes(q) ||
    p.owner?.name?.toLowerCase().includes(q) ||
    p.tutor?.name?.toLowerCase().includes(q)
  );
}


  constructor(
    private projectService: ProjectService,
    private cdr: ChangeDetectorRef,
    public auth: Auth,
    private router: Router
  ) {

    afterNextRender(() => {
      this.cargarProyectos();
    });

  }


  cargarProyectos(): void {

    this.projectService.getProjects()
      .subscribe({

        next: (data) => {

          console.log(
            'Proyectos recibidos:',
            data
          );

          this.projects = data;

          this.cdr.detectChanges();

        },

        error: (err) => {

          console.error(
            'Error al obtener proyectos',
            err
          );

        }

      });

  }

  nuevoProyecto() {

    this.proyectoSeleccionado = null;

    this.mostrarFormulario = true;

  }

  editarProyecto(project: Project) {

    this.proyectoSeleccionado = project;

    this.mostrarFormulario = true;

  }

  cerrarFormulario() {

    this.mostrarFormulario = false;

  }

  eliminarProyecto(project: Project): void {

    const confirmar = confirm(
      `¿Está seguro de eliminar el proyecto "${project.titulo}"?`
    );

    if (!confirmar) {

      return;

    }

    this.projectService
      .deleteProject(project.id!)
      .subscribe({

        next: () => {

          console.log(
            'Proyecto eliminado correctamente'
          );

          this.cargarProyectos();

        },

        error: (err) => {

          console.error(
            'Error al eliminar proyecto',
            err
          );

        }

      });

  }

  puedeEditarProyecto(project: Project): boolean {

    const usuario = this.auth.obtenerUsuario();

    if (!usuario) {

      return false;

    }

    // El coordinador puede editar todos
    if (this.auth.esCoordinador()) {

      return true;

    }

    // El estudiante solo sus proyectos
    if (
      this.auth.esEstudiante() &&
      project.owner?.id === usuario.id
    ) {

      return true;

    }

    return false;

  }
  solicitarTutor(project: Project): void {

    this.proyectoSolicitud = project;

    this.mostrarSolicitudTutor = true;

  }

  cerrarSolicitudTutor(): void {

    this.mostrarSolicitudTutor = false;

    this.proyectoSolicitud = null;

  }


  verProyecto(project: Project): void {

    this.router.navigate([
      '/dashboard/projects',
      project.id
    ]);

  }


  usuarioActual: any;

  ngOnInit(): void {

    this.usuarioActual =
      this.auth.obtenerUsuario();

    this.cargarProyectos();

  }

  get misProyectos(): Project[] {

    return this.projects.filter(

      project =>

        project.owner?.id ===
        this.usuarioActual?.id

    );

  }

  
get proyectosColaborando(): Project[] {

  return this.projects.filter(

    project =>

      project.owner?.id !==
      this.usuarioActual?.id

      &&

      project.collaborators?.some(

        (c: any) =>

          c.id ===
          this.usuarioActual?.id

      )

  );

}

get proyectosExternos(): Project[] {

  return this.projects.filter(

    project =>

      project.owner?.id !==
      this.usuarioActual?.id

      &&

      !project.collaborators?.some(

        (c: any) =>

          c.id ===
          this.usuarioActual?.id

      )

  );

}
  irANuevoProyecto(): void {

    this.router.navigate([
      '/dashboard/projects'
    ]);

  }

  esPropietarioProyecto(
    project: Project
  ): boolean {

    const usuario =
      this.auth.obtenerUsuario();

    return (
      !!usuario &&
      project.owner?.id === usuario.id
    );

  }

  abrirModalEliminar(
    project: Project
  ): void {

    this.proyectoEliminar = project;

    this.nombreConfirmacion = '';

    this.mostrarModalEliminar = true;

  }

  cerrarModalEliminar(): void {

    this.mostrarModalEliminar = false;

    this.proyectoEliminar = null;

    this.nombreConfirmacion = '';

  }

  confirmarEliminarProyecto(): void {

    console.log(
    'Usuario:',
    this.auth.obtenerUsuario()
  );

  console.log(
    'Proyecto:',
    this.proyectoEliminar
  );

  if (!this.proyectoEliminar) {

    return;

  }

  this.projectService
    .deleteProject(
      this.proyectoEliminar.id!
    )
    .subscribe({

      next: () => {

        console.log(
          'Proyecto eliminado correctamente'
        );

        this.cerrarModalEliminar();

        this.cargarProyectos();

      },

      error: (err) => {

        console.error(
          'Error al eliminar proyecto',
          err
        );

      }

    });

}
  
}


