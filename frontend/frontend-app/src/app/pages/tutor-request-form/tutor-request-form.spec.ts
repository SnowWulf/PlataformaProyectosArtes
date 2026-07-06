import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TutorRequestForm } from './tutor-request-form';

describe('TutorRequestForm', () => {
  let component: TutorRequestForm;
  let fixture: ComponentFixture<TutorRequestForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TutorRequestForm],
    }).compileComponents();

    fixture = TestBed.createComponent(TutorRequestForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
