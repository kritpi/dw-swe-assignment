import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { DRIZZLE } from '../db/database.constants';
import type { Database } from '../db/database.types';
import { concerts } from '../db/schema';
import type { CreateConcertDto } from './dto/create-concert.dto';
import type { ConcertResponseDto, ReservationStatus } from './dto/concert-response.dto';

type ConcertRow = {
  id: string;
  name: string;
  description: string | null;
  totalSeats: number;
  reservedSeats: number;
  availableSeats: number;
  createdAt: Date;
  reservationStatus?: ReservationStatus | null;
};

type CountRow = {
  count: number;
};

type Pagination = {
  limit: number;
  offset: number;
};

@Injectable()
export class ConcertsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async create(dto: CreateConcertDto, createdBy: string): Promise<void> {
    await this.db.insert(concerts).values({
      id: randomUUID(),
      name: dto.name,
      description: dto.description ?? null,
      totalSeat: dto.totalSeats,
      availableSeats: dto.totalSeats,
      createdBy,
    });
  }

  async softDelete(id: string): Promise<boolean> {
    const deletedRows = await this.db
      .update(concerts)
      .set({ deletedAt: new Date() })
      .where(and(eq(concerts.id, id), isNull(concerts.deletedAt)))
      .returning({ id: concerts.id });

    return deletedRows.length > 0;
  }

  async countActive(): Promise<number> {
    const result = await this.db.execute(sql<CountRow>`
      select count(*)::int as count
      from concerts
      where deleted_at is null
    `);

    return Number(rowsOf<CountRow>(result.rows)[0]?.count ?? 0);
  }

  async listForAdmin(pagination: Pagination): Promise<ConcertResponseDto[]> {
    const result = await this.db.execute(sql<ConcertRow>`
      select
        c.id,
        c.name,
        c.description,
        c.total_seat as "totalSeats",
        (c.total_seat - c.available_seats)::int as "reservedSeats",
        c.available_seats as "availableSeats",
        c.created_at as "createdAt"
      from concerts c
      where c.deleted_at is null
      order by c.created_at desc
      limit ${pagination.limit}
      offset ${pagination.offset}
    `);

    return rowsOf<ConcertRow>(result.rows).map(toConcertResponse);
  }

  async listForUser(userId: string, pagination: Pagination): Promise<ConcertResponseDto[]> {
    const result = await this.db.execute(sql<ConcertRow>`
      select
        c.id,
        c.name,
        c.description,
        c.total_seat as "totalSeats",
        (c.total_seat - c.available_seats)::int as "reservedSeats",
        c.available_seats as "availableSeats",
        c.created_at as "createdAt",
        user_r.status as "reservationStatus"
      from concerts c
      left join reservations user_r
        on user_r.concert_id = c.id
       and user_r.user_id = ${userId}
       and user_r.status = 'RESERVED'
      where c.deleted_at is null
      order by c.created_at desc
      limit ${pagination.limit}
      offset ${pagination.offset}
    `);

    return rowsOf<ConcertRow>(result.rows).map((row) => {
      const concert = toConcertResponse(row);
      concert.reservationStatus = row.reservationStatus ?? null;
      concert.hasReserved = row.reservationStatus === 'RESERVED';
      return concert;
    });
  }
}

function toConcertResponse(row: ConcertRow): ConcertResponseDto {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    totalSeats: Number(row.totalSeats),
    reservedSeats: Number(row.reservedSeats),
    availableSeats: Number(row.availableSeats),
    createdAt: row.createdAt,
  };
}

function rowsOf<T>(rows: unknown): T[] {
  return rows as T[];
}
