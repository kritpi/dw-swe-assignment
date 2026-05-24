import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import {
  PaginatedResponse,
  PaginationMetaDto,
  PaginationQueryDto,
} from '../common/dto/pagination-query.dto';
import { UserRole } from '../utils/user-role';
import { ConcertsService } from './concerts.service';
import { CreateConcertDto } from './dto/create-concert.dto';
import { ConcertResponseDto } from './dto/concert-response.dto';

@Controller('concerts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.User)
@ApiTags('Concerts')
@ApiCookieAuth()
@ApiExtraModels(ConcertResponseDto, PaginationMetaDto)
export class ConcertsController {
  constructor(private readonly concertsService: ConcertsService) {}

  @Get()
  @ApiOperation({ summary: 'List concerts available to the authenticated user' })
  @ApiOkResponse({
    schema: {
      properties: {
        data: { type: 'array', items: { $ref: getSchemaPath(ConcertResponseDto) } },
        meta: { $ref: getSchemaPath(PaginationMetaDto) },
      },
    },
  })
  listForUser(
    @Req() request: AuthenticatedRequest,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponse<ConcertResponseDto>> {
    return this.concertsService.listForUser(request.user.sub, query);
  }
}

@Controller('admin/concerts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin)
@ApiTags('Admin Concerts')
@ApiCookieAuth()
@ApiExtraModels(ConcertResponseDto, PaginationMetaDto)
export class AdminConcertsController {
  constructor(private readonly concertsService: ConcertsService) {}

  @Get()
  @ApiOperation({ summary: 'List concerts for administrators' })
  @ApiOkResponse({
    schema: {
      properties: {
        data: { type: 'array', items: { $ref: getSchemaPath(ConcertResponseDto) } },
        meta: { $ref: getSchemaPath(PaginationMetaDto) },
      },
    },
  })
  listForAdmin(@Query() query: PaginationQueryDto): Promise<PaginatedResponse<ConcertResponseDto>> {
    return this.concertsService.listForAdmin(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a concert' })
  @ApiCreatedResponse({ description: 'Concert created.' })
  async create(@Body() dto: CreateConcertDto, @Req() request: AuthenticatedRequest): Promise<void> {
    await this.concertsService.create(dto, request.user.sub);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a concert' })
  @ApiParam({ name: 'id', description: 'Concert id' })
  @ApiNoContentResponse()
  async delete(@Param('id') id: string): Promise<void> {
    await this.concertsService.delete(id);
  }
}
