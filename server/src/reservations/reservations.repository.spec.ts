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

  it('findConcert_missingConcert_returnsNull', async () => {
    executor.execute.mockResolvedValue({ rows: [] });

    await expect(repository.findConcert(executor as never, 'missing-concert')).resolves.toBeNull();
  });

  it('findConcert_existingConcert_returnsConcert', async () => {
    executor.execute.mockResolvedValue({ rows: [{ id: 'concert-id', availableSeats: 2 }] });

    await expect(repository.findConcert(executor as never, 'concert-id')).resolves.toEqual({
      id: 'concert-id',
      availableSeats: 2,
    });
  });

  it('decrementAvailableSeat_updatedRow_returnsTrue', async () => {
    executor.execute.mockResolvedValue({ rows: [{ id: 'concert-id' }] });

    await expect(repository.decrementAvailableSeat(executor as never, 'concert-id')).resolves.toBe(true);
  });

  it('decrementAvailableSeat_noUpdatedRow_returnsFalse', async () => {
    executor.execute.mockResolvedValue({ rows: [] });

    await expect(repository.decrementAvailableSeat(executor as never, 'concert-id')).resolves.toBe(false);
  });

  it('incrementAvailableSeat_updatedRow_returnsTrue', async () => {
    executor.execute.mockResolvedValue({ rows: [{ id: 'concert-id' }] });

    await expect(repository.incrementAvailableSeat(executor as never, 'concert-id')).resolves.toBe(true);
  });

  it('findActiveReservationForUpdate_missingReservation_returnsNull', async () => {
    executor.execute.mockResolvedValue({ rows: [] });

    await expect(
      repository.findActiveReservationForUpdate(executor as never, 'user-id', 'concert-id'),
    ).resolves.toBeNull();
  });

  it('findActiveReservationForUpdate_existingReservation_returnsReservation', async () => {
    executor.execute.mockResolvedValue({ rows: [{ id: 'reservation-id', status: 'RESERVED' }] });

    await expect(
      repository.findActiveReservationForUpdate(executor as never, 'user-id', 'concert-id'),
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
      }),
    ).resolves.toBeUndefined();
    expect(executor.execute).toHaveBeenCalledTimes(1);
  });

  it('cancelActiveReservation_validPayload_returnsReservation', async () => {
    executor.execute.mockResolvedValue({ rows: [{ id: 'reservation-id', status: 'CANCELED' }] });

    await expect(
      repository.cancelActiveReservation(executor as never, 'user-id', 'concert-id'),
    ).resolves.toEqual({
      id: 'reservation-id',
      status: 'CANCELED',
    });
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

  it('countHistoryRecords_existingRows_returnsCount', async () => {
    db.execute.mockResolvedValue({ rows: [{ count: 2 }] });

    await expect(repository.countHistoryRecords()).resolves.toBe(2);
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

    const actualHistory = await repository.listHistoryRecords({ limit: 20, offset: 0 });

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
