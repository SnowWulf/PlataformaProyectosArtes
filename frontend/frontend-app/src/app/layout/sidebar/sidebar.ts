import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { Auth } from '../../services/auth';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar {

  constructor(
    public auth: Auth
  ) {}

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

}
