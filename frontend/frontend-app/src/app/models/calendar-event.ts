export interface CalendarEvent {

  id: number;

  user_id: number;

  titulo: string;

  descripcion?: string;

  fecha_inicio: string;

  fecha_fin?: string;

  tipo:
    | 'personal'
    | 'academico'
    | 'reunion'
    | 'otro';

  color: string;

  recordatorio: boolean;

  created_at?: string;

  updated_at?: string;

}