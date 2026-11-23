import { NotificationService } from '@mohammed_a4rf/core-ui';
import { CenterDialogContentComponent, ConfirmDialogService } from '@mohammed_a4rf/core-ui/shared';
import { warning } from '@mohammed_a4rf/core-ui/utils';
import { filter } from 'rxjs';
import { CompanySecret } from '../models/company.interface';

/**
 * Shows a company's one-time secret (after create on the form page, after regenerate on the list)
 * with a Copy button. It closes only on a button, because the secret can't be read again.
 */
export function showCompanySecret(
  confirmDialog: ConfirmDialogService,
  notification: NotificationService,
  company: CompanySecret,
): void {
  confirmDialog
    .confirm({
      component: CenterDialogContentComponent,
      width: '32rem',
      closable: false,
      dismissableMask: false,
      data: {
        icon: warning,
        title: 'companies.secret.title',
        question: 'companies.secret.warning',
        description: company.secret,
        cancelBtnLabel: 'general.close',
        confirmBtnLabel: 'companies.secret.copy',
      },
    })
    .pipe(filter((result) => result.confirmed))
    .subscribe(() => {
      navigator.clipboard.writeText(company.secret);
      notification.success('general.messages.success', 'companies.secret.copied');
    });
}
