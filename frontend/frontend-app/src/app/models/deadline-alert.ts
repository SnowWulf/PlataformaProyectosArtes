export interface ProjectAlert {
  id: number;
  titulo: string;
  fecha_fin: string;
  dias_restantes: number;
}

export interface DeadlineAlertsResponse {
  banner_projects: ProjectAlert[];
  critical_projects: ProjectAlert[];
}