import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AppRoutes } from '../app-routes';
import { Roles } from './models/auth.interface';
import { AuthService } from './services/auth.service';

/** Users and roles are super-admin only (the API answers 403 to the other roles). */
export const superAdminGuard: CanActivateFn = () =>
  inject(AuthService).user()?.role === Roles.SuperAdmin ||
  inject(Router).parseUrl('/' + AppRoutes.Dashboard);
