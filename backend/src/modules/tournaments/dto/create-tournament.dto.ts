import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsNumber, IsBoolean, IsDateString, Min, Max, Length } from 'class-validator';

export enum GameType {
  CS2 = 'CS2',
  VALORANT = 'VALORANT',
  LOL = 'LOL',
  DOTA2 = 'DOTA2',
  ROCKET_LEAGUE = 'ROCKET_LEAGUE',
  OVERWATCH = 'OVERWATCH',
}

export enum TournamentType {
  SWISS = 'SWISS',
  SINGLE_ELIMINATION = 'SINGLE_ELIMINATION',
  DOUBLE_ELIMINATION = 'DOUBLE_ELIMINATION',
  ROUND_ROBIN = 'ROUND_ROBIN',
}

export enum SeedingMode {
  AUTO = 'AUTO',
  MANUAL = 'MANUAL',
  RANDOM = 'RANDOM',
}

export class CreateTournamentDto {
  @ApiProperty({ description: 'Tournament title', minLength: 3, maxLength: 100 })
  @IsString()
  @Length(3, 100)
  title: string;

  @ApiProperty({ description: 'Tournament description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Short description', required: false })
  @IsOptional()
  @IsString()
  short_description?: string;

  @ApiProperty({ enum: GameType, description: 'Game type' })
  @IsEnum(GameType)
  game_type: GameType;

  @ApiProperty({ enum: TournamentType, description: 'Tournament format' })
  @IsEnum(TournamentType)
  tournament_type: TournamentType;

  @ApiProperty({ enum: SeedingMode, description: 'Seeding mode', required: false, default: SeedingMode.AUTO })
  @IsOptional()
  @IsEnum(SeedingMode)
  seeding_mode?: SeedingMode;

  @ApiProperty({ description: 'Registration start date', required: false })
  @IsOptional()
  @IsDateString()
  registration_start?: string;

  @ApiProperty({ description: 'Registration end date', required: false })
  @IsOptional()
  @IsDateString()
  registration_end?: string;

  @ApiProperty({ description: 'Tournament start date', required: false })
  @IsOptional()
  @IsDateString()
  tournament_start?: string;

  @ApiProperty({ description: 'Tournament end date', required: false })
  @IsOptional()
  @IsDateString()
  tournament_end?: string;

  @ApiProperty({ description: 'Maximum number of teams', default: 16, minimum: 4, maximum: 128 })
  @IsOptional()
  @IsNumber()
  @Min(4)
  @Max(128)
  max_teams?: number;

  @ApiProperty({ description: 'Minimum number of teams', default: 4, minimum: 2, maximum: 64 })
  @IsOptional()
  @IsNumber()
  @Min(2)
  @Max(64)
  min_teams?: number;

  @ApiProperty({ description: 'Team size', default: 5, minimum: 1, maximum: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  team_size?: number;

  @ApiProperty({ description: 'Entry fee', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  entry_fee?: number;

  @ApiProperty({ description: 'Prize pool', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  prize_pool?: number;

  @ApiProperty({ description: 'Is tournament public', default: true })
  @IsOptional()
  @IsBoolean()
  is_public?: boolean;

  @ApiProperty({ description: 'Requires approval to join', default: false })
  @IsOptional()
  @IsBoolean()
  requires_approval?: boolean;

  @ApiProperty({ description: 'Tournament rules', required: false })
  @IsOptional()
  @IsString()
  rules?: string;

  @ApiProperty({ description: 'Banner URL', required: false })
  @IsOptional()
  @IsString()
  banner_url?: string;

  @ApiProperty({ description: 'Logo URL', required: false })
  @IsOptional()
  @IsString()
  logo_url?: string;

  @ApiProperty({ description: 'Stream URL', required: false })
  @IsOptional()
  @IsString()
  stream_url?: string;

  @ApiProperty({ description: 'Discord invite link', required: false })
  @IsOptional()
  @IsString()
  discord_invite?: string;

  @ApiProperty({ description: 'Tournament format-specific settings (JSONB)', required: false })
  @IsOptional()
  format_settings?: any;
}