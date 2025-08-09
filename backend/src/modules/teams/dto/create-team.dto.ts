import { IsString, IsOptional, IsBoolean, IsInt, IsUrl, MinLength, MaxLength, Matches, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTeamDto {
  @ApiProperty({ description: 'Team name', example: 'Team Liquid' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @ApiProperty({ description: 'Team tag/abbreviation', example: 'TL' })
  @IsString()
  @MinLength(2)
  @MaxLength(10)
  @Matches(/^[A-Z0-9_-]+$/, { message: 'Tag can only contain uppercase letters, numbers, underscores and hyphens' })
  tag: string;

  @ApiPropertyOptional({ description: 'Team description', example: 'Professional esports team' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ description: 'Team logo URL', example: 'https://example.com/logo.png' })
  @IsOptional()
  @IsUrl()
  logo_url?: string;

  @ApiPropertyOptional({ description: 'Team banner URL', example: 'https://example.com/banner.jpg' })
  @IsOptional()
  @IsUrl()
  banner_url?: string;

  @ApiPropertyOptional({ description: 'Country code', example: 'US' })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  country?: string;

  @ApiPropertyOptional({ description: 'Team website URL', example: 'https://teamliquid.com' })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({ description: 'Discord server URL', example: 'https://discord.gg/teamliquid' })
  @IsOptional()
  @IsUrl()
  discord_url?: string;

  @ApiPropertyOptional({ description: 'Twitter profile URL', example: 'https://twitter.com/teamliquid' })
  @IsOptional()
  @IsUrl()
  twitter_url?: string;

  @ApiPropertyOptional({ description: 'Maximum number of team members', example: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  max_members?: number;

  @ApiProperty({ description: 'ID of the user creating the team' })
  @IsString()
  created_by: string;
}