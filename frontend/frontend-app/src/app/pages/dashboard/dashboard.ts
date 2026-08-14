import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Auth } from '../../services/auth';
import { Sidebar } from '../../layout/sidebar/sidebar';
import { Topbar } from '../../layout/topbar/topbar';

import { WarningBannerComponent } from '../../components/warning-banner/warning-banner';
import { CriticalModalComponent } from '../../components/critical-modal/critical-modal';
import { ProjectDeadlineAlert, DeadlineAlertsResponse } from '../../models/project-alert';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    Sidebar,
    Topbar,
    WarningBannerComponent,
    CriticalModalComponent
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {

  usuario: any;

  // Propiedades para gestionar las alertas
  bannerProjects: ProjectDeadlineAlert[] = [];
  criticalProjects: ProjectDeadlineAlert[] = [];

  showBanner = false;
  showModal = false;

  constructor(
    private auth: Auth,
    private router: Router,
    private http: HttpClient
  ) {
    this.usuario = this.auth.obtenerUsuario();
  }

  ngOnInit(): void {
    this.consultarAlertasVencimiento();
  }

  consultarAlertasVencimiento(): void {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });

    const API_URL = 'http://localhost:8000/api/projects/deadline-alerts';

    this.http.get<DeadlineAlertsResponse>(API_URL, { headers }).subscribe({
      next: (res) => {
        this.bannerProjects = res.banner_projects || [];
        this.criticalProjects = res.critical_projects || [];

        this.showBanner = this.bannerProjects.length > 0;

        const modalDismissed = sessionStorage.getItem('critical_modal_dismissed');
        this.showModal = this.criticalProjects.length > 0 && !modalDismissed;
      },
      error: (err) => console.error('Error al cargar alertas de vencimiento:', err)
    });
  }

  cerrarModal(): void {
    this.showModal = false;
    sessionStorage.setItem('critical_modal_dismissed', 'true');
  }

  ir(ruta: string) {
    this.router.navigate([ruta]);
  }

  logout() {
    sessionStorage.removeItem('critical_modal_dismissed');
    this.auth.logout();
    this.router.navigate(['/login']);
  }

}