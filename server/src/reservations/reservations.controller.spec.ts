import { Test, TestingModule } from '@nestjs/testing';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../utils/user-role';
import { AdminReservationsController, ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import type { ReservationHistoryResponseDto } from './dto/reservation-history-response.dto';

describe('ReservationsController', () => {
  let controller: ReservationsController;
  let adminController: AdminReservationsController;
  let reservationsService: {
    reserveSeat: jest.Mock;
    cancelReservation: jest.Mock;
    listHistory: jest.Mock;
    listMyHistory: jest.Mock;
  };

  beforeEach(async () => {
    reservationsService = {
      reserveSeat: jest.fn(),
      cancelReservation: jest.fn(),
      listHistory: jest.fn(),
      listMyHistory: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReservationsController, AdminReservationsController],
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
    adminController = module.get<AdminReservationsController>(AdminReservationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(adminController).toBeDefined();
  });

  it('routes_areMountedOnExpectedPaths', () => {
    expect(Reflect.getMetadata('path', ReservationsController)).toBe('reservations');
    expect(Reflect.getMetadata('path', ReservationsController.prototype.reserveSeat)).toBe(
      'concerts/:concertId',
    );
    expect(Reflect.getMetadata('path', ReservationsController.prototype.cancelReservation)).toBe(
      'concerts/:concertId',
    );
    expect(Reflect.getMetadata('path', ReservationsController.prototype.listMyHistory)).toBe('me');
    expect(Reflect.getMetadata('path', AdminReservationsController)).toBe('admin/reservations');
    expect(Reflect.getMetadata('path', AdminReservationsController.prototype.listHistory)).toBe(
      'history',
    );
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

    const query = { page: 1, limit: 20 };
    const actualHistory = await adminController.listHistory(query);

    expect(actualHistory).toBe(expectedHistory);
    expect(reservationsService.listHistory).toHaveBeenCalledWith(query);
  });

  it('listMyHistory_authenticatedUser_returnsServiceResult', async () => {
    const expectedHistory = { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };
    reservationsService.listMyHistory.mockResolvedValue(expectedHistory);
    const query = { page: 1, limit: 20 };

    const actualHistory = await controller.listMyHistory(createRequest('user-id'), query);

    expect(actualHistory).toBe(expectedHistory);
    expect(reservationsService.listMyHistory).toHaveBeenCalledWith('user-id', query);
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
