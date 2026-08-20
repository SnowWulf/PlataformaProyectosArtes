import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ProjectService } from '../../services/project-service';
import { DocumentService } from '../../services/document';
import { Auth } from '../../services/auth';
import { Project } from '../../models/project';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tutor-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './tutor-home.html',
  styleUrl: './tutor-home.scss'
})
export class TutorHome implements OnInit {

  tabActiva = 'inicio';

  actividadReciente: any[] = [];

  proyectosAsignados: Project[] = [];

  totalProyectos = 0;

  pendientesRevision = 0;

  documentosEnRevision = 0;

  documentosAprobados = 0;

  documentosCorrecciones = 0;

  revisionesRealizadas = 0;

  filtroDocumentos = 'pendientes';

  documentosTutor: any[] = [];

  estudiantesTutor: any[] = [];

  filtroProyecto = 'Todos';

  proyectosFiltrados: Project[] = [];

  estudianteExpandido: number | null = null;

  historialRevisiones: any[] = [];

  revisionSeleccionada: any = null;

  estadisticasProyecto: {
    [projectId: number]: {
      pendientes: number;
      revision: number;
      correcciones: number;
    };
  } = {};

  constructor(
    private projectService: ProjectService,
    private documentService: DocumentService,
    private auth: Auth,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) { }

  ngOnInit(): void {

    this.cargarProyectosTutor();

  }

  cargarProyectosTutor(): void {

    // Limpiar datos


    this.proyectosAsignados = [];

    this.documentosTutor = [];

    this.totalProyectos = 0;

    this.pendientesRevision = 0;

    this.revisionesRealizadas = 0;

    this.documentosAprobados = 0;

    this.documentosCorrecciones = 0;

    this.documentosEnRevision = 0;

    this.estudiantesTutor = [];



    const usuario =
      this.auth.obtenerUsuario();

    console.log(
      'Usuario logueado:',
      usuario
    );

    this.projectService
      .getProjects()
      .subscribe({

        next: (projects: Project[]) => {



          this.proyectosAsignados =
            projects.filter(

              project =>

                project.tutor_id ===
                usuario?.id
            );


          this.proyectosAsignados.forEach(

            project => {

              const estudiante =
                project.owner;

              if (!estudiante) {

                return;

              }

              const existente =
                this.estudiantesTutor.find(

                  e =>

                    e.id ===
                    estudiante.id

                );

              if (existente) {

                existente.proyectos++;

              }

              else {

                this.estudiantesTutor.push({

                  id: estudiante.id,

                  nombre: estudiante.name,

                  email: estudiante.email,

                  proyectos: 1

                });

              }

            }

          );
          this.totalProyectos =
            this.proyectosAsignados.length;



          this.proyectosAsignados.forEach(

            project => {



              this.documentService
                .getByProject(project.id)
                .subscribe({

                  next: (documents: any) => {

                    this.estadisticasProyecto[
                      project.id
                    ] = {

                      pendientes:

                        documents.filter(
                          (document: any) =>
                            document.estado ===
                            'Pendiente revisión'
                        ).length,

                      revision:

                        documents.filter(
                          (document: any) =>
                            document.estado ===
                            'En revisión'
                        ).length,

                      correcciones:

                        documents.filter(
                          (document: any) =>
                            document.estado ===
                            'Requiere correcciones'
                        ).length

                    };




                    documents.forEach(


                      (document: any) => {

                        this.actividadReciente.push({

                          tipo: 'documento',

                          proyecto:
                            project.titulo,

                          proyectoId:
                            project.id,

                          estudiante:
                            project.owner?.name,

                          documento:
                            document.nombre,

                          estado:
                            document.estado,

                          fecha:

                            document.updated_at
                            ||

                            document.created_at

                        });

                        this.actividadReciente.sort(

                          (a, b) =>

                            new Date(
                              b.fecha
                            ).getTime()

                            -

                            new Date(
                              a.fecha
                            ).getTime()

                        );


                        if (

                          document.estado === 'Aprobado'

                          ||

                          document.estado === 'Requiere correcciones'

                          ||

                          document.estado === 'Rechazado'

                        ) {

                          this.historialRevisiones.push({

                            proyecto:
                              project.titulo,

                            proyectoId:
                              project.id,

                            documento:
                              document.nombre,

                            estudiante:
                              project.owner?.name,

                            estado:
                              document.estado,

                            fecha:

                              document.updated_at
                              ||

                              document.created_at

                          });

                        }

                        this.historialRevisiones.sort(

                          (a, b) =>

                            new Date(
                              b.fecha
                            ).getTime()

                            -

                            new Date(
                              a.fecha
                            ).getTime()

                        );

                        this.documentosTutor.push({

                          ...document,

                          proyectoId: project.id,

                          proyectoTitulo: project.titulo

                        });

                      }

                    );

                    // Pendientes reales

                    this.pendientesRevision +=

                      documents.filter(

                        (document: any) =>

                          document.estado ===
                          'Pendiente revisión'

                          ||

                          document.estado ===
                          'submitted'

                      ).length;


                    // Revisando ahora

                    this.documentosEnRevision +=

                      documents.filter(

                        (document: any) =>

                          document.estado ===
                          'En revisión'

                      ).length;


                    // Aprobados

                    this.documentosAprobados +=

                      documents.filter(

                        (document: any) =>

                          document.estado ===
                          'Aprobado'

                      ).length;


                    // Correcciones

                    this.documentosCorrecciones +=

                      documents.filter(

                        (document: any) =>

                          document.estado ===
                          'Requiere correcciones'

                      ).length;


                    this.revisionesRealizadas +=

                      documents.filter(

                        (document: any) =>

                          document.estado ===
                          'Aprobado'

                          ||

                          document.estado ===
                          'Requiere correcciones'

                          ||

                          document.estado ===
                          'Rechazado'

                      ).length;

                    this.cdr.detectChanges();
                  },



                  error: (error) => {

                    console.error(
                      'Error cargando documentos:',
                      error
                    );

                  }

                });

            }

          );

        },

        error: (error) => {

          console.error(
            'Error cargando proyectos:',
            error
          );

        }

      });

  }

  obtenerDocumentosFiltrados() {

    switch (this.filtroDocumentos) {

      case 'proyectos':

        return this.proyectosAsignados;

      case 'pendientes':

        return this.documentosTutor.filter(
          document =>
            document.estado ===
            'Pendiente revisión' || document.estado === 'submitted'
        );

      case 'revisando':

        return this.documentosTutor.filter(
          document =>
            document.estado ===
            'En revisión'
        );

      case 'aprobados':

        return this.documentosTutor.filter(
          document =>
            document.estado ===
            'Aprobado'
        );

      case 'correcciones':

        return this.documentosTutor.filter(
          document =>
            document.estado ===
            'Requiere correcciones'
        );

      case 'realizadas':

        return this.documentosTutor.filter(
          document =>
            document.estado === 'Aprobado' ||
            document.estado === 'Requiere correcciones' ||
            document.estado === 'Rechazado'
        );

      default:

        return [];

    }

  }
  abrirProyecto(
    projectId: number
  ): void {

    this.router.navigate([
      '/dashboard/projects',
      projectId
    ]);

  }


  toggleEstudiante(
    estudianteId: number
  ): void {

    if (
      this.estudianteExpandido ===
      estudianteId
    ) {

      this.estudianteExpandido = null;

    } else {

      this.estudianteExpandido =
        estudianteId;

    }

  }

  filtrarProyectos(
    estado: string
  ): void {

    this.filtroProyecto =
      estado;

  }

  obtenerProyectosFiltrados() {

    if (
      this.filtroProyecto ===
      'Todos'
    ) {

      return this.proyectosAsignados;

    }

    return this.proyectosAsignados.filter(

      proyecto =>

        proyecto.estado ===
        this.filtroProyecto

    );

  }

actualizarEstadoProyecto(
  proyecto: any
): void {

  this.projectService
    .updateProject(

      proyecto.id,

      {
        estado: proyecto.estado
      }

    )
    .subscribe({

      next: () => {

        console.log(
          'Estado actualizado'
        );

      },

      error: (error) => {

        console.error(
          'Error actualizando estado',
          error
        );

      }

    });

}


}