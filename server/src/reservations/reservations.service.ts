import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  getPagination,
  type PaginatedResponse,
  type PaginationQueryDto,
} from '../common/dto/pagination-query.dto';
import { AppException } from '../common/errors/app.exception';
import { ErrorCode } from '../common/errors/error-code';
import { DRIZZLE } from '../db/database.constants';
import type { Database } from '../db/database.types';
import type { ReservationHistoryResponseDto } from './dto/reservation-history-response.dto';
import { ReservationsRepository } from './reservations.repository';

@Injectable()
export class ReservationsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly reservationsRepository: ReservationsRepository,
  ) {}

  async reserveSeat(userId: string, concertId: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      const activeReservation = await this.reservationsRepository.findActiveReservationForUpdate(
        tx,
        userId,
        concertId,
      );

      if (activeReservation) {
        throw new AppException(
          ErrorCode.AlreadyReserved,
          'Seat already reserved for this concert',
          HttpStatus.CONFLICT,
        );
      }

      const seatClaimed = await this.reservationsRepository.decrementAvailableSeat(tx, concertId);

      if (!seatClaimed) {
        const concert = await this.reservationsRepository.findConcert(tx, concertId);

        if (!concert) {
          throw new AppException(ErrorCode.ConcertNotFound, 'Concert not found', HttpStatus.NOT_FOUND);
        }

        throw new AppException(ErrorCode.ConcertSoldOut, 'Concert is fully booked', HttpStatus.CONFLICT);
      }

      try {
        await this.reservationsRepository.insertReservation(tx, {
          id: randomUUID(),
          userId,
          concertId,
        });
      } catch (error) {
        if (isActiveReservationUniqueViolation(error)) {
          throw new AppException(
            ErrorCode.AlreadyReserved,
            'Seat already reserved for this concert',
            HttpStatus.CONFLICT,
          );
        }

        throw error;
      }
      await this.reservationsRepository.insertReservationHistory(tx, {
        id: randomUUID(),
        userId,
        concertId,
        action: 'RESERVE',
      });
    });
  }

  async cancelReservation(userId: string, concertId: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      const concert = await this.reservationsRepository.findConcert(tx, concertId);

      if (!concert) {
        throw new AppException(ErrorCode.ConcertNotFound, 'Concert not found', HttpStatus.NOT_FOUND);
      }

      const reservation = await this.reservationsRepository.cancelActiveReservation(tx, userId, concertId);

      if (!reservation) {
        throw new AppException(
          ErrorCode.NoActiveReservation,
          'No active reservation to cancel',
          HttpStatus.CONFLICT,
        );
      }

      await this.reservationsRepository.incrementAvailableSeat(tx, concertId);
      await this.reservationsRepository.insertReservationHistory(tx, {
        id: randomUUID(),
        userId,
        concertId,
        action: 'CANCEL',
      });
    });
  }

  async listHistory(query: PaginationQueryDto): Promise<PaginatedResponse<ReservationHistoryResponseDto>> {
    return this.listHistoryRecords(query);
  }

  async listMyHistory(
    userId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<ReservationHistoryResponseDto>> {
    return this.listHistoryRecords(query, userId);
  }

  private async listHistoryRecords(
    query: PaginationQueryDto,
    userId?: string,
  ): Promise<PaginatedResponse<ReservationHistoryResponseDto>> {
    const pagination = getPagination(query);
    const [rows, total] = await Promise.all([
      this.reservationsRepository.listHistoryRecords(pagination, userId),
      this.reservationsRepository.countHistoryRecords(userId),
    ]);

    return {
      data: rows.map((row) => ({
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
      })),
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }
}

function isActiveReservationUniqueViolation(error: unknown): error is { code: string; constraint?: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505' &&
    'constraint' in error &&
    error.constraint === 'reservations_active_user_concert_unique'
  );
}
