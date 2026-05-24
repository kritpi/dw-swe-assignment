import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../db/database.module';
import { AdminConcertsController, ConcertsController } from './concerts.controller';
import { ConcertsRepository } from './concerts.repository';
import { ConcertsService } from './concerts.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [ConcertsController, AdminConcertsController],
  providers: [ConcertsRepository, ConcertsService],
})
export class ConcertsModule {}
