import { Component, computed, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { LanguageService } from '@mohammed_a4rf/core-ui';
import { AppLayoutComponent, SidebarGroupLink } from '@mohammed_a4rf/core-ui/layout';
import { chartPolarIcon, editUser, paperPlus, user } from '@mohammed_a4rf/core-ui/utils';
import { AppRoutes } from '../app-routes';
import { Roles } from '../auth/models/auth.interface';
import { AuthService } from '../auth/services/auth.service';

@Component({
  selector: 'app-shell',
  imports: [AppLayoutComponent],
  templateUrl: './shell.component.html',
})
export class ShellComponent {
  protected readonly auth = inject(AuthService);
  private readonly language = inject(LanguageService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly router = inject(Router);

  protected readonly menuGroups: SidebarGroupLink[] = [
    {
      type: 'main',
      labelType: 'navigation.main',
      expanded: true,
      items: [
        {
          label: 'navigation.dashboard',
          routerLink: ['/', AppRoutes.Dashboard],
          svg: this.sanitizer.bypassSecurityTrustHtml(chartPolarIcon),
        },
        {
          label: 'navigation.companies',
          routerLink: ['/', AppRoutes.Companies],
          svg: this.sanitizer.bypassSecurityTrustHtml(paperPlus),
        },
        {
          label: 'navigation.users',
          routerLink: ['/', AppRoutes.Users],
          svg: this.sanitizer.bypassSecurityTrustHtml(editUser),
          visible: this.auth.user()?.role === Roles.SuperAdmin,
        },
        {
          label: 'auth.profile.title',
          routerLink: ['/', AppRoutes.Profile],
          svg: this.sanitizer.bypassSecurityTrustHtml(user),
        },
      ],
    },
  ];

  protected readonly userName = computed(() => {
    const userDetails = this.auth.user();
    if (!userDetails) return '';

    return this.language.lang() === 'ar'
      ? userDetails.name || userDetails.engName
      : userDetails.engName || userDetails.name;
  });

  protected openProfile(): void {
    void this.router.navigate(['/', AppRoutes.Profile]);
  }
}
