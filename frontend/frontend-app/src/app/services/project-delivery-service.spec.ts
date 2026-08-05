import { TestBed } from '@angular/core/testing';

import { ProjectDeliveryService } from './project-delivery-service';

describe('ProjectDeliveryService', () => {
  let service: ProjectDeliveryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProjectDeliveryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
