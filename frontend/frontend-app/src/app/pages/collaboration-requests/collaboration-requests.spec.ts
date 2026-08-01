import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CollaborationRequests } from './collaboration-requests';

describe('CollaborationRequests', () => {
  let component: CollaborationRequests;
  let fixture: ComponentFixture<CollaborationRequests>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollaborationRequests],
    }).compileComponents();

    fixture = TestBed.createComponent(CollaborationRequests);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
