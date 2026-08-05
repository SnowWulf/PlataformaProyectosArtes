import { Component, OnInit } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive
} from '@angular/router';

import { CommonModule } from '@angular/common';
import { Auth } from '../../services/auth';


@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,

    RouterLink,

    RouterLinkActive
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar implements OnInit {

  mostrarMenuUsuario = false;

  usuarioActual: any = null;

  constructor(

  public auth: Auth,

  private router: Router

) {}
ngOnInit(): void {

  this.usuarioActual =
    this.auth.obtenerUsuario();

}

logout(): void {

  this.auth.logout();

  this.router.navigate(
    ['/login']
  );

}

  obtenerRutaDashboard(): string {

    if (
      this.auth.esEstudiante()
    ) {

      return '/dashboard/student-home';

    }

    if (
      this.auth.esTutor()
    ) {

      return '/dashboard/tutor-home';

    }

    if (
      this.auth.esCoordinador()
    ) {

      return '/dashboard/coordinator-home';

    }

    return '/dashboard';

  }

  obtenerUsuario() {

    return this.auth.obtenerUsuario();

  }
irAMiPerfil(): void {

  const usuario =
    this.auth.obtenerUsuario();

  if (!usuario) {

    return;

  }

  this.router.navigate([
    '/dashboard/community/profile',
    usuario.id
  ]);

}


}