import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {

  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:8000/api';

  getByProject(projectId: number) {
    return this.http.get(
      `${this.apiUrl}/projects/${projectId}/documents`
    );
  }

  upload(formData: FormData) {

  return this.http.post(
    `${this.apiUrl}/documents`,
    formData
  );

}
  
update(
  id: number,
  formData: FormData
) {

  return this.http.put(
    `${this.apiUrl}/documents/${id}`,
    formData
  );

}

delete(id: number) {

  return this.http.delete(
    `${this.apiUrl}/documents/${id}`
  );

}
}