import { inject, Injectable } from '@angular/core';
import { ApiService } from '@mohammed_a4rf/core-ui';
import { GlobalResponse } from '@mohammed_a4rf/core-ui/utils';
import { Observable } from 'rxjs';
import { CompanyFilter, CompanySummary } from '../models/company.interface';

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private readonly api = inject(ApiService);
  private readonly endPoint = 'Company';

  getCompanies(filter: CompanyFilter): Observable<GlobalResponse<CompanySummary[]>> {
    return this.api.post<GlobalResponse<CompanySummary[]>>(this.endPoint, filter);
  }
}
