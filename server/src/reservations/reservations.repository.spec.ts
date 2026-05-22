import { ReservationsRepository } from './reservations.repository';

describe('ReservationsRepository', () => {
  let repository: ReservationsRepository;
  let db: { execute: jest.Mock };
  let executor: { execute: jest.Mock };

  beforeEach(() => {
    executor = {
      execute: jest.fn(),
    };
    db = {
      execute: jest.fn(),
    };
    repository = new ReservationsRepository(db as never);
  });

  it('findConcertForUpdate_missingConcert_returnsNull', async () => {
    executor.execute.mockResolvedValue({ rows: [] });

    await expect(repository.findConcertForUpdate(executor as never, 'missing-concert')).resolves.toBeNull();
    expect(executor.execute).toHaveBeenCalledTimes(1);
  });

  it('findConcertForUpdate_existingConcert_returnsLockedConcert', async () => {
    executor.execute.mockResolvedValue({ rows: [{ id: 'concert-id', totalSeat: 2 }] });

    await expect(repository.findConcertForUpdate(executor as never, 'concert-id')).resolves.toEqual({
      id: 'concert-id',
      totalSeat: 2,
    });
  });

  it('countReservedSeats_existingReservations_returnsCount', async () => {
    executor.execute.mockResolvedValue({ rows: [{ count: 2 }] });

    await expect(repository.countReservedSeats(executor as never, 'concert-id')).resolves.toBe(2);
  });

  it('findReservationForUpdate_missingReservation_returnsNull', async () => {
    executor.execute.mockResolvedValue({ rows: [] });

    await expect(
      repository.findReservationForUpdate(executor as never, 'user-id', 'concert-id'),
    ).resolves.toBeNull();
  });

  it('findReservationForUpdate_existingReservation_returnsReservation', async () => {
    executor.execute.mockResolvedValue({ rows: [{ id: 'reservation-id', status: 'RESERVED' }] });

    await expect(
      repository.findReservationForUpdate(executor as never, 'user-id', 'concert-id'),
    ).resolves.toEqual({
      id: 'reservation-id',
      status: 'RESERVED',
    });
  });

  it('insertReservation_validPayload_executesInsert', async () => {
    executor.execute.mockResolvedValue({ rows: [] });

    await expect(
      repository.insertReservation(executor as never, {
        id: 'reservation-id',
        userId: 'user-id',
        concertId: 'concert-id',
        status: 'RESERVED',
      }),
    ).resolves.toBeUndefined();
    expect(executor.execute).toHaveBeenCalledTimes(1);
  });

  it('updateReservationStatus_validPayload_executesUpdate', async () => {
    executor.execute.mockResolvedValue({ rows: [] });

    await expect(
      repository.updateReservationStatus(executor as never, 'reservation-id', 'CANCELED'),
    ).resolves.toBeUndefined();
    expect(executor.execute).toHaveBeenCalledTimes(1);
  });

  it('insertReservationHistory_validPayload_executesInsert', async () => {
    executor.execute.mockResolvedValue({ rows: [] });

    await expect(
      repository.insertReservationHistory(executor as never, {
        id: 'history-id',
        userId: 'user-id',
        concertId: 'concert-id',
        action: 'CANCEL',
      }),
    ).resolves.toBeUndefined();
    expect(executor.execute).toHaveBeenCalledTimes(1);
  });

  it('listHistoryRecords_existingRows_returnsFlatHistoryRecords', async () => {
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

    const actualHistory = await repository.listHistoryRecords();

    expect(actualHistory).toEqual([
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
    ]);
  });
});
