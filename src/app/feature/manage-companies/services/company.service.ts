import { inject, Injectable } from '@angular/core';
import { ApiService } from '@mohammed_a4rf/core-ui';
import { DropdownOrEnum, GlobalResponse } from '@mohammed_a4rf/core-ui/utils';
import { Observable } from 'rxjs';
import { Company, CompanyBody, CompanyFilter, CompanySecret } from '../models/company.interface';

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private readonly api = inject(ApiService);
  private readonly endPoint = 'Company';

  // ==========================================================================
  // Companies list and form
  // ==========================================================================

  getCompanies(filter: CompanyFilter): Observable<GlobalResponse<Company[]>> {
    return this.api.post<GlobalResponse<Company[]>>(this.endPoint, filter);
  }

  getCompany(id: number): Observable<GlobalResponse<Company>> {
    return this.api.get<GlobalResponse<Company>>(`${this.endPoint}/${id}`);
  }

  register(body: CompanyBody): Observable<GlobalResponse<CompanySecret>> {
    return this.api.post<GlobalResponse<CompanySecret>>(`${this.endPoint}/register`, body);
  }

  edit(body: CompanyBody): Observable<GlobalResponse<unknown>> {
    return this.api.post<GlobalResponse<unknown>>(`${this.endPoint}/Edit`, body);
  }

  deleteCompany(id: number): Observable<GlobalResponse<unknown>> {
    return this.api.delete<GlobalResponse<unknown>>(`${this.endPoint}/DeleteSoftById/${id}`);
  }

  /** The old secret stops working at once; the new one is returned only here. */
  regenerateSecret(id: number): Observable<GlobalResponse<CompanySecret>> {
    return this.api.post<GlobalResponse<CompanySecret>>(`${this.endPoint}/RegenerateSecret/${id}`, {});
  }

  /** Asks the company's HR system to fetch its license now (needs its `apiUrl`). */
  syncNow(id: number): Observable<GlobalResponse<unknown>> {
    return this.api.post<GlobalResponse<unknown>>(`${this.endPoint}/SyncNow/${id}`, {});
  }

  // ==========================================================================
  // Lookups
  // ==========================================================================

  getStatuses(): Observable<GlobalResponse<DropdownOrEnum[]>> {
    return this.api.getEnum('getCompanyStatus');
  }
}
