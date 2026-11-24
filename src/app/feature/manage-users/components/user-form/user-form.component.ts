import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CustomDropdownComponent,
  FormErrorComponent,
  PageToolbarAction,
  PageToolbarComponent,
  RequiredFieldComponent,
  TrimInputDirective,
} from '@mohammed_a4rf/core-ui/shared';
import { isApiError, removeNullFilterProperties, strictEmailValidator } from '@mohammed_a4rf/core-ui/utils';
import { TranslatePipe } from '@ngx-translate/core';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { of, switchMap } from 'rxjs';
import { AppRoutes } from '../../../../core/app-routes';
import { SuperAdminRole } from '../../../../core/auth/models/auth.interface';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { RoleOption, UserBody } from '../../models/user.interface';
import { UserService } from '../../services/user.service';
import { optionalPhoneValidator } from '../../validators/user.validators';

/** Page of `users/add` and `users/edit/:id`. */
@Component({
  selector: 'app-user-form',
  imports: [
    CustomDropdownComponent,
    FormErrorComponent,
    InputTextModule,
    PageToolbarComponent,
    ReactiveFormsModule,
    RequiredFieldComponent,
    ToggleSwitchModule,
    TranslatePipe,
    TrimInputDirective,
  ],
  templateUrl: './user-form.component.html',
})
export class UserFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  /** `null` on the add page. */
  protected readonly userId = Number(this.route.snapshot.paramMap.get('id')) || null;

  protected readonly actions: PageToolbarAction[] = [
    { label: 'general.cancel', severity: 'white', callback: () => this.goToList() },
    { label: 'general.save', severity: 'primary', callback: () => this.save() },
  ];
  /** 8+ characters with an upper-case letter, a lower-case letter and a digit. */
  private readonly passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

  protected readonly roles = signal<RoleOption[]>([]);
  protected form!: FormGroup;

  private saving = false;
  private originalRole: SuperAdminRole | null = null;

  ngOnInit(): void {
    this.initForm();
    this.loadRoles();
    if (this.userId) this.loadUser();
  }

  protected save(): void {
    if (this.saving) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Blank fields are left out of the body; on edit, no password means "keep the current one".
    const body = removeNullFilterProperties(this.form.getRawValue()) as UserBody;
    this.saving = true;
    if (this.userId) this.updateUser({ ...body, id: this.userId });
    else this.createUser(body);
  }

  private initForm(): void {
    const editing = !!this.userId;
    // The API refuses changing your own role or deactivating your own user.
    const ownUser = editing && this.userId === this.auth.user()?.id;
    this.form = this.formBuilder.group({
      name: [null, [Validators.required, Validators.maxLength(200)]],
      engName: [null, [Validators.required, Validators.maxLength(200)]],
      email: [null, [Validators.required, strictEmailValidator()]],
      phoneNumber: [null, optionalPhoneValidator()],
      password: [
        null,
        editing ? Validators.pattern(this.passwordPattern) : [Validators.required, Validators.pattern(this.passwordPattern)],
      ],
      role: [{ value: null, disabled: ownUser }, Validators.required],
      isActive: [{ value: true, disabled: ownUser }],
    });
  }

  private loadRoles(): void {
    this.userService
      .getRoles()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (isApiError(res)) return;
          this.roles.set(res.data);
        },
        error: () => {},
      });
  }

  private loadUser(): void {
    this.userService
      .getUser(this.userId!)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (isApiError(res)) return;
          this.originalRole = res.data.role;
          this.form.patchValue(res.data);
        },
        error: () => {},
      });
  }

  private createUser(body: UserBody): void {
    this.userService
      .register(body)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.saving = false;
          if (isApiError(res)) return;
          this.goToList();
        },
        error: () => (this.saving = false),
      });
  }

  /** `User/Edit` ignores the role, so a changed role is saved with `User/ChangeRole`. */
  private updateUser(body: UserBody): void {
    this.userService
      .edit(body)
      .pipe(
        switchMap((res) =>
          isApiError(res) || body.role === this.originalRole
            ? of(res)
            : this.userService.changeRole({ userId: body.id!, role: body.role }),
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

  private goToList(): void {
    void this.router.navigate(['/', AppRoutes.Users]);
  }
}
