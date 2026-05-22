import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DRIZZLE } from '../db/database.constants';
import type { Database } from '../db/database.types';

type ConcertRow = {
  id: string;
  availableSeats: number;
};

type CountRow = {
  count: number;
};

type ReservationRow = {
  id: string;
  status: 'RESERVED' | 'CANCELED';
};

type HistoryRow = {
  id: string;
  action: 'RESERVE' | 'CANCEL';
  actionAt: Date;
  userId: string;
  fullName: string;
  email: string;
  concertId: string;
  concertName: string;
};

type QueryExecutor = Pick<Database, 'execute'>;
type Pagination = {
  limit: number;
  offset: number;
};

@Injectable()
export class ReservationsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async findConcert(executor: QueryExecutor, concertId: string): Promise<ConcertRow | null> {
    const result = await executor.execute(sql<ConcertRow>`
      select id, available_seats as "availableSeats"
      from concerts
      where id = ${concertId}
        and deleted_at is null
    `);

    return rowsOf<ConcertRow>(result.rows)[0] ?? null;
  }

  async decrementAvailableSeat(executor: QueryExecutor, concertId: string): Promise<boolean> {
    const result = await executor.execute(sql<{ id: string }>`
      update concerts
      set available_seats = available_seats - 1
      where id = ${concertId}
        and deleted_at is null
        and available_seats > 0
      returning id
    `);

    return rowsOf(result.rows).length === 1;
  }

  async incrementAvailableSeat(executor: QueryExecutor, concertId: string): Promise<boolean> {
    const result = await executor.execute(sql<{ id: string }>`
      update concerts
      set available_seats = available_seats + 1
      where id = ${concertId}
        and deleted_at is null
        and available_seats < total_seat
      returning id
    `);

    return rowsOf(result.rows).length === 1;
  }

  async findActiveReservationForUpdate(
    executor: QueryExecutor,
    userId: string,
    concertId: string,
  ): Promise<ReservationRow | null> {
    const result = await executor.execute(sql<ReservationRow>`
      select id, status
      from reservations
      where user_id = ${userId}
        and concert_id = ${concertId}
        and status = 'RESERVED'
      for update
    `);

    return rowsOf<ReservationRow>(result.rows)[0] ?? null;
  }

  async insertReservation(executor: QueryExecutor, reservation: { id: string; userId: string; concertId: string }): Promise<void> {
    await executor.execute(sql`
      insert into reservations (id, user_id, concert_id, status)
      values (${reservation.id}, ${reservation.userId}, ${reservation.concertId}, 'RESERVED')
    `);
  }

  async cancelActiveReservation(
    executor: QueryExecutor,
    userId: string,
    concertId: string,
  ): Promise<ReservationRow | null> {
    const result = await executor.execute(sql<ReservationRow>`
      update reservations
      set status = 'CANCELED',
          updated_at = now()
      where user_id = ${userId}
        and concert_id = ${concertId}
        and status = 'RESERVED'
      returning id, status
    `);

    return rowsOf<ReservationRow>(result.rows)[0] ?? null;
  }

  async insertReservationHistory(
    executor: QueryExecutor,
    history: { id: string; userId: string; concertId: string; action: HistoryRow['action'] },
  ): Promise<void> {
    await executor.execute(sql`
      insert into reservation_history (id, user_id, concert_id, action)
      values (${history.id}, ${history.userId}, ${history.concertId}, ${history.action})
    `);
  }

  async countHistoryRecords(userId?: string): Promise<number> {
    const result = await this.db.execute(sql<CountRow>`
      select count(*)::int as count
      from reservation_history h
      ${userId ? sql`where h.user_id = ${userId}` : sql``}
    `);

    return Number(rowsOf<CountRow>(result.rows)[0]?.count ?? 0);
  }

  async listHistoryRecords(pagination: Pagination, userId?: string): Promise<HistoryRow[]> {
    const result = await this.db.execute(sql<HistoryRow>`
      select
        h.id,
        h.action,
        h.action_at as "actionAt",
        u.id as "userId",
        u.full_name as "fullName",
        u.email,
        c.id as "concertId",
        c.name as "concertName"
      from reservation_history h
      inner join users u on u.id = h.user_id
      inner join concerts c on c.id = h.concert_id
      ${userId ? sql`where h.user_id = ${userId}` : sql``}
      order by h.action_at desc
      limit ${pagination.limit}
      offset ${pagination.offset}
    `);

    return rowsOf<HistoryRow>(result.rows);
  }
}

function rowsOf<T>(rows: unknown): T[] {
  return rows as T[];
}
