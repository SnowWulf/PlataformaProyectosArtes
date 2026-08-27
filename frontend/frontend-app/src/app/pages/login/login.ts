import { Component, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { Auth, LoginResult } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {

  // Credenciales iniciales
  email = '';
  password = '';

  // Estado del flujo 2FA
  requiresTwoFactor = false;
  twoFactorCode = '';
  
  // Mensajes de error y carga
  errorMessage = '';
  loading = false;

  constructor(
    private authService: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ingresar(): void {
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor, ingresa tu correo y contraseña.';
      return;
    }

    this.errorMessage = '';
    this.loading = true;

    this.authService.login(this.email, this.password)
    .subscribe({
      next: (data: LoginResult) => {
        this.loading = false;

        const necesita2FA = data.requires_two_factor || (data as any).requires_2fa;

        if (necesita2FA) {
          this.requiresTwoFactor = true;
          this.errorMessage = '';
          this.cdr.detectChanges();
          return;
        }

        // Login directo
        this.authService.guardarSesion(data);

        if (data.user?.require_password_change) {
          this.router.navigate(['/cambiar-password']);
        } else {
          this.router.navigate(['/dashboard']);
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Error login:', err);

        // Captura mensajes específicos de la API o muestra texto por defecto
        if (err.status === 401) {
          this.errorMessage = 'Correo o contraseña incorrectos. Verifica tus datos e intentalo de nuevo.';
        } else {
          this.errorMessage = err.error?.message || 'Ocurrió un error al intentar iniciar sesión. Inténtalo más tarde.';
        }

        this.cdr.detectChanges();
      }
    });
  }

  verificarCodigo2FA(): void {
    if (!this.twoFactorCode || this.twoFactorCode.length < 6) {
      this.errorMessage = 'Ingresa el código completo de 6 dígitos.';
      return;
    }

    this.errorMessage = '';
    this.loading = true;

    this.authService.verifyTwoFactor({
      email: this.email,
      two_factor_code: this.twoFactorCode
    }).subscribe({
      next: (data) => {
        this.loading = false;
        this.authService.guardarSesion(data);

        if (data.user?.require_password_change) {
          this.router.navigate(['/cambiar-password']);
        } else {
          this.router.navigate(['/dashboard']);
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Error 2FA:', err);

        // Captura si el código de verificación expiró o es invalido
        if (err.status === 400 || err.status === 422 || err.status === 401) {
          this.errorMessage = 'El código de 6 dígitos es incorrecto o ha caducado. Inténtalo nuevamente.';
        } else {
          this.errorMessage = err.error?.message || 'Error al validar el código de verificación.';
        }

        this.cdr.detectChanges();
      }
    });
  }

  cancelar2FA(): void {
    this.requiresTwoFactor = false;
    this.twoFactorCode = '';
    this.errorMessage = '';
    this.cdr.detectChanges();
  }

}