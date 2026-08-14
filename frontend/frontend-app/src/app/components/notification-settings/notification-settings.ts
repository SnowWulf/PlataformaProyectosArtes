import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../services/notification-service';
import { NotificationPreference } from '../../models/notification';

@Component({
  selector: 'app-notification-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notification-settings.html',
  styleUrls: []
})
export class NotificationSettingsComponent implements OnInit {
  preferences: NotificationPreference[] = [];
  loading = false;
  saving = false;
  successMessage = '';

  labelsMap: { [key: string]: string } = {
    'solicitud_tutoria': 'Solicitudes de tutoría recibidas',
    'respuesta_tutoria': 'Respuestas a solicitudes de tutoría',
    'nueva_entrega': 'Nuevas entregas o tareas asignadas',
    'mensajes_proyecto': 'Mensajes en el chat del proyecto'
  };

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.loadPreferences();
  }

  loadPreferences(): void {
    this.loading = true;
    this.notificationService.getPreferences().subscribe({
      next: (data) => {
        this.preferences = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  save(): void {
    this.saving = true;
    this.successMessage = '';
    this.notificationService.updatePreferences(this.preferences).subscribe({
      next: () => {
        this.saving = false;
        this.successMessage = 'Preferencias guardadas correctamente.';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: () => {
        this.saving = false;
      }
    });
  }
}