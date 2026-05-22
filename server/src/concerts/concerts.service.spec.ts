import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConcertsRepository } from './concerts.repository';
import { ConcertsService } from './concerts.service';
import type { ConcertResponseDto } from './dto/concert-response.dto';
import type { CreateConcertDto } from './dto/create-concert.dto';

describe('ConcertsService', () => {
  let service: ConcertsService;
  let concertsRepository: {
    create: jest.Mock;
    softDelete: jest.Mock;
    listForAdmin: jest.Mock;
    listForUser: jest.Mock;
    countActive: jest.Mock;
  };

  beforeEach(async () => {
    concertsRepository = {
      create: jest.fn(),
      softDelete: jest.fn(),
      listForAdmin: jest.fn(),
      listForUser: jest.fn(),
      countActive: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConcertsService,
        {
          provide: ConcertsRepository,
          useValue: concertsRepository,
        },
      ],
    }).compile();

    service = module.get<ConcertsService>(ConcertsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create_validDto_delegatesToRepository', async () => {
    const dto: CreateConcertDto = {
      name: 'Live Night',
      description: null,
      totalSeats: 100,
    };

    await expect(service.create(dto, 'admin-id')).resolves.toBeUndefined();

    expect(concertsRepository.create).toHaveBeenCalledWith(dto, 'admin-id');
  });

  it('delete_existingConcert_softDeletesConcert', async () => {
    concertsRepository.softDelete.mockResolvedValue(true);

    await expect(service.delete('concert-id')).resolves.toBeUndefined();

    expect(concertsRepository.softDelete).toHaveBeenCalledWith('concert-id');
  });

  it('delete_missingConcert_throwsNotFoundException', async () => {
    concertsRepository.softDelete.mockResolvedValue(false);

    await expect(service.delete('missing-concert')).rejects.toThrow(NotFoundException);
  });

  it('listForAdmin_existingConcerts_returnsRepositoryResult', async () => {
    const expectedConcerts = [createConcertResponse()];
    concertsRepository.listForAdmin.mockResolvedValue(expectedConcerts);
    concertsRepository.countActive.mockResolvedValue(1);

    const actualConcerts = await service.listForAdmin({ page: 1, limit: 20 });

    expect(actualConcerts.data).toBe(expectedConcerts);
    expect(actualConcerts.meta.total).toBe(1);
  });

  it('listForUser_existingConcerts_returnsRepositoryResult', async () => {
    const expectedConcerts = [createConcertResponse({ hasReserved: true })];
    concertsRepository.listForUser.mockResolvedValue(expectedConcerts);
    concertsRepository.countActive.mockResolvedValue(1);

    const actualConcerts = await service.listForUser('user-id', { page: 1, limit: 20 });

    expect(actualConcerts.data).toBe(expectedConcerts);
    expect(concertsRepository.listForUser).toHaveBeenCalledWith('user-id', {
      page: 1,
      limit: 20,
      offset: 0,
    });
  });
});

function createConcertResponse(overrides: Partial<ConcertResponseDto> = {}): ConcertResponseDto {
  return {
    id: 'concert-id',
    name: 'Live Night',
    description: null,
    totalSeats: 100,
    reservedSeats: 10,
    availableSeats: 90,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}
