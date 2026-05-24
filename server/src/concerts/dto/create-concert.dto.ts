import { Transform, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConcertDto {
  @ApiProperty({ example: 'Coldplay Live in Bangkok' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    nullable: true,
    example: 'One-night concert with reserved seating.',
  })
  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({ minimum: 1, example: 500 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  totalSeats!: number;
}
