import { Module } from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { TournamentsController } from './tournaments.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { UsersModule } from '../users/users.module';
import { AdminGuard } from '../../common/guards/admin.guard';
import { RoleGuard } from '../../common/guards/role.guard';

@Module({
  imports: [SupabaseModule, UsersModule],
  controllers: [TournamentsController],
  providers: [TournamentsService, AdminGuard, RoleGuard],
  exports: [TournamentsService],
})
export class TournamentsModule {}
