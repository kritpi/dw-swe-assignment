import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { compare } from 'bcryptjs';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { UserRole } from '../utils/user-role';
import type { User } from '../db/schema';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let authRepository: { findByEmail: jest.Mock };
  let jwtService: { sign: jest.Mock };
  const compareMock = compare as unknown as jest.Mock;

  beforeEach(async () => {
    authRepository = {
      findByEmail: jest.fn(),
    };
    jwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: AuthRepository,
          useValue: authRepository,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('signs a token for valid user credentials on the user login page', async () => {
    const user = createUser({ role: UserRole.User });
    authRepository.findByEmail.mockResolvedValue(user);
    compareMock.mockResolvedValue(true);
    jwtService.sign.mockReturnValue('user-token');

    await expect(
      service.login({
        email: ' User@Example.com ',
        password: 'password123',
        role: UserRole.User,
      }),
    ).resolves.toEqual({ accessToken: 'user-token' });
    expect(authRepository.findByEmail).toHaveBeenCalledWith('user@example.com');
    expect(jwtService.sign).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: user.id,
        email: user.email,
        role: UserRole.User,
      }),
    );
  });

  it('signs a token for valid admin credentials on the admin login page', async () => {
    const admin = createUser({ role: UserRole.Admin });
    authRepository.findByEmail.mockResolvedValue(admin);
    compareMock.mockResolvedValue(true);
    jwtService.sign.mockReturnValue('admin-token');

    await expect(
      service.login({
        email: admin.email,
        password: 'password123',
        role: UserRole.Admin,
      }),
    ).resolves.toEqual({ accessToken: 'admin-token' });
    expect(jwtService.sign).toHaveBeenCalledWith(expect.objectContaining({ role: UserRole.Admin }));
  });

  it('rejects valid credentials when the requested login role does not match the account role', async () => {
    authRepository.findByEmail.mockResolvedValue(createUser({ role: UserRole.User }));
    compareMock.mockResolvedValue(true);

    await expect(
      service.login({
        email: 'user@example.com',
        password: 'password123',
        role: UserRole.Admin,
      }),
    ).rejects.toThrow(UnauthorizedException);
    expect(jwtService.sign).not.toHaveBeenCalled();
  });

  it('rejects invalid passwords', async () => {
    authRepository.findByEmail.mockResolvedValue(createUser({ role: UserRole.User }));
    compareMock.mockResolvedValue(false);

    await expect(
      service.login({
        email: 'user@example.com',
        password: 'wrong-password',
        role: UserRole.User,
      }),
    ).rejects.toThrow(UnauthorizedException);
    expect(jwtService.sign).not.toHaveBeenCalled();
  });
});

function createUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-id',
    fullName: 'Test User',
    email: 'user@example.com',
    password: 'hashed-password',
    role: UserRole.User,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}
