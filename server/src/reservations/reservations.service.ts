import { Injectable } from '@nestjs/common';
import type { ReservationHistoryResponseDto } from './dto/reservation-history-response.dto';
import { ReservationsRepository } from './reservations.repository';

@Injectable()
export class ReservationsService {
  constructor(private readonly reservationsRepository: ReservationsRepository) {}

  async reserveSeat(userId: string, concertId: string): Promise<void> {
    await this.reservationsRepository.reserveSeat(userId, concertId);
  }

  async cancelReservation(userId: string, concertId: string): Promise<void> {
    await this.reservationsRepository.cancelReservation(userId, concertId);
  }

  async listHistory(): Promise<ReservationHistoryResponseDto[]> {
    return this.reservationsRepository.listHistory();
  }
}
