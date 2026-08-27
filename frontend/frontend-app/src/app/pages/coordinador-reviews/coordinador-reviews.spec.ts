import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoordinadorReviews } from './coordinador-reviews';

describe('CoordinadorReviews', () => {
  let component: CoordinadorReviews;
  let fixture: ComponentFixture<CoordinadorReviews>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoordinadorReviews],
    }).compileComponents();

    fixture = TestBed.createComponent(CoordinadorReviews);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
