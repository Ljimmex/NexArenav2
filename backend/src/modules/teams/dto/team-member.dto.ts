import { IsString, IsEnum, IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TeamRole {
  CAPTAIN = 'CAPTAIN',
  PLAYER = 'PLAYER',
  SUBSTITUTE = 'SUBSTITUTE',
  COACH = 'COACH',
  MANAGER = 'MANAGER'
}

export class AddTeamMemberDto {
  @ApiProperty({ description: 'User ID to add to team' })
  @IsString()
  user_id: string;

  @ApiProperty({ description: 'Role in the team', enum: TeamRole, example: TeamRole.PLAYER })
  @IsEnum(TeamRole)
  role: TeamRole;
}

export class UpdateTeamMemberDto {
  @ApiPropertyOptional({ description: 'Role in the team', enum: TeamRole, example: TeamRole.PLAYER })
  @IsOptional()
  @IsEnum(TeamRole)
  role?: TeamRole;

  @ApiPropertyOptional({ description: 'Whether member is active', example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Date when member left the team', example: '2024-01-15T10:30:00Z' })
  @IsOptional()
  @IsDateString()
  left_at?: string;
}

export class TeamMemberResponseDto {
  @ApiProperty({ description: 'Member ID' })
  id: string;

  @ApiProperty({ description: 'Team ID' })
  team_id: string;

  @ApiProperty({ description: 'User ID' })
  user_id: string;

  @ApiProperty({ description: 'Role in the team', enum: TeamRole })
  role: TeamRole;

  @ApiProperty({ description: 'Whether member is active' })
  is_active: boolean;

  @ApiProperty({ description: 'Date when member joined the team' })
  joined_at: string;

  @ApiPropertyOptional({ description: 'Date when member left the team' })
  left_at?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  created_at: string;

  @ApiProperty({ description: 'Last update timestamp' })
  updated_at: string;

  @ApiPropertyOptional({ description: 'User details' })
  user?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
    country?: string;
  };
}