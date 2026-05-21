import type { User } from '../../db/schema';

export type JwtPayload = {
  sub: string;
  email: string;
  role: User['role'];
  iat: number;
};
