import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../common/enums';

export class UserStatsDto {
  @ApiProperty({ description: 'Games played', example: 150 })
  games_played: number;

  @ApiProperty({ description: 'Games won', example: 95 })
  games_won: number;

  @ApiProperty({ description: 'Tournaments played', example: 12 })
  tournaments_played: number;

  @ApiProperty({ description: 'Tournaments won', example: 3 })
  tournaments_won: number;

  @ApiProperty({ description: 'Total prize money', example: 5000.00 })
  total_prize_money: number;

  @ApiProperty({ description: 'Ranking points', example: 1250 })
  ranking_points: number;

  @ApiProperty({ description: 'Current streak', example: 5 })
  current_streak: number;

  @ApiProperty({ description: 'Best streak', example: 12 })
  best_streak: number;
}

export class UserSettingsDto {
  @ApiProperty({ description: 'Theme preference', example: 'dark' })
  theme: string;

  @ApiProperty({ description: 'Language preference', example: 'en' })
  language: string;

  @ApiProperty({ description: 'Timezone', example: 'UTC' })
  timezone: string;

  @ApiProperty({ description: 'Email notifications enabled', example: true })
  email_notifications: boolean;

  @ApiProperty({ description: 'Push notifications enabled', example: true })
  push_notifications: boolean;

  @ApiProperty({ description: 'Profile privacy setting', example: 'public' })
  privacy_profile: string;

  @ApiProperty({ description: 'Stats privacy setting', example: 'public' })
  privacy_stats: string;

  @ApiProperty({ description: 'Matches privacy setting', example: 'public' })
  privacy_matches: string;
}

export class UserResponseDto {
  @ApiProperty({ description: 'User ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ description: 'Supabase user ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  supabase_user_id: string;

  @ApiProperty({ description: 'Username', example: 'player123' })
  username: string;

  @ApiPropertyOptional({ description: 'Display name', example: 'Pro Player' })
  display_name?: string;

  @ApiProperty({ description: 'Email address', example: 'player@example.com' })
  email: string;

  @ApiPropertyOptional({ description: 'Avatar URL', example: 'https://example.com/avatar.jpg' })
  avatar_url?: string;

  @ApiPropertyOptional({ description: 'User bio', example: 'Professional esports player' })
  bio?: string;

  @ApiPropertyOptional({ description: 'Country code', example: 'PL' })
  country?: string;

  @ApiPropertyOptional({ description: 'City', example: 'Warsaw' })
  city?: string;

  @ApiPropertyOptional({ description: 'Date of birth', example: '1995-01-15' })
  date_of_birth?: string;

  @ApiProperty({ description: 'User role', enum: UserRole, example: UserRole.USER })
  role: UserRole;

  @ApiProperty({ description: 'Whether user is active', example: true })
  is_active: boolean;

  @ApiProperty({ description: 'Whether user is verified', example: true })
  is_verified: boolean;

  @ApiPropertyOptional({ description: 'Last login timestamp', example: '2024-01-15T10:30:00Z' })
  last_login?: string;

  @ApiProperty({ description: 'Creation timestamp', example: '2024-01-01T00:00:00Z' })
  created_at: string;

  @ApiProperty({ description: 'Last update timestamp', example: '2024-01-15T10:30:00Z' })
  updated_at: string;

  @ApiPropertyOptional({ description: 'User statistics', type: UserStatsDto })
  stats?: UserStatsDto;

  @ApiPropertyOptional({ description: 'User settings', type: UserSettingsDto })
  settings?: UserSettingsDto;
}