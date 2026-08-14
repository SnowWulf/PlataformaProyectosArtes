import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SidebarPanelComponent } from './sidebar-panel.component';

describe('SidebarPanelComponent', () => {
  let component: SidebarPanelComponent;
  let fixture: ComponentFixture<SidebarPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarPanelComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
