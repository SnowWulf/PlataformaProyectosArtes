import { TestBed } from '@angular/core/testing';

import { TutorRequest } from './tutor-request';

describe('TutorRequest', () => {
  let service: TutorRequest;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TutorRequest);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
