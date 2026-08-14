import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// Componentes
import { TelegramConnectComponent } from '../../components/telegram-connect/telegram-connect'; 
import { SidebarPanelComponent } from '../../components/sidebar-panel.component/sidebar-panel.component';

// Modelos y Servicios
import { CalendarEvent, QuickNote } from '../../models/calendar-event';
import { CalendarEventService } from '../../services/calendar-event-service';

@Component({
  selector: 'app-tools',
  standalone: true,
  templateUrl: './tools.html',
  styleUrl: './tools.scss',
  imports: [
    CommonModule,
    RouterLink, 
    FormsModule,
    TelegramConnectComponent,
    SidebarPanelComponent
  ],
})
export class ToolsComponent implements OnInit {

  // Control de visibilidad del panel de ajustes de alertas
  mostrarConfiguracionAlertas: boolean = false;

  // Control de visibilidad del modal flotante de Telegram
  mostrarModalTelegram: boolean = false;

  // 📋 Control de visibilidad del panel desplegable de Tareas y Notas
  mostrarTareasNotas: boolean = false;

  // Estado global de las alertas
  alertasGlobalesActivas: boolean = true;

  // Configuración específica de cada alerta
  configuracionAlertas = {
    vencimientos: true,
    documentosPendientes: true,
    solicitudesTutoria: true,
    resumenSemanal: false
  };

  // Listas de datos para el SidebarPanelComponent
  eventos: CalendarEvent[] = [];
  notas: QuickNote[] = [];

  constructor(private calendarService: CalendarEventService) {}

  ngOnInit(): void {
    this.cargarConfiguracionAlertas();
    this.cargarEventos();
    this.cargarNotas();
  }

  // Métodos para controlar el Modal Flotante de Telegram
  abrirModalTelegram(): void {
    this.mostrarModalTelegram = true;
  }

  cerrarModalTelegram(): void {
    this.mostrarModalTelegram = false;
  }

  // Alternar paneles (cierra el otro para evitar amontonar la vista)
  togglePanelAlertas(): void {
    this.mostrarConfiguracionAlertas = !this.mostrarConfiguracionAlertas;
    if (this.mostrarConfiguracionAlertas) {
      this.mostrarTareasNotas = false;
    }
  }

  togglePanelTareasNotas(): void {
    this.mostrarTareasNotas = !this.mostrarTareasNotas;
    if (this.mostrarTareasNotas) {
      this.mostrarConfiguracionAlertas = false;
    }
  }

  // --- Carga y Gestión de Alertas ---
  guardarConfiguracionAlertas(): void {
    const estadoAlertas = {
      global: this.alertasGlobalesActivas,
      detalles: this.configuracionAlertas
    };
    
    localStorage.setItem('user_alerts_config', JSON.stringify(estadoAlertas));
  }

  cargarConfiguracionAlertas(): void {
    const savedConfig = localStorage.getItem('user_alerts_config');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      this.alertasGlobalesActivas = parsed.global ?? true;
      if (parsed.detalles) {
        this.configuracionAlertas = { ...this.configuracionAlertas, ...parsed.detalles };
      }
    }
  }

  // --- Carga y Gestión de Tareas / Notas ---
  cargarEventos(): void {
    this.calendarService.getEvents().subscribe({
      next: res => {
        this.eventos = Array.isArray(res) ? res : (res as any).data || [];
      },
      error: err => console.error('Error al cargar eventos en herramientas:', err)
    });
  }

  cargarNotas(): void {
    const savedNotes = localStorage.getItem('calendar_quick_notes');
    if (savedNotes) {
      try {
        this.notas = JSON.parse(savedNotes);
      } catch (e) {
        this.notas = [];
      }
    } else {
      this.notas = [];
    }
  }

  guardarNotasEnStorage(): void {
    localStorage.setItem('calendar_quick_notes', JSON.stringify(this.notas));
  }

  // --- Manejadores de eventos emitidos por SidebarPanelComponent ---
  onTaskStatusChanged(task: CalendarEvent): void {
    if (task.id) {
      this.calendarService.updateEvent(task.id, task).subscribe({
        error: err => console.error('Error actualizando estado de tarea:', err)
      });
    }
  }

  onNewTaskCreated(newTaskData: Partial<CalendarEvent>): void {
    // 1. Validar y forzar un tipo aceptado por la validación del backend Laravel
    const tiposPermitidos = ['personal', 'academico', 'trabajo', 'otro'];
    let tipoValido = newTaskData.tipo;

    if (!tipoValido || !tiposPermitidos.includes(tipoValido)) {
      tipoValido = 'personal'; // Valor predeterminado seguro
    }

    // 2. Formatear fecha para compatibilidad con la base de datos (YYYY-MM-DD HH:mm:ss)
    const fechaHoy = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const newEvent: CalendarEvent = {
      id: 0,
      user_id: 0,
      titulo: newTaskData.titulo || 'Nueva tarea',
      descripcion: newTaskData.descripcion || 'Tarea agregada desde herramientas',
      fecha_inicio: newTaskData.fecha_inicio || fechaHoy,
      fecha_fin: newTaskData.fecha_fin || newTaskData.fecha_inicio || fechaHoy,
      tipo: tipoValido as any,
      color: newTaskData.color || '#6366f1',
      recordatorio: false,
      completado: false
    };

    this.calendarService.createEvent(newEvent).subscribe({
      next: () => {
        this.cargarEventos();
      },
      error: err => {
        console.error('Error al crear tarea desde herramientas:', err);
        if (err.error && err.error.errors) {
          console.error('Detalles del error de validación de Laravel:', err.error.errors);
        }
      }
    });
  }

  onNewNoteCreated(note: QuickNote): void {
    note.id = Date.now();
    note.created_at = new Date().toISOString();
    this.notas.unshift(note);
    this.guardarNotasEnStorage();
  }

  onNoteDeleted(noteId: number): void {
    this.notas = this.notas.filter(n => n.id !== noteId);
    this.guardarNotasEnStorage();
  }
}