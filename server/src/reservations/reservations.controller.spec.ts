import { Test, TestingModule } from '@nestjs/testing';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../utils/user-role';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import type { ReservationHistoryResponseDto } from './dto/reservation-history-response.dto';

describe('ReservationsController', () => {
  let controller: ReservationsController;
  let reservationsService: {
    reserveSeat: jest.Mock;
    cancelReservation: jest.Mock;
    listHistory: jest.Mock;
  };

  beforeEach(async () => {
    reservationsService = {
      reserveSeat: jest.fn(),
      cancelReservation: jest.fn(),
      listHistory: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReservationsController],
      providers: [
        {
          provide: ReservationsService,
          useValue: reservationsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<ReservationsController>(ReservationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('reserveSeat_authenticatedUser_delegatesToService', async () => {
    await expect(controller.reserveSeat('concert-id', createRequest('user-id'))).resolves.toBeUndefined();

    expect(reservationsService.reserveSeat).toHaveBeenCalledWith('user-id', 'concert-id');
  });

  it('cancelReservation_authenticatedUser_delegatesToService', async () => {
    await expect(controller.cancelReservation('concert-id', createRequest('user-id'))).resolves.toBeUndefined();

    expect(reservationsService.cancelReservation).toHaveBeenCalledWith('user-id', 'concert-id');
  });

  it('listHistory_existingHistory_returnsServiceResult', async () => {
    const expectedHistory: ReservationHistoryResponseDto[] = [
      {
        id: 'history-id',
        action: 'RESERVE',
        actionAt: new Date('2026-01-01T00:00:00.000Z'),
        user: {
          id: 'user-id',
          fullName: 'Test User',
          email: 'test@example.com',
        },
        concert: {
          id: 'concert-id',
          name: 'Live Night',
        },
      },
    ];
    reservationsService.listHistory.mockResolvedValue(expectedHistory);

    const actualHistory = await controller.listHistory();

    expect(actualHistory).toBe(expectedHistory);
    expect(reservationsService.listHistory).toHaveBeenCalledWith();
  });
});

function createRequest(userId: string): AuthenticatedRequest {
  return {
    user: {
      sub: userId,
      email: `${userId}@example.com`,
      role: UserRole.User,
      iat: 1_766_000_000,
    },
  } as AuthenticatedRequest;
}
