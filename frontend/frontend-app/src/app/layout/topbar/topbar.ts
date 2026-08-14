import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { CommonModule } from '@angular/common';
import { NotificationBellComponent } from '../../components/notification-bell/notification-bell';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    CommonModule,
    NotificationBellComponent
  ],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss'
})
export class Topbar {
  usuario: any;

  constructor(
    private auth: Auth,
    private router: Router
  ) {
    this.usuario = this.auth.obtenerUsuario();
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}