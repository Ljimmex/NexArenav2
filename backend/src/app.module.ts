import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TeamsModule } from './modules/teams/teams.module';
import { TournamentsModule } from './modules/tournaments/tournaments.module';
import { MatchesModule } from './modules/matches/matches.module';
import { SupabaseModule } from './modules/supabase/supabase.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    // PrismaModule, // Disabled until needed - no services use it yet
    SupabaseModule,
    AuthModule,
    UsersModule,
    TeamsModule,
    TournamentsModule,
    MatchesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
