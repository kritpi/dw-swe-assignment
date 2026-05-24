import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../db/database.module';
import { AdminReservationsController, ReservationsController } from './reservations.controller';
import { ReservationsRepository } from './reservations.repository';
import { ReservationsService } from './reservations.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [ReservationsController, AdminReservationsController],
  providers: [ReservationsRepository, ReservationsService],
})
export class ReservationsModule {}
