import type { User } from '../../db/schema';

export type JwtPayload = {
  sub: string;
  role: User['role'];
};
