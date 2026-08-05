import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
import { ProjectService } from '../../services/project-service';
import { DocumentService } from '../../services/document';
import { DatePipe } from '@angular/common';
import { DocumentReviewService } from '../../services/document-review';
import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-student-home',
  standalone: true,
  imports: [
    DatePipe
  ],
  templateUrl: './student-home.html',
  styleUrl: './student-home.scss'

})
export class StudentHome implements OnInit {

  ultimoMovimientoProyecto: Date | null = null;

  historialRevisiones: any[] = [];

  tabActiva = 'inicio';

  totalDocumentos = 0;

  aprobados = 0;

  filtroEstado = 'Todos';

  todosLosDocumentos: any[] = [];

  documentosFiltrados: any[] = [];

  rechazados = 0;

  progresoProyecto = 0;

  documentosProyectoActual = 0;

  aprobadosProyectoActual = 0;

  enRevision = 0;

  requierenCorrecciones = 0;

  ultimaRevision: any = null;

  ultimoDocumento: any = null;

  proyectoActual: any = null;

  alertasProyectos: any[] = [];

  actividadProyecto: any[] = [];

  constructor(
    private projectService: ProjectService,
    private documentService: DocumentService,
    private documentReviewService: DocumentReviewService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {

    console.log('ngOnInit');
    this.cargarResumen();

  }

  abrirProyecto(
    projectId: number
  ): void {

    this.router.navigate([
      '/dashboard/projects',
      projectId
    ]);

  }
  cargarResumen(): void {

    this.alertasProyectos = [];

    this.proyectoActual = null;

    this.ultimaRevision = null;

    this.ultimoDocumento = null;

    console.log('cargarResumen');

    this.totalDocumentos = 0;

    this.aprobados = 0;

    this.enRevision = 0;

    this.todosLosDocumentos = [];

    this.documentosFiltrados = [];

    this.rechazados = 0;

    this.filtroEstado = 'Todos';

    this.requierenCorrecciones = 0;

    this.progresoProyecto = 0;

    this.projectService
      .getProjects()
      .subscribe({

        next: (projects: any[]) => {

          if (projects.length > 0) {

            this.proyectoActual = projects[0];

            this.cdr.detectChanges();

            this.cargarActividad();

          }
          projects.forEach(project => {

            this.documentService
              .getByProject(project.id)
              .subscribe({

                next: (documents: any) => {

                  documents.forEach((document: any) => {

                    const fechaDocumento =
                      new Date(
                        document.updated_at ??
                        document.created_at
                      );

                    if (

                      !this.ultimoMovimientoProyecto ||

                      fechaDocumento >
                      this.ultimoMovimientoProyecto

                    ) {

                      this.ultimoMovimientoProyecto =
                        fechaDocumento;

                      this.proyectoActual =
                        project;

                    }

                  });

                  this.procesarDocumentos(
                    documents
                  );

                  this.procesarAlertasProyecto(
                    project,
                    documents


                  );


                  if (
                    project.id ===
                    this.proyectoActual?.id
                  ) {

                    this.calcularProgresoProyecto(
                      documents
                    );

                  }

                  this.buscarUltimaRevision(
                    documents,
                    project
                  );

                }

                

              });

          });

        }

      });

  }

  procesarDocumentos(
    documents: any[]
  ): void {

    this.totalDocumentos +=
      documents.length;

    documents.forEach(document => {

      switch (
      document.estado
      ) {

        case 'Aprobado':

          this.aprobados++;

          break;

        case 'En revisión':

          this.enRevision++;

          break;

        case 'Requiere correcciones':

          this.requierenCorrecciones++;

          break;

        case 'Rechazado':

          this.rechazados++;

          break;

      }


    });

    console.log({

      total: this.totalDocumentos,

      aprobados: this.aprobados,

      revision: this.enRevision,

      correcciones: this.requierenCorrecciones

    });

  }


  buscarUltimaRevision(
    documents: any[],
    project: any
  ): void {

    documents.forEach(document => {

      this.documentReviewService
        .getByDocument(document.id)
        .subscribe({

          next: (reviews: any) => {

            if (
              !reviews ||
              reviews.length === 0
            ) {

              return;

            }

            const ultima = reviews[0];

            reviews.forEach((review: any) => {

              this.historialRevisiones.push({

                fecha:
                  review.created_at,

                proyecto:
                  project.titulo,

                documento:
                  document.nombre,

                estado:
                  review.estado,

                comentario:
                  review.comentario,

                tutor:
                  review.tutor?.name

              });
              this.historialRevisiones.sort(

                (a, b) =>

                  new Date(b.fecha).getTime()

                  -

                  new Date(a.fecha).getTime()

              );

            });

            if (
              !this.ultimaRevision ||
              new Date(
                ultima.created_at
              ) >
              new Date(
                this.ultimaRevision.created_at
              )
            ) {

              this.ultimaRevision =
                ultima;

              this.ultimoDocumento =
                document;

            }

          }

        });

    });

  }

  calcularProgresoProyecto(
    documents: any[]
  ): void {



    this.documentosProyectoActual =
      documents.length;

    this.aprobadosProyectoActual =
      documents.filter(

        (document: any) =>

          document.estado ===
          'Aprobado'

      ).length;

    if (
      this.documentosProyectoActual > 0
    ) {

      this.progresoProyecto =
        Math.round(

          (
            this.aprobadosProyectoActual /

            this.documentosProyectoActual

          ) * 100

        );

    } else {

      this.progresoProyecto = 0;

    }

    this.cdr.detectChanges();

  }
  procesarAlertasProyecto(
    project: any,
    documents: any[]
  ): void {

    this.todosLosDocumentos.push(
      ...documents
    );

    this.documentosFiltrados =
      this.todosLosDocumentos;

    console.log(
      'Proyecto:',
      project.titulo
    );

    documents.forEach(
      (document: any) => {

        console.log(
          document.nombre,
          document.estado
        );

      }
    );

    const enRevision =
      documents.filter(
        (document: any) =>
          document.estado ===
          'En revisión'
      ).length;

    const correcciones =
      documents.filter(
        (document: any) =>
          document.estado ===
          'Requiere correcciones'
      ).length;

    console.log(
      'Alerta calculada',
      {
        proyecto: project.titulo,
        enRevision,
        correcciones
      }
    );

    if (

      enRevision > 0 ||

      correcciones > 0

    ) {

      this.alertasProyectos.push({

        proyectoId:
          project.id,

        titulo:
          project.titulo,

        enRevision,

        correcciones

      });

      this.cdr.detectChanges();

    }
  }

  filtrarDocumentos(
    estado: string
  ): void {

    this.filtroEstado =
      estado;

    if (
      estado === 'Todos'
    ) {

      this.documentosFiltrados =
        this.todosLosDocumentos;

      return;

    }

    this.documentosFiltrados =
      this.todosLosDocumentos.filter(

        document =>

          document.estado === estado

      );

  }

  abrirDocumento(
    document: any
  ): void {

    this.router.navigate([

      '/dashboard/projects',

      document.project_id

    ]);

  }

  cargarActividad(): void {

  this.projectService
    .getStudentActivity()
    .subscribe({

      next: data => {

        console.log(
          'Actividad recibida:',
          data
        );

        this.actividadProyecto = data;

      },

      error: err => {

        console.error(
          'Error actividad:',
          err
        );

      }

    });

}
}