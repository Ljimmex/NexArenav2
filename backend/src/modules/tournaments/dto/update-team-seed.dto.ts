import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

export class UpdateTeamSeedDto {
  @ApiProperty({ description: 'Seed number for the team', minimum: 1 })
  @IsNumber()
  @IsPositive()
  seed: number;
}