import {
  Component,
  ChangeDetectorRef,
  afterNextRender
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { TutorRequestService } from '../../services/tutor-request';

@Component({
  selector: 'app-tutor-requests',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './tutor-requests.html',
  styleUrl: './tutor-requests.scss'
})
export class TutorRequests {

  solicitudes: any[] = [];

  constructor(
    private tutorRequestService: TutorRequestService,
    private cdr: ChangeDetectorRef
  ) {

    afterNextRender(() => {

      this.cargarSolicitudes();

    });

  }

  cargarSolicitudes(): void {

    this.tutorRequestService
      .getPendingRequests()
      .subscribe({

        next: (data) => {

          console.log(
            'Solicitudes recibidas:',
            data
          );

          this.solicitudes = data;

          this.cdr.detectChanges();

        },

        error: (err) => {

          console.error(
            'Error al cargar solicitudes',
            err
          );

        }

      });

  }

  aceptarSolicitud(id: number): void {

    this.tutorRequestService
      .acceptRequest(id)
      .subscribe({

        next: () => {

          console.log(
            'Solicitud aceptada'
          );

          this.cargarSolicitudes();

        },

        error: (err) => {

          console.error(
            'Error al aceptar',
            err
          );

        }

      });

  }

  rechazarSolicitud(id: number): void {

    this.tutorRequestService
      .rejectRequest(id)
      .subscribe({

        next: () => {

          console.log(
            'Solicitud rechazada'
          );

          this.cargarSolicitudes();

        },

        error: (err) => {

          console.error(
            'Error al rechazar',
            err
          );

        }

      });

  }

}