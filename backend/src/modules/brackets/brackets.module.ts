import { Module } from '@nestjs/common';
import { BracketsService } from './brackets.service';
import { BracketsController } from './brackets.controller';
import { TournamentsModule } from '../tournaments/tournaments.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { UsersModule } from '../users/users.module';
import { MatchesModule } from '../matches/matches.module';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RoleGuard } from '../../common/guards/role.guard';
import { SingleEliminationGeneratorService } from './services/single-elimination-generator.service';
import { BracketMatchManagerService } from './services/bracket-match-manager.service';
import { BracketSyncService } from './services/bracket-sync.service';
import { BracketPlacementsService } from './services/bracket-placements.service';
import { BracketGroupsService } from './services/bracket-groups.service';

@Module({
  imports: [TournamentsModule, SupabaseModule, UsersModule, MatchesModule],
  providers: [
    BracketsService,
    SingleEliminationGeneratorService,
    BracketMatchManagerService,
    BracketSyncService,
    BracketPlacementsService,
    BracketGroupsService,
    AuthGuard,
    RoleGuard
  ],
  controllers: [BracketsController],
  exports: [BracketsService],
})
export class BracketsModule {}