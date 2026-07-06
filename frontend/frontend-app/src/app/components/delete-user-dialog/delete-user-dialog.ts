import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { CommonModule } from '@angular/common';

import { User } from '../../models/user';

@Component({
  selector: 'app-delete-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './delete-user-dialog.html',
  styleUrl: './delete-user-dialog.scss'
})
export class DeleteUserDialog {

  @Input()
  usuario!: User;

  @Output()
  cancelar = new EventEmitter<void>();

  @Output()
  confirmar = new EventEmitter<string>();

  form: FormGroup;

  constructor(
    private fb: FormBuilder
  ) {

    this.form = this.fb.group({

      password: [
        '',
        Validators.required
      ]

    });

  }

  eliminar(): void {

    if (this.form.invalid) {

      this.form.markAllAsTouched();

      return;

    }

    this.confirmar.emit(

      this.form.value.password

    );

  }

}