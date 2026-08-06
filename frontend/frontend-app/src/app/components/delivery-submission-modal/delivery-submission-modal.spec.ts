import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliverySubmissionModal } from './delivery-submission-modal';

describe('DeliverySubmissionModal', () => {
  let component: DeliverySubmissionModal;
  let fixture: ComponentFixture<DeliverySubmissionModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeliverySubmissionModal],
    }).compileComponents();

    fixture = TestBed.createComponent(DeliverySubmissionModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
