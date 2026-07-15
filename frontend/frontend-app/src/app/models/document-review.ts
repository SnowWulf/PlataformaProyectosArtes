export interface ReviewTutor {

  id: number;

  name: string;

}

export interface DocumentReview {

  id?: number;

  document_id: number;

  tutor_id: number;

  estado: string;

  comentario?: string;

  attachment_path?: string;

  attachment_url?: string;

  created_at?: string;

  updated_at?: string;

  tutor?: ReviewTutor;

}