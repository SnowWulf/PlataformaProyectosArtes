import { Component, OnInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef, HostListener, NgZone, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TelegramService } from '../../services/telegram-service';
import QRCode from 'qrcode';

@Component({
  selector: 'app-telegram-connect',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './telegram-connect.html',
  styleUrls: ['./telegram-connect.scss']
})
export class TelegramConnectComponent implements OnInit, OnDestroy {
  @ViewChild('qrCanvas') qrCanvas!: ElementRef<HTMLCanvasElement>;

  telegramUrl: string = '';
  isConnected: boolean = false;
  telegramChatId: string | null | undefined = null;
  loading: boolean = true;
  actionLoading: boolean = false;
  errorMessage: string = '';
  justConnected: boolean = false; // Flag para mostrar el banner de éxito

  private pollInterval: any = null;
  private ngZone = inject(NgZone);

  constructor(
    private telegramService: TelegramService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarEstado();
  }

  ngOnDestroy(): void {
    this.detenerPolling();
  }

  // Refresca automáticamente los datos si el usuario regresa a la pestaña
  @HostListener('window:focus')
  onWindowFocus(): void {
    if (!this.isConnected && !this.loading) {
      this.verificarSilenciosamente();
    }
  }

  iniciarPolling(): void {
    this.detenerPolling(); // Asegurarnos de limpiar cualquier intervalo previo
    
    // Ejecutar fuera de la zona de Angular para evitar disparar detección de cambios innecesaria
    this.ngZone.runOutsideAngular(() => {
      this.pollInterval = setInterval(() => {
        if (!this.isConnected) {
          this.ngZone.run(() => {
            this.verificarSilenciosamente();
          });
        } else {
          this.detenerPolling();
        }
      }, 3000); // Revisa automáticamente cada 3 segundos
    });
  }

  detenerPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  verificarSilenciosamente(): void {
    this.telegramService.getConnectLink().subscribe({
      next: (res) => {
        const conectoAhora = !this.isConnected && !!res?.is_connected;

        this.telegramUrl = res?.telegram_url || '';
        this.isConnected = !!res?.is_connected;
        this.telegramChatId = res?.telegram_chat_id ?? null;

        if (conectoAhora) {
          this.justConnected = true; // Activa la ventanita/banner de éxito
          this.detenerPolling();
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error durante la verificación en segundo plano:', err);
      }
    });
  }

  cargarEstado(): void {
    this.loading = true;
    this.errorMessage = '';

    this.telegramService.getConnectLink().subscribe({
      next: (res) => {
        console.log('Respuesta del Backend Telegram:', res);
        this.telegramUrl = res?.telegram_url || '';
        this.isConnected = !!res?.is_connected;
        this.telegramChatId = res?.telegram_chat_id ?? null;
        this.loading = false;
        this.cdr.detectChanges();

        // Generar QR únicamente si no está vinculado e iniciar escucha en tiempo real
        if (!this.isConnected) {
          if (this.telegramUrl) {
            setTimeout(() => this.generarQR(), 100);
          }
          this.iniciarPolling();
        } else {
          this.detenerPolling();
        }
      },
      error: (err) => {
        console.error('Error al obtener estado de Telegram:', err);
        this.errorMessage = 'No se pudo conectar con el servidor para obtener el enlace de Telegram.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  generarQR(): void {
    if (this.qrCanvas && this.telegramUrl) {
      QRCode.toCanvas(
        this.qrCanvas.nativeElement,
        this.telegramUrl,
        {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        },
        (error) => {
          if (error) console.error('Error al renderizar el QR:', error);
        }
      );
    }
  }

  desvincular(): void {
    if (!confirm('¿Estás seguro de desvincular tu cuenta de Telegram? Dejarás de recibir alertas en tu celular.')) {
      return;
    }

    this.actionLoading = true;
    this.errorMessage = '';
    this.justConnected = false;

    this.telegramService.disconnect().subscribe({
      next: () => {
        this.actionLoading = false;
        this.isConnected = false;
        this.telegramChatId = null;
        this.cargarEstado(); // Recarga estado para obtener un nuevo enlace/QR limpio e iniciar polling nuevamente
      },
      error: (err) => {
        console.error('Error al desvincular Telegram:', err);
        this.errorMessage = 'Ocurrió un error al intentar desvincular la cuenta.';
        this.actionLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}