import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const roleGuard: CanActivateFn = (route) => {

  const router = inject(Router);

  const userString = localStorage.getItem('user');

  if (!userString) {
    router.navigate(['/login']);
    return false;
  }

  const user = JSON.parse(userString);

  const expectedRole = route.data?.['role'];

  if (user?.role?.nombre === expectedRole) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
