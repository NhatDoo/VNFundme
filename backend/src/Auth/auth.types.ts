import { UserRole } from '../generated/prisma/enums.js';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  tokenType: 'access' | 'refresh';
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}
