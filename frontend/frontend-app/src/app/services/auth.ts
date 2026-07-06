import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


export interface LoginResponse {
  token: string;
  user: any;
}


@Injectable({
  providedIn: 'root'
})
export class Auth {

  private apiUrl = 'http://localhost:8000/api';


  constructor(
    private http: HttpClient
  ) {}


  login(email:string, password:string): Observable<LoginResponse>{

    return this.http.post<LoginResponse>(
      `${this.apiUrl}/login`,
      {
        email,
        password
      }
    );

  }


  guardarSesion(data: LoginResponse){

    localStorage.setItem(
      'token',
      data.token
    );


    localStorage.setItem(
      'user',
      JSON.stringify(data.user)
    );

  }


  obtenerUsuario(){

    const user = localStorage.getItem('user');

    return user ? JSON.parse(user) : null;

  }


  logout(){

    localStorage.removeItem('token');
    localStorage.removeItem('user');

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
