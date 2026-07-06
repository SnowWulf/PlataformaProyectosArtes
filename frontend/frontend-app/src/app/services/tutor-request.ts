import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { User } from '../models/user';


@Injectable({
  providedIn: 'root'
})
export class TutorRequestService {

  private apiUrl = 'http://localhost:8000/api';

  constructor(
    private http: HttpClient
  ) { }

  getTutors(): Observable<User[]> {

    return this.http.get<User[]>(
      `${this.apiUrl}/users/tutors`
    );

  }

  createTutorRequest(data: {
  project_id: number;
  tutor_id: number;
  mensaje: string;
    
  }): Observable<any> {

  return this.http.post(
    `${this.apiUrl}/tutor-requests`,
    data
  );

}

getPendingRequests(): Observable<any[]> {

  return this.http.get<any[]>(
    `${this.apiUrl}/tutor-requests/pending`
  );

}

acceptRequest(id: number): Observable<any> {

  return this.http.put(
    `${this.apiUrl}/tutor-requests/${id}/accept`,
    {}
  );

}

rejectRequest(id: number): Observable<any> {

  return this.http.put(
    `${this.apiUrl}/tutor-requests/${id}/reject`,
    {}
  );

}
}