export type ReservationStatus = 'RESERVED' | 'CANCELED';

export type ConcertResponseDto = {
  id: string;
  name: string;
  description: string | null;
  totalSeats: number;
  reservedSeats: number;
  availableSeats: number;
  hasReserved?: boolean;
  reservationStatus?: ReservationStatus | null;
  createdAt: Date;
};
