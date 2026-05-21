import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { hash } from 'bcryptjs';
import { UserRole } from '../utils/user-role';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';
import type { CreateUserDto } from './dto/create-user.dto';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: { create: jest.Mock };
  const hashMock = hash as unknown as jest.Mock;

  beforeEach(async () => {
    usersRepository = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: usersRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create_validDto_hashesPasswordAndCreatesUser', async () => {
    const dto = createUserDto();
    hashMock.mockResolvedValue('hashed-password');

    await expect(service.create(dto)).resolves.toBeUndefined();

    expect(hashMock).toHaveBeenCalledWith('password123', expect.anything());
    expect(usersRepository.create).toHaveBeenCalledWith({
      id: expect.any(String),
      fullName: dto.fullName,
      email: dto.email,
      password: 'hashed-password',
      role: dto.role,
    });
  });

  it('create_duplicateEmail_throwsConflictException', async () => {
    hashMock.mockResolvedValue('hashed-password');
    usersRepository.create.mockRejectedValue({ code: '23505' });

    await expect(service.create(createUserDto())).rejects.toThrow(ConflictException);
  });

  it('create_repositoryFailsWithUnknownError_rethrowsError', async () => {
    const expectedError = new Error('database unavailable');
    hashMock.mockResolvedValue('hashed-password');
    usersRepository.create.mockRejectedValue(expectedError);

    await expect(service.create(createUserDto())).rejects.toThrow(expectedError);
  });
});

function createUserDto(overrides: Partial<CreateUserDto> = {}): CreateUserDto {
  return {
    fullName: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: UserRole.User,
    ...overrides,
  };
}
