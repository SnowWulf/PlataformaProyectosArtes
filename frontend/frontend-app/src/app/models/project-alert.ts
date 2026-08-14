export interface ProjectDeadlineAlert {
  id: number;
  titulo: string;
  fecha_fin: string;
  dias_restantes: number;
}

export interface DeadlineAlertsResponse {
  banner_projects: ProjectDeadlineAlert[];
  critical_projects: ProjectDeadlineAlert[];
}