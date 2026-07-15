import {
  Component,
  afterNextRender,
  ChangeDetectorRef,
  inject
} from '@angular/core';

import { DocumentService } from '../../services/document';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [],
  templateUrl: './documents.html',
  styleUrl: './documents.scss',
})
export class Documents {

  private documentService = inject(DocumentService);

  documents: any[] = [];

  constructor(
    private cdr: ChangeDetectorRef
  ) {

    afterNextRender(() => {
      this.cargarDocumentos();
    });

  }

  cargarDocumentos(): void {

    this.documentService.getByProject(1)
      .subscribe({

        next: (documents: any) => {

          console.log('DOCUMENTOS', documents);

          this.documents = documents;

          this.cdr.detectChanges();

        },

        error: (error) => {

          console.error(error);

        }

      });

  }

}