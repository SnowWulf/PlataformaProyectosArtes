import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProjectDeliveryService {

  private apiUrl =
    'http://localhost:8000/api';

  constructor(
    private http: HttpClient
  ) {}

  getDeliveries(
    projectId: number
  ): Observable<any[]> {

    return this.http.get<any[]>(

      `${this.apiUrl}/projects/${projectId}/deliveries`

    );

  }

  createDelivery(
    projectId: number,
    data: any
  ) {

    return this.http.post(

      `${this.apiUrl}/projects/${projectId}/deliveries`,

      data

    );

  }

  updateDelivery(
    deliveryId: number,
    data: any
  ) {

    return this.http.put(

      `${this.apiUrl}/deliveries/${deliveryId}`,

      data

    );

  }

  deleteDelivery(
    deliveryId: number
  ) {

    return this.http.delete(

      `${this.apiUrl}/deliveries/${deliveryId}`

    );

  }

}