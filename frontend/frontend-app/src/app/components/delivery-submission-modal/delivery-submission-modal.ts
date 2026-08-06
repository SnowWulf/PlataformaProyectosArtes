import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import {
  ProjectDelivery
} from '../../models/project-delivery';

@Component({
  selector: 'app-delivery-submission-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './delivery-submission-modal.html',
  styleUrl: './delivery-submission-modal.scss'
})
export class DeliverySubmissionModal {

  @Input()
  entrega!: ProjectDelivery;

  comentario = '';

  archivo: File | null = null;

  @Output()
  guardar =
    new EventEmitter<FormData>();

  @Output()
  cancelar =
    new EventEmitter<void>();


  seleccionarArchivo(
    event: Event
  ) {

    const input =
      event.target as HTMLInputElement;

    if (

      input.files &&
      input.files.length > 0

    ) {

      this.archivo =
        input.files[0];

    }

  }


  enviar() {

    if (!this.archivo) {

      alert(

        'Seleccione un archivo.'

      );

      return;

    }

    const formData =
      new FormData();

    formData.append(

      'file',

      this.archivo

    );

    formData.append(

      'comentario',

      this.comentario

    );

    this.guardar.emit(
      formData
    );

  }

}