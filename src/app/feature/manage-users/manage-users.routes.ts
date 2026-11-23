import { Routes } from '@angular/router';

export const manageUsersRoutes: Routes = [
  {
    path: '',
    data: { breadcrumb: 'navigation.users' },
    children: [
      {
        path: '',
        loadComponent: () => import('./components/users-list/users-list.component').then((m) => m.UsersListComponent),
      },
      {
        path: 'add',
        data: { breadcrumb: 'users.form.addTitle' },
        loadComponent: () => import('./components/user-form/user-form.component').then((m) => m.UserFormComponent),
      },
      {
        path: 'edit/:id',
        data: { breadcrumb: 'users.form.editTitle' },
        loadComponent: () => import('./components/user-form/user-form.component').then((m) => m.UserFormComponent),
      },
    ],
  },
];
