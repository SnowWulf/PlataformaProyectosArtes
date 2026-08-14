import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TelegramConnect } from './telegram-connect';

describe('TelegramConnect', () => {
  let component: TelegramConnect;
  let fixture: ComponentFixture<TelegramConnect>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TelegramConnect],
    }).compileComponents();

    fixture = TestBed.createComponent(TelegramConnect);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
