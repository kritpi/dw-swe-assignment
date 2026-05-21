import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UserRole } from '../../utils/user-role';
import type { JwtPayload } from '../types/jwt-payload';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: { verifyAsync: jest.Mock };
  let configService: { get: jest.Mock; getOrThrow: jest.Mock };

  beforeEach(() => {
    jwtService = {
      verifyAsync: jest.fn(),
    };
    configService = {
      get: jest.fn((key: string, defaultValue?: string) => {
        if (key === 'app.authCookieName') {
          return defaultValue;
        }

        return undefined;
      }),
      getOrThrow: jest.fn(() => 'jwt-secret'),
    };

    guard = new JwtAuthGuard(
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
    );
  });

  it('rejects requests without an auth cookie', async () => {
    const request = createRequest();

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(UnauthorizedException);
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('verifies a token from parsed cookies and assigns the user payload', async () => {
    const payload = createPayload();
    const request = createRequest({ cookies: { accessToken: 'token' } });
    jwtService.verifyAsync.mockResolvedValue(payload);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('token', { secret: 'jwt-secret' });
    expect(request.user).toEqual(payload);
  });

  it('uses the configured cookie name', async () => {
    const payload = createPayload();
    const request = createRequest({ cookies: { session: 'custom-token' } });
    configService.get.mockImplementation((key: string, defaultValue?: string) => {
      if (key === 'app.authCookieName') {
        return 'session';
      }

      return defaultValue;
    });
    jwtService.verifyAsync.mockResolvedValue(payload);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('custom-token', { secret: 'jwt-secret' });
  });

  it('falls back to the raw cookie header when parsed cookies are unavailable', async () => {
    const payload = createPayload();
    const request = createRequest({ headers: { cookie: 'other=value; accessToken=header-token' } });
    jwtService.verifyAsync.mockResolvedValue(payload);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('header-token', { secret: 'jwt-secret' });
  });

  it('rejects invalid or expired tokens', async () => {
    const request = createRequest({ cookies: { accessToken: 'bad-token' } });
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid token'));

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(UnauthorizedException);
  });
});

type TestRequest = {
  cookies?: Record<string, string | undefined>;
  headers: {
    cookie?: string;
  };
  user?: JwtPayload;
};

function createRequest(overrides: Partial<TestRequest> = {}): TestRequest {
  return {
    headers: {},
    ...overrides,
  };
}

function createContext(request: TestRequest): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

function createPayload(): JwtPayload {
  return {
    sub: 'user-id',
    email: 'user@example.com',
    role: UserRole.User,
    iat: 1_766_000_000,
  };
}
