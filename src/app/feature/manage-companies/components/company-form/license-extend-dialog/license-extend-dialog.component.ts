import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CONFIRM_DIALOG_DATA,
  CONFIRM_DIALOG_REF,
  ConfirmDialogRef,
  FormErrorComponent,
  PreventInvalidNumberKeysDirective,
  TrimInputDirective,
} from '@mohammed_a4rf/core-ui/shared';
import { atLeastOneControlTruthyValidator, isApiError, removeNullFilterProperties } from '@mohammed_a4rf/core-ui/utils';
import { TranslatePipe } from '@ngx-translate/core';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { LicenseExtendBody } from '../../../models/company-license.interface';
import { CompanyLicenseService } from '../../../services/company-license.service';

/** Extends a company's license by months and/or days; opened through `ConfirmDialogService`. */
@Component({
  selector: 'app-license-extend-dialog',
  imports: [
    FormErrorComponent,
    InputTextModule,
    PreventInvalidNumberKeysDirective,
    ReactiveFormsModule,
    TextareaModule,
    TranslatePipe,
    TrimInputDirective,
  ],
  templateUrl: './license-extend-dialog.component.html',
})
export class LicenseExtendDialogComponent implements OnInit {
  private readonly data = inject<{ companyId: number }>(CONFIRM_DIALOG_DATA);
  private readonly dialogRef = inject<ConfirmDialogRef>(CONFIRM_DIALOG_REF);
  private readonly formBuilder = inject(FormBuilder);
  private readonly companyLicenseService = inject(CompanyLicenseService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly saving = signal(false);
  protected form!: FormGroup;

  ngOnInit(): void {
    this.initForm();
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { months, days, note } = this.form.getRawValue();
    // A blank months/days/note is left out of the body (the API then treats it as 0 / no note).
    const body = removeNullFilterProperties({ companyId: this.data.companyId, months, days, note }) as LicenseExtendBody;
    this.saving.set(true);
    this.companyLicenseService
      .extend(body)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.saving.set(false);
          if (isApiError(res)) return;
          this.dialogRef.confirm();
        },
        error: () => this.saving.set(false),
      });
  }

  protected cancel(): void {
    this.dialogRef.cancel();
  }

  private initForm(): void {
    this.form = this.formBuilder.group(
      {
        months: [null, [Validators.min(0), Validators.max(120)]],
        days: [null, [Validators.min(0), Validators.max(3650)]],
        note: [null, Validators.maxLength(500)],
      },
      { validators: atLeastOneControlTruthyValidator(['months', 'days'], 'periodRequired') },
    );
  }
}
