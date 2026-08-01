import { Role } from './role';

export interface User {

  id: number;

  name: string;

  email: string;

  role_id: number;

  role?: Role;

  programa?: string | null;

  bio?: string | null;

  mostrar_proyectos?: boolean;

  mostrar_correo?: boolean;

  foto?: string | null;

}
