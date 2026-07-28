import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';

import { CommonModule } from '@angular/common';

import { Project } from '../../models/project';
import { User } from '../../models/user';

import { TutorRequestService } from '../../services/tutor-request';

@Component({
  selector: 'app-tutor-request-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './tutor-request-form.html',
  styleUrl: './tutor-request-form.scss',
})
export class TutorRequestForm implements OnInit {

  @Input()
  proyecto!: Project;

  @Output()
  solicitudEnviada = new EventEmitter<void>();

  tutores: User[] = [];

  form!: FormGroup;

  @Output()
  cancelado =
    new EventEmitter<void>();

  @Output()
  enviado =
    new EventEmitter<void>();



  constructor(
    private fb: FormBuilder,
    private tutorRequestService: TutorRequestService,
    private cdr: ChangeDetectorRef
  ) {

    this.form = this.fb.group({

      tutor_id: [''],

      mensaje: ['']

    });

  }

  ngOnInit(): void {

    this.cargarTutores();

  }

  cargarTutores(): void {

    this.tutorRequestService
      .getTutors()
      .subscribe({

        next: (data) => {

          console.log(
            'Tutores recibidos:',
            data
          );

          this.tutores = data;

          this.cdr.detectChanges();

        },

        error: (err) => {

          console.error(
            'Error al cargar tutores',
            err
          );

        }

      });

  }

  enviarSolicitud(): void {

    if (this.form.invalid) {

      return;

    }

    this.tutorRequestService
      .createTutorRequest({

        project_id: this.proyecto.id,

        tutor_id: this.form.value.tutor_id,

        mensaje: this.form.value.mensaje

      })
      .subscribe({

        next: (respuesta) => {

          console.log(
            'Solicitud enviada'
          );

          this.enviado.emit();

          console.log(
            'Solicitud enviada correctamente',
            respuesta
          );

          alert('Solicitud enviada correctamente.');

          this.solicitudEnviada.emit();

        },

        error: (err) => {

          console.error(
            'Error al enviar solicitud',
            err
          );

          alert(
            err.error?.message ??
            'No fue posible enviar la solicitud.'
          );

        }

      });

  }

}