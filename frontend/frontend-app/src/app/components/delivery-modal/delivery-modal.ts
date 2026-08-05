import {

  Component,

  EventEmitter,

  Input,

  Output,

  OnChanges

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

  selector: 'app-delivery-modal',

  standalone: true,

  imports: [

    CommonModule,

    FormsModule

  ],

  templateUrl: './delivery-modal.html',

  styleUrl: './delivery-modal.scss'

})

export class DeliveryModal

implements OnChanges {

  @Input()

  visible = false;

  @Input()

  delivery: ProjectDelivery | null = null;

  @Output()

  save =

    new EventEmitter<any>();

  @Output()

  close =

    new EventEmitter<void>();

  form: any = {

    titulo: '',

    descripcion: '',

    fecha_limite: '',

    obligatorio: true

  };

  ngOnChanges() {

    if (

      this.delivery

    ) {

      this.form = {

        titulo:

          this.delivery.titulo,

        descripcion:

          this.delivery.descripcion,

        fecha_limite:

          this.delivery.fecha_limite,

        obligatorio:

          this.delivery.obligatorio

      };

    } else {

      this.form = {

        titulo: '',

        descripcion: '',

        fecha_limite: '',

        obligatorio: true

      };

    }

  }

  guardar() {

    this.save.emit(

      this.form

    );

  }

}