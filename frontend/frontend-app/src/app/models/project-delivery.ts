import { DeliverySubmission } from './delivery-submission';
export interface ProjectDelivery {

  id: number;

  project_id: number;

  tutor_id: number;

  titulo: string;

  descripcion: string;

  fecha_limite: string;

  obligatorio: boolean;

  estado: string;
  
}

export interface ProjectDelivery {
  id: number;
  project_id: number;
  tutor_id: number;
  titulo: string;
  descripcion: string;
  fecha_limite: string;
  obligatorio: boolean;
  estado: string;
  
  respuesta?: DeliverySubmission; 
}