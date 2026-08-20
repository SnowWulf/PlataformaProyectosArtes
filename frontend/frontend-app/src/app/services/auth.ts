import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user';

export interface LoginResponse {
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class Auth {

  private apiUrl = 'http://localhost:8000/api';

  constructor(
    private http: HttpClient
  ) {}

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.apiUrl}/login`,
      {
        email,
        password
      }
    );
  }

  guardarSesion(data: LoginResponse) {
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

  // Actualiza los datos del usuario en localStorage una vez cambia la contraseña
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