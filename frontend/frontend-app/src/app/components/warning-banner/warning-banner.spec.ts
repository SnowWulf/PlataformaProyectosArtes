import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WarningBanner } from './warning-banner';

describe('WarningBanner', () => {
  let component: WarningBanner;
  let fixture: ComponentFixture<WarningBanner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WarningBanner],
    }).compileComponents();

    fixture = TestBed.createComponent(WarningBanner);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
