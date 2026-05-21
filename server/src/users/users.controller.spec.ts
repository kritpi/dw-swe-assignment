import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '../utils/user-role';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import type { CreateUserDto } from './dto/create-user.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: { create: jest.Mock };

  beforeEach(async () => {
    usersService = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create_validDto_delegatesToService', async () => {
    const dto: CreateUserDto = {
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: UserRole.User,
    };

    await expect(controller.create(dto)).resolves.toBeUndefined();

    expect(usersService.create).toHaveBeenCalledWith(dto);
  });
});
