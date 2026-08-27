import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { ReviewService, Review } from '../../services/review';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-coordinador-reviews',
  templateUrl: './coordinador-reviews.html',
  styleUrls: ['./coordinador-reviews.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class CoordinadorReviewsComponent implements OnInit {
  private reviewService = inject(ReviewService);
  private cdr = inject(ChangeDetectorRef);

  reviews: Review[] = [];
  filtroEstado: string = 'todos';
  cargando: boolean = false;
  
  // Paginación
  paginaActual: number = 1;
  totalPaginas: number = 1;

  ngOnInit(): void {
    this.cargarReviews();
  }

  cargarReviews(page: number = 1): void {
    this.cargando = true;
    this.paginaActual = page;

    // Si el filtro es 'todos', enviamos una cadena vacía o null para que el backend traiga todas las reseñas
    const estadoParam = this.filtroEstado === 'todos' ? '' : this.filtroEstado;

    this.reviewService.getReviewsCoordinador(estadoParam, page).subscribe({
      next: (response) => {
        this.reviews = response.data;
        this.totalPaginas = response.last_page;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar reseñas:', err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  cambiarFiltro(estado: string): void {
    this.filtroEstado = estado;
    this.cargarReviews(1);
  }

  cambiarEstado(review: Review, nuevoEstado: string): void {
    if (!review.id) return;
    this.reviewService.actualizarEstadoReview(review.id, { estado: nuevoEstado }).subscribe({
      next: () => {
        review.estado = nuevoEstado as 'pendiente' | 'aprobado' | 'rechazado';
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al actualizar estado:', err)
    });
  }

  toggleDestacado(review: Review): void {
    if (!review.id) return;
    const nuevoDestacado = !review.destacado_landing;
    this.reviewService.actualizarEstadoReview(review.id, { destacado_landing: nuevoDestacado }).subscribe({
      next: () => {
        review.destacado_landing = nuevoDestacado;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cambiar estado destacado:', err)
    });
  }

  eliminarResena(review: Review): void {
    if (!review.id || !confirm('¿Estás seguro de eliminar permanentemente esta reseña?')) return;

    this.reviewService.eliminarReview(review.id).subscribe({
      next: () => {
        this.reviews = this.reviews.filter(r => r.id !== review.id);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al eliminar reseña:', err)
    });
  }
}