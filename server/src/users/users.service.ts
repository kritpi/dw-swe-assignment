import { HttpStatus, Injectable } from '@nestjs/common';
import { hash } from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import type { CreateUserDto } from './dto/create-user.dto';
import { UsersRepository } from './users.repository';
import { AppException } from '../common/errors/app.exception';
import { ErrorCode } from '../common/errors/error-code';

const saltRound = process.env.BCRYPT_SALT_ROUNDS ?? 12;

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(dto: CreateUserDto): Promise<void> {
    const passwordHash = await hash(dto.password, saltRound);

    try {
      await this.usersRepository.create({
        id: randomUUID(),
        fullName: dto.fullName,
        email: dto.email,
        password: passwordHash,
        role: dto.role,
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new AppException(ErrorCode.DuplicateEmail, 'Email already exists', HttpStatus.CONFLICT);
      }

      throw error;
    }
  }
}

function isUniqueViolation(error: unknown): error is { code: string } {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
}
