export type UserRole = 'MEMBER' | 'ADMIN' | 'MANAGER';

export interface UserProfile {
  id: string;
  username: string;
  role: UserRole;
  permissions?: string[];
  merchantId?: string;
} 