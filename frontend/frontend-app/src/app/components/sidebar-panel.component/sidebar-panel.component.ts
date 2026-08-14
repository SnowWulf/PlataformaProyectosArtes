import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarEvent, QuickNote } from '../../models/calendar-event';

@Component({
  selector: 'app-sidebar-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sidebar-panel.component.html',
  styleUrls: ['./sidebar-panel.component.scss']
})
export class SidebarPanelComponent implements OnInit, OnChanges {
  // Recibimos todos los eventos guardados en la app/calendario
  @Input() events: CalendarEvent[] = [];
  @Input() notes: QuickNote[] = [];

  // Eventos para notificar cambios al componente padre o backend
  @Output() taskStatusChanged = new EventEmitter<CalendarEvent>();
  @Output() newTaskCreated = new EventEmitter<Partial<CalendarEvent>>();
  @Output() newNoteCreated = new EventEmitter<QuickNote>();
  @Output() noteDeleted = new EventEmitter<number>();

  activeTab: 'tasks' | 'notes' = 'tasks';
  
  // Variables locales para tareas
  todayTasks: CalendarEvent[] = [];

  // Variables para notas adhesivas
  newNoteContent = '';
  
  // Paleta de colores pastel para las notas adhesivas (Post-it)
  availableColors: string[] = [
    '#fef08a', // Amarillo
    '#bbf7d0', // Verde
    '#bfdbfe', // Azul
    '#fbcfe8', // Rosa
    '#fed7aa'  // Naranja
  ];
  selectedColor: string = '#fef08a';

  ngOnInit(): void {
    this.filterTodayTasks();
  }

  ngOnChanges(): void {
    this.filterTodayTasks();
  }

  // Filtrar eventos del calendario que ocurren hoy
  filterTodayTasks(): void {
    const todayStr = new Date().toISOString().split('T')[0];

    this.todayTasks = this.events.filter(event => {
      if (!event.fecha_inicio) return false;
      const eventDateStr = event.fecha_inicio.split('T')[0];
      return eventDateStr === todayStr;
    });
  }

  // Calcular el porcentaje de tareas completadas
  get completionPercentage(): number {
    if (this.todayTasks.length === 0) return 0;
    const completedCount = this.todayTasks.filter(t => t.completado).length;
    return Math.round((completedCount / this.todayTasks.length) * 100);
  }

  get pendingTasksCount(): number {
    return this.todayTasks.filter(t => !t.completado).length;
  }

  // Cambiar estado de completado
  toggleTask(task: CalendarEvent): void {
    task.completado = !task.completado;
    this.taskStatusChanged.emit(task);
  }

  // Crear una tarea rápida para el calendario de hoy
  quickAddTask(inputHTML: HTMLInputElement): void {
  const title = inputHTML.value.trim();
  if (!title) return;

  const newTask: CalendarEvent = {
    id: Date.now(),
    titulo: title,
    completado: false,
    fecha_inicio: new Date().toISOString(), // 👈 1. Formato ISO String "YYYY-MM-DDTHH:mm:ss"
    color: '#6366f1',
    tipo: 'tarea',                           // 👈 2. Usar un valor válido de TipoEvento ('tarea', 'evento', etc.)
    user_id: 1,                              // 👈 3. ID numérico directo (o este.userId si lo tienes declarado)
    recordatorio: false
  };

  // Reasignar el array para forzar la detección de cambios de Angular en la vista
  this.todayTasks = [newTask, ...this.todayTasks];
  
  // Limpiar el input
  inputHTML.value = '';
}

  // Crear una nueva nota adhesiva
  createNote(): void {
    if (!this.newNoteContent.trim()) return;

    const note: QuickNote = {
      titulo: 'Nota rápida', // 👈 Agregamos el título requerido por la interfaz
      contenido: this.newNoteContent.trim(),
      color: this.selectedColor,
      updated_at: new Date().toISOString()
    };

    this.newNoteCreated.emit(note);
    this.newNoteContent = '';
  }

  // Eliminar nota por ID
  deleteNote(id?: number): void {
    if (id !== undefined) {
      this.noteDeleted.emit(id);
    }
  }
}