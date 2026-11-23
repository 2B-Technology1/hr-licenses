export type SuperAdminRole = 'sup-admin' | 'admin' | 'viewer';

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
