import { Test, TestingModule } from '@nestjs/testing';
import { ErrorCode } from '../common/errors/error-code';
import { DRIZZLE } from '../db/database.constants';
import { ReservationsRepository } from './reservations.repository';
import { ReservationsService } from './reservations.service';

describe('ReservationsService', () => {
  let service: ReservationsService;
  let db: { transaction: jest.Mock };
  let tx: Record<string, never>;
  let reservationsRepository: {
    findConcert: jest.Mock;
    decrementAvailableSeat: jest.Mock;
    incrementAvailableSeat: jest.Mock;
    findActiveReservationForUpdate: jest.Mock;
    insertReservation: jest.Mock;
    cancelActiveReservation: jest.Mock;
    insertReservationHistory: jest.Mock;
    listHistoryRecords: jest.Mock;
    countHistoryRecords: jest.Mock;
  };

  beforeEach(async () => {
    tx = {};
    db = {
      transaction: jest.fn((callback: (transaction: typeof tx) => Promise<void>) => callback(tx)),
    };
    reservationsRepository = {
      findConcert: jest.fn(),
      decrementAvailableSeat: jest.fn(),
      incrementAvailableSeat: jest.fn(),
      findActiveReservationForUpdate: jest.fn(),
      insertReservation: jest.fn(),
      cancelActiveReservation: jest.fn(),
      insertReservationHistory: jest.fn(),
      listHistoryRecords: jest.fn(),
      countHistoryRecords: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        {
          provide: DRIZZLE,
          useValue: db,
        },
        {
          provide: ReservationsRepository,
          useValue: reservationsRepository,
        },
      ],
    }).compile();

    service = module.get<ReservationsService>(ReservationsService);
  });

  it('reserveSeat_missingConcert_throwsConcertNotFound', async () => {
    reservationsRepository.findActiveReservationForUpdate.mockResolvedValue(null);
    reservationsRepository.decrementAvailableSeat.mockResolvedValue(false);
    reservationsRepository.findConcert.mockResolvedValue(null);

    await expect(service.reserveSeat('user-id', 'concert-id')).rejects.toMatchObject({
      code: ErrorCode.ConcertNotFound,
    });
  });

  it('reserveSeat_fullConcert_throwsConcertSoldOut', async () => {
    reservationsRepository.findActiveReservationForUpdate.mockResolvedValue(null);
    reservationsRepository.decrementAvailableSeat.mockResolvedValue(false);
    reservationsRepository.findConcert.mockResolvedValue({ id: 'concert-id', availableSeats: 0 });

    await expect(service.reserveSeat('user-id', 'concert-id')).rejects.toMatchObject({
      code: ErrorCode.ConcertSoldOut,
    });
  });

  it('reserveSeat_alreadyReserved_throwsAlreadyReserved', async () => {
    reservationsRepository.findActiveReservationForUpdate.mockResolvedValue({
      id: 'reservation-id',
      status: 'RESERVED',
    });

    await expect(service.reserveSeat('user-id', 'concert-id')).rejects.toMatchObject({
      code: ErrorCode.AlreadyReserved,
    });
    expect(reservationsRepository.decrementAvailableSeat).not.toHaveBeenCalled();
  });

  it('reserveSeat_availableConcert_decrementsSeatInsertsReservationAndCreatesHistory', async () => {
    reservationsRepository.findActiveReservationForUpdate.mockResolvedValue(null);
    reservationsRepository.decrementAvailableSeat.mockResolvedValue(true);

    await expect(service.reserveSeat('user-id', 'concert-id')).resolves.toBeUndefined();

    expect(reservationsRepository.decrementAvailableSeat).toHaveBeenCalledWith(tx, 'concert-id');
    expect(reservationsRepository.insertReservation).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        userId: 'user-id',
        concertId: 'concert-id',
      }),
    );
    expect(reservationsRepository.insertReservationHistory).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        userId: 'user-id',
        concertId: 'concert-id',
        action: 'RESERVE',
      }),
    );
  });

  it('reserveSeat_parallelRequests_onlyCapacitySucceeds', async () => {
    let availableSeats = 2;
    reservationsRepository.findActiveReservationForUpdate.mockResolvedValue(null);
    reservationsRepository.findConcert.mockResolvedValue({ id: 'concert-id', availableSeats: 0 });
    reservationsRepository.decrementAvailableSeat.mockImplementation(async () => {
      if (availableSeats <= 0) {
        return false;
      }

      availableSeats -= 1;
      return true;
    });

    const results = await Promise.allSettled(
      Array.from({ length: 8 }, (_, index) => service.reserveSeat(`user-${index}`, 'concert-id')),
    );

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(2);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(6);
    expect(reservationsRepository.insertReservation).toHaveBeenCalledTimes(2);
  });

  it('reserveSeat_activeReservationRace_rollsBackWithAlreadyReserved', async () => {
    reservationsRepository.findActiveReservationForUpdate.mockResolvedValue(null);
    reservationsRepository.decrementAvailableSeat.mockResolvedValue(true);
    reservationsRepository.insertReservation.mockRejectedValue({
      code: '23505',
      constraint: 'reservations_active_user_concert_unique',
    });

    await expect(service.reserveSeat('user-id', 'concert-id')).rejects.toMatchObject({
      code: ErrorCode.AlreadyReserved,
    });
  });

  it('cancelReservation_missingConcert_throwsConcertNotFound', async () => {
    reservationsRepository.findConcert.mockResolvedValue(null);

    await expect(service.cancelReservation('user-id', 'concert-id')).rejects.toMatchObject({
      code: ErrorCode.ConcertNotFound,
    });
  });

  it('cancelReservation_withoutActiveReservation_throwsNoActiveReservation', async () => {
    reservationsRepository.findConcert.mockResolvedValue({ id: 'concert-id', availableSeats: 1 });
    reservationsRepository.cancelActiveReservation.mockResolvedValue(null);

    await expect(service.cancelReservation('user-id', 'concert-id')).rejects.toMatchObject({
      code: ErrorCode.NoActiveReservation,
    });
  });

  it('cancelReservation_activeReservation_cancelsAndIncrementsSeatAndCreatesHistory', async () => {
    reservationsRepository.findConcert.mockResolvedValue({ id: 'concert-id', availableSeats: 1 });
    reservationsRepository.cancelActiveReservation.mockResolvedValue({
      id: 'reservation-id',
      status: 'CANCELED',
    });
    reservationsRepository.incrementAvailableSeat.mockResolvedValue(true);

    await expect(service.cancelReservation('user-id', 'concert-id')).resolves.toBeUndefined();

    expect(reservationsRepository.cancelActiveReservation).toHaveBeenCalledWith(tx, 'user-id', 'concert-id');
    expect(reservationsRepository.incrementAvailableSeat).toHaveBeenCalledWith(tx, 'concert-id');
    expect(reservationsRepository.insertReservationHistory).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        userId: 'user-id',
        concertId: 'concert-id',
        action: 'CANCEL',
      }),
    );
  });

  it('listHistory_existingHistory_returnsPaginatedRepositoryResult', async () => {
    const actionAt = new Date('2026-01-01T00:00:00.000Z');
    reservationsRepository.listHistoryRecords.mockResolvedValue([
      {
        id: 'history-id',
        action: 'CANCEL',
        actionAt,
        userId: 'user-id',
        fullName: 'Test User',
        email: 'test@example.com',
        concertId: 'concert-id',
        concertName: 'Live Night',
      },
    ]);
    reservationsRepository.countHistoryRecords.mockResolvedValue(1);

    const actualHistory = await service.listHistory({ page: 1, limit: 20 });

    expect(actualHistory).toEqual({
      data: [
        {
          id: 'history-id',
          action: 'CANCEL',
          actionAt,
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
      ],
      meta: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    });
  });
});
