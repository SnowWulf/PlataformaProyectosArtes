import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Review {
  id?: number;
  user_id?: number;
  asunto: string;
  observaciones: string;
  calificacion: number;
  proyecto_contexto?: string;
  estado?: 'pendiente' | 'aprobado' | 'rechazado';
  motivo_rechazo_ia?: string | null;
  destacado_landing?: boolean;
  created_at?: string;
  usuario?: {
    id: number;
    name: string;
    email?: string;
    foto_perfil_url?: string;
    role?: { id: number; name: string };
  };
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  // Publicar reseña (Estudiantes / Tutores)
  publicarFeedback(review: Review): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/feedback`, review);
  }

  // Obtener reseñas públicas aprobadas para el Landing Page
  getLandingReviews(): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiUrl}/landing/reviews`);
  }

  // Listar reseñas para el Panel del Coordinador (con paginación y filtro opcional)
  getReviewsCoordinador(estado?: string, page: number = 1): Observable<any> {
    let params = new HttpParams().set('page', page.toString());
    if (estado && estado !== 'todos') {
      params = params.set('estado', estado);
    }
    return this.http.get<any>(`${this.apiUrl}/coordinador/reviews`, { params });
  }

  // Modificar el estado o visibilidad en el Landing
  actualizarEstadoReview(reviewId: number, datos: { estado?: string; destacado_landing?: boolean; motivo_rechazo_ia?: string }): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/coordinador/reviews/${reviewId}`, datos);
  }

  // Eliminar definitivamente una reseña (Coordinador)
  eliminarReview(reviewId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/coordinador/reviews/${reviewId}`);
  }
}