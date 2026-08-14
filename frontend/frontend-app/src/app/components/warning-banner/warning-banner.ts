import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProjectDeadlineAlert } from '../../models/project-alert';

@Component({
  selector: 'app-warning-banner',
  standalone: true, // 👈 Asegura que sea Standalone
  imports: [CommonModule],
  templateUrl: './warning-banner.html', // 👈 Apunta al nombre real del HTML
  styleUrl: './warning-banner.scss'    // 👈 Apunta al nombre real del SCSS
})
export class WarningBannerComponent {
  @Input() projects: ProjectDeadlineAlert[] = [];
  @Output() dismiss = new EventEmitter<void>();

  constructor(private router: Router) {}

  goToProject(id: number): void {
    this.router.navigate(['/dashboard/projects', id]);
  }

  closeBanner(): void {
    this.dismiss.emit();
  }
}