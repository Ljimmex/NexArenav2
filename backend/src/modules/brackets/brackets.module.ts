import { Module } from '@nestjs/common';
import { BracketsService } from './brackets.service';
import { BracketsController } from './brackets.controller';
import { TournamentsModule } from '../tournaments/tournaments.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { UsersModule } from '../users/users.module';
import { MatchesModule } from '../matches/matches.module';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RoleGuard } from '../../common/guards/role.guard';

@Module({
  imports: [TournamentsModule, SupabaseModule, UsersModule, MatchesModule],
  providers: [BracketsService, AuthGuard, RoleGuard],
  controllers: [BracketsController],
  exports: [BracketsService],
})
export class BracketsModule {}