import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Feedback, DatosFeedbackModal } from '../../components/feedback/feedback';
import { ReviewService, Review } from '../../services/review';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    Feedback
  ],
  templateUrl: './landing.html',
  styleUrls: ['./landing.scss']
})
export class LandingComponent implements OnInit {
  private reviewService = inject(ReviewService);
  private cdr = inject(ChangeDetectorRef); // <--- Inyectamos el detector de cambios

  // Modal de retroalimentación
  mostrarModalFeedback = false;

  datosParaFeedback: DatosFeedbackModal = {
    estudianteId: 0,
    correoDestino: 'coordinacion.artes@udenar.edu.co',
    nombreEstudiante: 'Comunidad Institucional',
    tituloProyecto: 'Propuesta / Sugerencia Ecosistema Digital'
  };

  // Carga de reseñas para el Landing Page
  publicReviews: Review[] = [];
  cargandoReviews: boolean = true;

  ngOnInit(): void {
    this.cargarResenasDestacadas();
  }

  cargarResenasDestacadas(): void {
    this.cargandoReviews = true;
    this.reviewService.getLandingReviews().subscribe({
      next: (data) => {
        this.publicReviews = data || [];
        this.cargandoReviews = false;
        this.cdr.detectChanges(); // <--- Forzamos a Angular a pintar los datos inmediatamente
      },
      error: (err) => {
        console.error('Error al obtener reseñas para la landing:', err);
        this.cargandoReviews = false;
        this.cdr.detectChanges(); // <--- Forzamos también en caso de error
      }
    });
  }

  getEstrellas(calificacion: number): string {
    const score = Math.max(1, Math.min(5, Math.round(calificacion || 5)));
    return '★'.repeat(score) + '☆'.repeat(5 - score);
  }

  abrirModalFeedback(): void {
    this.mostrarModalFeedback = true;
  }

  cerrarModalFeedback(): void {
    this.mostrarModalFeedback = false;
  }

  onFeedbackExitoso(eventPayload: any): void {
    console.log('Retroalimentación procesada con éxito:', eventPayload);
    this.cerrarModalFeedback();

    if (eventPayload && typeof eventPayload === 'object' && eventPayload.calificacion) {
      this.publicReviews.unshift(eventPayload as Review);
      this.cdr.detectChanges(); // <--- Refrescamos al agregar una nueva en tiempo real
    } else {
      this.cargarResenasDestacadas();
    }
  }
}