import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LanguageService, NotificationService } from '@mohammed_a4rf/core-ui';
import {
  CalendarInputComponent,
  ConfirmDialogService,
  CustomMultiSelectComponent,
  FormErrorComponent,
  PageToolbarAction,
  PageToolbarComponent,
  PreventInvalidNumberKeysDirective,
  ReasonDialogComponent,
  ReasonDialogData,
  RequiredFieldComponent,
  TrimInputDirective,
} from '@mohammed_a4rf/core-ui/shared';
import {
  BadgeSeverity,
  dateRangeValidator,
  formatDate,
  isApiError,
  removeNullFilterProperties,
  strictEmailValidator,
} from '@mohammed_a4rf/core-ui/utils';
import { TranslatePipe } from '@ngx-translate/core';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { filter, map, Observable, of, switchMap } from 'rxjs';
import { AppRoutes } from '../../../../core/app-routes';
import { CompanyLicense, LicenseResumeBody, LicenseState } from '../../models/company-license.interface';
import { CompanyBody } from '../../models/company.interface';
import { HrModule } from '../../models/hr-module.interface';
import { CompanyLicenseService } from '../../services/company-license.service';
import { CompanyModuleService } from '../../services/company-module.service';
import { CompanyService } from '../../services/company.service';
import { HrModuleService } from '../../services/hr-module.service';
import { showCompanySecret } from '../show-company-secret';
import { LicenseExtendDialogComponent } from './license-extend-dialog/license-extend-dialog.component';

/** Page of `companies/add`, `companies/edit/:id` and `companies/view/:id` (read-only, for viewers). */
@Component({
  selector: 'app-company-form',
  imports: [
    CalendarInputComponent,
    CustomMultiSelectComponent,
    DatePipe,
    FormErrorComponent,
    InputTextModule,
    PageToolbarComponent,
    PreventInvalidNumberKeysDirective,
    ReactiveFormsModule,
    RequiredFieldComponent,
    TextareaModule,
    TranslatePipe,
    TrimInputDirective,
  ],
  templateUrl: './company-form.component.html',
})
export class CompanyFormComponent implements OnInit {
  protected readonly language = inject(LanguageService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly companyService = inject(CompanyService);
  private readonly companyModuleService = inject(CompanyModuleService);
  private readonly companyLicenseService = inject(CompanyLicenseService);
  private readonly hrModuleService = inject(HrModuleService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly notification = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  /** `null` on the add page. */
  protected readonly companyId = Number(this.route.snapshot.paramMap.get('id')) || null;
  protected readonly readonly = this.route.snapshot.data['readonly'] === true;

  protected readonly actions: PageToolbarAction[] = [
    { label: 'general.cancel', severity: 'white', visible: !this.readonly, callback: () => this.goToList() },
    { label: 'general.save', severity: 'primary', visible: !this.readonly, callback: () => this.save() },
  ];
  protected readonly licenseState = LicenseState;
  protected readonly licenseStateColors: Record<number, BadgeSeverity> = {
    [LicenseState.Active]: 'success',
    [LicenseState.ExpiringSoon]: 'warning',
    [LicenseState.Expired]: 'danger',
    [LicenseState.Stopped]: 'danger',
    [LicenseState.NotStarted]: 'info',
  };

  protected readonly modules = signal<HrModule[]>([]);
  protected readonly license = signal<CompanyLicense | null>(null);
  protected form!: FormGroup;

  private saving = false;
  private originalModules: number[] = [];

  ngOnInit(): void {
    this.initForm();
    this.loadModules();
    this.listenToModulesChange();
    if (this.companyId) {
      this.loadCompany();
      this.loadLicense();
    }
    if (this.readonly) this.form.disable();
  }

  protected save(): void {
    if (this.saving) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    // Blank optional fields are left out of the body instead of being sent as null or "".
    const body = removeNullFilterProperties({
      ...value,
      licenseStartDate: formatDate(value.licenseStartDate),
      licenseExpiryDate: formatDate(value.licenseExpiryDate),
    }) as CompanyBody;
    this.saving = true;
    if (this.companyId) this.updateCompany({ ...body, id: this.companyId });
    else this.createCompany(body);
  }

  protected extendLicense(): void {
    this.confirmDialog
      .confirm({ component: LicenseExtendDialogComponent, width: '30rem', data: { companyId: this.companyId } })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result.confirmed) this.loadLicense();
      });
  }

  protected stopLicense(): void {
    const companyId = this.companyId!;
    this.askReason({
      title: 'companies.license.suspendTitle',
      description: 'companies.license.suspendDescription',
      label: 'companies.license.reason',
      placeholder: 'companies.license.reasonPlaceholder',
      confirmLabel: 'companies.license.suspend',
      reasonRequired: true,
    })
      .pipe(switchMap((reason) => this.companyLicenseService.stop({ companyId, reason })))
      .subscribe({
        next: (res) => {
          if (isApiError(res)) return;
          this.loadLicense();
        },
        error: () => {},
      });
  }

  protected resumeLicense(): void {
    const companyId = this.companyId!;
    this.askReason({
      title: 'companies.license.resumeTitle',
      description: 'companies.license.resumeDescription',
      label: 'companies.license.note',
      placeholder: 'companies.license.notePlaceholder',
      confirmLabel: 'companies.license.resume',
    })
      .pipe(
        switchMap((note) =>
          this.companyLicenseService.resume(removeNullFilterProperties({ companyId, note }) as LicenseResumeBody),
        ),
      )
      .subscribe({
        next: (res) => {
          if (isApiError(res)) return;
          this.loadLicense();
        },
        error: () => {},
      });
  }

  private initForm(): void {
    const editing = !!this.companyId;
    this.form = this.formBuilder.group(
      {
        name: [null, [Validators.required, Validators.maxLength(200)]],
        engName: [null, [Validators.required, Validators.maxLength(200)]],
        code: [
          { value: null, disabled: editing },
          [Validators.required, Validators.maxLength(50), Validators.pattern(/^[A-Za-z0-9_-]+$/)],
        ],
        apiUrl: [null],
        contactName: [null],
        contactEmail: [null, strictEmailValidator()],
        contactPhone: [null],
        notes: [null],
        modules: [[]],
        licenseStartDate: [{ value: null, disabled: editing }, Validators.required],
        licenseExpiryDate: [{ value: null, disabled: editing }, Validators.required],
        maxUsers: [null, [Validators.required, Validators.min(0)]],
        graceDays: [null, [Validators.required, Validators.min(0), Validators.max(90)]],
      },
      { validators: dateRangeValidator('licenseStartDate', 'licenseExpiryDate') },
    );
  }

  private loadModules(): void {
    this.hrModuleService
      .getModules()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (isApiError(res)) return;
          this.modules.set(res.data);
        },
        error: () => {},
      });
  }

  /** Ticking a module ticks what it needs; unticking one unticks what depends on it. */
  private listenToModulesChange(): void {
    const control = this.form.get('modules')!;
    let previous: number[] = control.value;
    control.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((selected: number[]) => {
      const added = selected.filter((code) => !previous.includes(code));
      const removed = previous.filter((code) => !selected.includes(code));
      let next = [...selected];
      this.modules().forEach((module) => {
        if (added.includes(module.code)) next.push(...module.dependsOn);
        if (module.dependsOn.some((code) => removed.includes(code))) {
          next = next.filter((code) => code !== module.code);
        }
      });
      next = [...new Set(next)];
      previous = next;
      if (next.length !== selected.length || next.some((code) => !selected.includes(code))) {
        control.setValue(next, { emitEvent: false });
      }
    });
  }

  private loadCompany(): void {
    this.companyService
      .getCompany(this.companyId!)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (isApiError(res)) return;
          const company = res.data;
          this.originalModules = company.activeModules;
          this.form.patchValue({ ...company, name: company.nameAr, engName: company.nameEn, modules: company.activeModules });
        },
        error: () => {},
      });
  }

  private loadLicense(): void {
    this.companyLicenseService
      .getLicense(this.companyId!)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (isApiError(res)) return;
          this.license.set(res.data);
        },
        error: () => {},
      });
  }

  private createCompany(body: CompanyBody): void {
    this.companyService
      .register(body)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.saving = false;
          if (isApiError(res)) return;
          // The dialog is attached to the app, so it stays open after leaving this page.
          showCompanySecret(this.confirmDialog, this.notification, res.data);
          this.goToList();
        },
        error: () => (this.saving = false),
      });
  }

  /** `Company/Edit` ignores modules, so a changed checklist is saved with `CompanyModule/Edit`. */
  private updateCompany(body: CompanyBody): void {
    const modulesChanged =
      body.modules.length !== this.originalModules.length ||
      body.modules.some((code) => !this.originalModules.includes(code));

    this.companyService
      .edit(body)
      .pipe(
        switchMap((res) =>
          isApiError(res) || !modulesChanged
            ? of(res)
            : this.companyModuleService.editModules({ companyId: body.id!, modules: body.modules }),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (res) => {
          this.saving = false;
          if (isApiError(res)) return;
          this.goToList();
        },
        error: () => (this.saving = false),
      });
  }

  private askReason(data: ReasonDialogData): Observable<string> {
    return this.confirmDialog.confirm<string>({ component: ReasonDialogComponent, width: '30rem', data }).pipe(
      filter((result) => result.confirmed),
      map((result) => result.data ?? ''),
      takeUntilDestroyed(this.destroyRef),
    );
  }

  private goToList(): void {
    void this.router.navigate(['/', AppRoutes.Companies]);
  }
}
