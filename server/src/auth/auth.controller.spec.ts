import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../utils/user-role';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: { login: jest.Mock };
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    authService = {
      login: jest.fn(),
    };
    configService = {
      get: jest.fn((key: string, defaultValue?: string) => defaultValue ?? key),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('login_validCredentials_setsAuthCookieAndReturnsToken', async () => {
    authService.login.mockResolvedValue({ accessToken: 'token' });
    configService.get.mockImplementation((key: string, defaultValue?: string) => {
      if (key === 'app.nodeEnv') {
        return 'test';
      }

      return defaultValue;
    });
    const response = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };

    const actualResponse = await controller.login(
      {
        email: 'user@example.com',
        password: 'password123',
        role: UserRole.User,
      },
      response,
    );

    expect(actualResponse).toEqual({ accessToken: 'token' });
    expect(response.cookie).toHaveBeenCalledWith('accessToken', 'token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
    });
  });

  it('logout_existingSession_clearsAuthCookie', () => {
    configService.get.mockImplementation((key: string, defaultValue?: string) => {
      if (key === 'app.nodeEnv') {
        return 'production';
      }

      return defaultValue;
    });
    const response = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };

    controller.logout(response);

    expect(response.clearCookie).toHaveBeenCalledWith('accessToken', {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
    });
  });

  it('me_authenticatedRequest_returnsJwtPayload', () => {
    const expectedUser = {
      sub: 'user-id',
      role: UserRole.User,
    };

    const actualUser = controller.me({ user: expectedUser });

    expect(actualUser).toBe(expectedUser);
  });
});
