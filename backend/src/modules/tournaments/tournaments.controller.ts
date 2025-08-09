import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { TournamentsService } from './tournaments.service';
import { CreateTournamentDto, UpdateTournamentDto, TournamentResponseDto } from './dto';
import { AdminGuard } from '../../common/guards/admin.guard';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RoleGuard } from '../../common/guards/role.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { UsersService } from '../../modules/users/users.service';

@ApiTags('tournaments')
@Controller('tournaments')
export class TournamentsController {
  constructor(
    private readonly tournamentsService: TournamentsService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Create a new tournament', description: 'Creates a new tournament. Requires authentication.' })
  @ApiResponse({ status: 201, description: 'Tournament created successfully', type: TournamentResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth()
  async create(@Body() createTournamentDto: CreateTournamentDto, @Request() req): Promise<TournamentResponseDto> {
    const supabaseUser = req.user;
    const internalUser = await this.usersService.findBySupabaseId(supabaseUser.id);
    return this.tournamentsService.create(createTournamentDto, internalUser.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tournaments' })
  @ApiQuery({ name: 'game_type', required: false, type: String, description: 'Filter by game type' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by status' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in title and description' })
  @ApiResponse({
    status: 200,
    description: 'Tournaments retrieved successfully',
    type: [TournamentResponseDto],
  })
  async findAll(
    @Query('game_type') game_type?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ): Promise<TournamentResponseDto[]> {
    return this.tournamentsService.findAll({ game_type, status, search });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tournament by ID' })
  @ApiResponse({
    status: 200,
    description: 'Tournament retrieved successfully',
    type: TournamentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tournament not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<TournamentResponseDto> {
    return this.tournamentsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Update tournament' })
  @ApiResponse({
    status: 200,
    description: 'Tournament updated successfully',
    type: TournamentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Tournament not found' })
  @ApiBearerAuth()
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTournamentDto: UpdateTournamentDto,
    @Request() req: any,
  ): Promise<TournamentResponseDto> {
    const supabaseUser = req.user;
    const internalUser = await this.usersService.findBySupabaseId(supabaseUser.id);
    return this.tournamentsService.update(id, updateTournamentDto, internalUser);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Delete tournament' })
  @ApiResponse({ status: 200, description: 'Tournament deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Tournament not found' })
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: any): Promise<{ message: string }> {
    const supabaseUser = req.user;
    const internalUser = await this.usersService.findBySupabaseId(supabaseUser.id);
    await this.tournamentsService.remove(id, internalUser);
    return { message: 'Tournament deleted successfully' };
  }

  @Patch(':id/status')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update tournament status (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Tournament status updated successfully',
    type: TournamentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Tournament not found' })
  @ApiBearerAuth()
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: string,
    @Request() req: any,
  ): Promise<TournamentResponseDto> {
    const supabaseUser = req.user;
    const internalUser = await this.usersService.findBySupabaseId(supabaseUser.id);
    return this.tournamentsService.updateStatus(id, status, internalUser);
  }

  @Post(':id/teams/:teamId')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Register team for tournament' })
  @ApiResponse({ status: 201, description: 'Team registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Tournament or team not found' })
  @ApiResponse({ status: 409, description: 'Team already registered' })
  @ApiBearerAuth()
  async registerTeam(
    @Param('id', ParseUUIDPipe) tournamentId: string,
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Request() req: any,
  ): Promise<{ message: string }> {
    const supabaseUser = req.user;
    const internalUser = await this.usersService.findBySupabaseId(supabaseUser.id);
    await this.tournamentsService.registerTeam(tournamentId, teamId, internalUser.id);
    return { message: 'Team registered successfully' };
  }

  @Delete(':id/teams/:teamId')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Unregister team from tournament' })
  @ApiResponse({ status: 200, description: 'Team unregistered successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Tournament or team not found' })
  @ApiBearerAuth()
  async unregisterTeam(
    @Param('id', ParseUUIDPipe) tournamentId: string,
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Request() req: any,
  ): Promise<{ message: string }> {
    const supabaseUser = req.user;
    const internalUser = await this.usersService.findBySupabaseId(supabaseUser.id);
    await this.tournamentsService.unregisterTeam(tournamentId, teamId, internalUser.id);
    return { message: 'Team unregistered successfully' };
  }

  @Get(':id/teams')
  @ApiOperation({ summary: 'Get registered teams for tournament' })
  @ApiResponse({ status: 200, description: 'Teams retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Tournament not found' })
  async getRegisteredTeams(@Param('id') tournamentId: string) {
    return this.tournamentsService.getRegisteredTeams(tournamentId);
  }
}