import { Role } from './role';

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

  require_password_change?: boolean; // <- Identifica si la clave es temporal

}