import { Body, Controller, HttpCode, HttpStatus, Post, Get, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BracketsService } from './brackets.service';
import { GenerateBracketDto, SingleEliminationBracketDto, BracketMatchDto } from './dto/bracket.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RoleGuard } from '../../common/guards/role.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { UpdateBracketMatchRequestDto } from './dto/bracket.dto';
import { Param } from '@nestjs/common';

@ApiTags('Brackets')
@ApiBearerAuth()
@Controller('brackets')
export class BracketsController {
  constructor(private readonly bracketsService: BracketsService) {}

  @Post('single-elimination/generate')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  @ApiOperation({ summary: 'Generate Single Elimination bracket (empty bracket with placeholders)' })
  @ApiResponse({ status: 201, description: 'Bracket generated', type: SingleEliminationBracketDto as any })
  @HttpCode(HttpStatus.CREATED)
  async generateSingleElimination(@Body() dto: GenerateBracketDto): Promise<SingleEliminationBracketDto> {
    return this.bracketsService.generateSingleElimination(dto);
  }

  @Post('single-elimination/update-match')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  @ApiOperation({ summary: 'Update a match result in Single Elimination bracket and propagate winners' })
  @ApiResponse({ status: 200, description: 'Match updated' })
  @HttpCode(HttpStatus.OK)
  async updateMatch(@Body() dto: UpdateBracketMatchRequestDto) {
    return this.bracketsService.updateSingleEliminationMatch(dto);
  }

  @Post('single-elimination/reset/:tournamentId/:matchId')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  @ApiOperation({ summary: 'Reset a match and clear downstream placements to placeholders' })
  @ApiResponse({ status: 200, description: 'Match reset' })
  @HttpCode(HttpStatus.OK)
  async resetMatch(@Param('tournamentId') tournamentId: string, @Param('matchId') matchId: string) {
    return this.bracketsService.resetSingleEliminationMatch(tournamentId, matchId);
  }

  @Get('single-elimination/:tournamentId')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  @ApiOperation({ summary: 'Get complete Single Elimination bracket structure' })
  @ApiResponse({ status: 200, description: 'Complete bracket structure', type: SingleEliminationBracketDto as any })
  async getSingleEliminationBracket(@Param('tournamentId') tournamentId: string): Promise<SingleEliminationBracketDto> {
    return this.bracketsService.getSingleEliminationBracket(tournamentId);
  }

  @Get('single-elimination/:tournamentId/matches')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  @ApiOperation({ summary: 'List all matches in Single Elimination bracket' })
  @ApiResponse({ status: 200, description: 'List of matches', type: [BracketMatchDto] })
  async listMatches(
    @Param('tournamentId') tournamentId: string,
    @Query('groupId') groupId?: string
  ): Promise<BracketMatchDto[]> {
    return this.bracketsService.listSingleEliminationMatches(tournamentId, groupId);
  }

  @Get('single-elimination/:tournamentId/groups')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  @ApiOperation({ summary: 'Get list of groups in tournament' })
  @ApiResponse({ status: 200, description: 'List of groups' })
  async getGroups(@Param('tournamentId') tournamentId: string) {
    return this.bracketsService.getGroups(tournamentId);
  }

  @Get('single-elimination/:tournamentId/matches/:matchId')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  getSingleEliminationMatch(@Param('tournamentId') tournamentId: string, @Param('matchId') matchId: string) {
    return this.bracketsService.getSingleEliminationMatch(tournamentId, matchId);
  }

  @Get('single-elimination/:tournamentId/placements')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  listPlacements(@Param('tournamentId') tournamentId: string) {
    return this.bracketsService.listPlacements(tournamentId);
  }

  @Get('single-elimination/:tournamentId/summary')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  getSummary(@Param('tournamentId') tournamentId: string) {
    return this.bracketsService.getSummary(tournamentId);
  }

  @Get('single-elimination/:tournamentId/final-placements')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  getFinalPlacements(@Param('tournamentId') tournamentId: string) {
    return this.bracketsService.getFinalPlacements(tournamentId);
  }
  @Post('single-elimination/:tournamentId/final-placements/recompute')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  @ApiOperation({ summary: 'Recompute and persist final placements for Single Elimination bracket' })
  @ApiResponse({ status: 200, description: 'Final placements recomputed' })
  @HttpCode(HttpStatus.OK)
  recomputeFinalPlacements(@Param('tournamentId') tournamentId: string) {
    return this.bracketsService.recomputeFinalPlacements(tournamentId);
  }

  @Post('single-elimination/:tournamentId/sync-matches')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  @ApiOperation({ summary: 'Synchronize bracket matches with the matches table' })
  @ApiResponse({ status: 200, description: 'Matches synchronized successfully' })
  @HttpCode(HttpStatus.OK)
  async syncMatches(@Param('tournamentId') tournamentId: string) {
    return this.bracketsService.syncBracketMatchesToDatabase(tournamentId);
  }
  @ApiOperation({ summary: 'Get a single match by ID for Single Elimination bracket' })
  @ApiResponse({ status: 200, description: 'Match details', type: Object as any })
  async getMatch(
    @Param('tournamentId') tournamentId: string,
    @Param('matchId') matchId: string,
  ): Promise<BracketMatchDto> {
    return this.bracketsService.getSingleEliminationMatch(tournamentId, matchId);
  }
}