import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthGuard } from '../../common/guards/auth.guard';

@Module({
  imports: [SupabaseModule],
  controllers: [UsersController],
  providers: [UsersService, AuthGuard],
  exports: [UsersService],
})
export class UsersModule {}
