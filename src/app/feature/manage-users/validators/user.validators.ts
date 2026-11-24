import { ValidatorFn } from '@angular/forms';
import { phoneValidator } from '@mohammed_a4rf/core-ui/utils';

/**
 * The user's phone is optional in the API: empty is valid, otherwise it must be an Egyptian or Saudi
 * mobile number (`{ invalidPhone }`). The shared `phoneValidator` also reports empty as `required`.
 */
export function optionalPhoneValidator(): ValidatorFn {
  const phone = phoneValidator();
  return (control) => (control.value ? phone(control) : null);
}
