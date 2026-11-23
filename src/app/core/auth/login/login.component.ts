import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CORE_UI_CONFIG, LanguageService } from '@mohammed_a4rf/core-ui';
import { FormErrorComponent, RequiredFieldComponent } from '@mohammed_a4rf/core-ui/shared';
import { isApiError } from '@mohammed_a4rf/core-ui/utils';
import { TranslatePipe } from '@ngx-translate/core';
import { InputTextModule } from 'primeng/inputtext';
import { finalize } from 'rxjs';
import { LoginRequest } from '../models/auth.interface';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [
    FormErrorComponent,
    InputTextModule,
    ReactiveFormsModule,
    RequiredFieldComponent,
    TranslatePipe,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly config = inject(CORE_UI_CONFIG);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly language = inject(LanguageService);

  protected form!: FormGroup;
  protected readonly submitting = signal(false);
  protected readonly showPassword = signal(false);
  protected readonly loginError = signal('');
  protected readonly connectionFailed = signal(false);

  ngOnInit(): void {
    this.auth.clearSession();
    this.initForm();
  }

  protected switchLanguage(): void {
    this.loginError.set('');
    this.connectionFailed.set(false);
    this.language.setLang(this.language.lang() === 'ar' ? 'en' : 'ar');
  }

  protected submit(): void {
    if (this.submitting()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const values: LoginRequest = this.form.getRawValue();
    const email = values.email.trim();
    if (!email) {
      this.form.get('email')?.setErrors({ required: true });
      this.form.get('email')?.markAsTouched();
      return;
    }

    this.loginError.set('');
    this.connectionFailed.set(false);
    this.submitting.set(true);
    const responseLanguage = this.language.lang();

    this.auth
      .login({ email, password: values.password })
      .pipe(finalize(() => this.submitting.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (isApiError(response) || !this.auth.user()) {
            const message = responseLanguage === this.language.lang() ? response.message : '';
            this.loginError.set(message || '');
            this.connectionFailed.set(!message);
            return;
          }

          void this.router.navigateByUrl(this.config.homeRoute, { replaceUrl: true });
        },
        error: () => this.connectionFailed.set(true),
      });
  }
  private initForm(): void {
    this.form = this.formBuilder.nonNullable.group({
      email: ['', Validators.required],
      password: ['', Validators.required],
    });
  }
}
