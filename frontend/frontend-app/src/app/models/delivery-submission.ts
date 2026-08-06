export interface DeliverySubmission {

  id: number;

  delivery_id: number;

  student_id: number;

  file_path: string;

  comentario?: string;

  estado:
    | 'submitted'
    | 'reviewed'
    | 'approved'
    | 'rejected';

  created_at?: string;

  updated_at?: string;

}