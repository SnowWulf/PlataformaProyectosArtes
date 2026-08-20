import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http'; // <-- Importar HttpClient

@Component({
  selector: 'app-register-request',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register-request.html',
  styleUrl: './register-request.scss'
})
export class RegisterRequestComponent {

  programasDisponibles: string[] = [
    'Artes Visuales',
    'Diseño Gráfico',
    'Diseño Industrial',
    'Licenciatura en Educación Artística',
    'Música'
  ];

  form = {
    fullName: '',
    email: '',
    role: 'Estudiante',
    department: '',
    reason: ''
  };

  loading = false;
  mostrarModalExito = false;
  private redirectTimeout: any;

  constructor(
    private router: Router,
    private http: HttpClient, // <-- Inyectar HttpClient
    private cdr: ChangeDetectorRef
  ) {}

  enviarSolicitud(): void {
    if (!this.form.fullName || !this.form.email || !this.form.department || !this.form.reason) {
      alert('Por favor, completa todos los campos obligatorios.');
      return;
    }

    this.loading = true;

    const payload = {
      name: this.form.fullName,
      email: this.form.email,
      role_solicitado: this.form.role,
      programa: this.form.department,
      reason: this.form.reason
    };

    // Envío POST al backend de Laravel
    this.http.post('http://localhost:8000/api/registration-requests', payload).subscribe({
      next: () => {
        this.loading = false;
        this.mostrarModalExito = true;
        this.cdr.detectChanges();

        this.redirectTimeout = setTimeout(() => {
          this.volverAlLogin();
        }, 4000);
      },
      error: (err) => {
        this.loading = false;
        console.error('Error al guardar la solicitud', err);
        alert(err.error?.message || 'Ocurrió un error al enviar la solicitud.');
      }
    });
  }

  volverAlLogin(): void {
    if (this.redirectTimeout) {
      clearTimeout(this.redirectTimeout);
    }
    this.router.navigate(['/login']);
  }
}