import {
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
import { ReservationHistoryResponseDto } from './dto/reservation-history-response.dto';
import { ReservationsService } from './reservations.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Reservations')
@ApiCookieAuth()
@ApiExtraModels(ReservationHistoryResponseDto, PaginationMetaDto)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post('concerts/:concertId/reservations')
  @Roles(UserRole.User)
  @HttpCode(204)
  @ApiOperation({ summary: 'Reserve a seat for a concert' })
  @ApiParam({ name: 'concertId', description: 'Concert id' })
  @ApiNoContentResponse()
  async reserveSeat(
    @Param('concertId') concertId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    await this.reservationsService.reserveSeat(request.user.sub, concertId);
  }

  @Delete('concerts/:concertId/reservations')
  @Roles(UserRole.User)
  @HttpCode(204)
  @ApiOperation({ summary: 'Cancel the authenticated user reservation for a concert' })
  @ApiParam({ name: 'concertId', description: 'Concert id' })
  @ApiNoContentResponse()
  async cancelReservation(
    @Param('concertId') concertId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    await this.reservationsService.cancelReservation(request.user.sub, concertId);
  }

  @Get('reservations/history')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'List all reservation history entries' })
  @ApiOkResponse({
    schema: {
      properties: {
        data: { type: 'array', items: { $ref: getSchemaPath(ReservationHistoryResponseDto) } },
        meta: { $ref: getSchemaPath(PaginationMetaDto) },
      },
    },
  })
  listHistory(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponse<ReservationHistoryResponseDto>> {
    return this.reservationsService.listHistory(query);
  }

  @Get('me/reservations')
  @Roles(UserRole.User)
  @ApiOperation({ summary: 'List the authenticated user reservation history' })
  @ApiOkResponse({
    schema: {
      properties: {
        data: { type: 'array', items: { $ref: getSchemaPath(ReservationHistoryResponseDto) } },
        meta: { $ref: getSchemaPath(PaginationMetaDto) },
      },
    },
  })
  listMyHistory(
    @Req() request: AuthenticatedRequest,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponse<ReservationHistoryResponseDto>> {
    return this.reservationsService.listMyHistory(request.user.sub, query);
  }
}
