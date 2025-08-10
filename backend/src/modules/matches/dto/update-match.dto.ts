import { PartialType } from '@nestjs/swagger'
import { CreateMatchDto } from './create-match.dto'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator'
import { MatchStatus } from './match.dto'

export class UpdateMatchDto extends PartialType(CreateMatchDto) {
  @ApiPropertyOptional({ enum: MatchStatus, description: 'Current match status' })
  @IsOptional()
  @IsEnum(MatchStatus)
  status?: MatchStatus

  @ApiPropertyOptional({ description: 'Winner team ID (UUID)' })
  @IsOptional()
  @IsUUID()
  winner_id?: string

  @ApiPropertyOptional({ description: 'Actual start time (ISO date)' })
  @IsOptional()
  @IsDateString()
  started_at?: string

  @ApiPropertyOptional({ description: 'Finish time (ISO date)' })
  @IsOptional()
  @IsDateString()
  finished_at?: string

  @ApiPropertyOptional({ description: 'Current game number in series' })
  @IsOptional()
  @IsInt()
  @Min(1)
  current_game?: number

  @ApiPropertyOptional({ description: 'Score for team 1' })
  @IsOptional()
  @IsInt()
  @Min(0)
  team1_score?: number

  @ApiPropertyOptional({ description: 'Score for team 2' })
  @IsOptional()
  @IsInt()
  @Min(0)
  team2_score?: number
}