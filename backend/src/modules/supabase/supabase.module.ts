import { Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

@Module({
  controllers: [],
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}