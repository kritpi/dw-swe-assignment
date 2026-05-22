import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
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
      const concert = await this.reservationsRepository.findConcertForUpdate(tx, concertId);

      if (!concert) {
        throw new NotFoundException('Concert not found');
      }

      const reservedCount = await this.reservationsRepository.countReservedSeats(tx, concertId);

      if (reservedCount >= Number(concert.totalSeat)) {
        throw new ConflictException('Concert is fully booked');
      }

      const reservation = await this.reservationsRepository.findReservationForUpdate(tx, userId, concertId);

      if (reservation?.status === 'RESERVED') {
        throw new ConflictException('Seat already reserved for this concert');
      }

      if (reservation) {
        await this.reservationsRepository.updateReservationStatus(tx, reservation.id, 'RESERVED');
      } else {
        await this.reservationsRepository.insertReservation(tx, {
          id: randomUUID(),
          userId,
          concertId,
          status: 'RESERVED',
        });
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
      const concert = await this.reservationsRepository.findConcertForUpdate(tx, concertId);

      if (!concert) {
        throw new NotFoundException('Concert not found');
      }

      const reservation = await this.reservationsRepository.findReservationForUpdate(tx, userId, concertId);

      if (!reservation || reservation.status !== 'RESERVED') {
        throw new ConflictException('No active reservation to cancel');
      }

      await this.reservationsRepository.updateReservationStatus(tx, reservation.id, 'CANCELED');
      await this.reservationsRepository.insertReservationHistory(tx, {
        id: randomUUID(),
        userId,
        concertId,
        action: 'CANCEL',
      });
    });
  }

  async listHistory(): Promise<ReservationHistoryResponseDto[]> {
    const rows = await this.reservationsRepository.listHistoryRecords();

    return rows.map((row) => ({
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
