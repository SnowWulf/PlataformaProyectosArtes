import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TutorRequests } from './tutor-requests';

describe('TutorRequests', () => {
  let component: TutorRequests;
  let fixture: ComponentFixture<TutorRequests>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TutorRequests],
    }).compileComponents();

    fixture = TestBed.createComponent(TutorRequests);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
