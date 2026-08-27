import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  OnInit, 
  OnChanges, 
  SimpleChanges, 
  inject, 
  ChangeDetectorRef 
} from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'; 
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { Auth } from '../../services/auth';

export interface DatosFeedbackModal {
  estudianteId?: number;
  correoDestino?: string;
  nombreEstudiante?: string;
  tituloProyecto?: string;
}

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './feedback.html',
  styleUrls: ['./feedback.scss']
})
export class Feedback implements OnInit, OnChanges {
  @Input() isOpen: boolean = false;
  @Input() datosUsuario?: DatosFeedbackModal;
  
  @Output() alCerrar = new EventEmitter<void>();
  @Output() alEnviarExitoso = new EventEmitter<string>();

  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef); // Inyectamos el detector de cambios
  public auth = inject(Auth);

  feedbackForm!: FormGroup;
  cargando: boolean = false;
  mensajeErrorIa: string | null = null;
  mensajeExito: string | null = null;

  ngOnInit(): void {
    this.inicializarFormulario();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['datosUsuario'] && this.datosUsuario) {
      this.actualizarFormulario();
    }
  }

  private inicializarFormulario(): void {
    this.feedbackForm = this.fb.group({
      asunto: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(150)]],
      observaciones: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
      calificacion: [5, [Validators.required, Validators.min(1), Validators.max(5)]]
    });

    if (this.datosUsuario) {
      this.actualizarFormulario();
    }
  }

  private actualizarFormulario(): void {
    if (!this.feedbackForm) return;

    const asuntoPredeterminado = this.datosUsuario?.tituloProyecto 
      ? `Retroalimentación al Proyecto: ${this.datosUsuario.tituloProyecto}`
      : '';

    this.feedbackForm.patchValue({
      asunto: asuntoPredeterminado
    });
  }

  cerrarModal(): void {
    if (!this.cargando) {
      this.feedbackForm.reset({ calificacion: 5 });
      this.mensajeErrorIa = null;
      this.mensajeExito = null;
      this.alCerrar.emit();
    }
  }

  enviarFeedback(): void {
    this.mensajeErrorIa = null;
    this.mensajeExito = null;

    if (this.feedbackForm.invalid) {
      this.feedbackForm.markAllAsTouched();
      return;
    }

    this.cargando = true;

    const payload = {
      asunto: this.feedbackForm.get('asunto')?.value,
      observaciones: this.feedbackForm.get('observaciones')?.value,
      calificacion: this.feedbackForm.get('calificacion')?.value,
      proyecto_contexto: this.datosUsuario?.tituloProyecto || null
    };

    this.http.post('/api/feedback', payload)
      .pipe(
        finalize(() => {
          this.cargando = false;
          // Fuerza el ciclo de detección de cambios en la interfaz
          this.cdr.detectChanges(); 
        })
      )
      .subscribe({
        next: (res: any) => {
          const msg = res.message || 'La reseña ha sido validada y publicada con éxito.';
          this.mensajeExito = msg;
          this.alEnviarExitoso.emit(msg);

          this.feedbackForm.reset({ calificacion: 5 });
          
          if (this.isOpen) {
            setTimeout(() => this.cerrarModal(), 1500);
          }
        },
        error: (err) => {
          // Captura de errores 422 de la IA u otros errores HTTP
          if (err.status === 422) {
            const motivo = err.error?.motivo || err.error?.razon || err.error?.message || 'El comentario no cumple con las políticas de moderación.';
            this.mensajeErrorIa = `🤖 Moderación por IA: ${motivo}`;
          } else if (err.error?.message) {
            this.mensajeErrorIa = err.error.message;
          } else {
            this.mensajeErrorIa = 'Ocurrió un error al procesar el comentario. Inténtalo de nuevo.';
          }

          console.error('Error en el servicio de feedback:', err);
        }
      });
  }
}