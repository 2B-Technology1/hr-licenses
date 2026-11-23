import { inject, Injectable } from '@angular/core';
import { ApiService } from '@mohammed_a4rf/core-ui';
import { GlobalResponse } from '@mohammed_a4rf/core-ui/utils';
import { Observable } from 'rxjs';
import { AuthUser } from '../../../core/auth/models/auth.interface';
import { ChangeRoleBody, RoleOption, UserBody, UserFilter, UserStatusBody } from '../models/user.interface';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly api = inject(ApiService);
  private readonly endPoint = 'User';

  // ==========================================================================
  // Users list and form
  // ==========================================================================

  getUsers(filter: UserFilter): Observable<GlobalResponse<AuthUser[]>> {
    return this.api.post<GlobalResponse<AuthUser[]>>(this.endPoint, filter);
  }

  getUser(id: number): Observable<GlobalResponse<AuthUser>> {
    return this.api.get<GlobalResponse<AuthUser>>(`${this.endPoint}/${id}`);
  }

  register(body: UserBody): Observable<GlobalResponse<{ id: number }>> {
    return this.api.post<GlobalResponse<{ id: number }>>(`${this.endPoint}/register`, body);
  }

  edit(body: UserBody): Observable<GlobalResponse<unknown>> {
    return this.api.post<GlobalResponse<unknown>>(`${this.endPoint}/Edit`, body);
  }

  changeRole(body: ChangeRoleBody): Observable<GlobalResponse<AuthUser>> {
    return this.api.post<GlobalResponse<AuthUser>>(`${this.endPoint}/ChangeRole`, body);
  }

  setStatus(body: UserStatusBody): Observable<GlobalResponse<unknown>> {
    return this.api.post<GlobalResponse<unknown>>(`${this.endPoint}/SetStatus`, body);
  }

  // ==========================================================================
  // Lookups
  // ==========================================================================

  getRoles(): Observable<GlobalResponse<RoleOption[]>> {
    return this.api.getEnum<RoleOption>('getRoles');
  }
}
