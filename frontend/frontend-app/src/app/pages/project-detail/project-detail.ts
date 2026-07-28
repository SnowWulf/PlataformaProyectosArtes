import {
  Component,
  inject,
  afterNextRender,
  ChangeDetectorRef
} from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';

import { Project } from '../../models/project';
import { ProjectService } from '../../services/project-service';
import { DocumentService } from '../../services/document';
import { Auth } from '../../services/auth';
import { DocumentForm } from '../../components/document-form/document-form';
import { Document } from '../../models/document';
import { DocumentReviewForm }
  from '../../components/document-review-form/document-review-form';
import { DocumentReviewService }
  from '../../services/document-review';

import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    NgClass,
    DocumentForm,
    DocumentReviewForm,
    DatePipe,
    FormsModule
  ],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.scss'
})

export class ProjectDetail {

  mostrarFormularioDocumento = false;
  documents: Document[] = [];
  documentoSeleccionado: Document | null = null;
  private route = inject(ActivatedRoute);

  projectId: number | null = null;

  project: Project | null = null;

  mostrarFormularioRevision = false;

  documentoRevision: any = null;

  tabActiva = 'informacion';

  mostrarModalEstado = false;

  estadoSeleccionado = '';

  proyectoEstado: Project | null = null;


  constructor(
    private projectService: ProjectService,
    private documentService: DocumentService,
    private documentReviewService: DocumentReviewService,
    private cdr: ChangeDetectorRef,
    public auth: Auth,
  ) {


    this.projectId = Number(
      this.route.snapshot.paramMap.get('id')
    );
    afterNextRender(() => {

      this.cargarProyecto();
      this.cargarDocumentos();

    });

  }

  cargarProyecto(): void {

    if (!this.projectId) {
      return;
    }

    this.projectService
      .getProject(this.projectId)
      .subscribe({

        next: (project) => {

          console.log('Proyecto:', project);

          this.project = project;

          this.cdr.detectChanges();

        },

        error: (error) => {

          console.error(error);

        }

      });

  }

  cargarDocumentos(): void {

    if (!this.projectId) {
      return;
    }

    this.documentService
      .getByProject(this.projectId)
      .subscribe({

        next: (documents: any) => {

          console.log('Documentos:', documents);

          this.documents = documents;

          this.documents.forEach(
            (document: any) => {

              this.cargarRevisiones(
                document
              );

            }
          );

          this.cdr.detectChanges();


        },

        error: (error) => {

          console.error(error);

        }

      });

  }

  abrirFormularioDocumento(
    document: Document | null = null
  ): void {

    this.documentoSeleccionado = document;

    this.mostrarFormularioDocumento = true;

  }

  cerrarFormularioDocumento(): void {

    this.mostrarFormularioDocumento = false;

    this.documentoSeleccionado = null;

  }

  puedeSubirDocumento(): boolean {

    const usuario = this.auth.obtenerUsuario();

    if (!usuario || !this.project) {
      return false;
    }

    return usuario.id === this.project.owner?.id;

  }

  documentoGuardado(): void {

    this.cerrarFormularioDocumento();

    this.cargarDocumentos();

  }

  eliminarDocumento(
    document: Document
  ): void {

    const confirmar = confirm(
      `¿Eliminar "${document.nombre}"?`
    );

    if (!confirmar) {

      return;

    }

    this.documentService
      .delete(document.id)
      .subscribe({

        next: () => {

          this.cargarDocumentos();

        },

        error: (error) => {

          console.error(error);

        }

      });

  }

  abrirFormularioRevision(
    document: any
  ): void {

    this.documentoRevision =
      document;

    this.mostrarFormularioRevision =
      true;

  }

  cerrarFormularioRevision(): void {

    this.mostrarFormularioRevision =
      false;

    this.documentoRevision =
      null;

  }

  revisionGuardada(): void {

    this.cerrarFormularioRevision();

    this.cargarDocumentos();

  }

  cargarRevisiones(
    document: any
  ): void {

    this.documentReviewService
      .getByDocument(document.id)
      .subscribe({

        next: (reviews: any) => {

          document.reviews = reviews;

          this.cdr.detectChanges();

        },

        error: (error) => {

          console.error(error);

        }

      });

  }


  obtenerClaseEstado(
    estado: string
  ): string {

    switch (estado) {

      case 'Aprobado':
        return 'estado-aprobado';

      case 'Requiere correcciones':
        return 'estado-correcciones';

      case 'En revisión':
        return 'estado-revision';

      case 'Rechazado':
        return 'estado-rechazado';

      default:
        return 'estado-pendiente';

    }

  }

  esPropietarioProyecto(): boolean {

    const usuario =
      this.auth.obtenerUsuario();

    if (!usuario || !this.project) {

      return false;

    }

    return usuario.id ===
      this.project.owner_id;

  }

  contarPendientesProyecto(
    projectId: number
  ): number {

    return this.documents.filter(

      document =>

        document.estado === 'Pendiente revisión' ||

        document.estado === 'En revisión'

    ).length;

  }

  revisionesAbiertas: Record<number, boolean> = {};

  toggleRevisiones(
    documentId: number
  ): void {

    this.revisionesAbiertas[
      documentId
    ] = !this.revisionesAbiertas[
    documentId
    ];

  }

  actualizarEstadoProyecto(): void {

    console.log(
  'Estado a guardar:',
  this.estadoSeleccionado
);

  if (!this.proyectoEstado) {

    return;

  }

  this.projectService
    .updateProject(
      this.proyectoEstado.id!,
      {

        titulo:
          this.proyectoEstado.titulo,

        descripcion:
          this.proyectoEstado.descripcion,

        tipo_proyecto:
          this.proyectoEstado.tipo_proyecto,

        estado:
          this.estadoSeleccionado

      }
    )
    .subscribe({

      next: (projectActualizado) => {

  this.project =
    projectActualizado;

  this.cerrarModalEstado();

  this.cdr.detectChanges();

}

    });

}
  abrirModalEstado(
    project: Project
  ): void {

    this.proyectoEstado =
      project;

    this.estadoSeleccionado =
      project.estado;

    this.mostrarModalEstado =
      true;

  }

  cerrarModalEstado(): void {

  this.mostrarModalEstado =
    false;

  this.proyectoEstado =
    null;

}



}