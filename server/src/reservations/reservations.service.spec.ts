import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DRIZZLE } from '../db/database.constants';
import { ReservationsRepository } from './reservations.repository';
import { ReservationsService } from './reservations.service';
import type { ReservationHistoryResponseDto } from './dto/reservation-history-response.dto';

describe('ReservationsService', () => {
  let service: ReservationsService;
  let db: { transaction: jest.Mock };
  let tx: Record<string, never>;
  let reservationsRepository: {
    findConcertForUpdate: jest.Mock;
    countReservedSeats: jest.Mock;
    findReservationForUpdate: jest.Mock;
    insertReservation: jest.Mock;
    updateReservationStatus: jest.Mock;
    insertReservationHistory: jest.Mock;
    listHistoryRecords: jest.Mock;
  };

  beforeEach(async () => {
    tx = {};
    db = {
      transaction: jest.fn((callback: (transaction: typeof tx) => Promise<void>) => callback(tx)),
    };
    reservationsRepository = {
      findConcertForUpdate: jest.fn(),
      countReservedSeats: jest.fn(),
      findReservationForUpdate: jest.fn(),
      insertReservation: jest.fn(),
      updateReservationStatus: jest.fn(),
      insertReservationHistory: jest.fn(),
      listHistoryRecords: jest.fn(),
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('reserveSeat_missingConcert_throwsNotFoundException', async () => {
    reservationsRepository.findConcertForUpdate.mockResolvedValue(null);

    await expect(service.reserveSeat('user-id', 'concert-id')).rejects.toThrow(NotFoundException);
  });

  it('reserveSeat_fullConcert_throwsConflictException', async () => {
    reservationsRepository.findConcertForUpdate.mockResolvedValue({ id: 'concert-id', totalSeat: 2 });
    reservationsRepository.countReservedSeats.mockResolvedValue(2);

    await expect(service.reserveSeat('user-id', 'concert-id')).rejects.toThrow(ConflictException);
  });

  it('reserveSeat_alreadyReserved_throwsConflictException', async () => {
    reservationsRepository.findConcertForUpdate.mockResolvedValue({ id: 'concert-id', totalSeat: 2 });
    reservationsRepository.countReservedSeats.mockResolvedValue(1);
    reservationsRepository.findReservationForUpdate.mockResolvedValue({
      id: 'reservation-id',
      status: 'RESERVED',
    });

    await expect(service.reserveSeat('user-id', 'concert-id')).rejects.toThrow(ConflictException);
  });

  it('reserveSeat_canceledReservation_updatesReservationAndCreatesHistory', async () => {
    reservationsRepository.findConcertForUpdate.mockResolvedValue({ id: 'concert-id', totalSeat: 2 });
    reservationsRepository.countReservedSeats.mockResolvedValue(1);
    reservationsRepository.findReservationForUpdate.mockResolvedValue({
      id: 'reservation-id',
      status: 'CANCELED',
    });

    await expect(service.reserveSeat('user-id', 'concert-id')).resolves.toBeUndefined();

    expect(reservationsRepository.updateReservationStatus).toHaveBeenCalledWith(
      tx,
      'reservation-id',
      'RESERVED',
    );
    expect(reservationsRepository.insertReservation).not.toHaveBeenCalled();
    expect(reservationsRepository.insertReservationHistory).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        userId: 'user-id',
        concertId: 'concert-id',
        action: 'RESERVE',
      }),
    );
  });

  it('reserveSeat_newReservation_insertsReservationAndCreatesHistory', async () => {
    reservationsRepository.findConcertForUpdate.mockResolvedValue({ id: 'concert-id', totalSeat: 2 });
    reservationsRepository.countReservedSeats.mockResolvedValue(1);
    reservationsRepository.findReservationForUpdate.mockResolvedValue(null);

    await expect(service.reserveSeat('user-id', 'concert-id')).resolves.toBeUndefined();

    expect(reservationsRepository.insertReservation).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        userId: 'user-id',
        concertId: 'concert-id',
        status: 'RESERVED',
      }),
    );
    expect(reservationsRepository.updateReservationStatus).not.toHaveBeenCalled();
    expect(reservationsRepository.insertReservationHistory).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        userId: 'user-id',
        concertId: 'concert-id',
        action: 'RESERVE',
      }),
    );
  });

  it('cancelReservation_missingConcert_throwsNotFoundException', async () => {
    reservationsRepository.findConcertForUpdate.mockResolvedValue(null);

    await expect(service.cancelReservation('user-id', 'concert-id')).rejects.toThrow(NotFoundException);
  });

  it('cancelReservation_withoutActiveReservation_throwsConflictException', async () => {
    reservationsRepository.findConcertForUpdate.mockResolvedValue({ id: 'concert-id', totalSeat: 2 });
    reservationsRepository.findReservationForUpdate.mockResolvedValue({
      id: 'reservation-id',
      status: 'CANCELED',
    });

    await expect(service.cancelReservation('user-id', 'concert-id')).rejects.toThrow(ConflictException);
  });

  it('cancelReservation_activeReservation_updatesReservationAndCreatesHistory', async () => {
    reservationsRepository.findConcertForUpdate.mockResolvedValue({ id: 'concert-id', totalSeat: 2 });
    reservationsRepository.findReservationForUpdate.mockResolvedValue({
      id: 'reservation-id',
      status: 'RESERVED',
    });

    await expect(service.cancelReservation('user-id', 'concert-id')).resolves.toBeUndefined();

    expect(reservationsRepository.updateReservationStatus).toHaveBeenCalledWith(
      tx,
      'reservation-id',
      'CANCELED',
    );
    expect(reservationsRepository.insertReservationHistory).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        userId: 'user-id',
        concertId: 'concert-id',
        action: 'CANCEL',
      }),
    );
  });

  it('listHistory_existingHistory_returnsRepositoryResult', async () => {
    reservationsRepository.listHistoryRecords.mockResolvedValue([
      {
        id: 'history-id',
        action: 'CANCEL',
        actionAt: new Date('2026-01-01T00:00:00.000Z'),
        userId: 'user-id',
        fullName: 'Test User',
        email: 'test@example.com',
        concertId: 'concert-id',
        concertName: 'Live Night',
      },
    ]);

    const actualHistory = await service.listHistory();

    expect(actualHistory).toEqual<ReservationHistoryResponseDto[]>([
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
    ]);
  });
});
