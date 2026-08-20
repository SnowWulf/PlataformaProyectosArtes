import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { User } from '../models/user';
import { RegistrationRequest } from '../models/registration-request';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private baseUrl = 'http://localhost:8000/api';
  private apiUrl = `${this.baseUrl}/users`;

  constructor(
    private http: HttpClient
  ) {}

  // Obtener todos los usuarios
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  // Obtener uno
  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  // Crear
  createUser(data: any): Observable<User> {
    return this.http.post<User>(
      this.apiUrl,
      data
    );
  }

  // Actualizar
  updateUser(id: number, data: any): Observable<User> {
    return this.http.put<User>(
      `${this.apiUrl}/${id}`,
      data
    );
  }

  // Eliminar
  deleteUser(id: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/${id}`
    );
  }

  // Borrar con contraseña
  deleteUserWithPassword(id: number, password: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${id}/delete`,
      {
        password
      }
    );
  }

  // Perfil
  getProfile() {
    return this.http.get<any>(
      `${this.baseUrl}/profile`
    );
  }

  updateProfile(formData: FormData) {
    return this.http.post<{
      message: string;
      user: any;
    }>(
      `${this.baseUrl}/profile`,
      formData
    );
  }

  // --- SOLICITUDES DE REGISTRO ---

  // Obtener todas las solicitudes pendientes
  getRegistrationRequests(): Observable<RegistrationRequest[]> {
    return this.http.get<RegistrationRequest[]>(
      `${this.baseUrl}/registration-requests`
    );
  }

  // Aprobar solicitud enviando mensaje y contraseña temporal opcionales
  approveRegistrationRequest(id: number, message?: string, password?: string): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/registration-requests/${id}/approve`,
      {
        message: message || '',
        password: password || ''
      }
    );
  }

  // Rechazar solicitud enviando mensaje opcional en el body
  rejectRegistrationRequest(id: number, message?: string): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/registration-requests/${id}/reject`,
      { message: message || '' }
    );
  }

}