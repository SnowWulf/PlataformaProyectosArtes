import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-bi-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bi-dashboard.component.html',
  styleUrls: ['./bi-dashboard.component.scss']
})
export class BiDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);
  private cdr = inject(ChangeDetectorRef); // 👈 Detector de cambios manual

  iframeUrl: SafeResourceUrl | null = null;
  isLoading: boolean = true;
  hasError: boolean = false;

  private readonly apiUrl = 'http://localhost:8000/api/bi/dashboard-url';

  ngOnInit(): void {
    this.cargarDashboard();
  }

  cargarDashboard(): void {
    this.isLoading = true;
    this.hasError = false;
    this.iframeUrl = null;

    this.http.get<{ iframeUrl: string }>(this.apiUrl).subscribe({
      next: (res) => {
        console.log('URL de Metabase recibida:', res.iframeUrl);
        
        // Sanitizamos la URL
        this.iframeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(res.iframeUrl);
        
        // ⚠️ Forzamos a Angular a actualizar el HTML INMEDIATAMENTE
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al obtener la URL del Dashboard:', err);
        this.hasError = true;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onIframeLoad(): void {
    if (this.iframeUrl) {
      console.log('Iframe cargado exitosamente');
      this.isLoading = false;
      // ⚠️ Volvemos a notificar a la vista para ocultar el spinner
      this.cdr.detectChanges();
    }
  }
}