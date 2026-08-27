import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AppNotification, NotificationPreference, NotificationResponse } from './../models/notification';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/notifications`;

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Cargar notificaciones e informar el número de no leídas
  getNotifications(): Observable<NotificationResponse> {
    return this.http.get<NotificationResponse>(this.apiUrl).pipe(
      tap(res => this.unreadCountSubject.next(res.unread_count))
    );
  }

  // Marcar una notificación como leída
  markAsRead(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/read`, {}).pipe(
      tap(() => {
        const current = this.unreadCountSubject.value;
        if (current > 0) {
          this.unreadCountSubject.next(current - 1);
        }
      })
    );
  }

  // Marcar todas como leídas
  markAllAsRead(): Observable<any> {
    return this.http.patch(`${this.apiUrl}/read-all`, {}).pipe(
      tap(() => this.unreadCountSubject.next(0))
    );
  }

  // Preferencias de usuario
  getPreferences(): Observable<NotificationPreference[]> {
    return this.http.get<NotificationPreference[]>(`${this.apiUrl}/preferences`);
  }

  updatePreferences(preferences: NotificationPreference[]): Observable<any> {
    return this.http.put(`${this.apiUrl}/preferences`, { preferences });
  }

  // Enviar una nueva notificación a un usuario
  sendNotification(payload: { user_id: number; title: string; message: string; type?: string; link?: string }): Observable<any> {
    return this.http.post<any>(this.apiUrl, payload);
  }
}