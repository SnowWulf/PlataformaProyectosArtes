import { Injectable } from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable
} from 'rxjs';

import {
  User
} from '../models/user';

import {
  CommunityProject
} from '../models/community-project';

@Injectable({
  providedIn: 'root'
})
export class CommunityService {

  private apiUrl =
    'http://localhost:8000/api/community';

  constructor(
    private http: HttpClient
  ) { }

  getUsers():
    Observable<User[]> {

    return this.http.get<User[]>(
      `${this.apiUrl}/users`
    );

  }
  getUser(
    id: number
  ): Observable<User> {

    return this.http.get<User>(
      `${this.apiUrl}/users/${id}`
    );

  }

  getProjects(
    userId: number
  ): Observable<CommunityProject[]> {

    return this.http.get<
      CommunityProject[]
    >(
      `${this.apiUrl}/users/${userId}/projects`
    );

  }

  requestCollaboration(
    projectId: number,
    requesterId: number
  ): Observable<any> {

    return this.http.post(

      `${this.apiUrl}/request-collaboration`,

      {

        project_id:
          projectId,

        requester_id:
          requesterId

      }

    );

  }
  getReceivedRequests(
    userId: number
  ) {

    return this.http.get<any[]>(

      `${this.apiUrl}/requests/received/${userId}`

    );

  }

  getSentRequests(
    userId: number
  ) {

    return this.http.get<any[]>(

      `${this.apiUrl}/requests/sent/${userId}`

    );

  }

  acceptRequest(
    id: number
  ) {

    return this.http.post(

      `${this.apiUrl}/requests/${id}/accept`,

      {}

    );

  }
  rejectRequest(
    id: number
  ) {

    return this.http.post(

      `${this.apiUrl}/requests/${id}/reject`,

      {}

    );

  }

  inviteToProject(
  projectId: number,
  receiverId: number
) {

  return this.http.post(

    'http://localhost:8000/api/community/invite',

    {

      project_id: projectId,

      receiver_id: receiverId

    }

  );

}
requestTutor(
  projectId: number,
  tutorId: number
) {

  return this.http.post(

    'http://localhost:8000/api/tutor-requests',

    {

      project_id: projectId,

      tutor_id: tutorId

    }

  );

}

}