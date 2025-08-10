import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsNumber, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum BracketType {
  SINGLE_ELIMINATION = 'SINGLE_ELIMINATION',
  DOUBLE_ELIMINATION = 'DOUBLE_ELIMINATION',
  ROUND_ROBIN = 'ROUND_ROBIN',
  SWISS = 'SWISS',
  GROUP_STAGE = 'GROUP_STAGE',
}

export enum ParticipantType {
  TEAM = 'TEAM',
  PLACEHOLDER_WINNER = 'PLACEHOLDER_WINNER',
  PLACEHOLDER_LOSER = 'PLACEHOLDER_LOSER',
  PLACEHOLDER_SWISS = 'PLACEHOLDER_SWISS',
  PLACEHOLDER_ROUND_ROBIN = 'PLACEHOLDER_ROUND_ROBIN',
  PLACEHOLDER_GROUP = 'PLACEHOLDER_GROUP',
  PLACEHOLDER_SEED = 'PLACEHOLDER_SEED',
  TBD = 'TBD',
}

export enum MatchStatus {
  PENDING = 'PENDING',
  SCHEDULED = 'SCHEDULED',
  LIVE = 'LIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  WALKOVER = 'WALKOVER',
  DISQUALIFIED = 'DISQUALIFIED',
}

export class ParticipantDto {
  @ApiProperty({ description: 'Participant ID (team UUID or placeholder)' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Display name' })
  @IsString()
  name: string;

  @ApiProperty({ enum: ParticipantType })
  @IsEnum(ParticipantType)
  type: ParticipantType;

  @ApiPropertyOptional({ description: 'Team logo URL' })
  @IsOptional()
  @IsString()
  logo_url?: string;

  @ApiPropertyOptional({ description: 'Seed position' })
  @IsOptional()
  @IsNumber()
  seed?: number;

  @ApiPropertyOptional({ description: 'Reference data for placeholders' })
  @IsOptional()
  placeholder_reference?: {
    match_id?: string;
    group_id?: string;
    swiss_place?: number;
    round_robin_position?: string; // A1, B2, etc.
  };
}

export class BracketMatchDto {
  @ApiProperty({ description: 'Match ID' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Match number within bracket' })
  @IsNumber()
  match_number: number;

  @ApiProperty({ description: 'Round number (1 = first round)' })
  @IsNumber()
  round: number;

  @ApiProperty({ description: 'Position in round' })
  @IsNumber()
  position_in_round: number;

  @ApiProperty({ type: ParticipantDto })
  @ValidateNested()
  @Type(() => ParticipantDto)
  participant1: ParticipantDto;

  @ApiProperty({ type: ParticipantDto })
  @ValidateNested()
  @Type(() => ParticipantDto)
  participant2: ParticipantDto;

  @ApiPropertyOptional({ type: ParticipantDto, description: 'Winner of the match' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ParticipantDto)
  winner?: ParticipantDto;

  @ApiProperty({ enum: MatchStatus })
  @IsEnum(MatchStatus)
  status: MatchStatus;

  @ApiPropertyOptional({ description: 'Scheduled start time' })
  @IsOptional()
  @IsString()
  scheduled_at?: string;

  @ApiPropertyOptional({ description: 'Best of X games' })
  @IsOptional()
  @IsNumber()
  best_of?: number;

  @ApiPropertyOptional({ description: 'Score participant 1' })
  @IsOptional()
  @IsNumber()
  score1?: number;

  @ApiPropertyOptional({ description: 'Score participant 2' })
  @IsOptional()
  @IsNumber()
  score2?: number;

  @ApiPropertyOptional({ description: 'Match that gets the winner' })
  @IsOptional()
  @IsString()
  next_match_id?: string;

  @ApiPropertyOptional({ description: 'Position in next match (1 or 2)' })
  @IsOptional()
  @IsNumber()
  next_match_position?: number;

  @ApiPropertyOptional({ description: 'Is this a bronze medal match' })
  @IsOptional()
  @IsBoolean()
  is_bronze_match?: boolean;

  @ApiPropertyOptional({ description: 'Match is finalized and cannot be changed' })
  @IsOptional()
  @IsBoolean()
  is_finalized?: boolean;

  @ApiPropertyOptional({ description: 'Participant who was disqualified' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ParticipantDto)
  disqualified_participant?: ParticipantDto;
}

export class BracketRoundDto {
  @ApiProperty({ description: 'Round number' })
  @IsNumber()
  round: number;

  @ApiProperty({ description: 'Round name (e.g., "Round of 16", "Quarterfinals")' })
  @IsString()
  name: string;

  @ApiProperty({ type: [BracketMatchDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BracketMatchDto)
  matches: BracketMatchDto[];

  @ApiPropertyOptional({ description: 'Is this the bronze medal round' })
  @IsOptional()
  @IsBoolean()
  is_bronze_round?: boolean;
}

export class SingleEliminationBracketDto {
  @ApiProperty({ description: 'Tournament ID' })
  @IsString()
  tournament_id: string;

  @ApiProperty({ enum: BracketType })
  @IsEnum(BracketType)
  type: BracketType;

  @ApiProperty({ description: 'Total number of participants' })
  @IsNumber()
  total_participants: number;

  @ApiProperty({ description: 'Number of rounds (including bronze match if enabled)' })
  @IsNumber()
  total_rounds: number;

  @ApiProperty({ type: [BracketRoundDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BracketRoundDto)
  rounds: BracketRoundDto[];

  @ApiPropertyOptional({ description: 'Bronze medal match enabled' })
  @IsOptional()
  @IsBoolean()
  bronze_match?: boolean;

  @ApiPropertyOptional({ description: 'Number of groups (for group-based tournaments)' })
  @IsOptional()
  @IsNumber()
  number_of_groups?: number;

  @ApiProperty({ description: 'Bracket metadata' })
  metadata: {
    created_at: string;
    updated_at: string;
    is_finalized: boolean;
    is_bracket_complete?: boolean;
    advancement_rules?: string;
    placements?: Array<{
      participant_id: string;
      name?: string;
      place: number;
      dsq?: boolean;
      ex_aequo?: boolean;
    }>;
  };
}

export class GenerateBracketDto {
  @ApiProperty({ description: 'Tournament ID' })
  @IsString()
  tournament_id: string;

  @ApiProperty({ description: 'Maximum number of participants' })
  @IsNumber()
  max_participants: number;

  @ApiPropertyOptional({ description: 'Enable bronze medal match', default: false })
  @IsOptional()
  @IsBoolean()
  bronze_match?: boolean;

  @ApiPropertyOptional({ description: 'Number of groups for group stage', default: 1 })
  @IsOptional()
  @IsNumber()
  number_of_groups?: number;

  @ApiPropertyOptional({ description: 'Custom advancement rules' })
  @IsOptional()
  @IsString()
  advancement_rules?: string;

  @ApiPropertyOptional({ type: [ParticipantDto], description: 'Pre-seeded participants' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParticipantDto)
  participants?: ParticipantDto[];
}

export class UpdateBracketMatchDto {
  @ApiProperty({ description: 'Match ID' })
  @IsString()
  match_id: string;

  @ApiPropertyOptional({ description: 'Winner participant ID' })
  @IsOptional()
  @IsString()
  winner_id?: string;

  @ApiPropertyOptional({ description: 'Score for participant 1' })
  @IsOptional()
  @IsNumber()
  score1?: number;

  @ApiPropertyOptional({ description: 'Score for participant 2' })
  @IsOptional()
  @IsNumber()
  score2?: number;

  @ApiProperty({ enum: MatchStatus })
  @IsEnum(MatchStatus)
  status: MatchStatus;
}

export class UpdateBracketMatchRequestDto extends UpdateBracketMatchDto {
  @ApiProperty({ description: 'Tournament ID' })
  @IsString()
  tournament_id: string;

  @ApiPropertyOptional({ description: 'Disqualified participant ID' })
  @IsOptional()
  @IsString()
  disqualified_participant_id?: string;

  @ApiPropertyOptional({ description: 'Force update even if match is finalized' })
  @IsOptional()
  @IsBoolean()
  force_update?: boolean;
}