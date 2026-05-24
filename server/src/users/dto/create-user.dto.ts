import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../utils/user-role';

export class CreateUserDto {
  @ApiProperty({ example: 'Ada Lovelace' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({ example: 'ada@example.com' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 5, example: 'password123' })
  @IsString()
  @MinLength(5)
  password!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.User })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsEnum(UserRole)
  role!: UserRole;
}
