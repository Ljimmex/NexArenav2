import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, UseGuards, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiExtraModels, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { MatchesService } from './matches.service'
import { AuthGuard } from '../../common/guards/auth.guard'
import { RoleGuard } from '../../common/guards/role.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { UserRole } from '../../common/enums/user-role.enum'
import { CreateMatchDto } from './dto/create-match.dto'
import { UpdateMatchDto } from './dto/update-match.dto'
import { MatchDto, MatchStatus, MatchStage } from './dto/match.dto'

@ApiTags('Matches')
@ApiBearerAuth()
@ApiExtraModels(MatchDto)
@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  @ApiOperation({ summary: 'Create a match' })
  @ApiResponse({ status: 201, description: 'Match created', type: MatchDto })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateMatchDto): Promise<MatchDto> {
    return this.matchesService.create(dto)
  }

  @Get('tournament/:tournamentId')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  @ApiOperation({ summary: 'List matches for a tournament with filters, sorting and pagination' })
  @ApiParam({ name: 'tournamentId', description: 'Tournament UUID' })
  @ApiQuery({ name: 'status', required: false, enum: MatchStatus, description: 'Filter by match status' })
  @ApiQuery({ name: 'stage', required: false, enum: MatchStage, description: 'Filter by match stage' })
  @ApiQuery({ name: 'team_id', required: false, type: String, description: 'Filter by team participation (UUID)' })
  @ApiQuery({ name: 'scheduled_from', required: false, type: String, description: 'Scheduled at from (ISO date)' })
  @ApiQuery({ name: 'scheduled_to', required: false, type: String, description: 'Scheduled at to (ISO date)' })
  @ApiQuery({ name: 'sort_by', required: false, type: String, description: 'Sort by field (default: scheduled_at)' })
  @ApiQuery({ name: 'sort_dir', required: false, enum: ['asc', 'desc'], description: 'Sort direction (asc|desc)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20, max: 100)' })
  @ApiResponse({
    status: 200,
    description: 'Matches list with pagination',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { $ref: '#/components/schemas/MatchDto' } },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  findAllByTournament(
    @Param('tournamentId', ParseUUIDPipe) tournamentId: string,
    @Query('status') status?: MatchStatus,
    @Query('stage') stage?: MatchStage,
    @Query('team_id') team_id?: string,
    @Query('scheduled_from') scheduled_from?: string,
    @Query('scheduled_to') scheduled_to?: string,
    @Query('sort_by') sort_by?: string,
    @Query('sort_dir') sort_dir?: 'asc' | 'desc',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{ data: MatchDto[]; total: number; page: number; limit: number; totalPages: number }> {
    const pageNum = page ? Number(page) : 1
    const limitNum = limit ? Number(limit) : 20
    return this.matchesService.findAllByTournament(tournamentId, {
      status,
      stage,
      team_id,
      scheduled_from,
      scheduled_to,
      sort_by,
      sort_dir,
      page: pageNum,
      limit: limitNum,
    })
  }

  @Get('global')
  @ApiOperation({ summary: 'List matches globally with filters, sorting and pagination' })
  @ApiQuery({ name: 'tournament_id', required: false, type: String, description: 'Filter by tournament UUID' })
  @ApiQuery({ name: 'status', required: false, enum: MatchStatus, description: 'Filter by match status' })
  @ApiQuery({ name: 'stage', required: false, enum: MatchStage, description: 'Filter by match stage' })
  @ApiQuery({ name: 'team_id', required: false, type: String, description: 'Filter by team participation (UUID)' })
  @ApiQuery({ name: 'scheduled_from', required: false, type: String, description: 'Scheduled at from (ISO date)' })
  @ApiQuery({ name: 'scheduled_to', required: false, type: String, description: 'Scheduled at to (ISO date)' })
  @ApiQuery({ name: 'sort_by', required: false, type: String, description: 'Sort by field (default: scheduled_at)' })
  @ApiQuery({ name: 'sort_dir', required: false, enum: ['asc', 'desc'], description: 'Sort direction (asc|desc)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20, max: 100)' })
  @ApiResponse({
    status: 200,
    description: 'Matches list with pagination',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { $ref: '#/components/schemas/MatchDto' } },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  findAllGlobal(
    @Query('tournament_id') tournament_id?: string,
    @Query('status') status?: MatchStatus,
    @Query('stage') stage?: MatchStage,
    @Query('team_id') team_id?: string,
    @Query('scheduled_from') scheduled_from?: string,
    @Query('scheduled_to') scheduled_to?: string,
    @Query('sort_by') sort_by?: string,
    @Query('sort_dir') sort_dir?: 'asc' | 'desc',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{ data: MatchDto[]; total: number; page: number; limit: number; totalPages: number }> {
    const pageNum = page ? Number(page) : 1
    const limitNum = limit ? Number(limit) : 20
    return this.matchesService.findAllGlobal({
      tournament_id,
      status,
      stage,
      team_id,
      scheduled_from,
      scheduled_to,
      sort_by,
      sort_dir,
      page: pageNum,
      limit: limitNum,
    })
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get the nearest upcoming matches across all tournaments' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'How many upcoming matches to return (default: 1)' })
  @ApiResponse({ status: 200, description: 'Upcoming matches', type: [MatchDto] })
  getUpcoming(@Query('limit') limit?: string): Promise<MatchDto[]> {
    const n = limit ? Math.max(1, Number(limit)) : 1
    return this.matchesService.getUpcoming(n)
  }

  @Get('user/:userId/recent')
  @ApiOperation({ summary: 'List recent finished matches for a given user (by their teams)' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiResponse({
    status: 200,
    description: 'Recent matches for a user',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { $ref: '#/components/schemas/MatchDto' } },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  recentByUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{ data: MatchDto[]; total: number; page: number; limit: number; totalPages: number }> {
    const pageNum = page ? Number(page) : 1
    const limitNum = limit ? Number(limit) : 10
    return this.matchesService.findRecentByUser(userId, pageNum, limitNum)
  }

  @Get(':id')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  @ApiOperation({ summary: 'Get a single match by ID' })
  @ApiParam({ name: 'id', description: 'Match UUID' })
  @ApiResponse({ status: 200, description: 'Match fetched', type: MatchDto })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<MatchDto> {
    return this.matchesService.findOne(id)
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  @ApiOperation({ summary: 'Update a match' })
  @ApiParam({ name: 'id', description: 'Match UUID' })
  @ApiResponse({ status: 200, description: 'Match updated', type: MatchDto })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMatchDto): Promise<MatchDto> {
    return this.matchesService.update(id, dto)
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  @ApiOperation({ summary: 'Delete a match' })
  @ApiParam({ name: 'id', description: 'Match UUID' })
  @ApiResponse({ status: 200, description: 'Match deleted' })
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ id: string }> {
    return this.matchesService.remove(id)
  }
}