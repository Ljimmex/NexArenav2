import { IsString, IsEmail, IsOptional, IsEnum, IsDateString, MaxLength, MinLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../common/enums';

export class CreateUserDto {
  @ApiPropertyOptional({ description: 'Supabase user ID', example: 'uuid-string' })
  @IsOptional()
  @IsString()
  supabase_user_id?: string;

  @ApiProperty({ description: 'Unique username', example: 'player123' })
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: 'Username can only contain letters, numbers, underscores and hyphens' })
  username: string;

  @ApiPropertyOptional({ description: 'Display name', example: 'Pro Player' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  display_name?: string;

  @ApiProperty({ description: 'Email address', example: 'player@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Avatar URL', example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatar_url?: string;

  @ApiPropertyOptional({ description: 'User bio', example: 'Professional esports player' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({ description: 'Country code', example: 'PL' })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  country?: string;

  @ApiPropertyOptional({ description: 'City', example: 'Warsaw' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ description: 'Date of birth', example: '1995-01-15' })
  @IsOptional()
  @IsDateString()
  date_of_birth?: string;

  @ApiPropertyOptional({ description: 'User role', enum: UserRole, example: UserRole.USER })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}