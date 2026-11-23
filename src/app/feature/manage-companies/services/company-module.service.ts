import { inject, Injectable } from '@angular/core';
import { ApiService } from '@mohammed_a4rf/core-ui';
import { GlobalResponse } from '@mohammed_a4rf/core-ui/utils';
import { Observable } from 'rxjs';
import { CompanyModulesBody } from '../models/company-module.interface';

@Injectable({ providedIn: 'root' })
export class CompanyModuleService {
  private readonly api = inject(ApiService);
  private readonly endPoint = 'CompanyModule';

  // ==========================================================================
  // A company's modules
  // ==========================================================================

  editModules(body: CompanyModulesBody): Observable<GlobalResponse<unknown>> {
    return this.api.post<GlobalResponse<unknown>>(`${this.endPoint}/Edit`, body);
  }
}
