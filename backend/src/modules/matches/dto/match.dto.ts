import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsArray, IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator'

export enum MatchStage {
  GROUP = 'GROUP',
  PLAYOFF = 'PLAYOFF',
  FINAL = 'FINAL',
  THIRD_PLACE = 'THIRD_PLACE',
}

export enum MatchStatus {
  UNSCHEDULED = 'UNSCHEDULED',
  SCHEDULED = 'SCHEDULED',
  LIVE = 'LIVE',
  FINISHED = 'FINISHED',
  POSTPONED = 'POSTPONED',
  CANCELLED = 'CANCELLED',
  FORFEIT = 'FORFEIT',
}

export class MatchDto {
  @ApiProperty({ description: 'Match ID (UUID)' })
  @IsUUID()
  id: string

  @ApiProperty({ description: 'Tournament ID (UUID)' })
  @IsUUID()
  tournament_id: string

  @ApiProperty({ description: 'Round number (1 = first round)' })
  @IsInt()
  @Min(1)
  round: number

  @ApiProperty({ enum: MatchStage, description: 'Match stage' })
  @IsEnum(MatchStage)
  stage: MatchStage

  @ApiProperty({ enum: MatchStatus, description: 'Current match status' })
  @IsEnum(MatchStatus)
  status: MatchStatus

  @ApiPropertyOptional({ description: 'First team ID (UUID)' })
  @IsOptional()
  @IsUUID()
  team1_id?: string | null

  @ApiPropertyOptional({ description: 'Second team ID (UUID)' })
  @IsOptional()
  @IsUUID()
  team2_id?: string | null

  @ApiPropertyOptional({ description: 'Winner team ID (UUID)' })
  @IsOptional()
  @IsUUID()
  winner_id?: string | null

  @ApiPropertyOptional({ description: 'Scheduled start time (ISO date)' })
  @IsOptional()
  @IsDateString()
  scheduled_at?: string | null

  @ApiPropertyOptional({ description: 'Actual start time (ISO date)' })
  @IsOptional()
  @IsDateString()
  started_at?: string | null

  @ApiPropertyOptional({ description: 'Finish time (ISO date)' })
  @IsOptional()
  @IsDateString()
  finished_at?: string | null

  @ApiPropertyOptional({ description: 'Best-of value (must be odd, e.g., 1, 3, 5)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  best_of?: number | null

  @ApiPropertyOptional({ description: 'Current game number in series' })
  @IsOptional()
  @IsInt()
  @Min(1)
  current_game?: number | null

  @ApiPropertyOptional({ description: 'Score for team 1' })
  @IsOptional()
  @IsInt()
  @Min(0)
  team1_score?: number | null

  @ApiPropertyOptional({ description: 'Score for team 2' })
  @IsOptional()
  @IsInt()
  @Min(0)
  team2_score?: number | null

  @ApiPropertyOptional({ description: 'Detailed per-map/game scores', type: 'array', isArray: true })
  @IsOptional()
  @IsArray()
  detailed_scores?: any[] | null

  @ApiPropertyOptional({ description: 'Map pool' })
  @IsOptional()
  @IsArray()
  map_pool?: string[] | null

  @ApiPropertyOptional({ description: 'Map picks/bans as object' })
  @IsOptional()
  map_picks?: Record<string, any> | null

  @ApiPropertyOptional({ description: 'Stream URL' })
  @IsOptional()
  @IsString()
  stream_url?: string | null

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string | null

  @ApiPropertyOptional({ description: 'Created at (ISO date)' })
  @IsOptional()
  @IsDateString()
  created_at?: string

  @ApiPropertyOptional({ description: 'Updated at (ISO date)' })
  @IsOptional()
  @IsDateString()
  updated_at?: string
}