import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliveryModal } from './delivery-modal';

describe('DeliveryModal', () => {
  let component: DeliveryModal;
  let fixture: ComponentFixture<DeliveryModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeliveryModal],
    }).compileComponents();

    fixture = TestBed.createComponent(DeliveryModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
