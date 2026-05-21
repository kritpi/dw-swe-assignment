import { ConflictException, NotFoundException } from '@nestjs/common';
import { ReservationsRepository } from './reservations.repository';

describe('ReservationsRepository', () => {
  let repository: ReservationsRepository;
  let db: { execute: jest.Mock; transaction: jest.Mock };
  let tx: { execute: jest.Mock };

  beforeEach(() => {
    tx = {
      execute: jest.fn(),
    };
    db = {
      execute: jest.fn(),
      transaction: jest.fn((callback: (transaction: typeof tx) => Promise<void>) => callback(tx)),
    };
    repository = new ReservationsRepository(db as never);
  });

  it('reserveSeat_missingConcert_throwsNotFoundException', async () => {
    tx.execute.mockResolvedValueOnce({ rows: [] });

    await expect(repository.reserveSeat('user-id', 'missing-concert')).rejects.toThrow(NotFoundException);

    expect(tx.execute).toHaveBeenCalledTimes(1);
  });

  it('reserveSeat_fullConcert_throwsConflictException', async () => {
    tx.execute
      .mockResolvedValueOnce({ rows: [{ id: 'concert-id', totalSeat: 2 }] })
      .mockResolvedValueOnce({ rows: [{ count: 2 }] });

    await expect(repository.reserveSeat('user-id', 'concert-id')).rejects.toThrow(ConflictException);

    expect(tx.execute).toHaveBeenCalledTimes(2);
  });

  it('reserveSeat_alreadyReserved_throwsConflictException', async () => {
    tx.execute
      .mockResolvedValueOnce({ rows: [{ id: 'concert-id', totalSeat: 2 }] })
      .mockResolvedValueOnce({ rows: [{ count: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id: 'reservation-id', status: 'RESERVED' }] });

    await expect(repository.reserveSeat('user-id', 'concert-id')).rejects.toThrow(ConflictException);

    expect(tx.execute).toHaveBeenCalledTimes(3);
  });

  it('reserveSeat_canceledReservation_updatesReservationAndCreatesHistory', async () => {
    tx.execute
      .mockResolvedValueOnce({ rows: [{ id: 'concert-id', totalSeat: 2 }] })
      .mockResolvedValueOnce({ rows: [{ count: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id: 'reservation-id', status: 'CANCELED' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    await expect(repository.reserveSeat('user-id', 'concert-id')).resolves.toBeUndefined();

    expect(tx.execute).toHaveBeenCalledTimes(5);
  });

  it('reserveSeat_newReservation_insertsReservationAndCreatesHistory', async () => {
    tx.execute
      .mockResolvedValueOnce({ rows: [{ id: 'concert-id', totalSeat: 2 }] })
      .mockResolvedValueOnce({ rows: [{ count: 1 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    await expect(repository.reserveSeat('user-id', 'concert-id')).resolves.toBeUndefined();

    expect(tx.execute).toHaveBeenCalledTimes(5);
  });

  it('cancelReservation_missingConcert_throwsNotFoundException', async () => {
    tx.execute.mockResolvedValueOnce({ rows: [] });

    await expect(repository.cancelReservation('user-id', 'missing-concert')).rejects.toThrow(NotFoundException);

    expect(tx.execute).toHaveBeenCalledTimes(1);
  });

  it('cancelReservation_withoutActiveReservation_throwsConflictException', async () => {
    tx.execute
      .mockResolvedValueOnce({ rows: [{ id: 'concert-id', totalSeat: 2 }] })
      .mockResolvedValueOnce({ rows: [{ id: 'reservation-id', status: 'CANCELED' }] });

    await expect(repository.cancelReservation('user-id', 'concert-id')).rejects.toThrow(ConflictException);

    expect(tx.execute).toHaveBeenCalledTimes(2);
  });

  it('cancelReservation_activeReservation_updatesReservationAndCreatesHistory', async () => {
    tx.execute
      .mockResolvedValueOnce({ rows: [{ id: 'concert-id', totalSeat: 2 }] })
      .mockResolvedValueOnce({ rows: [{ id: 'reservation-id', status: 'RESERVED' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    await expect(repository.cancelReservation('user-id', 'concert-id')).resolves.toBeUndefined();

    expect(tx.execute).toHaveBeenCalledTimes(4);
  });

  it('listHistory_existingRows_returnsNestedHistoryResponse', async () => {
    const actionAt = new Date('2026-01-01T00:00:00.000Z');
    db.execute.mockResolvedValue({
      rows: [
        {
          id: 'history-id',
          action: 'RESERVE',
          actionAt,
          userId: 'user-id',
          fullName: 'Test User',
          email: 'test@example.com',
          concertId: 'concert-id',
          concertName: 'Live Night',
        },
      ],
    });

    const actualHistory = await repository.listHistory();

    expect(actualHistory).toEqual([
      {
        id: 'history-id',
        action: 'RESERVE',
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
    ]);
  });
});
