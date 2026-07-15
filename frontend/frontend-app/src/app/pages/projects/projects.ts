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

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [
  CommonModule,
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

  nuevoProyecto(){

    this.proyectoSeleccionado = null;

    this.mostrarFormulario = true;

}

editarProyecto(project: Project){

    this.proyectoSeleccionado = project;

    this.mostrarFormulario = true;

}

cerrarFormulario(){

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

  // El tutor solo los proyectos donde es tutor
  if (
    this.auth.esTutor() &&
    project.tutor?.id === usuario.id
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
}