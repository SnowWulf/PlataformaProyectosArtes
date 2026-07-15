import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentForm } from './document-form';

describe('DocumentForm', () => {
  let component: DocumentForm;
  let fixture: ComponentFixture<DocumentForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentForm],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
