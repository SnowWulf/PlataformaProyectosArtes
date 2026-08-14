import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProjectDeadlineAlert } from '../../models/project-alert';

@Component({
  selector: 'app-critical-modal',
  standalone: true, // 👈 Asegura que sea Standalone
  imports: [CommonModule],
  templateUrl: './critical-modal.html', // 👈 Apunta al nombre real del HTML
  styleUrl: './critical-modal.scss'    // 👈 Apunta al nombre real del SCSS
})
export class CriticalModalComponent {
  @Input() projects: ProjectDeadlineAlert[] = [];
  @Output() close = new EventEmitter<void>();

  constructor(private router: Router) {}

  goToProject(id: number): void {
    this.closeModal();
    this.router.navigate(['/dashboard/projects', id]);
  }

  closeModal(): void {
    this.close.emit();
  }
}