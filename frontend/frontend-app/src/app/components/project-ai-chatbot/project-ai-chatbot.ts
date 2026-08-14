import { 
  Component, 
  ChangeDetectorRef,
  Input, 
  Output, 
  EventEmitter, 
  OnInit, 
  OnChanges,
  SimpleChanges,
  ElementRef, 
  ViewChild, 
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectAiChatService, ChatMessage } from '../../services/project-ai-chat';
import { finalize, timeout, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { MarkdownComponent } from 'ngx-markdown';

@Component({
  selector: 'app-project-ai-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, MarkdownComponent],
  templateUrl: './project-ai-chatbot.html',
  styleUrl: './project-ai-chatbot.scss',
  
})
export class ProjectAiChatbotComponent implements OnInit, OnChanges {
  @Input() projectId!: number;
  @Output() toggleState = new EventEmitter<boolean>();

  private cdr = inject(ChangeDetectorRef);
  private aiChatService = inject(ProjectAiChatService);

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  isOpen = false;
  isLoading = false;         // Controla la burbuja de carga únicamente al ENVIAR mensajes
  isHistoryLoading = false;  // Carga silenciosa del historial inicial
  newMessage = '';
  messages: ChatMessage[] = [];

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['projectId'] && !changes['projectId'].firstChange) {
      this.messages = [];
      if (this.isOpen && this.projectId) {
        this.loadHistory();
      }
    }
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    this.toggleState.emit(this.isOpen);

    if (this.isOpen) {
      if (this.messages.length === 0) {
        this.setWelcomeMessage();
        if (this.projectId) {
          this.loadHistory();
        }
      }
    }
    this.scrollToBottom();
  }

  loadHistory(): void {
    if (!this.projectId) return;
    this.isHistoryLoading = true;

    this.aiChatService.getHistory(this.projectId)
      .pipe(
        timeout(8000),
        catchError((err) => {
          console.error('Error al cargar historial:', err);
          return of([]); 
        }),
        finalize(() => {
          this.isHistoryLoading = false;
          this.cdr.detectChanges(); // Forzar renderizado del fin de carga de historial
          this.scrollToBottom();
        })
      )
      .subscribe({
        next: (history) => {
          if (history && history.length > 0) {
            this.messages = history;
            this.cdr.detectChanges(); // Refrescar vista con los mensajes recuperados
          }
        }
      });
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || this.isLoading || !this.projectId) return;

    const userText = this.newMessage.trim();

    // 1. Añadir mensaje del usuario a la vista
    this.messages.push({
      sender: 'user',
      text: userText,
      timestamp: new Date().toISOString()
    });

    this.newMessage = '';
    this.isLoading = true; // Activa la burbuja de tres puntos
    this.cdr.detectChanges(); // Actualiza UI inmediatamente (muestra el mensaje enviado y el indicador de carga)
    this.scrollToBottom();

    // 2. Realizar petición HTTP al backend
    this.aiChatService.sendMessage(this.projectId, userText)
      .pipe(
        timeout(35000), // Tiempo de espera amplio para respuestas extensas de la IA
        catchError((err) => {
          console.error('Error en llamada a Gemini:', err);
          return of({ response: '⚠️ Ocurrió un error al procesar tu solicitud con la IA.' });
        }),
        finalize(() => {
          this.isLoading = false;   // Desactiva la burbuja de tres puntos
          this.cdr.detectChanges(); // Forzar actualización de UI al terminar
          this.scrollToBottom();
        })
      )
      .subscribe({
        next: (res: any) => {
          // 3. Añadir respuesta recibida
          this.messages.push({
            sender: 'ai',
            text: res?.response || res?.texto || res?.message || 'Sin respuesta.',
            timestamp: new Date().toISOString()
          });

          this.cdr.detectChanges(); // 👈 IMPORTANTE: Pinta la respuesta en pantalla inmediatamente
          this.scrollToBottom();
        }
      });
  }

  private setWelcomeMessage(): void {
    this.messages = [
      {
        sender: 'ai',
        text: '¡Hola! 👋 Soy tu asistente de Inteligencia Artificial para este proyecto. ¿En qué te puedo colaborar hoy?',
        timestamp: new Date().toISOString()
      }
    ];
    this.cdr.detectChanges();
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.scrollContainer?.nativeElement) {
        this.scrollContainer.nativeElement.scrollTop = 
          this.scrollContainer.nativeElement.scrollHeight;
      }
    }, 50);
  }
}