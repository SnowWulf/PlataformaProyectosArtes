import { User } from './user';

export interface Project {
  id: number;
  titulo: string;
  descripcion: string;
  tipo_proyecto: string;
  estado: string;
  fecha_inicio: string;
  fecha_fin?: string;
  created_at?: string; 

  owner_id: number;
  tutor_id?: number;

  owner?: User;
  tutor?: User;
  es_visible?: boolean;

  collaborators?: User[];
}