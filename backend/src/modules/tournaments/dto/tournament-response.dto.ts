import { ApiProperty } from '@nestjs/swagger';
import { GameType, TournamentType, SeedingMode } from './create-tournament.dto';

export enum TournamentStatus {
  DRAFT = 'DRAFT',
  REGISTRATION = 'REGISTRATION',
  READY = 'READY',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  POSTPONED = 'POSTPONED',
}

export class TournamentResponseDto {
  @ApiProperty({ description: 'Tournament ID' })
  id: string;

  @ApiProperty({ description: 'Tournament title' })
  title: string;

  @ApiProperty({ description: 'Tournament description', required: false })
  description?: string;

  @ApiProperty({ description: 'Short description', required: false })
  short_description?: string;

  @ApiProperty({ enum: GameType, description: 'Game type' })
  game_type: GameType;

  @ApiProperty({ enum: TournamentType, description: 'Tournament format' })
  tournament_type: TournamentType;

  @ApiProperty({ description: 'Tournament status' })
  status: string;

  @ApiProperty({ description: 'Registration start date', required: false })
  registration_start?: string;

  @ApiProperty({ description: 'Registration end date', required: false })
  registration_end?: string;

  @ApiProperty({ description: 'Tournament start date', required: false })
  tournament_start?: string;

  @ApiProperty({ description: 'Tournament end date', required: false })
  tournament_end?: string;

  @ApiProperty({ description: 'Maximum number of teams' })
  max_teams: number;

  @ApiProperty({ description: 'Minimum number of teams' })
  min_teams: number;

  @ApiProperty({ description: 'Team size' })
  team_size: number;

  @ApiProperty({ description: 'Entry fee' })
  entry_fee: number;

  @ApiProperty({ description: 'Prize pool' })
  prize_pool: number;

  @ApiProperty({ description: 'Is tournament public' })
  is_public: boolean;

  @ApiProperty({ description: 'Requires approval to join' })
  requires_approval: boolean;

  @ApiProperty({ description: 'Tournament rules', required: false })
  rules?: string;

  @ApiProperty({ description: 'Format settings', required: false })
  format_settings?: any;

  @ApiProperty({ description: 'Bracket data', required: false })
  bracket_data?: any;

  @ApiProperty({ description: 'Group settings', required: false })
  group_settings?: any;

  @ApiProperty({ description: 'Organizer ID' })
  organizer_id: string;

  @ApiProperty({ description: 'Moderators IDs' })
  moderators: string[];

  @ApiProperty({ description: 'Banner URL', required: false })
  banner_url?: string;

  @ApiProperty({ description: 'Logo URL', required: false })
  logo_url?: string;

  @ApiProperty({ description: 'Stream URL', required: false })
  stream_url?: string;

  @ApiProperty({ description: 'Discord invite link', required: false })
  discord_invite?: string;

  @ApiProperty({ description: 'Creation date' })
  created_at: string;

  @ApiProperty({ description: 'Last update date' })
  updated_at: string;
}