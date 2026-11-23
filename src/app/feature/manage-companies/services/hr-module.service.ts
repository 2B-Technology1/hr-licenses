import { inject, Injectable } from '@angular/core';
import { ApiService } from '@mohammed_a4rf/core-ui';
import { GlobalResponse } from '@mohammed_a4rf/core-ui/utils';
import { Observable } from 'rxjs';
import { HrModule } from '../models/hr-module.interface';

@Injectable({ providedIn: 'root' })
export class HrModuleService {
  private readonly api = inject(ApiService);
  private readonly endPoint = 'HrModule';

  // ==========================================================================
  // Module catalogue
  // ==========================================================================

  getModules(): Observable<GlobalResponse<HrModule[]>> {
    return this.api.get<GlobalResponse<HrModule[]>>(this.endPoint);
  }
}
