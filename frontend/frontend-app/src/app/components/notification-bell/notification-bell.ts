import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../../services/notification-service';
import { AppNotification } from '../../models/notification';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-bell.html',
  styleUrls: ['./notification-bell.scss']
})
export class NotificationBellComponent implements OnInit {
  isOpen = false;
  unreadCount = 0;
  notifications: AppNotification[] = [];
  loading = false;

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadNotifications(false);
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.loadNotifications(true);
    }
  }

  loadNotifications(showLoading: boolean = true): void {
    if (showLoading) {
      this.loading = true;
    }

    this.notificationService.getNotifications().subscribe({
      next: (response: any) => {
        console.log('Respuesta completa de la API:', response);

        // Extraer el arreglo independientemente de la envoltura
        let rawList: any[] = [];
        if (Array.isArray(response)) {
          rawList = response;
        } else if (response && Array.isArray(response.data)) {
          rawList = response.data;
        } else if (response && response.data && Array.isArray(response.data.data)) {
          rawList = response.data.data;
        }

        this.notifications = [...rawList];

        // Extraer o calcular el unreadCount
        if (response && typeof response.unreadCount === 'number') {
          this.unreadCount = response.unreadCount;
        } else {
          this.unreadCount = this.notifications.filter(n => !n.leida && !n.read_at).length;
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error HTTP al consultar notificaciones:', err);
        this.notifications = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  markAsRead(notification: any): void {
    if (!notification.leida && !notification.read_at) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          notification.leida = true;
          notification.read_at = new Date().toISOString();
          if (this.unreadCount > 0) this.unreadCount--;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al marcar notificación como leída:', err);
        }
      });
    }
  }

  onNotificationClick(notification: any): void {
    // 1. Marcar como leída si no lo está
    this.markAsRead(notification);

    // 2. Cerrar el menú desplegable al hacer clic
    this.isOpen = false;

    // 3. Evaluar redirección: Primero intentar usar el enlace provisto por el backend
    if (notification.link && notification.link.trim() !== '') {
      this.router.navigateByUrl(notification.link);
      return;
    }

    // 4. Si no tiene 'link', redireccionar según la clave del tipo de notificación
    const tipo = notification.tipo_clave || notification.tipo;

    switch (tipo) {
      // Casos de Tutorías
      case 'SOLICITUD_TUTORIA':
      case 'respuesta_tutoria':
      case 'tutoria_asignada':
      case 'tutoria_cancelada':
        this.router.navigate(['/dashboard/tutorships']);
        break;

      // Casos de Proyectos y Colaboraciones
      case 'INVITACION_COLABORADOR':
      case 'invitacion_proyecto':
      case 'solicitud_colaboracion':
      case 'colaboracion_aceptada':
      case 'colaboracion_rechazada':
      case 'alerta_vencimiento':
        if (notification.project_id) {
          this.router.navigate(['/dashboard/projects', notification.project_id]);
        } else {
          this.router.navigate(['/dashboard/projects']);
        }
        break;

      // Caso por defecto si no coincide ningún tipo ni existe link
      default:
        this.router.navigate(['/dashboard']);
        break;
    }
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach(n => {
          n.leida = true;
          n.read_at = new Date().toISOString();
        });
        this.unreadCount = 0;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al marcar todas como leídas:', err);
      }
    });
  }
}