import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { User } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiUrl = 'http://localhost:8000/api/users';

  constructor(
    private http: HttpClient
  ) {}

  // Obtener todos
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

  //Borrar con contraseña
deleteUserWithPassword(id: number, password: string): Observable<any> {

  return this.http.post(

    `${this.apiUrl}/${id}/delete`,

    {
      password
    }

  );

}

}