import { PaginationObj } from '@mohammed_a4rf/core-ui/utils';
import { SuperAdminRole } from '../../../core/auth/models/auth.interface';

// ==========================================================================
// Users list and form (rows use `AuthUser`, the same shape as the logged-in user)
// ==========================================================================

export interface UserFilter extends PaginationObj {
  filterValue?: string;
  role?: SuperAdminRole;
}

/** Body of `User/register` and `User/Edit` (`id` on edit; `role` is ignored on edit). Blank fields are left out; no `password` on edit keeps the current one. */
export interface UserBody {
  id?: number;
  name: string;
  engName: string;
  userName: string;
  email: string;
  phoneNumber?: string;
  password?: string;
  role: SuperAdminRole;
  isActive: boolean;
}

export interface ChangeRoleBody {
  userId: number;
  role: SuperAdminRole;
}

export interface UserStatusBody {
  userId: number;
  isActive: boolean;
}

// ==========================================================================
// Lookups
// ==========================================================================

/** An option of `Enums/getRoles`: the key is the role, not a number. */
export interface RoleOption {
  key: SuperAdminRole;
  name: string;
}
