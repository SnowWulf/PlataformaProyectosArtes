import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoordinatorHome } from './coordinator-home';

describe('CoordinatorHome', () => {
  let component: CoordinatorHome;
  let fixture: ComponentFixture<CoordinatorHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoordinatorHome],
    }).compileComponents();

    fixture = TestBed.createComponent(CoordinatorHome);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
