import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-cambiar-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cambiar-password.html',
  styleUrl: './cambiar-password.scss'
})
export class CambiarPassword {
  currentPassword = '';
  newPassword = '';
  newPasswordConfirmation = '';

  errorMessage = '';
  cargando = false;

  constructor(
    private authService: Auth,
    private router: Router
  ) {}

  cambiarPassword(): void {
    if (!this.currentPassword || !this.newPassword || !this.newPasswordConfirmation) {
      this.errorMessage = 'Por favor completa todos los campos.';
      return;
    }

    if (this.newPassword !== this.newPasswordConfirmation) {
      this.errorMessage = 'Las contraseñas nuevas no coinciden.';
      return;
    }

    if (this.newPassword.length < 8) {
      this.errorMessage = 'La nueva contraseña debe tener al menos 8 caracteres.';
      return;
    }

    this.cargando = true;
    this.errorMessage = '';

    const payload = {
      current_password: this.currentPassword,
      new_password: this.newPassword,
      new_password_confirmation: this.newPasswordConfirmation
    };

    this.authService.changePassword(payload).subscribe({
      next: (response) => {
        this.cargando = false;
        alert('Contraseña actualizada correctamente.');
        
        // Actualiza la sesión local removiendo la bandera require_password_change
        if (response.user) {
          this.authService.actualizarUsuarioEnSesion(response.user);
        }

        // Redirige al dashboard
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.cargando = false;
        console.error('Error al cambiar contraseña:', err);
        this.errorMessage = err.error?.message ?? 'Ocurrió un error al intentar cambiar la contraseña.';
      }
    });
  }
}