import type { JwtPayload } from './jwt-payload';

export type AuthenticatedRequest = {
  user: JwtPayload;
};
