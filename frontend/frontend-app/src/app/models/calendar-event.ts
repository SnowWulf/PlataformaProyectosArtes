// calendar-event.ts

export type TipoEvento = 'personal' | 'academico' | 'reunion' | 'tarea' | 'otro';

export interface CalendarEvent {
  id: number;
  user_id: number;
  titulo: string;
  descripcion?: string;
  fecha_inicio: string; // ISO String: "YYYY-MM-DDTHH:mm:ss"
  fecha_fin?: string;
  tipo: TipoEvento;
  color: string;
  recordatorio: boolean;
  completado?: boolean; // 👈 Útil para renderizar el checkbox de la tarea
  created_at?: string;
  updated_at?: string;
}

// Modelo independiente para las Notas Rápidas
export interface QuickNote {
  id?: number;
  user_id?: number;
  titulo: string;
  contenido: string; // Texto o Markdown
  color?: string;    // Ej: '#6366f1' para el borde superior
  created_at?: string;
  updated_at?: string;
}