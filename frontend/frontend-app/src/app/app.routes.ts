import { Routes } from '@angular/router';

import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Projects } from './pages/projects/projects';
import { Users } from './pages/users/users';
import { TutorRequests } from './pages/tutor-requests/tutor-requests';

import { authGuard } from './guards/auth-guard';
import { roleGuard } from './guards/role-guard';

import { Documents } from './pages/documents/documents';
import { ProjectDetail } from './pages/project-detail/project-detail';

import { StudentHome } from './pages/student-home/student-home';
import { TutorHome } from './pages/tutor-home/tutor-home';
import { CoordinatorHome } from './pages/coordinator-home/coordinator-home';
import { Profile } from './pages/profile/profile';

export const routes: Routes = [



  {
    path: 'login',
    component: Login
  },

  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard],

    children: [

      {
        path: '',
        redirectTo: 'projects',
        pathMatch: 'full'
      },

      {
        path: 'student-home',
        component: StudentHome
      },

      {
        path: 'tutor-home',
        component: TutorHome
      },

      {
        path: 'coordinator-home',
        component: CoordinatorHome
      },

      {
        path: 'projects',
        component: Projects
      },

      {
        path: 'projects/:id',
        component: ProjectDetail
      },

      {
        path: 'documents',
        component: Documents
      },

      {
        path: 'users',
        component: Users,
        canActivate: [roleGuard],
        data: {
          role: 'Coordinador'
        }
      },

      {
        path: 'tutor-requests',
        component: TutorRequests,
        canActivate: [roleGuard],
        data: {
          role: 'Tutor'
        }
      },
      {
        path: 'community',
        loadComponent: () =>
          import('./pages/community/community')
            .then(m => m.Community)
      },
      {
        path: 'community/profile/:id',
        loadComponent: () =>
          import('./pages/community-profile/community-profile')
            .then(m => m.CommunityProfile)
      },
      {
        path: 'requests',
        loadComponent: () =>
          import(
            './pages/collaboration-requests/collaboration-requests'
          ).then(
            m => m.CollaborationRequests
          )
      },
      {
        path: 'profile',
        component: Profile
      },
      // ✅ CORRECTO
{
  path: 'tools',
  loadComponent: () => import('./pages/tools/tools').then(m => m.ToolsComponent)
},
      {
        path: 'tools/calendar',
          loadComponent: () =>
          import('./pages/calendar/calendar')
          .then(
          m => m.Calendar
        )
      },
    ]

  },

  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },

  {
    path: '**',
    redirectTo: 'dashboard'
  }
];