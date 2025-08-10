import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator'
import { MatchStage } from './match.dto'

export class CreateMatchDto {
  @ApiProperty({ description: 'Tournament ID (UUID)' })
  @IsUUID()
  tournament_id: string

  @ApiProperty({ description: 'Round number (1 = first round)' })
  @IsInt()
  @Min(1)
  round: number

  @ApiProperty({ enum: MatchStage, description: 'Match stage', default: MatchStage.PLAYOFF })
  @IsEnum(MatchStage)
  stage: MatchStage = MatchStage.PLAYOFF

  @ApiPropertyOptional({ description: 'First team ID (UUID)' })
  @IsOptional()
  @IsUUID()
  team1_id?: string

  @ApiPropertyOptional({ description: 'Second team ID (UUID)' })
  @IsOptional()
  @IsUUID()
  team2_id?: string

  @ApiPropertyOptional({ description: 'Scheduled start time (ISO date)' })
  @IsOptional()
  @IsDateString()
  scheduled_at?: string

  @ApiPropertyOptional({ description: 'Best-of value (must be odd, e.g., 1, 3, 5)', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  best_of?: number

  @ApiPropertyOptional({ description: 'Stream URL' })
  @IsOptional()
  @IsString()
  stream_url?: string

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string
}