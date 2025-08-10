import { Module } from '@nestjs/common'
import { MatchesController } from './matches.controller'
import { MatchesService } from './matches.service'
import { SupabaseModule } from '../supabase/supabase.module'
import { UsersModule } from '../users/users.module'
import { AuthGuard } from '../../common/guards/auth.guard'
import { RoleGuard } from '../../common/guards/role.guard'

@Module({
  imports: [SupabaseModule, UsersModule],
  controllers: [MatchesController],
  providers: [MatchesService, AuthGuard, RoleGuard],
  exports: [MatchesService],
})
export class MatchesModule {}
