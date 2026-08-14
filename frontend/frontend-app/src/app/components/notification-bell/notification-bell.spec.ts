import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing'; // Importante para evitar errores de NotificationService
import { NotificationBellComponent } from './notification-bell'; // 👈 Nombre correcto de la clase

describe('NotificationBellComponent', () => {
  let component: NotificationBellComponent;
  let fixture: ComponentFixture<NotificationBellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NotificationBellComponent,
        HttpClientTestingModule // Agregado para proveer las dependencias de HTTP que usa tu servicio
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationBellComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});