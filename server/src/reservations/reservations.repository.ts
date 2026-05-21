import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { DRIZZLE } from '../db/database.constants';
import type { Database } from '../db/database.types';
import type { ReservationHistoryResponseDto } from './dto/reservation-history-response.dto';

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

@Injectable()
export class ReservationsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async reserveSeat(userId: string, concertId: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      const concertResult = await tx.execute(sql<ConcertLockRow>`
        select id, total_seat as "totalSeat"
        from concerts
        where id = ${concertId}
          and deleted_at is null
        for update
      `);
      const concert = rowsOf<ConcertLockRow>(concertResult.rows)[0];

      if (!concert) {
        throw new NotFoundException('Concert not found');
      }

      const reservedResult = await tx.execute(sql<CountRow>`
        select count(*)::int as count
        from reservations
        where concert_id = ${concertId}
          and status = 'RESERVED'
      `);
      const reservedCount = Number(rowsOf<CountRow>(reservedResult.rows)[0]?.count ?? 0);

      if (reservedCount >= Number(concert.totalSeat)) {
        throw new ConflictException('Concert is fully booked');
      }

      const reservationResult = await tx.execute(sql<ReservationRow>`
        select id, status
        from reservations
        where user_id = ${userId}
          and concert_id = ${concertId}
        for update
      `);
      const reservation = rowsOf<ReservationRow>(reservationResult.rows)[0];

      if (reservation?.status === 'RESERVED') {
        throw new ConflictException('Seat already reserved for this concert');
      }

      if (reservation) {
        await tx.execute(sql`
          update reservations
          set status = 'RESERVED',
              updated_at = now()
          where id = ${reservation.id}
        `);
      } else {
        await tx.execute(sql`
          insert into reservations (id, user_id, concert_id, status)
          values (${randomUUID()}, ${userId}, ${concertId}, 'RESERVED')
        `);
      }

      await tx.execute(sql`
        insert into reservation_history (id, user_id, concert_id, action)
        values (${randomUUID()}, ${userId}, ${concertId}, 'RESERVE')
      `);
    });
  }

  async cancelReservation(userId: string, concertId: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      const concertResult = await tx.execute(sql<ConcertLockRow>`
        select id, total_seat as "totalSeat"
        from concerts
        where id = ${concertId}
          and deleted_at is null
        for update
      `);

      if (!rowsOf<ConcertLockRow>(concertResult.rows)[0]) {
        throw new NotFoundException('Concert not found');
      }

      const reservationResult = await tx.execute(sql<ReservationRow>`
        select id, status
        from reservations
        where user_id = ${userId}
          and concert_id = ${concertId}
        for update
      `);
      const reservation = rowsOf<ReservationRow>(reservationResult.rows)[0];

      if (!reservation || reservation.status !== 'RESERVED') {
        throw new ConflictException('No active reservation to cancel');
      }

      await tx.execute(sql`
        update reservations
        set status = 'CANCELED',
            updated_at = now()
        where id = ${reservation.id}
      `);

      await tx.execute(sql`
        insert into reservation_history (id, user_id, concert_id, action)
        values (${randomUUID()}, ${userId}, ${concertId}, 'CANCEL')
      `);
    });
  }

  async listHistory(): Promise<ReservationHistoryResponseDto[]> {
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

    return rowsOf<HistoryRow>(result.rows).map((row) => ({
      id: row.id,
      action: row.action,
      actionAt: row.actionAt,
      user: {
        id: row.userId,
        fullName: row.fullName,
        email: row.email,
      },
      concert: {
        id: row.concertId,
        name: row.concertName,
      },
    }));
  }
}

function rowsOf<T>(rows: unknown): T[] {
  return rows as T[];
}
