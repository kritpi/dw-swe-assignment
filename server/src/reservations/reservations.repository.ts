import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DRIZZLE } from '../db/database.constants';
import type { Database } from '../db/database.types';

type ConcertLockRow = {
  id: string;
  totalSeat: number;
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

@Injectable()
export class ReservationsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async findConcertForUpdate(executor: QueryExecutor, concertId: string): Promise<ConcertLockRow | null> {
    const result = await executor.execute(sql<ConcertLockRow>`
      select id, total_seat as "totalSeat"
      from concerts
      where id = ${concertId}
        and deleted_at is null
      for update
    `);

    return rowsOf<ConcertLockRow>(result.rows)[0] ?? null;
  }

  async countReservedSeats(executor: QueryExecutor, concertId: string): Promise<number> {
    const result = await executor.execute(sql<CountRow>`
      select count(*)::int as count
      from reservations
      where concert_id = ${concertId}
        and status = 'RESERVED'
    `);

    return Number(rowsOf<CountRow>(result.rows)[0]?.count ?? 0);
  }

  async findReservationForUpdate(
    executor: QueryExecutor,
    userId: string,
    concertId: string,
  ): Promise<ReservationRow | null> {
    const result = await executor.execute(sql<ReservationRow>`
      select id, status
      from reservations
      where user_id = ${userId}
        and concert_id = ${concertId}
      for update
    `);

    return rowsOf<ReservationRow>(result.rows)[0] ?? null;
  }

  async insertReservation(
    executor: QueryExecutor,
    reservation: { id: string; userId: string; concertId: string; status: ReservationRow['status'] },
  ): Promise<void> {
    await executor.execute(sql`
      insert into reservations (id, user_id, concert_id, status)
      values (${reservation.id}, ${reservation.userId}, ${reservation.concertId}, ${reservation.status})
    `);
  }

  async updateReservationStatus(
    executor: QueryExecutor,
    reservationId: string,
    status: ReservationRow['status'],
  ): Promise<void> {
    await executor.execute(sql`
      update reservations
      set status = ${status},
          updated_at = now()
      where id = ${reservationId}
    `);
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

  async listHistoryRecords(): Promise<HistoryRow[]> {
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
      order by h.action_at desc
    `);

    return rowsOf<HistoryRow>(result.rows);
  }
}

function rowsOf<T>(rows: unknown): T[] {
  return rows as T[];
}
