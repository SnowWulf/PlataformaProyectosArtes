import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user-service';
import { Auth, ToggleTwoFactorResponse, ConfirmTwoFactorResponse } from '../../services/auth';
import { User } from '../../models/user';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class Profile implements OnInit {

  usuario: User = {} as User;
  foto: File | null = null;
  cargando: boolean = false;
  cargando2FA: boolean = false;

  // Propiedades para la gestión del modal de confirmación 2FA
  mostrarModal2FA: boolean = false;
  codigo2FA: string = '';
  estadoPendiente2FA: boolean = false;

  private previewUrl: string | null = null;

  constructor(
    private userService: UserService,
    private authService: Auth,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarPerfil();
  }

  cargarPerfil(): void {
    this.userService.getProfile().subscribe({
      next: (data: any) => {
        console.log('Respuesta de la API:', data);

        const userObj = data.data || data.user || data;
        const listaProyectos = userObj.proyectos || userObj.projects || userObj.community_projects || [];

        this.usuario = {
          ...userObj,
          bio: userObj.bio ?? userObj.biografia ?? '',
          foto_url: userObj.foto_url ?? userObj.foto ?? userObj.avatar ?? '',
          mostrar_proyectos: userObj.mostrar_proyectos == 1 || userObj.mostrar_proyectos === true,
          mostrar_correo: userObj.mostrar_correo == 1 || userObj.mostrar_correo === true,
          two_factor_enabled: userObj.two_factor_enabled == 1 || userObj.two_factor_enabled === true,
          proyectos: listaProyectos.map((p: any) => ({
            ...p,
            titulo: p.titulo || p.title || p.nombre || 'Proyecto sin título',
            es_visible: p.es_visible == 1 || p.es_visible === true || p.visible == 1 || p.visible === true
          }))
        };

        // Sincroniza en localStorage para mantener actualizado el estado global
        this.authService.actualizarUsuarioEnSesion(this.usuario);

        console.log('Proyectos mapeados en usuario:', this.usuario.proyectos);
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error al cargar el perfil:', err);
      }
    });
  }

  // En profile.ts

toggleTwoFactor(event: Event): void {
  const checkInput = event.target as HTMLInputElement;
  
  // Guardamos el estado que el usuario intenta establecer (activar o desactivar)
  const nuevoEstado = checkInput.checked;
  this.estadoPendiente2FA = nuevoEstado;

  // Garantizamos booleano estricto (false si es undefined) para evitar TS2322
  checkInput.checked = this.usuario.two_factor_enabled ?? false;

  this.cargando2FA = true;

  // Solicita el envío del código al correo
  this.authService.toggleTwoFactor(nuevoEstado).subscribe({
    next: (res: ToggleTwoFactorResponse) => {
      this.cargando2FA = false;
      this.codigo2FA = '';
      this.mostrarModal2FA = true; // Abre el modal de confirmación
      this.cdr.detectChanges();
    },
    error: (err: any) => {
      this.cargando2FA = false;
      this.cdr.detectChanges();

      console.error('Error al solicitar código 2FA:', err);
      const msj = err.error?.message || 'No se pudo enviar el código de verificación en 2 pasos.';
      alert(msj);
    }
  });
}

  confirmarCodigo2FA(): void {
    if (!this.codigo2FA || this.codigo2FA.trim().length < 6) {
      alert('Por favor, ingresa un código de 6 dígitos válido.');
      return;
    }

    this.cargando2FA = true;

    this.authService.confirmTwoFactor(this.codigo2FA.trim(), this.estadoPendiente2FA).subscribe({
      next: (res: ConfirmTwoFactorResponse) => {
        this.cargando2FA = false;
        this.mostrarModal2FA = false;
        this.usuario.two_factor_enabled = this.estadoPendiente2FA;

        // Actualiza el objeto guardado en la sesión local
        const usuarioSesion = this.authService.obtenerUsuario();
        if (usuarioSesion) {
          usuarioSesion.two_factor_enabled = this.estadoPendiente2FA;
          this.authService.actualizarUsuarioEnSesion(usuarioSesion);
        }

        this.cdr.detectChanges();
        alert(res.message || 'Verificación en dos pasos configurada con éxito.');
      },
      error: (err: any) => {
        this.cargando2FA = false;
        this.cdr.detectChanges();

        console.error('Error al confirmar 2FA:', err);
        const msj = err.error?.message || 'Código incorrecto o expirado.';
        alert(msj);
      }
    });
  }

  cerrarModal2FA(): void {
    this.mostrarModal2FA = false;
    this.codigo2FA = '';
    this.cdr.detectChanges();
  }

  seleccionarFoto(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files[0]) {
      this.foto = input.files[0];

      if (this.previewUrl) {
        URL.revokeObjectURL(this.previewUrl);
      }

      this.previewUrl = URL.createObjectURL(this.foto);
      
      this.usuario = {
        ...this.usuario,
        foto_url: this.previewUrl
      };

      this.cdr.detectChanges();
    }
  }

  guardarPerfil(): void {
    if (this.cargando) return;

    this.cargando = true;
    const formData = new FormData();

    formData.append('bio', this.usuario.bio || '');
    formData.append('mostrar_proyectos', this.usuario.mostrar_proyectos ? '1' : '0');
    formData.append('mostrar_correo', this.usuario.mostrar_correo ? '1' : '0');

    if (this.usuario.proyectos?.length) {
      const visibilidadProyectos = this.usuario.proyectos.map(p => ({
        id: p.id,
        es_visible: p.es_visible
      }));
      formData.append('proyectos_visibilidad', JSON.stringify(visibilidadProyectos));
    }

    if (this.foto) {
      formData.append('foto', this.foto);
    }

    this.userService.updateProfile(formData).subscribe({
      next: (response: any) => {
        this.cargando = false;
        
        const userObj = response.user || response.data || response;
        if (userObj) {
          this.usuario = {
            ...this.usuario,
            ...userObj,
            bio: userObj.bio ?? userObj.biografia ?? this.usuario.bio,
            foto_url: userObj.foto_url ?? userObj.foto ?? userObj.avatar ?? this.usuario.foto_url,
            mostrar_proyectos: Boolean(userObj.mostrar_proyectos),
            mostrar_correo: Boolean(userObj.mostrar_correo),
            two_factor_enabled: Boolean(userObj.two_factor_enabled ?? this.usuario.two_factor_enabled),
            proyectos: userObj.proyectos ? userObj.proyectos.map((p: any) => ({
              ...p,
              titulo: p.titulo || p.title || 'Proyecto sin título',
              es_visible: Boolean(p.es_visible ?? p.visible ?? true)
            })) : this.usuario.proyectos
          };

          this.authService.actualizarUsuarioEnSesion(this.usuario);
        }

        this.foto = null;
        this.cdr.detectChanges();
        alert('Perfil guardado correctamente.');
      },
      error: (err: any) => {
        this.cargando = false;
        this.cdr.detectChanges();
        console.error('Error al actualizar perfil:', err);
        
        const mensajeError = err.error?.message || 'Ocurrió un error al guardar los cambios.';
        alert(mensajeError);
      }
    });
  }
}