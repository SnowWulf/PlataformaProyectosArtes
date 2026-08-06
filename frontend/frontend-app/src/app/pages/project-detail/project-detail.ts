import {
  Component,
  inject,
  afterNextRender,
  ChangeDetectorRef
} from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { CommonModule } from '@angular/common';
import { DeliverySubmission } from '../../models/delivery-submission';
import { Project } from '../../models/project';
import { ProjectService } from '../../services/project-service';
import { DocumentService } from '../../services/document';
import { Auth } from '../../services/auth';
import { DocumentForm } from '../../components/document-form/document-form';
import { Document } from '../../models/document';
import { DocumentReviewForm } from '../../components/document-review-form/document-review-form';
import { DocumentReviewService } from '../../services/document-review';
import { FormsModule } from '@angular/forms';
import { ElementRef, ViewChild } from '@angular/core';

import { ProjectDelivery } from '../../models/project-delivery';
import { ProjectDeliveryService } from '../../services/project-delivery-service';

import { DeliverySubmissionModal } from '../../components/delivery-submission-modal/delivery-submission-modal';
import { DeliverySubmissionService } from '../../services/delivery-submission';


@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    DocumentForm,
    DocumentReviewForm,
    DatePipe,
    FormsModule,
    DeliverySubmissionModal
  ],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.scss'
})


export class ProjectDetail {

  deliveries: ProjectDelivery[] = [];
  
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

  mensajes: any[] = [];

  nuevoMensaje = '';

  chatAbierto = false;

  actividadProyecto: any[] = [];

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

  @ViewChild(
    'chatMessages'
  )
  chatMessages!:
    ElementRef;

  constructor(
    private projectService: ProjectService,
    private documentService: DocumentService,
    private documentReviewService: DocumentReviewService,
    private cdr: ChangeDetectorRef,
    public auth: Auth,
    private deliveryService: ProjectDeliveryService,
    private submissionService: DeliverySubmissionService,

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

          this.cargarActividad();
          this.project = project;
          this.cargarEntregas(); 
          this.cargarMensajes();
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


  eliminarColaborador(
    userId: number
  ): void {

    if (
      !confirm(
        '¿Eliminar colaborador?'
      )
    ) {

      return;

    }

    this.projectService
      .removeCollaborator(
        this.project!.id,
        userId
      )
      .subscribe({

        next: () => {

          this.project!.collaborators =
            this.project!.collaborators!
              .filter(

                c => c.id !== userId

              );
          this.cdr.detectChanges();
        },

        error: (err) => {

          console.error(err);

        }

      });

  }
  cargarMensajes(): void {

    this.projectService
      .getMessages(
        this.project!.id
      )
      .subscribe({

        next: data => {

          this.mensajes =
            data;

          this.scrollAlFinal();
        }

      });

  }
  enviarMensaje(): void {

    console.log(
      'Mensaje actual:',
      this.nuevoMensaje
    );

    if (
      !this.nuevoMensaje.trim()
    ) {

      return;

    }

    this.projectService
      .sendMessage(

        this.project!.id,

        this.nuevoMensaje

      )
      .subscribe({

        next: mensaje => {

          this.mensajes = [

            ...this.mensajes,

            mensaje

          ];

          this.nuevoMensaje =
            '';


          this.scrollAlFinal();
          this.cdr.detectChanges();
          this.cargarMensajes();
        }

      });

  }
  toggleChat(): void {

    this.chatAbierto =
      !this.chatAbierto;
    this.scrollAlFinal();

  }

  esMismoAutor(
    index: number
  ): boolean {

    if (
      index === 0
    ) {

      return false;

    }

    return (

      this.mensajes[index]
        .user.id

      ===

      this.mensajes[index - 1]
        .user.id

    );

  }

  scrollAlFinal(): void {

    setTimeout(() => {

      if (

        !this.chatMessages

      ) {

        return;

      }

      this.chatMessages
        .nativeElement
        .scrollTop =

        this.chatMessages
          .nativeElement
          .scrollHeight;

    });

  }

  mostrarHora(
    index: number
  ): boolean {

    const actual =
      this.mensajes[index];

    const siguiente =
      this.mensajes[index + 1];

    if (!siguiente) {

      return true;
    }

    if (

      actual.user.id
      !==
      siguiente.user.id

    ) {

      return true;
    }

    const actualFecha =
      new Date(
        actual.created_at
      );

    const siguienteFecha =
      new Date(
        siguiente.created_at
      );

    const diferencia =
      (
        siguienteFecha.getTime()
        -
        actualFecha.getTime()
      )
      / 60000;

    return diferencia > 5;

  }


  esMiMensaje(
    mensaje: any
  ): boolean {

    const usuario =
      this.auth
        .obtenerUsuario();

    return (

      usuario?.id ===
      mensaje.user.id

    );

  }

  puedeEditarDocumento(
    document: any
  ): boolean {

    const usuario =
      this.auth.obtenerUsuario();

    if (!usuario) {

      return false;

    }

    const esAutor =

      document.user?.id ===
      usuario.id;

    const esPropietario =

      this.project?.owner?.id ===
      usuario.id;

    return (
      esAutor ||
      esPropietario
    );

  }

  puedeCrearDocumento(): boolean {

    const usuario =
      this.auth.obtenerUsuario();

    if (
      !usuario ||
      !this.project
    ) {

      return false;

    }

    const esPropietario =

      this.project.owner?.id ===
      usuario.id;

    const esColaborador =

      this.project.collaborators?.some(

        (c: any) =>

          c.id === usuario.id

      ) ?? false;

    return (
      esPropietario ||
      esColaborador
    );

  }

  cargarActividad(): void {

    if (!this.project?.id) {

      return;

    }

    this.projectService
      .getProjectActivity(
        this.project.id
      )
      .subscribe({

        next: data => {

          this.actividadProyecto =
            data;

        },

        error: err => {

          console.error(
            'Error cargando actividad',
            err
          );

        }

      });

  }

cargarEntregas() {
  if (!this.project?.id) return;

  this.deliveryService
    .getDeliveries(this.project.id)
    .subscribe({
      next: (data: any) => {
        this.deliveries = Array.isArray(data) ? data : (data.deliveries || data.data || []);
        this.cdr.detectChanges(); // Refresca la vista en Angular
      },
      error: err => console.error('Error al cargar entregas:', err)
    });
}

abrirNuevaEntrega() {

  this.modoEdicionEntrega = false;

  this.entregaActual = {

    titulo: '',

    descripcion: '',

    fecha_limite: '',

    obligatorio: true

  };

  this.mostrarModalEntrega = true;

}

editarEntrega(
  entrega: ProjectDelivery
) {

  this.modoEdicionEntrega = true;

  this.entregaActual = {

    ...entrega

  };

  this.mostrarModalEntrega = true;

}


cerrarModalEntrega() {
  this.mostrarModalEntrega = false;
  this.guardandoEntrega = false;
  this.cdr.detectChanges(); // 👈 Forzar a Angular a refrescar el DOM
}

guardarEntrega() {
  if (!this.project || this.guardandoEntrega) {
    return;
  }

  this.guardandoEntrega = true;

  const request = this.modoEdicionEntrega
    ? this.deliveryService.updateDelivery(
        this.entregaActual.id,
        this.entregaActual
      )
    : this.deliveryService.createDelivery(
        this.project.id,
        this.entregaActual
      );

  request.subscribe({
    next: (respuesta) => {
      console.log('✅ NEXT ejecutado', respuesta);
      this.cargarEntregas();
      this.cerrarModalEntrega(); // 👈 Llama a cerrar con detectChanges()
    },
    error: err => {
      console.error('❌ ERROR ejecutado', err);
      this.guardandoEntrega = false;
      this.cdr.detectChanges(); // 👈 Forzar refresco en caso de error
    }
  });
}

eliminarEntrega(
  id: number
) {

  if (

    !confirm(

      '¿Eliminar esta entrega?'

    )

  ) {

    return;

  }

  this.deliveryService
    .deleteDelivery(id)
    .subscribe({

      next: () => {

        this.cargarEntregas();

    this.cerrarModalEntrega();

      },

      error: err => {

        console.error(err);

      }

    });

}

abrirRespuesta(
  entrega: ProjectDelivery
) {

  this.entregaResponder = entrega;

  this.mostrarModalRespuesta = true;

}

cerrarRespuesta() {

  this.mostrarModalRespuesta = false;

  this.entregaResponder = null;

}

guardarRespuesta(formData: FormData) {
  if (!this.entregaResponder) {
    return;
  }

  const idEntregaActual = this.entregaResponder.id;

  this.submissionService
    .submitDelivery(idEntregaActual, formData)
    .subscribe({
      next: (res: any) => {
        console.log('🔍 Respuesta recibida del backend al entregar:', res);
        alert('Entrega enviada correctamente.');

        // Reemplazamos la entrega en el arreglo creando un nuevo objeto para forzar la detección de cambios
        this.deliveries = this.deliveries.map(entrega => {
          if (entrega.id === idEntregaActual) {
            return {
              ...entrega,
              respuesta: res || {
                id: Date.now(),
                delivery_id: idEntregaActual,
                student_id: 0,
                file_path: '',
                estado: 'submitted',
                created_at: new Date().toISOString()
              }
            };
          }
          return entrega;
        });

        console.log('📦 Entregas actualizadas localmente:', this.deliveries);

        this.cerrarRespuesta();
        this.cdr.detectChanges(); // Forzar actualización de pantalla
      },
      error: (err) => {
        console.error('Error al enviar entrega:', err);
        alert(err.error?.message ?? 'Error al enviar.');
      }
    });
}



}