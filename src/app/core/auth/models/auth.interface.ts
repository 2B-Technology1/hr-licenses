/** Keys of `Enums/getRoles`. */
export const Roles = {
  SuperAdmin: 'sup-admin',
  Admin: 'admin',
  Viewer: 'viewer',
} as const;
export type SuperAdminRole = (typeof Roles)[keyof typeof Roles];

export interface AuthUser {
  id: number;
  name: string;
  engName: string;
  email: string;
  phoneNumber: string | null;
  isActive: boolean;
  role: SuperAdminRole;
  roleName: string;
  creationTime: string;
  lastLoginTime: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginSession {
  token: string;
  expiresAt: string;
  user: AuthUser;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
