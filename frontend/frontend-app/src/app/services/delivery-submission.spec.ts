import { TestBed } from '@angular/core/testing';

import { DeliverySubmission } from './delivery-submission';

describe('DeliverySubmission', () => {
  let service: DeliverySubmission;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DeliverySubmission);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
