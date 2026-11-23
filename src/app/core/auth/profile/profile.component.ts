import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LanguageService } from '@mohammed_a4rf/core-ui';
import {
  FormErrorComponent,
  PageToolbarComponent,
  RequiredFieldComponent,
} from '@mohammed_a4rf/core-ui/shared';
import { isApiError } from '@mohammed_a4rf/core-ui/utils';
import { TranslatePipe } from '@ngx-translate/core';
import { InputTextModule } from 'primeng/inputtext';
import { finalize } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-profile',
  imports: [
    DatePipe,
    FormErrorComponent,
    InputTextModule,
    PageToolbarComponent,
    ReactiveFormsModule,
    RequiredFieldComponent,
    TranslatePipe,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  protected readonly language = inject(LanguageService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected form!: FormGroup;
  protected readonly submitting = signal(false);
  protected readonly passwordMismatch = signal(false);
  protected readonly validationErrors = signal<string[]>([]);

  ngOnInit(): void {
    this.initForm();
  }

  protected submit(): void {
    if (this.submitting()) return;

    this.validationErrors.set([]);
    this.passwordMismatch.set(false);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = this.form.getRawValue();
    if (newPassword !== confirmPassword) {
      this.passwordMismatch.set(true);
      return;
    }

    this.submitting.set(true);
    this.auth
      .changePassword({ currentPassword, newPassword })
      .pipe(finalize(() => this.submitting.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (isApiError(response)) {
            this.validationErrors.set(Array.isArray(response.data) ? response.data : []);
            return;
          }

          this.form.reset();
        },
        error: () => {},
      });
  }

  private initForm(): void {
    this.form = this.formBuilder.nonNullable.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)]],
      confirmPassword: ['', Validators.required],
    });
  }
}
