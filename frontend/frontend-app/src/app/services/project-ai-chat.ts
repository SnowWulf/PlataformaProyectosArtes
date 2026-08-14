import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ChatMessage {
  id?: number;
  sender: 'user' | 'ai' | 'bot';
  text: string;
  timestamp?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectAiChatService {
  private apiUrl = `${environment.apiUrl}/projects`;

  constructor(private http: HttpClient) {}

  /**
   * Cargar el historial de mensajes del proyecto.
   */
  getHistory(projectId: number): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.apiUrl}/${projectId}/ai-chat/history`);
  }

  /**
   * Enviar un mensaje del estudiante a la API de Gemini mediante Laravel.
   */
  sendMessage(projectId: number, message: string): Observable<{ response: string; timestamp: string }> {
    return this.http.post<{ response: string; timestamp: string }>(
      `${this.apiUrl}/${projectId}/ai-chat`,
      { message }
    );
  }
}