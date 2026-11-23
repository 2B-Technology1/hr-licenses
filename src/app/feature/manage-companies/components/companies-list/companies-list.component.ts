import { Component, computed, DestroyRef, inject, Injector, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { LanguageService, NotificationService } from '@mohammed_a4rf/core-ui';
import {
  CenterDialogContentComponent,
  ConfirmDialogService,
  DeleteConfirmationService,
  FilterComponentComponent,
  FilterConfig,
  FilterOption,
  PageToolbarAction,
  PageToolbarComponent,
  ReusableTableComponent,
  TableAction,
  TableConfig,
  TableEmptyStateConfig,
  TableSkeletonConfig,
} from '@mohammed_a4rf/core-ui/shared';
import { isApiError, removeNullFilterProperties, warning } from '@mohammed_a4rf/core-ui/utils';
import { TranslateService } from '@ngx-translate/core';
import { filter, forkJoin, skip, switchMap } from 'rxjs';
import { AppRoutes } from '../../../../core/app-routes';
import { Roles } from '../../../../core/auth/models/auth.interface';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { Company, CompanyFilter, CompanyRow, CompanyStatus } from '../../models/company.interface';
import { HrModule } from '../../models/hr-module.interface';
import { CompanyService } from '../../services/company.service';
import { HrModuleService } from '../../services/hr-module.service';
import { showCompanySecret } from '../show-company-secret';

@Component({
  selector: 'app-companies-list',
  imports: [
    FilterComponentComponent,
    PageToolbarComponent,
    ReusableTableComponent,
  ],
  templateUrl: './companies-list.component.html',
})
export class CompaniesListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly companyService = inject(CompanyService);
  private readonly hrModuleService = inject(HrModuleService);
  private readonly auth = inject(AuthService);
  private readonly language = inject(LanguageService);
  private readonly translate = inject(TranslateService);
  private readonly deleteConfirmation = inject(DeleteConfirmationService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly notification = inject(NotificationService);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);

  /** Viewers only read companies (the API answers 403 to their changes). */
  protected readonly canManage = this.auth.user()?.role !== Roles.Viewer;

  /** Options come from the API and are filled in place, so the filter form is not rebuilt. */
  private readonly statusFilter: FilterOption = {
    inputName: 'status',
    type: 'select',
    label: 'companies.filters.status',
    placeholder: 'companies.filters.status',
    checkboxes: [],
  };
  private readonly moduleFilter: FilterOption = {
    inputName: 'module',
    type: 'select',
    label: 'companies.filters.module',
    placeholder: 'companies.filters.module',
    checkboxes: [],
  };

  protected readonly actions: PageToolbarAction[] = [
    {
      label: 'companies.add',
      icon: 'pi pi-plus',
      severity: 'primary',
      visible: this.canManage,
      callback: () => this.openPage('add'),
    },
  ];
  protected readonly filterConfig: FilterConfig = {
    filterHeader: 'companies.filters.header',
    filterDescription: 'companies.filters.description',
    allowActiveFilter: true,
    activeFilterInputs: ['status', 'module'],
    filterInputsConfig: [
      {
        name: 'filter',
        type: 'filter-2',
        label: 'general.filter',
        btnSeverity: 'white',
        options: [this.statusFilter, this.moduleFilter],
      },
      { name: 'filterValue', type: 'search', placeholder: 'companies.searchPlaceholder' },
    ],
  };
  protected readonly tableConfig: TableConfig = {
    columns: [
      { field: 'name', secondaryField: 'code', header: 'companies.columns.company', type: 'text-and-desc' },
      { field: 'moduleNames', header: 'companies.columns.modules', type: 'chips', chipsLimit: 3 },
      {
        field: 'statusName',
        header: 'companies.columns.licenseStatus',
        type: 'badge',
        valueFormatter: (value, row: Company) =>
          row.status === CompanyStatus.Active && row.isExpired ? 'companies.expired' : value,
        badgeColorField: (row: Company) =>
          row.status === CompanyStatus.Suspended ? 'danger' : row.isExpired ? 'warning' : 'success',
      },
      { field: 'licenseStartDate', header: 'companies.columns.licenseStart', type: 'date' },
      {
        field: 'licenseExpiryDate',
        header: 'companies.columns.licenseDuration',
        type: 'text',
        valueFormatter: (_, row: Company) => this.licenseLength(row),
      },
    ],
    serverSide: true,
    rowsPerPage: 10,
    rowsPerPageOptions: [10, 20, 50],
    selectionMode: null,
    actionsColumnWidth: () => '5rem',
  };
  protected readonly rowActions: TableAction[] = [{ action: 'show-menu' }];
  protected readonly menuActions: TableAction[] = [
    {
      label: 'general.view',
      icon: 'pi pi-eye',
      visible: !this.canManage,
      callback: (row: CompanyRow) => this.openPage('view', row.id),
    },
    {
      label: 'general.edit',
      icon: 'pi pi-pencil',
      type: 'edit',
      visible: this.canManage,
      callback: (row: CompanyRow) => this.openPage('edit', row.id),
    },
    {
      label: 'companies.actions.syncNow',
      icon: 'pi pi-sync',
      visible: this.canManage,
      // Sync needs the company's HR API URL; without it the edit page opens to add one.
      callback: (row: CompanyRow) => (row.apiUrl ? this.syncNow(row) : this.openPage('edit', row.id)),
    },
    {
      label: 'companies.actions.regenerateSecret',
      icon: 'pi pi-key',
      visible: this.canManage,
      callback: (row: CompanyRow) => this.regenerateSecret(row),
    },
    {
      label: 'general.delete',
      icon: 'pi pi-trash',
      type: 'delete',
      visible: this.canManage,
      callback: (row: CompanyRow) => this.deleteCompany(row),
    },
  ];
  protected readonly emptyState: TableEmptyStateConfig = {
    title: 'companies.empty.title',
    description: 'companies.empty.description',
  };
  protected readonly skeletonConfig: TableSkeletonConfig = { columns: 5, rows: 6 };

  protected readonly loading = signal(true);
  protected readonly totalRecords = signal(0);
  /** The companies and the module catalogue load separately; the chips need both. */
  protected readonly rows = computed<CompanyRow[]>(() => {
    const names: Record<number, string> = {};
    this.modules().forEach((module) => (names[module.code] = module.name));
    return this.companies().map((company) => ({
      ...company,
      moduleNames: company.activeModules.filter((code) => names[code]).map((code) => names[code]),
    }));
  });

  private readonly companies = signal<Company[]>([]);
  private readonly modules = signal<HrModule[]>([]);
  private companyFilter: CompanyFilter = { pageNumber: 1, pageSize: 10 };

  ngOnInit(): void {
    this.loadLookups();
    this.loadCompanies();
    this.listenToLanguageChange();
  }

  protected getSelectedFilters(value: Partial<CompanyFilter>): void {
    this.companyFilter = removeNullFilterProperties({
      ...this.companyFilter,
      ...value,
      pageNumber: 1,
    }) as CompanyFilter;
    this.loadCompanies();
  }

  protected onPageChange(event: { first: number; rows: number | 'all' }): void {
    this.companyFilter =
      event.rows === 'all'
        ? { ...this.companyFilter, pageNumber: 1, pageSize: this.totalRecords() || 1000000 }
        : { ...this.companyFilter, pageNumber: Math.floor(event.first / event.rows) + 1, pageSize: event.rows };
    this.loadCompanies();
  }

  private loadCompanies(): void {
    this.loading.set(true);
    this.companyService
      .getCompanies(this.companyFilter)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          if (isApiError(res)) return;
          this.companies.set(res.data);
          this.totalRecords.set(res.totalItems ?? 0);
        },
        error: () => this.loading.set(false),
      });
  }

  private loadLookups(): void {
    forkJoin({ statuses: this.companyService.getStatuses(), modules: this.hrModuleService.getModules() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ statuses, modules }) => {
          if (isApiError(statuses) || isApiError(modules)) return;
          this.statusFilter.checkboxes = statuses.data;
          this.moduleFilter.checkboxes = modules.data.map((module) => ({ id: module.code, name: module.name }));
          this.modules.set(modules.data);
        },
        error: () => {},
      });
  }

  /** Names, statuses and modules come from the API in the selected language. */
  private listenToLanguageChange(): void {
    toObservable(this.language.lang, { injector: this.injector })
      .pipe(skip(1), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loadLookups();
        this.loadCompanies();
      });
  }

  private deleteCompany(row: CompanyRow): void {
    this.deleteConfirmation
      .confirm()
      .pipe(
        filter(Boolean),
        switchMap(() => this.companyService.deleteCompany(row.id)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (res) => {
          if (isApiError(res)) return;
          this.companies.update((companies) => companies.filter((company) => company.id !== row.id));
          this.totalRecords.update((total) => total - 1);
        },
        error: () => {},
      });
  }

  /** The interceptors toast the result ("asked to update" or "couldn't be reached"). */
  private syncNow(row: CompanyRow): void {
    this.companyService
      .syncNow(row.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => {} });
  }

  private regenerateSecret(row: CompanyRow): void {
    this.confirmDialog
      .confirm({
        component: CenterDialogContentComponent,
        width: '30rem',
        data: {
          icon: warning,
          title: 'companies.regenerate.title',
          question: 'companies.regenerate.question',
          cancelBtnLabel: 'general.cancel',
          confirmBtnLabel: 'companies.regenerate.confirm',
        },
      })
      .pipe(
        filter((result) => result.confirmed),
        switchMap(() => this.companyService.regenerateSecret(row.id)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (res) => {
          if (isApiError(res)) return;
          showCompanySecret(this.confirmDialog, this.notification, res.data);
        },
        error: () => {},
      });
  }

  /** `companies/add`, `companies/edit/:id` or `companies/view/:id`. */
  private openPage(page: 'add' | 'edit' | 'view', companyId?: number): void {
    void this.router.navigate(['/', AppRoutes.Companies, page, ...(companyId ? [companyId] : [])]);
  }

  /** "12 months", or days when the license is shorter than a month. */
  private licenseLength(company: Company): string {
    const start = new Date(company.licenseStartDate);
    const end = new Date(company.licenseExpiryDate);
    const months =
      (end.getFullYear() - start.getFullYear()) * 12 +
      end.getMonth() -
      start.getMonth() -
      (end.getDate() < start.getDate() ? 1 : 0);
    if (months > 0) {
      return this.translate.instant(months === 1 ? 'companies.length.month' : 'companies.length.months', {
        count: months,
      });
    }

    const days = Math.round((end.getTime() - start.getTime()) / 86400000);
    return this.translate.instant(days === 1 ? 'companies.length.day' : 'companies.length.days', { count: days });
  }
}
