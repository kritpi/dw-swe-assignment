import { Injectable, NotFoundException } from '@nestjs/common';
import type { CreateConcertDto } from './dto/create-concert.dto';
import type { ConcertResponseDto } from './dto/concert-response.dto';
import { ConcertsRepository } from './concerts.repository';

@Injectable()
export class ConcertsService {
  constructor(private readonly concertsRepository: ConcertsRepository) {}

  async create(dto: CreateConcertDto, createdBy: string): Promise<void> {
    await this.concertsRepository.create(dto, createdBy);
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.concertsRepository.softDelete(id);

    if (!deleted) {
      throw new NotFoundException('Concert not found');
    }
  }

  async listForAdmin(): Promise<ConcertResponseDto[]> {
    return this.concertsRepository.listForAdmin();
  }

  async listForUser(userId: string): Promise<ConcertResponseDto[]> {
    return this.concertsRepository.listForUser(userId);
  }
}
