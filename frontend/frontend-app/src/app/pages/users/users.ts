import {
  Component,
  afterNextRender,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../models/user';
import { UserService } from '../../services/user-service';
import { RegistrationRequest } from '../../models/registration-request';
import { UserForm } from '../user-form/user-form';
import { DeleteUserDialog } from '../../components/delete-user-dialog/delete-user-dialog';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    UserForm,
    DeleteUserDialog,
    FormsModule,
  ],
  templateUrl: './users.html',
  styleUrl: './users.scss'
})
export class Users {

  users: User[] = [];
  solicitudes: RegistrationRequest[] = [];

  pestanaActiva: 'usuarios' | 'solicitudes' = 'usuarios';

  mostrarFormulario = false;
  usuarioSeleccionado: User | null = null;

  // CONFIRMACIÓN DE CONTRASEÑA EN FORMULARIO
  confirmarPassword = '';
  errorPasswordNoCoincide = false;

  mostrarDialogoEliminar = false;
  usuarioAEliminar: User | null = null;

  // Modales e Interacción con Solicitudes
  solicitudVerDetalle: RegistrationRequest | null = null;
  solicitudSeleccionada: RegistrationRequest | null = null;
  accionSolicitud: 'aprobar' | 'rechazar' | null = null;
  mensajeRespuesta: string = '';
  passwordTemporal: string = ''; // <- Almacena la contraseña generada

  // Control de estado para evitar peticiones duplicadas
  procesandoSolicitud: boolean = false;

  busqueda = '';
  filtroRol = 'todos';
  filtroPrograma = 'todos';
  mostrarFiltroPrograma = false;

  constructor(
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {
    afterNextRender(() => {
      this.cargarUsuarios();
      this.cargarSolicitudes();
    });
  }

  cargarUsuarios(): void {
    this.userService
      .getUsers()
      .subscribe({
        next: (data: User[]) => {
          this.users = data;
          this.cdr.detectChanges();
        },
        error: (err: any) => console.error('Error al cargar usuarios:', err)
      });
  }

  cargarSolicitudes(): void {
    this.userService
      .getRegistrationRequests()
      .subscribe({
        next: (data: RegistrationRequest[]) => {
          this.solicitudes = data;
          this.cdr.detectChanges();
        },
        error: (err: any) => console.error('Error al cargar solicitudes:', err)
      });
  }

  // --- MÉTODOS DE DETALLE DE SOLICITUD ---
  abrirDetalleSolicitud(solicitud: RegistrationRequest): void {
    this.solicitudVerDetalle = solicitud;
  }

  cerrarDetalleSolicitud(): void {
    this.solicitudVerDetalle = null;
  }

  // --- MÉTODOS DE APROBACIÓN Y RECHAZO CON CORREO ---
  abrirConfirmacionSolicitud(solicitud: RegistrationRequest, accion: 'aprobar' | 'rechazar'): void {
    this.solicitudVerDetalle = null;
    this.solicitudSeleccionada = solicitud;
    this.accionSolicitud = accion;

    if (accion === 'aprobar') {
      this.passwordTemporal = this.generarContrasenaAleatoria(12);
      this.mensajeRespuesta = `Hola ${solicitud.name}, tu solicitud para el programa ${solicitud.programa} ha sido aprobada. Tu contraseña temporal es: ${this.passwordTemporal}`;
    } else {
      this.passwordTemporal = '';
      this.mensajeRespuesta = `Hola ${solicitud.name}, lamentamos informarte que tu solicitud ha sido rechazada.`;
    }
  }

  cerrarConfirmacionSolicitud(): void {
    this.solicitudSeleccionada = null;
    this.accionSolicitud = null;
    this.mensajeRespuesta = '';
    this.passwordTemporal = '';
    this.procesandoSolicitud = false;
  }

  confirmarProcesarSolicitud(): void {
    if (this.procesandoSolicitud || !this.solicitudSeleccionada || !this.accionSolicitud) {
      return;
    }

    this.procesandoSolicitud = true;
    const id = this.solicitudSeleccionada.id;
    const msg = this.mensajeRespuesta;

    if (this.accionSolicitud === 'aprobar') {
      // Se envía el ID, el mensaje y la contraseña temporal al servicio
      this.userService.approveRegistrationRequest(id, msg, this.passwordTemporal).subscribe({
        next: () => {
          alert('Solicitud aprobada con éxito.');
          this.solicitudes = this.solicitudes.filter(s => s.id !== id);
          this.cerrarConfirmacionSolicitud();
          this.cargarUsuarios();
        },
        error: (err: any) => {
          this.procesandoSolicitud = false;
          console.error('Error al aprobar solicitud:', err);
          alert(err.error?.message ?? 'Error al aprobar la solicitud.');
        }
      });
    } else {
      this.userService.rejectRegistrationRequest(id, msg).subscribe({
        next: () => {
          alert('Solicitud rechazada.');
          this.solicitudes = this.solicitudes.filter(s => s.id !== id);
          this.cerrarConfirmacionSolicitud();
        },
        error: (err: any) => {
          this.procesandoSolicitud = false;
          console.error('Error al rechazar solicitud:', err);
          alert(err.error?.message ?? 'Error al rechazar la solicitud.');
        }
      });
    }
  }

  // --- GESTIÓN DE USUARIOS (CREAR / EDITAR) ---
  nuevoUsuario(): void {
    this.usuarioSeleccionado = null;
    this.limpiarValidacionPassword();
    this.mostrarFormulario = true;
  }

  editarUsuario(usuario: User): void {
    this.usuarioSeleccionado = usuario;
    this.limpiarValidacionPassword();
    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.usuarioSeleccionado = null;
    this.limpiarValidacionPassword();
  }

  limpiarValidacionPassword(): void {
    this.confirmarPassword = '';
    this.errorPasswordNoCoincide = false;
  }

  abrirEliminar(usuario: User): void {
    this.usuarioAEliminar = usuario;
    this.mostrarDialogoEliminar = true;
  }

  cerrarEliminar(): void {
    this.mostrarDialogoEliminar = false;
    this.usuarioAEliminar = null;
  }

  confirmarEliminar(password: string): void {
    if (!this.usuarioAEliminar) return;

    this.userService
      .deleteUserWithPassword(this.usuarioAEliminar.id, password)
      .subscribe({
        next: (response: any) => {
          alert(response.message);
          this.cerrarEliminar();
          this.cargarUsuarios();
        },
        error: (err: any) => {
          console.error(err);
          if (err.status === 401) alert('Contraseña incorrecta.');
          else alert('No fue posible eliminar el usuario.');
        }
      });
  }

  usuarioGuardado(): void {
    this.cargarUsuarios();
    this.cerrarFormulario();
  }

  get usuariosFiltrados(): User[] {
    return this.users.filter(usuario => {
      const coincideBusqueda =
        usuario.name.toLowerCase().includes(this.busqueda.toLowerCase()) ||
        usuario.email.toLowerCase().includes(this.busqueda.toLowerCase());

      const coincideRol =
        this.filtroRol === 'todos' || usuario.role?.nombre === this.filtroRol;

      const coincidePrograma =
        this.filtroPrograma === 'todos' || usuario.programa === this.filtroPrograma;

      return coincideBusqueda && coincideRol && coincidePrograma;
    });
  }

  get solicitudesFiltradas(): RegistrationRequest[] {
    return this.solicitudes.filter(solicitud =>
      solicitud.name.toLowerCase().includes(this.busqueda.toLowerCase()) ||
      solicitud.email.toLowerCase().includes(this.busqueda.toLowerCase())
    );
  }

  get programasDisponibles(): string[] {
    return [
      ...new Set(
        this.users
          .map(usuario => usuario.programa)
          .filter((programa): programa is string => !!programa)
      )
    ];
  }

  toggleFiltroPrograma(): void {
    this.mostrarFiltroPrograma = !this.mostrarFiltroPrograma;
  }

  seleccionarPrograma(programa: string): void {
    this.filtroPrograma = programa;
    this.mostrarFiltroPrograma = false;
  }

  private generarContrasenaAleatoria(longitud: number = 12): string {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
    let resultado = '';
    const array = new Uint32Array(longitud);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < longitud; i++) {
      resultado += caracteres[array[i] % caracteres.length];
    }
    return resultado;
  }
}