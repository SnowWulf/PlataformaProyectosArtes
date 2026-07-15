import { TestBed } from '@angular/core/testing';

import { DocumentReview } from './document-review';

describe('DocumentReview', () => {
  let service: DocumentReview;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DocumentReview);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
