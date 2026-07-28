import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TutorHome } from './tutor-home';

describe('TutorHome', () => {
  let component: TutorHome;
  let fixture: ComponentFixture<TutorHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TutorHome],
    }).compileComponents();

    fixture = TestBed.createComponent(TutorHome);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
