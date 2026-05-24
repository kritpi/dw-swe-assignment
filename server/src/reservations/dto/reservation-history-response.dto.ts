import { ApiProperty } from '@nestjs/swagger';

export class ReservationHistoryUserDto {
  @ApiProperty({ example: 'user_01HZY7J6Q59F5JQ9A3QX9P0K4M' })
  id: string;

  @ApiProperty({ example: 'Ada Lovelace' })
  fullName: string;

  @ApiProperty({ example: 'ada@example.com' })
  email: string;
}

export class ReservationHistoryConcertDto {
  @ApiProperty({ example: 'concert_01HZY7J6Q59F5JQ9A3QX9P0K4M' })
  id: string;

  @ApiProperty({ example: 'Coldplay Live in Bangkok' })
  name: string;
}

export class ReservationHistoryResponseDto {
  @ApiProperty({ example: 'history_01HZY7J6Q59F5JQ9A3QX9P0K4M' })
  id: string;

  @ApiProperty({ enum: ['RESERVE', 'CANCEL'], example: 'RESERVE' })
  action: 'RESERVE' | 'CANCEL';

  @ApiProperty({ type: String, format: 'date-time', example: '2026-05-24T12:00:00.000Z' })
  actionAt: Date;

  @ApiProperty({ type: ReservationHistoryUserDto })
  user: ReservationHistoryUserDto;

  @ApiProperty({ type: ReservationHistoryConcertDto })
  concert: ReservationHistoryConcertDto;
}
