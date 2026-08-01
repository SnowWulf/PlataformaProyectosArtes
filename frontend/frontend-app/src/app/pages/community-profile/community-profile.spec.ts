import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommunityProfile } from './community-profile';

describe('CommunityProfile', () => {
  let component: CommunityProfile;
  let fixture: ComponentFixture<CommunityProfile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommunityProfile],
    }).compileComponents();

    fixture = TestBed.createComponent(CommunityProfile);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
