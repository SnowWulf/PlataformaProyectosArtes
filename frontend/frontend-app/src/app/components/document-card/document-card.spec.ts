import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentCard } from './document-card';

describe('DocumentCard', () => {
  let component: DocumentCard;
  let fixture: ComponentFixture<DocumentCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentCard],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
