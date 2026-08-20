import {
  Component,
  inject,
  afterNextRender,
  ChangeDetectorRef,
  ElementRef,
  ViewChild
} from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { DatePipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Models
import { Project } from '../../models/project';
import { Document } from '../../models/document';
import { ProjectDelivery } from '../../models/project-delivery';
import { DeliverySubmission } from '../../models/delivery-submission';

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
    ProjectAiChatbotComponent
  ],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.scss'
})
export class ProjectDetail {
  ultimaLecturaChat: Date = new Date(0);

  deliveries: ProjectDelivery[] = [];
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

  // CHATBOT IA
  iaChatOpen: boolean = false;

  actividadProyecto: any[] = [];

  // ENTREGAS
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

  revisionesAbiertas: Record<number, boolean> = {};

  @ViewChild('chatMessages') chatMessages!: ElementRef;

  ngOnInit(): void {
  // Polling para refrescar chat cada 5 segundos si estás en la pantalla
  this.intervalId = setInterval(() => {
    if (this.projectId) {
      this.cargarMensajes();
    }
  }, 5000);
}

ngOnDestroy(): void {
  // Limpiar el intervalo al salir del componente
  if (this.intervalId) {
    clearInterval(this.intervalId);
  }
}

  constructor(
    private projectService: ProjectService,
    private documentService: DocumentService,
    private documentReviewService: DocumentReviewService,
    private cdr: ChangeDetectorRef,
    public auth: Auth,
    private deliveryService: ProjectDeliveryService,
    private submissionService: DeliverySubmissionService,
    
  ) {
    

    this.projectId = Number(this.route.snapshot.paramMap.get('id'));

    afterNextRender(() => {
      this.cargarProyecto();
      this.cargarDocumentos();
    });
  }

  // ==========================================
  // CARGA DE PROYECTO Y ACTIVIDAD
  // ==========================================

    obtenerUltimaLectura(): Date {
  if (!this.projectId) return new Date(0);
  const guardado = localStorage.getItem(`chat_last_read_project_${this.projectId}`);
  return guardado ? new Date(guardado) : new Date(0); // Si es la primera vez, evaluará mensajes previos no leídos
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
      error: (error) => console.error('Error al cargar proyecto:', error)
    });


  }

  cargarActividad(): void {
    if (!this.project?.id) return;

    this.projectService.getProjectActivity(this.project.id).subscribe({
      next: (data) => {
        this.actividadProyecto = data;
      },
      error: (err) => console.error('Error cargando actividad:', err)
    });
  }

  // ==========================================
  // DOCUMENTOS Y REVISIONES
  // ==========================================

  cargarDocumentos(): void {
    if (!this.projectId) return;

    this.documentService.getByProject(this.projectId).subscribe({
      next: (documents: any) => {
        console.log('Documentos:', documents);
        this.documents = documents;

        this.documents.forEach((document: any) => {
          this.cargarRevisiones(document);
        });

        this.cdr.detectChanges();
      },
      error: (error) => console.error('Error al cargar documentos:', error)
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
      next: () => {
        this.cargarDocumentos();
      },
      error: (error) => console.error('Error al eliminar documento:', error)
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
      error: (error) => console.error('Error al cargar revisiones:', error)
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

  abrirModalEstado(project: Project): void {
    this.proyectoEstado = project;
    this.estadoSeleccionado = project.estado;
    this.mostrarModalEstado = true;
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
      error: (err) => console.error('Error eliminando colaborador:', err)
    });
  }

  // ==========================================
  // CHAT DEL PROYECTO (HUMANO) - OPTIMISTA (0ms)
  // ==========================================
mensajesNoLeidos = 0;
cargarMensajes(): void {
  if (!this.project?.id) return;

  this.projectService.getMessages(this.project.id).subscribe({
    next: (data) => {
      this.mensajes = data || [];

      // Si el chat está CERRADO al cargar la vista
      if (!this.chatAbierto) {
        const usuarioActual = this.auth.obtenerUsuario();
        const fechaUltimaLectura = this.obtenerUltimaLectura();

        // Contamos solo mensajes de OTROS usuarios creados DESPUÉS de la última vez que se abrió el chat
        this.mensajesNoLeidos = this.mensajes.filter((m) => {
          const esDeOtro = m.user?.id !== usuarioActual?.id;
          const fechaMensaje = new Date(m.created_at);
          return esDeOtro && fechaMensaje > fechaUltimaLectura;
        }).length;
      }

      this.scrollAlFinal();
      this.cdr.detectChanges();
    },
    error: (err) => console.error('Error cargando mensajes:', err)
  });
}

  /**
   * Envía el mensaje con respuesta optimista (aparece al instante en pantalla)
   */
  enviarMensaje(): void {
    const texto = this.nuevoMensaje?.trim();
    if (!texto || !this.project?.id) return;

    const usuarioActual = this.auth.obtenerUsuario();

    // 1. Crear el objeto de mensaje temporal para renderizar de inmediato
    const mensajeTemp: any = {
      id: 'temp-' + Date.now(),
      mensaje: texto,
      created_at: new Date().toISOString(),
      user: usuarioActual ? { id: usuarioActual.id, name: usuarioActual.name || 'Tú' } : { id: 0, name: 'Tú' },
      enviando: true // Indicador visual opcional
    };

    // 2. Insertar en pantalla inmediatamente (0ms)
    this.mensajes = [...this.mensajes, mensajeTemp];
    this.nuevoMensaje = '';
    this.scrollAlFinal();
    this.cdr.detectChanges();
    
    // 3. Petición HTTP al Backend en segundo plano
    this.projectService.sendMessage(this.project.id, texto).subscribe({
      next: (mensajeReal: any) => { // <-- Agrega `: any` aquí
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
    this.mensajesNoLeidos = 0; // Reiniciamos contador

    // Guardamos la fecha/hora actual como la última lectura de este proyecto
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


// Llama a este método cada vez que llegue un mensaje NUEVO en tiempo real
recibirNuevoMensaje(mensajeNuevo: any): void {
  const usuarioActual = this.auth.obtenerUsuario();

  // Verificar que el mensaje sea de OTRO usuario
  if (mensajeNuevo.user?.id !== usuarioActual?.id) {
    if (!this.chatAbierto) {
      // Si el chat está CERRADO, sumamos 1 a los mensajes del chat
      this.mensajesNoLeidos++;
    } else {
      // Si está abierto, simplemente hacemos scroll
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

  cargarEntregas(): void {
    if (!this.project?.id) return;

    this.deliveryService.getDeliveries(this.project.id).subscribe({
      next: (data: any) => {
        this.deliveries = Array.isArray(data) ? data : (data.deliveries || data.data || []);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar entregas:', err)
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
      next: (respuesta) => {
        console.log('✅ Entrega guardada exitosamente', respuesta);
        this.cargarEntregas();
        this.cerrarModalEntrega();
      },
      error: (err) => {
        console.error('❌ Error guardando entrega', err);
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
      error: (err) => console.error('Error al eliminar entrega:', err)
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
        console.log('🔍 Respuesta enviada al backend:', res);
        alert('Entrega enviada correctamente.');

        this.deliveries = this.deliveries.map((entrega) => {
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

        this.cerrarRespuesta();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al enviar entrega:', err);
        alert(err.error?.message ?? 'Error al enviar la respuesta.');
      }
    });
  }

  
}