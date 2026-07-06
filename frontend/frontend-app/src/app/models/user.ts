import { Role } from './role';

export interface User {
  id: number;
  name: string;
  email: string;
  role_id: number;
  role?: Role;
}
