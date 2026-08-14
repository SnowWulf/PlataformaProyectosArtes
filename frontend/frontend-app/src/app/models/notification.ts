export interface NotificationPreference {
  tipo_clave: string;
  canal_inapp: boolean;
  canal_email: boolean;
}

export interface AppNotification {
  id: number;
  user_id: number;
  title?: string;      
  titulo?: string;
  mensaje: string;
  tipo_clave?: string;
  link?: string | null;
  leida?: boolean;
  read_at?: string | null;
  created_at?: string;
  updated_at?: string;
}
export interface NotificationResponse {
  unread_count: number;
  notifications: AppNotification[];
}