import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

import { Auth } from '../../services/auth';

import { Sidebar } from '../../layout/sidebar/sidebar';
import { Topbar } from '../../layout/topbar/topbar';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterOutlet,
    Sidebar,
    Topbar
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {

  usuario: any;

  constructor(
    private auth: Auth,
    private router: Router
  ) {

    this.usuario = this.auth.obtenerUsuario();

  }

  ir(ruta: string) {

    this.router.navigate([ruta]);

  }

  logout() {

    this.auth.logout();

    this.router.navigate(['/login']);

  }

}
