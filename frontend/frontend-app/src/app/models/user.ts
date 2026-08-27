import { Role } from './role';
import { Project } from './project'; 

export interface User {
  id: number;
  name: string;
  email: string;
  role_id: number;
  role?: Role;
  programa?: string;
  bio?: string;
  foto?: string;
  foto_url?: string;
  mostrar_proyectos?: boolean;
  mostrar_correo?: boolean;
  two_factor_enabled?: boolean;
  require_password_change?: boolean;
  proyectos?: Project[]; // 2. Agregar la relación de proyectos
}