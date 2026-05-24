import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../utils/user-role';

export class UserLoginDto {
  @ApiProperty({ example: 'admin@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 1, example: 'password123' })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ enum: UserRole, example: UserRole.Admin })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsEnum(UserRole)
  role: UserRole;
}
