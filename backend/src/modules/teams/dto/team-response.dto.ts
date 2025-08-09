import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TeamMemberResponseDto } from './team-member.dto';

export class TeamStatsDto {
  @ApiProperty({ description: 'Games played', example: 150 })
  games_played: number;

  @ApiProperty({ description: 'Games won', example: 95 })
  games_won: number;

  @ApiProperty({ description: 'Tournaments played', example: 12 })
  tournaments_played: number;

  @ApiProperty({ description: 'Tournaments won', example: 3 })
  tournaments_won: number;

  @ApiProperty({ description: 'Total prize money', example: 50000.00 })
  total_prize_money: number;

  @ApiProperty({ description: 'Ranking points', example: 1250 })
  ranking_points: number;

  @ApiProperty({ description: 'Current streak', example: 5 })
  current_streak: number;

  @ApiProperty({ description: 'Best streak', example: 12 })
  best_streak: number;
}

export class TeamResponseDto {
  @ApiProperty({ description: 'Team ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ description: 'Team name', example: 'Team Liquid' })
  name: string;

  @ApiProperty({ description: 'Team tag/abbreviation', example: 'TL' })
  tag: string;

  @ApiPropertyOptional({ description: 'Team description', example: 'Professional esports team' })
  description?: string;

  @ApiPropertyOptional({ description: 'Team logo URL', example: 'https://example.com/logo.png' })
  logo_url?: string;

  @ApiPropertyOptional({ description: 'Team banner URL', example: 'https://example.com/banner.jpg' })
  banner_url?: string;

  @ApiPropertyOptional({ description: 'Country code', example: 'US' })
  country?: string;

  @ApiPropertyOptional({ description: 'Team website URL', example: 'https://teamliquid.com' })
  website?: string;

  @ApiPropertyOptional({ description: 'Discord server URL', example: 'https://discord.gg/teamliquid' })
  discord_url?: string;

  @ApiPropertyOptional({ description: 'Twitter profile URL', example: 'https://twitter.com/teamliquid' })
  twitter_url?: string;

  @ApiProperty({ description: 'Whether team is active', example: true })
  is_active: boolean;

  @ApiProperty({ description: 'Whether team is verified', example: true })
  is_verified: boolean;

  @ApiProperty({ description: 'Maximum number of team members', example: 10 })
  max_members: number;

  @ApiProperty({ description: 'ID of the user who created the team' })
  created_by: string;

  @ApiProperty({ description: 'Creation timestamp', example: '2024-01-01T00:00:00Z' })
  created_at: string;

  @ApiProperty({ description: 'Last update timestamp', example: '2024-01-15T10:30:00Z' })
  updated_at: string;

  @ApiPropertyOptional({ description: 'Team statistics', type: TeamStatsDto })
  stats?: TeamStatsDto;

  @ApiPropertyOptional({ description: 'Team members', type: [TeamMemberResponseDto] })
  members?: TeamMemberResponseDto[];

  @ApiPropertyOptional({ description: 'Creator details' })
  creator?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };

  @ApiPropertyOptional({ description: 'Current member count', example: 5 })
  member_count?: number;
}