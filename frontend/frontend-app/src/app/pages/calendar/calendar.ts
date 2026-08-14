import {
  Component,
  afterNextRender,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarEvent, QuickNote} from '../../models/calendar-event';
import { CalendarEventService } from '../../services/calendar-event-service';
import { CalendarEventModal } from '../../components/calendar-event-modal/calendar-event-modal';
import { ProjectDeliveryService } from '../../services/project-delivery-service';

export interface ExtendedCalendarEvent extends CalendarEvent {
  esTarea?: boolean;
  delivery_id?: number;
  
}

export interface CalendarCell {
  fecha: Date;
  fechaKey: string;
  esMesActual: boolean;
  esHoy: boolean;
  eventos: ExtendedCalendarEvent[];
  
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CalendarEventModal,
    DatePipe
  ],
  templateUrl: './calendar.html',
  styleUrl: './calendar.scss'
})
export class Calendar {

  mostrarModal = false;
  modoEdicion = false;
  guardando = false;
  mesActual = new Date();
  
  diasCalendario: CalendarCell[] = [];
  vista = 'calendario';

  eventoActual: ExtendedCalendarEvent = {
    id: 0,
    user_id: 0,
    titulo: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: '',
    tipo: 'personal',
    color: '#4CAF50',
    recordatorio: false
  };

  eventos: ExtendedCalendarEvent[] = [];
  

  constructor(
    private calendarService: CalendarEventService,
    private deliveryService: ProjectDeliveryService, // 2. Inyectar el servicio de tareas/entregas
    private cdr: ChangeDetectorRef
    
  ) {
    afterNextRender(() => {
      this.cargarEventosYEntregas();
    });
  }

cargarEventosYEntregas() {
  this.calendarService.getEvents().subscribe({
    next: eventosRes => {
      const misEventos: ExtendedCalendarEvent[] = Array.isArray(eventosRes)
        ? eventosRes
        : (eventosRes as any).data || [];

      misEventos.forEach(ev => ev.esTarea = false);

      // Cargar las entregas filtradas especificamente para el usuario activo
      this.deliveryService.getDeliveries().subscribe({
        next: entregasRes => {
          const entregas = Array.isArray(entregasRes)
            ? entregasRes
            : (entregasRes as any).data || [];

          const eventosTareas: ExtendedCalendarEvent[] = entregas.map((entrega: any) => ({
            id: entrega.id,
            user_id: entrega.tutor_id || 0,
            titulo: `📌 Tarea: ${entrega.titulo}`,
            descripcion: entrega.descripcion || 'Tarea asignada por el tutor',
            fecha_inicio: entrega.fecha_limite,
            fecha_fin: entrega.fecha_limite, // Se marca únicamente en la fecha límite
            tipo: 'academico',
            color: '#EF4444',
            recordatorio: true,
            esTarea: true,
            delivery_id: entrega.id
          }));

          this.eventos = [...misEventos, ...eventosTareas];
          this.generarCalendario();
          this.cdr.detectChanges();
        },
        error: err => {
          console.error('Error al cargar entregas:', err);
          this.eventos = misEventos;
          this.generarCalendario();
          this.cdr.detectChanges();
        }
      });
    },
    error: err => console.error('Error al cargar eventos personales:', err)
  });
}

  generarCalendario() {
    const anio = this.mesActual.getFullYear();
    const mes = this.mesActual.getMonth();

    const primerDia = new Date(anio, mes, 1);
    
    let inicioSemana = primerDia.getDay() - 1;
    if (inicioSemana === -1) inicioSemana = 6;

    const fechaInicioGrid = new Date(primerDia);
    fechaInicioGrid.setDate(fechaInicioGrid.getDate() - inicioSemana);

    const celdas: CalendarCell[] = [];
    const hoyStr = this.obtenerFechaISO(new Date());

    for (let i = 0; i < 42; i++) {
      const fechaCelda = new Date(fechaInicioGrid);
      fechaCelda.setDate(fechaInicioGrid.getDate() + i);

      const fechaKey = this.obtenerFechaISO(fechaCelda);

      const eventosDelDia = this.eventos.filter(evento => {
        const fechaObjetivo = evento.fecha_fin || evento.fecha_inicio;
        if (!fechaObjetivo) return false;

        const fechaObjStr = this.obtenerFechaISO(new Date(fechaObjetivo));
        return fechaObjStr === fechaKey;
      });

      celdas.push({
        fecha: fechaCelda,
        fechaKey: fechaKey,
        esMesActual: fechaCelda.getMonth() === mes,
        esHoy: fechaKey === hoyStr,
        eventos: eventosDelDia
      });
    }

    this.diasCalendario = celdas;
  }

  private obtenerFechaISO(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  private formatearParaDateTimeLocal(fechaVal?: string | Date): string {
    if (!fechaVal) return '';
    const d = new Date(fechaVal);
    if (isNaN(d.getTime())) return '';

    const anio = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    const horas = String(d.getHours()).padStart(2, '0');
    const minutos = String(d.getMinutes()).padStart(2, '0');

    return `${anio}-${mes}-${dia}T${horas}:${minutos}`;
  }

  editarEvento(evento: ExtendedCalendarEvent) {
    // Si es una tarea del tutor, solo se muestra en lectura/alerta
    if (evento.esTarea) {
      alert(`📌 Tarea Asignada por el Tutor:\n\n${evento.titulo}\nFecha límite: ${evento.fecha_fin}\n\nNota: Las tareas del tutor no se pueden modificar desde el calendario.`);
      return;
    }

    this.modoEdicion = true;
    this.eventoActual = {
      ...evento,
      fecha_inicio: this.formatearParaDateTimeLocal(evento.fecha_inicio),
      fecha_fin: this.formatearParaDateTimeLocal(evento.fecha_fin)
    };
    this.mostrarModal = true;
    this.cdr.detectChanges();
  }

  eliminarEvento(id: number) {
    const evento = this.eventos.find(e => e.id === id);
    if (evento?.esTarea) {
      alert('Las tareas asignadas por el tutor no pueden ser eliminadas.');
      return;
    }

    if (!confirm('¿Eliminar este evento?')) return;

    this.calendarService.deleteEvent(id).subscribe({
      next: () => this.cargarEventosYEntregas(),
      error: err => console.error(err)
    });
  }

  // Métodos de navegación y control de modal
  mesAnterior() {
    this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() - 1, 1);
    this.generarCalendario();
    this.cdr.detectChanges();
  }

  mesSiguiente() {
    this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() + 1, 1);
    this.generarCalendario();
    this.cdr.detectChanges();
  }

  irAHoy() {
    this.mesActual = new Date();
    this.generarCalendario();
    this.cdr.detectChanges();
  }

  seleccionarDia(fecha: Date) {
    this.modoEdicion = false;
    const fechaISO = this.obtenerFechaISO(fecha);

    this.eventoActual = {
      id: 0,
      user_id: 0,
      titulo: '',
      descripcion: '',
      fecha_inicio: `${fechaISO}T09:00`,
      fecha_fin: `${fechaISO}T18:00`,
      tipo: 'personal',
      color: '#4CAF50',
      recordatorio: false,
      esTarea: false
    };
    this.mostrarModal = true;
    this.cdr.detectChanges();
  }

  manejarClickEvento(evento: ExtendedCalendarEvent) {
    this.editarEvento(evento);
  }

  abrirNuevoEvento() {
    this.modoEdicion = false;
    const hoyISO = this.obtenerFechaISO(new Date());

    this.eventoActual = {
      id: 0,
      user_id: 0,
      titulo: '',
      descripcion: '',
      fecha_inicio: `${hoyISO}T09:00`,
      fecha_fin: `${hoyISO}T18:00`,
      tipo: 'personal',
      color: '#4CAF50',
      recordatorio: false,
      esTarea: false
    };
    this.mostrarModal = true;
    this.cdr.detectChanges();
  }

  cerrarModal() {
    this.guardando = false;
    this.mostrarModal = false;
    this.cdr.detectChanges();
  }

  guardarEvento(evento: ExtendedCalendarEvent) {
    if (this.guardando) return;

    this.guardando = true;
    this.eventoActual = evento;

    const request = this.modoEdicion
      ? this.calendarService.updateEvent(this.eventoActual.id, this.eventoActual)
      : this.calendarService.createEvent(this.eventoActual);

    request.subscribe({
      next: () => {
        this.guardando = false;
        this.cerrarModal();
        this.cargarEventosYEntregas();
      },
      error: err => {
        this.guardando = false;
        console.error(err);
        alert(err.error?.message ?? 'Error al guardar.');
        this.cdr.detectChanges();
      }
    });
  }

  verMasEventos(celda: CalendarCell) {
    console.log('Ver eventos de la fecha:', celda.fechaKey);
    this.vista = 'lista';
    this.cdr.detectChanges();
  }

  
}