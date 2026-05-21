import { SetMetadata } from '@nestjs/common';
import type { JwtPayload } from '../types/jwt-payload';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: JwtPayload['role'][]) => SetMetadata(ROLES_KEY, roles);
