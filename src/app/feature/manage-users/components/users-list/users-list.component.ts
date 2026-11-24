import { Component, DestroyRef, inject, Injector, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { LanguageService } from '@mohammed_a4rf/core-ui';
import {
  FilterComponentComponent,
  FilterConfig,
  FilterInput,
  PageToolbarAction,
  PageToolbarComponent,
  ReusableTableComponent,
  TableAction,
  TableConfig,
  TableEmptyStateConfig,
  TableSkeletonConfig,
} from '@mohammed_a4rf/core-ui/shared';
import { isApiError, removeNullFilterProperties } from '@mohammed_a4rf/core-ui/utils';
import { skip } from 'rxjs';
import { AppRoutes } from '../../../../core/app-routes';
import { AuthUser, Roles } from '../../../../core/auth/models/auth.interface';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { UserFilter } from '../../models/user.interface';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-users-list',
  imports: [FilterComponentComponent, PageToolbarComponent, ReusableTableComponent],
  templateUrl: './users-list.component.html',
})
export class UsersListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly auth = inject(AuthService);
  private readonly language = inject(LanguageService);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);

  /** Options come from the API and are filled in place, so the filter form is not rebuilt. */
  private readonly roleFilter: FilterInput = {
    type: 'select',
    name: 'role',
    placeholder: 'users.filters.role',
    DDOption: [],
  };

  protected readonly actions: PageToolbarAction[] = [
    { label: 'users.add', icon: 'pi pi-plus', severity: 'primary', callback: () => this.openPage('add') },
  ];
  protected readonly filterConfig: FilterConfig = {
    filterHeader: 'users.filters.header',
    filterDescription: 'users.filters.description',
    filterInputsConfig: [
      { type: 'search', name: 'filterValue', placeholder: 'users.searchPlaceholder' },
      this.roleFilter,
    ],
  };
  /** Not readonly: "Show all" raises `rowsPerPage`, because the table shows at most that many rows. */
  protected tableConfig: TableConfig = {
    columns: [
      {
        field: 'engName',
        secondaryField: 'email',
        header: 'users.columns.user',
        type: 'text-and-desc',
        valueFormatter: (_, row: AuthUser) => (this.language.lang() === 'ar' ? row.name : row.engName),
      },
      { field: 'phoneNumber', header: 'users.columns.phone', type: 'text' },
      {
        field: 'roleName',
        header: 'users.columns.role',
        type: 'badge',
        badgeColorField: (row: AuthUser) =>
          row.role === Roles.SuperAdmin ? 'info' : row.role === Roles.Admin ? 'pending' : 'dark',
      },
      {
        field: 'isActive',
        header: 'users.columns.status',
        type: 'badge',
        valueFormatter: (value) => (value ? 'users.active' : 'users.inactive'),
        badgeColorField: (row: AuthUser) => (row.isActive ? 'success' : 'danger'),
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
      label: 'general.edit',
      icon: 'pi pi-pencil',
      type: 'edit',
      callback: (row: AuthUser) => this.openPage('edit', row.id),
    },
    {
      labelWhen: (row: AuthUser) => (row.isActive ? 'users.deactivate' : 'users.activate'),
      icon: 'pi pi-power-off',
      // The API refuses deactivating your own user.
      visibleWhen: (row: AuthUser) => row.id !== this.auth.user()?.id,
      callback: (row: AuthUser) => this.toggleStatus(row),
    },
  ];
  protected readonly emptyState: TableEmptyStateConfig = {
    title: 'users.empty.title',
    description: 'users.empty.description',
  };
  protected readonly skeletonConfig: TableSkeletonConfig = { columns: 4, rows: 6 };

  protected readonly users = signal<AuthUser[]>([]);
  protected readonly loading = signal(true);
  protected readonly totalRecords = signal(0);

  private userFilter: UserFilter = { pageNumber: 1, pageSize: 10 , };

  ngOnInit(): void {
    this.loadRoles();
    this.loadUsers();
    this.listenToLanguageChange();
  }

  protected getSelectedFilters(value: Partial<UserFilter>): void {
    this.userFilter = removeNullFilterProperties({
      ...this.userFilter,
      ...value,
      pageNumber: 1,
    }) as UserFilter;
    this.loadUsers();
  }

  protected onPageChange(event: { first: number; rows: number | 'all' }): void {
    if (event.rows === 'all') {
      const allRows = this.totalRecords() || 1000000;
      this.tableConfig = { ...this.tableConfig, rowsPerPage: allRows };
      this.userFilter = { ...this.userFilter, pageNumber: 1, pageSize: allRows };
    } else {
      this.userFilter = { ...this.userFilter, pageNumber: Math.floor(event.first / event.rows) + 1, pageSize: event.rows };
    }
    this.loadUsers();
  }

  private loadUsers(): void {
    this.loading.set(true);
    this.userService
      .getUsers(this.userFilter)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          if (isApiError(res)) return;
          this.users.set(res.data);
          this.totalRecords.set(res.totalItems ?? 0);
        },
        error: () => this.loading.set(false),
      });
  }

  private loadRoles(): void {
    this.userService
      .getRoles()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (isApiError(res)) return;
          this.roleFilter.DDOption = res.data.map((role) => ({ id: role.key, name: role.name }));
        },
        error: () => {},
      });
  }

  /** Role names come from the API in the selected language. */
  private listenToLanguageChange(): void {
    toObservable(this.language.lang, { injector: this.injector })
      .pipe(skip(1), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loadRoles();
        this.loadUsers();
      });
  }

  /** `users/add` or `users/edit/:id`. */
  private openPage(page: 'add' | 'edit', userId?: number): void {
    void this.router.navigate(['/', AppRoutes.Users, page, ...(userId ? [userId] : [])]);
  }

  private toggleStatus(row: AuthUser): void {
    const isActive = !row.isActive;
    this.userService
      .setStatus({ userId: row.id, isActive })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (isApiError(res)) return;
          this.users.update((users) => users.map((user) => (user.id === row.id ? { ...user, isActive } : user)));
        },
        error: () => {},
      });
  }
}
