import { TestBed } from '@angular/core/testing';

import { ProjectAiChat } from './project-ai-chat';

describe('ProjectAiChat', () => {
  let service: ProjectAiChat;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProjectAiChat);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
