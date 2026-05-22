import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { PaginatedResponse, PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { UserRole } from '../utils/user-role';
import { ConcertsService } from './concerts.service';
import { CreateConcertDto } from './dto/create-concert.dto';
import type { ConcertResponseDto } from './dto/concert-response.dto';

@Controller('concerts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConcertsController {
  constructor(private readonly concertsService: ConcertsService) {}

  @Get()
  @Roles(UserRole.User)
  listForUser(
    @Req() request: AuthenticatedRequest,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponse<ConcertResponseDto>> {
    return this.concertsService.listForUser(request.user.sub, query);
  }

  @Get('admin')
  @Roles(UserRole.Admin)
  listForAdmin(@Query() query: PaginationQueryDto): Promise<PaginatedResponse<ConcertResponseDto>> {
    return this.concertsService.listForAdmin(query);
  }

  @Post()
  @Roles(UserRole.Admin)
  async create(
    @Body() dto: CreateConcertDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    await this.concertsService.create(dto, request.user.sub);
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  @HttpCode(204)
  async delete(@Param('id') id: string): Promise<void> {
    await this.concertsService.delete(id);
  }
}
