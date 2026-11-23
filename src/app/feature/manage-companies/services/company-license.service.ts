import { inject, Injectable } from '@angular/core';
import { ApiService } from '@mohammed_a4rf/core-ui';
import { GlobalResponse } from '@mohammed_a4rf/core-ui/utils';
import { Observable } from 'rxjs';
import {
  CompanyLicense,
  LicenseExtendBody,
  LicenseResumeBody,
  LicenseStopBody,
} from '../models/company-license.interface';

@Injectable({ providedIn: 'root' })
export class CompanyLicenseService {
  private readonly api = inject(ApiService);
  private readonly endPoint = 'CompanyLicense';

  // ==========================================================================
  // A company's license
  // ==========================================================================

  getLicense(companyId: number): Observable<GlobalResponse<CompanyLicense>> {
    return this.api.get<GlobalResponse<CompanyLicense>>(`${this.endPoint}/${companyId}`);
  }

  extend(body: LicenseExtendBody): Observable<GlobalResponse<unknown>> {
    return this.api.post<GlobalResponse<unknown>>(`${this.endPoint}/Extend`, body);
  }

  stop(body: LicenseStopBody): Observable<GlobalResponse<unknown>> {
    return this.api.post<GlobalResponse<unknown>>(`${this.endPoint}/Stop`, body);
  }

  resume(body: LicenseResumeBody): Observable<GlobalResponse<unknown>> {
    return this.api.post<GlobalResponse<unknown>>(`${this.endPoint}/Resume`, body);
  }
}
