import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type ReservationStatus = 'RESERVED' | 'CANCELED';

export class ConcertResponseDto {
  @ApiProperty({ example: 'concert_01HZY7J6Q59F5JQ9A3QX9P0K4M' })
  id: string;

  @ApiProperty({ example: 'Coldplay Live in Bangkok' })
  name: string;

  @ApiProperty({ nullable: true, example: 'One-night concert with reserved seating.' })
  description: string | null;

  @ApiProperty({ example: 500 })
  totalSeats: number;

  @ApiProperty({ example: 120 })
  reservedSeats: number;

  @ApiProperty({ example: 380 })
  availableSeats: number;

  @ApiPropertyOptional({ example: true })
  hasReserved?: boolean;

  @ApiPropertyOptional({ enum: ['RESERVED', 'CANCELED'], nullable: true, example: 'RESERVED' })
  reservationStatus?: ReservationStatus | null;

  @ApiProperty({ type: String, format: 'date-time', example: '2026-05-24T12:00:00.000Z' })
  createdAt: Date;
}
