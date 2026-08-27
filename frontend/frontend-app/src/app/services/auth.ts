import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user';

// Respuesta cuando el 2FA está desactivado
export interface LoginResponseSuccess {
  requires_two_factor: false;
  token: string;
  user: User;
}

// Respuesta cuando el 2FA está activado
export interface TwoFactorLoginResponse {
  requires_two_factor: true;
  email: string;
  message: string;
}

export type LoginResult = LoginResponseSuccess | TwoFactorLoginResponse;

export interface VerifyTwoFactorRequest {
  email: string;
  two_factor_code: string;
}

export interface ToggleTwoFactorResponse {
  message: string;
  two_factor_enabled: boolean;
}

export interface ConfirmTwoFactorResponse {
  message: string;
  two_factor_enabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class Auth {

  private apiUrl = 'http://localhost:8000/api';

  constructor(
    private http: HttpClient
  ) {}

  login(email: string, password: string): Observable<LoginResult> {
    return this.http.post<LoginResult>(
      `${this.apiUrl}/login`,
      {
        email,
        password
      }
    );
  }

  // Verifica el código de 6 dígitos enviado por correo en el proceso de Login
  verifyTwoFactor(payload: VerifyTwoFactorRequest): Observable<{ token: string; user: User }> {
    return this.http.post<{ token: string; user: User }>(
      `${this.apiUrl}/login/verify-2fa`,
      payload
    );
  }

  // Solicita/inicia la activación o desactivación de la verificación en 2 pasos desde la configuración del perfil
  toggleTwoFactor(enabled: boolean): Observable<ToggleTwoFactorResponse> {
    return this.http.post<ToggleTwoFactorResponse>(
      `${this.apiUrl}/user/toggle-2fa`,
      { enabled }
    );
  }

  // Confirma el código de 6 dígitos ingresado en el modal de perfil para finalizar el cambio de estado de 2FA
  confirmTwoFactor(code: string, enabled: boolean): Observable<ConfirmTwoFactorResponse> {
    return this.http.post<ConfirmTwoFactorResponse>(
      `${this.apiUrl}/user/confirm-2fa`,
      { code, enabled }
    );
  }

  guardarSesion(data: { token: string; user: User }) {
    localStorage.setItem(
      'token',
      data.token
    );

    localStorage.setItem(
      'user',
      JSON.stringify(data.user)
    );
  }

  obtenerUsuario(): User | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // Verifica si el usuario autenticado requiere cambiar contraseña por primera vez
  mustChangePassword(): boolean {
    const usuario = this.obtenerUsuario();
    return !!usuario?.require_password_change;
  }

  // Llama al endpoint de Laravel para cambiar la contraseña
  changePassword(data: { current_password: string; new_password: string; new_password_confirmation: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/change-password`, data);
  }

  // Actualiza los datos del usuario en localStorage una vez cambia la contraseña o activa/desactiva el 2FA
  actualizarUsuarioEnSesion(user: User) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  esCoordinador(): boolean {
    const usuario = this.obtenerUsuario();
    return usuario?.role?.nombre === 'Coordinador';
  }

  esTutor(): boolean {
    const usuario = this.obtenerUsuario();
    return usuario?.role?.nombre === 'Tutor';
  }

  esEstudiante(): boolean {
    const usuario = this.obtenerUsuario();
    return usuario?.role?.nombre === 'Estudiante';
  }
}