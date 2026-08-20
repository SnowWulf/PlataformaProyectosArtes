import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BiDashboardComponent } from './bi-dashboard.component';

describe('BiDashboardComponent', () => {
  let component: BiDashboardComponent;
  let fixture: ComponentFixture<BiDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BiDashboardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BiDashboardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
