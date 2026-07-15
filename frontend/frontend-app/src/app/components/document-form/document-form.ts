import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { DocumentService } from '../../services/document';
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit
} from '@angular/core';
import { Document } from '../../models/document';

@Component({
  selector: 'app-document-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './document-form.html',
  styleUrl: './document-form.scss',
})


export class DocumentForm implements OnInit {

  form: FormGroup;

  selectedFile: File | null = null;
  @Input() projectId!: number;
  @Input() document: Document | null = null;
  @Output() guardado = new EventEmitter<void>();
  @Output() cancelado = new EventEmitter<void>();

  constructor(
    private fb: FormBuilder,
    private documentService: DocumentService
  ) {

    this.form = this.fb.group({

      nombre: [
        '',
        Validators.required
      ],

      descripcion: [
        ''
      ]

    });

  }

  onFileSelected(event: Event): void {

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

  const formData = new FormData();

  formData.append(
    'nombre',
    this.form.value.nombre
  );

  formData.append(
    'descripcion',
    this.form.value.descripcion || ''
  );

  if (this.document === null) {

    if (!this.selectedFile) {

      alert('Debe seleccionar un PDF');

      return;

    }

    formData.append(
      'project_id',
      this.projectId.toString()
    );

    formData.append(
      'archivo',
      this.selectedFile
    );

    this.documentService
      .upload(formData)
      .subscribe({

        next: (response) => {

          console.log(
            'Documento creado',
            response
          );

          this.guardado.emit();

        },

        error: (error) => {

          console.error(error);

        }

      });

  } else {

    if (this.selectedFile) {

      formData.append(
        'archivo',
        this.selectedFile
      );

    }

    this.documentService
      .update(
        this.document.id,
        formData
      )
      .subscribe({

        next: (response) => {

          console.log(
            'Documento actualizado',
            response
          );

          this.guardado.emit();

        },

        error: (error) => {

          console.error(error);

        }

      });

  }

}
ngOnInit(): void {

  if (this.document) {

    this.form.patchValue({

      nombre: this.document.nombre,

      descripcion:
        this.document.descripcion

    });

  }
}

cancelar(): void {

  this.cancelado.emit();

}

}