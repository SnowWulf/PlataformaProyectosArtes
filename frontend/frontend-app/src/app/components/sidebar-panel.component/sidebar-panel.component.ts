import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarEvent, QuickNote } from '../../models/calendar-event';

const STORAGE_KEYS = {
  NOTES: 'app_sidebar_notes',
  TASKS: 'app_sidebar_tasks',
  DELETED_TASKS: 'app_sidebar_deleted_tasks'
};

@Component({
  selector: 'app-sidebar-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sidebar-panel.component.html',
  styleUrls: ['./sidebar-panel.component.scss']
})
export class SidebarPanelComponent implements OnInit, OnChanges {
  @Input() events: CalendarEvent[] = [];
  @Input() notes: QuickNote[] = [];

  @Output() taskStatusChanged = new EventEmitter<CalendarEvent>();
  @Output() newTaskCreated = new EventEmitter<Partial<CalendarEvent>>();
  @Output() taskDeleted = new EventEmitter<number | string>();
  @Output() newNoteCreated = new EventEmitter<QuickNote>();
  @Output() noteDeleted = new EventEmitter<number>();

  activeTab: 'tasks' | 'notes' = 'tasks';
  
  todayTasks: CalendarEvent[] = [];
  localNotes: QuickNote[] = [];

  newNoteContent = '';
  
  availableColors: string[] = [
    '#fef08a',
    '#bbf7d0',
    '#bfdbfe',
    '#fbcfe8',
    '#fed7aa'
  ];
  selectedColor: string = '#fef08a';

  ngOnInit(): void {
    this.loadNotesFromStorage();
    this.filterTodayTasks();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['notes'] && this.notes) {
      if (this.notes.length > 0) {
        this.localNotes = [...this.notes];
        this.saveNotesToStorage();
      }
    }

    if (changes['events'] && !changes['events'].firstChange) {
      this.filterTodayTasks();
    }
  }

  // --- PERSISTENCIA Y LISTA NEGRA ---

  private getDeletedTaskIds(): string[] {
    const saved = localStorage.getItem(STORAGE_KEYS.DELETED_TASKS);
    if (saved) {
      try { return JSON.parse(saved); } catch { return []; }
    }
    return [];
  }

  private markTaskAsDeleted(identifier: string): void {
    const deletedIds = this.getDeletedTaskIds();
    if (!deletedIds.includes(identifier)) {
      deletedIds.push(identifier);
      localStorage.setItem(STORAGE_KEYS.DELETED_TASKS, JSON.stringify(deletedIds));
    }
  }

  private loadNotesFromStorage(): void {
    if (this.notes && this.notes.length > 0) {
      this.localNotes = [...this.notes];
      return;
    }
    const saved = localStorage.getItem(STORAGE_KEYS.NOTES);
    if (saved) {
      try {
        this.localNotes = JSON.parse(saved);
      } catch {
        this.localNotes = [];
      }
    }
  }

  private saveNotesToStorage(): void {
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(this.localNotes));
  }

  private loadLocalTasks(): CalendarEvent[] {
    const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  }

  private saveLocalTasks(tasks: CalendarEvent[]): void {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }

  /**
   * Genera una clave estricta basada SOLO en título y fecha del día.
   * Esto previene duplicaciones si una tarea es de tipo 'tarea' y la otra de tipo 'personal'.
   */
  private getSemanticKey(task: CalendarEvent): string {
    const titlePart = (task.titulo || '').trim().toLowerCase();
    const datePart = task.fecha_inicio ? task.fecha_inicio.split('T')[0] : 'nodate';
    return `${titlePart}_${datePart}`;
  }

  // --- MÉTODOS DE TAREAS ---

  filterTodayTasks(): void {
    const todayStr = new Date().toISOString().split('T')[0];
    const deletedIds = this.getDeletedTaskIds();

    const localTasks = this.loadLocalTasks();

    // Map indexado por el título y fecha sin importar el ID ni el tipo
    const mergedMap = new Map<string, CalendarEvent>();

    // 1. Procesar tareas de los eventos del padre (@Input)
    (this.events || []).forEach(event => {
      if (!event.fecha_inicio) return;
      if (event.fecha_inicio.split('T')[0] === todayStr) {
        const semanticKey = this.getSemanticKey(event);
        const eventId = event.id ? String(event.id) : '';

        if (!deletedIds.includes(semanticKey) && !deletedIds.includes(eventId)) {
          mergedMap.set(semanticKey, event);
        }
      }
    });

    // 2. Procesar tareas guardadas localmente (tienen prioridad si ya fueron modificadas/completadas)
    localTasks.forEach(task => {
      if (!task.fecha_inicio) return;
      if (task.fecha_inicio.split('T')[0] === todayStr) {
        const semanticKey = this.getSemanticKey(task);
        const taskId = task.id ? String(task.id) : '';

        if (!deletedIds.includes(semanticKey) && !deletedIds.includes(taskId)) {
          // Si ya existe la del Input, fusionamos manteniendo el estado completado si aplica
          const existing = mergedMap.get(semanticKey);
          if (existing) {
            mergedMap.set(semanticKey, {
              ...existing,
              ...task,
              id: existing.id || task.id
            });
          } else {
            mergedMap.set(semanticKey, task);
          }
        }
      }
    });

    this.todayTasks = Array.from(mergedMap.values());
  }

  get completionPercentage(): number {
    if (this.todayTasks.length === 0) return 0;
    const completedCount = this.todayTasks.filter(t => t.completado).length;
    return Math.round((completedCount / this.todayTasks.length) * 100);
  }

  get pendingTasksCount(): number {
    return this.todayTasks.filter(t => !t.completado).length;
  }

  get completedTasksCount(): number {
    return this.todayTasks.filter(t => t.completado).length;
  }

  toggleTask(task: CalendarEvent): void {
    task.completado = !task.completado;

    const semanticKey = this.getSemanticKey(task);
    const localTasks = this.loadLocalTasks();
    const index = localTasks.findIndex(t => this.getSemanticKey(t) === semanticKey);

    if (index !== -1) {
      localTasks[index].completado = task.completado;
      this.saveLocalTasks(localTasks);
    } else {
      this.saveLocalTasks([...localTasks, task]);
    }

    this.taskStatusChanged.emit(task);
  }

  quickAddTask(inputHTML: HTMLInputElement): void {
    const title = inputHTML.value.trim();
    if (!title) return;

    const newTask: CalendarEvent = {
      id: Date.now(),
      titulo: title,
      completado: false,
      fecha_inicio: new Date().toISOString(),
      color: '#6366f1',
      tipo: 'tarea',
      user_id: 1,
      recordatorio: false
    };

    const semanticKey = this.getSemanticKey(newTask);

    // Si ya existe una tarea con ese mismo nombre para hoy (sea 'tarea' o 'personal'), la ignoramos
    const exists = this.todayTasks.some(t => this.getSemanticKey(t) === semanticKey);
    if (exists) {
      inputHTML.value = '';
      return;
    }

    this.todayTasks = [newTask, ...this.todayTasks];

    const currentLocal = this.loadLocalTasks();
    this.saveLocalTasks([newTask, ...currentLocal]);

    this.newTaskCreated.emit(newTask);

    inputHTML.value = '';
  }

  deleteTask(taskId?: number | string): void {
    if (taskId === undefined) return;

    const taskToDelete = this.todayTasks.find(t => t.id === taskId || String(t.id) === String(taskId));

    if (taskToDelete) {
      const semanticKey = this.getSemanticKey(taskToDelete);
      this.markTaskAsDeleted(semanticKey);
      if (taskToDelete.id) {
        this.markTaskAsDeleted(String(taskToDelete.id));
      }
    }

    this.todayTasks = this.todayTasks.filter(t => t.id !== taskId && String(t.id) !== String(taskId));

    const updatedLocal = this.loadLocalTasks().filter(t => {
      const semKey = this.getSemanticKey(t);
      return t.id !== taskId && String(t.id) !== String(taskId) && !this.getDeletedTaskIds().includes(semKey);
    });
    this.saveLocalTasks(updatedLocal);

    this.taskDeleted.emit(taskId);
  }

  clearCompletedTasks(): void {
    const completedTasks = this.todayTasks.filter(t => t.completado);
    completedTasks.forEach(task => {
      if (task.id !== undefined) {
        this.deleteTask(task.id);
      }
    });
  }

  clearAllTodayTasks(): void {
    const allTasks = [...this.todayTasks];
    allTasks.forEach(task => {
      if (task.id !== undefined) {
        this.deleteTask(task.id);
      }
    });
  }

  // --- MÉTODOS DE NOTAS ---

  createNote(): void {
    if (!this.newNoteContent.trim()) return;

    const note: QuickNote = {
      id: Date.now(),
      titulo: 'Nota rápida',
      contenido: this.newNoteContent.trim(),
      color: this.selectedColor,
      updated_at: new Date().toISOString()
    };

    this.localNotes = [note, ...this.localNotes];
    this.saveNotesToStorage();

    this.newNoteCreated.emit(note);
    this.newNoteContent = '';
  }

  deleteNote(id?: number): void {
    if (id !== undefined) {
      this.localNotes = this.localNotes.filter(n => n.id !== id);
      this.saveNotesToStorage();
      this.noteDeleted.emit(id);
    }
  }
}