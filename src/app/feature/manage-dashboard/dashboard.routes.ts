import { Routes } from '@angular/router';

export const dashboardRoutes: Routes = [
  {
    path: '',
    data: { breadcrumb: 'navigation.dashboard' },
    loadComponent: () =>
      import('./components/dashboard.component').then((m) => m.DashboardComponent),
  },
];
