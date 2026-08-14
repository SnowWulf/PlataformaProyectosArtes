import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // 1. Importar ChangeDetectorRef
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user-service';

export interface UsuarioPerfil {
  id?: number;
  name?: string;
  email?: string;
  programa?: string;
  bio?: string;
  foto_url?: string;
  mostrar_proyectos?: boolean;
  mostrar_correo?: boolean;
}

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

  usuario: UsuarioPerfil = {};
  foto: File | null = null;
  cargando: boolean = false;
  private previewUrl: string | null = null;

  constructor(
    private userService: UserService,
    private cdr: ChangeDetectorRef // 2. Inyectar 'cdr' aquí dentro del constructor
  ) {}

  ngOnInit(): void {
    this.cargarPerfil();
  }

  cargarPerfil(): void {
    this.userService.getProfile().subscribe({
      next: (data: any) => {
        console.log('Datos de la API:', data);

        // Extraemos la información si viene envuelta en data o user
        const userObj = data.data || data.user || data;

        this.usuario = {
          ...userObj,
          bio: userObj.bio ?? userObj.biografia ?? '',
          foto_url: userObj.foto_url ?? userObj.foto ?? userObj.avatar ?? '',
          mostrar_proyectos: Boolean(userObj.mostrar_proyectos),
          mostrar_correo: Boolean(userObj.mostrar_correo)
        };

        // Forzar actualización inmediata de la interfaz
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar el perfil:', err);
      }
    });
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

    if (this.foto) {
      formData.append('foto', this.foto);
    }

    this.userService.updateProfile(formData).subscribe({
      next: (response: any) => {
        this.cargando = false;
        
        const userObj = response.user || response.data || response;
        if (userObj) {
          this.usuario = {
            ...userObj,
            bio: userObj.bio ?? userObj.biografia ?? '',
            foto_url: userObj.foto_url ?? userObj.foto ?? userObj.avatar ?? '',
            mostrar_proyectos: Boolean(userObj.mostrar_proyectos),
            mostrar_correo: Boolean(userObj.mostrar_correo)
          };
        }

        this.foto = null;
        this.cdr.detectChanges();
        alert('Perfil actualizado correctamente.');
      },
      error: (err) => {
        this.cargando = false;
        this.cdr.detectChanges();
        console.error('Error al actualizar perfil:', err);
        
        const mensajeError = err.error?.message || 'Ocurrió un error al guardar los cambios.';
        alert(mensajeError);
      }
    });
  }
}