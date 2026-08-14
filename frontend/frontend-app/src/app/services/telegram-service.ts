import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TelegramConnectResponse {
  telegram_url: string;
  is_connected: boolean;
  telegram_chat_id?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TelegramService {

  private apiUrl = 'http://localhost:8000/api/telegram';

  constructor(private http: HttpClient) {}

  getConnectLink(): Observable<TelegramConnectResponse> {
    return this.http.get<TelegramConnectResponse>(`${this.apiUrl}/connect-link`);
  }

  disconnect(): Observable<any> {
    return this.http.post(`${this.apiUrl}/disconnect`, {});
  }
}