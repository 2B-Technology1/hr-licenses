import { Routes } from '@angular/router';
import { authGuard } from '@mohammed_a4rf/core-ui';
import { AppRoutes } from './core/app-routes';
import { sessionGuard } from './core/auth/session.guard';

export const routes: Routes = [
  {
    path: AppRoutes.Login,
    canActivate: [authGuard],
    data: { breadcrumb: 'auth.login.title' },
    loadComponent: () =>
      import('./core/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [sessionGuard],
    loadComponent: () => import('./core/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: AppRoutes.Dashboard },
      {
        path: AppRoutes.Dashboard,
        loadChildren: () => import('./feature/manage-dashboard/dashboard.routes').then((m) => m.dashboardRoutes),
      },
      {
        path: AppRoutes.Profile,
        data: { breadcrumb: 'auth.profile.title' },
        loadComponent: () =>
          import('./core/auth/profile/profile.component').then((m) => m.ProfileComponent),
      },
    ],
  },
  {
    path: '**',
    data: { breadcrumb: 'navigation.notFound' },
    loadComponent: () =>
      import('@mohammed_a4rf/core-ui/layout').then((m) => m.NotFoundPageComponent),
  },
];
