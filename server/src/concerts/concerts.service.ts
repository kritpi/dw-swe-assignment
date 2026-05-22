import { Injectable, NotFoundException } from '@nestjs/common';
import {
  getPagination,
  type PaginatedResponse,
  type PaginationQueryDto,
} from '../common/dto/pagination-query.dto';
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

  async listForAdmin(query: PaginationQueryDto): Promise<PaginatedResponse<ConcertResponseDto>> {
    const pagination = getPagination(query);
    const [data, total] = await Promise.all([
      this.concertsRepository.listForAdmin(pagination),
      this.concertsRepository.countActive(),
    ]);

    return {
      data,
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  async listForUser(
    userId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<ConcertResponseDto>> {
    const pagination = getPagination(query);
    const [data, total] = await Promise.all([
      this.concertsRepository.listForUser(userId, pagination),
      this.concertsRepository.countActive(),
    ]);

    return {
      data,
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }
}
