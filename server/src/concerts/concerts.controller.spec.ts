import { Test, TestingModule } from '@nestjs/testing';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../utils/user-role';
import { ConcertsController } from './concerts.controller';
import { ConcertsService } from './concerts.service';
import type { ConcertResponseDto } from './dto/concert-response.dto';
import type { CreateConcertDto } from './dto/create-concert.dto';

describe('ConcertsController', () => {
  let controller: ConcertsController;
  let concertsService: {
    create: jest.Mock;
    delete: jest.Mock;
    listForAdmin: jest.Mock;
    listForUser: jest.Mock;
  };

  beforeEach(async () => {
    concertsService = {
      create: jest.fn(),
      delete: jest.fn(),
      listForAdmin: jest.fn(),
      listForUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConcertsController],
      providers: [
        {
          provide: ConcertsService,
          useValue: concertsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<ConcertsController>(ConcertsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('listForUser_authenticatedUser_returnsUserConcerts', async () => {
    const expectedConcerts = [createConcertResponse({ hasReserved: true })];
    concertsService.listForUser.mockResolvedValue(expectedConcerts);

    const query = { page: 1, limit: 20 };
    const actualConcerts = await controller.listForUser(createRequest('user-id'), query);

    expect(actualConcerts).toBe(expectedConcerts);
    expect(concertsService.listForUser).toHaveBeenCalledWith('user-id', query);
  });

  it('listForAdmin_adminUser_returnsAdminConcerts', async () => {
    const expectedConcerts = [createConcertResponse()];
    concertsService.listForAdmin.mockResolvedValue(expectedConcerts);

    const query = { page: 1, limit: 20 };
    const actualConcerts = await controller.listForAdmin(query);

    expect(actualConcerts).toBe(expectedConcerts);
    expect(concertsService.listForAdmin).toHaveBeenCalledWith(query);
  });

  it('create_validDto_delegatesToServiceWithCreator', async () => {
    const dto: CreateConcertDto = {
      name: 'Live Night',
      description: 'Main hall',
      totalSeats: 100,
    };

    await expect(controller.create(dto, createRequest('admin-id'))).resolves.toBeUndefined();

    expect(concertsService.create).toHaveBeenCalledWith(dto, 'admin-id');
  });

  it('delete_existingConcert_delegatesToService', async () => {
    await expect(controller.delete('concert-id')).resolves.toBeUndefined();

    expect(concertsService.delete).toHaveBeenCalledWith('concert-id');
  });
});

function createRequest(userId: string): AuthenticatedRequest {
  return {
    user: {
      sub: userId,
      role: UserRole.User,
    },
  } as AuthenticatedRequest;
}

function createConcertResponse(overrides: Partial<ConcertResponseDto> = {}): ConcertResponseDto {
  return {
    id: 'concert-id',
    name: 'Live Night',
    description: 'Main hall',
    totalSeats: 100,
    reservedSeats: 10,
    availableSeats: 90,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}
