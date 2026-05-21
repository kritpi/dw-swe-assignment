import { Test, TestingModule } from '@nestjs/testing';
import { ReservationsRepository } from './reservations.repository';
import { ReservationsService } from './reservations.service';
import type { ReservationHistoryResponseDto } from './dto/reservation-history-response.dto';

describe('ReservationsService', () => {
  let service: ReservationsService;
  let reservationsRepository: {
    reserveSeat: jest.Mock;
    cancelReservation: jest.Mock;
    listHistory: jest.Mock;
  };

  beforeEach(async () => {
    reservationsRepository = {
      reserveSeat: jest.fn(),
      cancelReservation: jest.fn(),
      listHistory: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        {
          provide: ReservationsRepository,
          useValue: reservationsRepository,
        },
      ],
    }).compile();

    service = module.get<ReservationsService>(ReservationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('reserveSeat_validRequest_delegatesToRepository', async () => {
    await expect(service.reserveSeat('user-id', 'concert-id')).resolves.toBeUndefined();

    expect(reservationsRepository.reserveSeat).toHaveBeenCalledWith('user-id', 'concert-id');
  });

  it('cancelReservation_validRequest_delegatesToRepository', async () => {
    await expect(service.cancelReservation('user-id', 'concert-id')).resolves.toBeUndefined();

    expect(reservationsRepository.cancelReservation).toHaveBeenCalledWith('user-id', 'concert-id');
  });

  it('listHistory_existingHistory_returnsRepositoryResult', async () => {
    const expectedHistory: ReservationHistoryResponseDto[] = [
      {
        id: 'history-id',
        action: 'CANCEL',
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
    reservationsRepository.listHistory.mockResolvedValue(expectedHistory);

    const actualHistory = await service.listHistory();

    expect(actualHistory).toBe(expectedHistory);
  });
});
