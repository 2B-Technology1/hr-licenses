import { Routes } from '@angular/router';

export const manageCompaniesRoutes: Routes = [
  {
    path: '',
    data: { breadcrumb: 'navigation.companies' },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/companies-list/companies-list.component').then((m) => m.CompaniesListComponent),
      },
      {
        path: 'add',
        data: { breadcrumb: 'companies.form.addTitle' },
        loadComponent: () => import('./components/company-form/company-form.component').then((m) => m.CompanyFormComponent),
      },
      {
        path: 'edit/:id',
        data: { breadcrumb: 'companies.form.editTitle' },
        loadComponent: () => import('./components/company-form/company-form.component').then((m) => m.CompanyFormComponent),
      },
      {
        path: 'view/:id',
        data: { breadcrumb: 'companies.form.viewTitle', readonly: true },
        loadComponent: () => import('./components/company-form/company-form.component').then((m) => m.CompanyFormComponent),
      },
    ],
  },
];
