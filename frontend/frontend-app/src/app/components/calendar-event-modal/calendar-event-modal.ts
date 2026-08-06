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

@Component({
  selector: 'app-calendar-event-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './calendar-event-modal.html',
  styleUrl: './calendar-event-modal.scss'
})
export class CalendarEventModal {

  @Input()
  evento: any = {

    titulo: '',

    descripcion: '',

    fecha_inicio: '',

    fecha_fin: '',

    tipo: 'personal',

    color: '#4CAF50',

    recordatorio: false

  };

  @Input()
  modoEdicion = false;

  @Output()
  guardar =
    new EventEmitter<any>();

  @Output()
  cancelar =
    new EventEmitter<void>();

  guardarEvento() {

    this.guardar.emit(
      this.evento
    );

  }

  cancelarModal() {

    this.cancelar.emit();

  }

}