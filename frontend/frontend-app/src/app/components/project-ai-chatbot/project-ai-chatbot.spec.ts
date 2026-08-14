import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectAiChatbot } from './project-ai-chatbot';

describe('ProjectAiChatbot', () => {
  let component: ProjectAiChatbot;
  let fixture: ComponentFixture<ProjectAiChatbot>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectAiChatbot],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectAiChatbot);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
