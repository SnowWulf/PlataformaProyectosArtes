import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CriticalModal } from './critical-modal';

describe('CriticalModal', () => {
  let component: CriticalModal;
  let fixture: ComponentFixture<CriticalModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CriticalModal],
    }).compileComponents();

    fixture = TestBed.createComponent(CriticalModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
