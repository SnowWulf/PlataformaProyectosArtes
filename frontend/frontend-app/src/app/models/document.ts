import { DocumentReview }
from './document-review';

export interface Document {

  id: number;

  project_id: number;

  user_id: number;

  nombre: string;

  descripcion: string | null;

  file_url: string;

  estado: string;

  created_at: string;

  updated_at: string;

  reviews?: DocumentReview[];
  
}