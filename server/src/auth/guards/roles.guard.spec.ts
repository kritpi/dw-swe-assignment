import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../../utils/user-role';
import type { JwtPayload } from '../types/jwt-payload';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: { getAllAndOverride: jest.Mock };

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('allows requests when no role metadata is declared', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(createContext(createRequest(UserRole.User)))).toBe(true);
  });

  it('allows requests when the authenticated user has a required role', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.Admin]);

    expect(guard.canActivate(createContext(createRequest(UserRole.Admin)))).toBe(true);
  });

  it('rejects requests when the authenticated user does not have a required role', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.Admin]);

    expect(() => guard.canActivate(createContext(createRequest(UserRole.User)))).toThrow(ForbiddenException);
  });
});

type TestRequest = {
  user: JwtPayload;
};

function createRequest(role: UserRole): TestRequest {
  return {
    user: {
      sub: 'user-id',
      email: 'user@example.com',
      role,
      iat: 1_766_000_000,
    },
  };
}

function createContext(request: TestRequest): ExecutionContext {
  return {
    getHandler: () => rolesGuardHandler,
    getClass: () => RolesGuardTestController,
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

function rolesGuardHandler() {
  return undefined;
}

class RolesGuardTestController {}
