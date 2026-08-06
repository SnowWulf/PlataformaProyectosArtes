import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { DeliverySubmission } from '../models/delivery-submission';

@Injectable({
  providedIn: 'root'
})
export class DeliverySubmissionService {

  private apiUrl =
    'http://localhost:8000/api';

  constructor(
    private http: HttpClient
  ) {}

  submitDelivery(

    deliveryId: number,

    formData: FormData

  ) {

    return this.http.post(

      `${this.apiUrl}/deliveries/${deliveryId}/submit`,

      formData

    );

  }

  getSubmissions(

    deliveryId: number

  ): Observable<DeliverySubmission[]> {

    return this.http.get<DeliverySubmission[]>(

      `${this.apiUrl}/deliveries/${deliveryId}/submissions`

    );

  }

}