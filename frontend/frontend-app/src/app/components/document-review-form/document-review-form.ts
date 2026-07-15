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

import { DocumentReviewService }
from '../../services/document-review';

@Component({
  selector: 'app-document-review-form',
  standalone: true,
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './document-review-form.html',
  styleUrl: './document-review-form.scss',
})
export class DocumentReviewForm {

  @Input() documentId!: number;

  @Output() guardado =
    new EventEmitter<void>();

  @Output() cancelado =
    new EventEmitter<void>();

  form: FormGroup;

  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private documentReviewService:
      DocumentReviewService
  ) {

    this.form = this.fb.group({

      estado: [

        'Pendiente revisión',

        Validators.required

      ],

      comentario: ['']

    });

  }

  onFileSelected(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;

    if (
      input.files &&
      input.files.length > 0
    ) {

      this.selectedFile =
        input.files[0];

    }

  }

  guardar(): void {

    const formData =
      new FormData();

    formData.append(
      'estado',
      this.form.value.estado
    );

    formData.append(
      'comentario',
      this.form.value.comentario || ''
    );

    if (this.selectedFile) {

      formData.append(
        'archivo',
        this.selectedFile
      );

    }

    this.documentReviewService
      .create(
        this.documentId,
        formData
      )
      .subscribe({

        next: () => {

          this.guardado.emit();

        },

        error: (error) => {

          console.error(error);

        }

      });

  }

  cancelar(): void {

    this.cancelado.emit();

  }

}