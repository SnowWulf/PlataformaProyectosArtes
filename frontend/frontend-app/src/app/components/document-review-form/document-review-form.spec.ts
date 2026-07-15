import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentReviewForm } from './document-review-form';

describe('DocumentReviewForm', () => {
  let component: DocumentReviewForm;
  let fixture: ComponentFixture<DocumentReviewForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentReviewForm],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentReviewForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
