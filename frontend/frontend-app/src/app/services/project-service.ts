import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Project } from '../models/project';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  private apiUrl = 'http://localhost:8000/api/projects';

  constructor(private http: HttpClient) {}

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(this.apiUrl);
  }

  getProject(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/${id}`);
  }

  createProject(project: Partial<Project>): Observable<Project> {

  return this.http.post<Project>(
    this.apiUrl,
    project
  );
  }
  updateProject(
  id: number,
  project: Partial<Project>
): Observable<Project> {

  return this.http.put<Project>(
    `${this.apiUrl}/${id}`,
    project
  );
  }

  deleteProject(id: number): Observable<any> {

  return this.http.delete(
    `${this.apiUrl}/${id}`
  );

}

}
