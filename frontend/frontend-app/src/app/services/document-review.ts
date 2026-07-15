import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';


@Injectable({
  providedIn: 'root'
  
})
export class DocumentReviewService {



  private http = inject(HttpClient);

  private apiUrl =
    'http://localhost:8000/api';

  getByDocument(
    documentId: number
  ) {

    return this.http.get(
      `${this.apiUrl}/documents/${documentId}/reviews`
    );

  }

  create(
    documentId: number,
    formData: FormData
  ) {

    return this.http.post(
      `${this.apiUrl}/documents/${documentId}/reviews`,
      formData
    );

  }

}