import { Controller, Delete, Get, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { UserRole } from '../utils/user-role';
import type { ReservationHistoryResponseDto } from './dto/reservation-history-response.dto';
import { ReservationsService } from './reservations.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post('concerts/:concertId/reservations')
  @Roles(UserRole.User)
  @HttpCode(204)
  async reserveSeat(
    @Param('concertId') concertId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    await this.reservationsService.reserveSeat(request.user.sub, concertId);
  }

  @Delete('concerts/:concertId/reservations')
  @Roles(UserRole.User)
  @HttpCode(204)
  async cancelReservation(
    @Param('concertId') concertId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    await this.reservationsService.cancelReservation(request.user.sub, concertId);
  }

  @Get('reservations/history')
  @Roles(UserRole.Admin)
  listHistory(): Promise<ReservationHistoryResponseDto[]> {
    return this.reservationsService.listHistory();
  }
}
