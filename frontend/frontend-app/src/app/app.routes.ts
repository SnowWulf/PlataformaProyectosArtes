import { Routes } from '@angular/router';

import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Projects } from './pages/projects/projects';
import { Users } from './pages/users/users';
import { TutorRequests } from './pages/tutor-requests/tutor-requests';

import { authGuard } from './guards/auth-guard';
import { roleGuard } from './guards/role-guard';

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
        path: 'projects',
        component: Projects
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
      }

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