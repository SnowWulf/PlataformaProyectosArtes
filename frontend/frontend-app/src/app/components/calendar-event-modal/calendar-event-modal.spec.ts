import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalendarEventModal } from './calendar-event-modal';

describe('CalendarEventModal', () => {
  let component: CalendarEventModal;
  let fixture: ComponentFixture<CalendarEventModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalendarEventModal],
    }).compileComponents();

    fixture = TestBed.createComponent(CalendarEventModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
