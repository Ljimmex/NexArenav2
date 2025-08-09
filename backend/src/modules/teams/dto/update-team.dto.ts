import { PartialType } from '@nestjs/swagger';
import { CreateTeamDto } from './create-team.dto';
import { IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTeamDto extends PartialType(CreateTeamDto) {
  @ApiPropertyOptional({ description: 'Whether team is active', example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Whether team is verified', example: true })
  @IsOptional()
  @IsBoolean()
  is_verified?: boolean;
}