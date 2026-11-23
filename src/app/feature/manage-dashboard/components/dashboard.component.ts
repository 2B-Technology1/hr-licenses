import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LanguageService } from '@mohammed_a4rf/core-ui';
import { PageToolbarComponent, StatCardComponent } from '@mohammed_a4rf/core-ui/shared';
import { isApiError } from '@mohammed_a4rf/core-ui/utils';
import { TranslatePipe } from '@ngx-translate/core';
import { SkeletonModule } from 'primeng/skeleton';
import { finalize, forkJoin } from 'rxjs';
import { AuthService } from '../../../core/auth/services/auth.service';
import { CompanyStatus, CompanySummary } from '../../manage-companies/models/company.interface';
import { CompanyService } from '../../manage-companies/services/company.service';

interface DashboardCounts {
  total: number;
  active: number;
  suspended: number;
  expired: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, DecimalPipe, PageToolbarComponent, SkeletonModule, StatCardComponent, TranslatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  protected readonly language = inject(LanguageService);
  private readonly auth = inject(AuthService);
  private readonly companies = inject(CompanyService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly today = new Date();
  protected readonly companyStatus = CompanyStatus;
  protected readonly metrics: { key: keyof DashboardCounts; label: string; icon: string }[] = [
    { key: 'total', label: 'dashboard.totalCompanies', icon: 'pi pi-building' },
    { key: 'active', label: 'dashboard.activeCompanies', icon: 'pi pi-check-circle' },
    { key: 'suspended', label: 'dashboard.suspendedCompanies', icon: 'pi pi-pause-circle' },
    { key: 'expired', label: 'dashboard.expiredLicenses', icon: 'pi pi-calendar-times' },
  ];

  protected readonly loading = signal(false);
  protected readonly failed = signal(false);
  protected readonly counts = signal<DashboardCounts | null>(null);
  protected readonly recent = signal<CompanySummary[]>([]);
  protected readonly userName = computed(() => {
    const user = this.auth.user();
    if (!user) return '';
    return this.language.lang() === 'ar' ? user.name || user.engName : user.engName || user.name;
  });

  ngOnInit(): void {
    this.loadOverview();
  }

  protected loadOverview(): void {
    if (this.loading()) return;

    this.loading.set(true);
    this.failed.set(false);
    const page = { pageNumber: 1, pageSize: 1 };

    forkJoin({
      recent: this.companies.getCompanies({ pageNumber: 1, pageSize: 5 }),
      active: this.companies.getCompanies({ ...page, status: CompanyStatus.Active }),
      suspended: this.companies.getCompanies({ ...page, status: CompanyStatus.Suspended }),
      expired: this.companies.getCompanies({ ...page, expired: true }),
    })
      .pipe(finalize(() => this.loading.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ recent, active, suspended, expired }) => {
          if (
            [recent, active, suspended, expired].some(
              (response) => isApiError(response) || typeof response.totalItems !== 'number',
            )
          ) {
            this.failed.set(true);
            return;
          }

          this.counts.set({
            total: recent.totalItems ?? 0,
            active: active.totalItems ?? 0,
            suspended: suspended.totalItems ?? 0,
            expired: expired.totalItems ?? 0,
          });
          this.recent.set(recent.data);
        },
        error: () => this.failed.set(true),
      });
  }
}
