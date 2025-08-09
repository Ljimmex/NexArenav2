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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamResponseDto } from './dto/team-response.dto';
import { AddTeamMemberDto, UpdateTeamMemberDto, TeamMemberResponseDto } from './dto/team-member.dto';

@ApiTags('teams')
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new team' })
  @ApiResponse({
    status: 201,
    description: 'Team created successfully',
    type: TeamResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Team with this name or tag already exists' })
  async create(@Body() createTeamDto: CreateTeamDto): Promise<TeamResponseDto> {
    return this.teamsService.create(createTeamDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all teams with pagination and search' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in name, tag, or description' })
  @ApiResponse({
    status: 200,
    description: 'Teams retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { $ref: '#/components/schemas/TeamResponseDto' } },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.teamsService.findAll(page, limit, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get team by ID' })
  @ApiParam({ name: 'id', description: 'Team UUID' })
  @ApiResponse({
    status: 200,
    description: 'Team found',
    type: TeamResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Team not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<TeamResponseDto> {
    return this.teamsService.findOne(id);
  }

  @Get('tag/:tag')
  @ApiOperation({ summary: 'Get team by tag' })
  @ApiParam({ name: 'tag', description: 'Team tag' })
  @ApiResponse({
    status: 200,
    description: 'Team found',
    type: TeamResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Team not found' })
  async findByTag(@Param('tag') tag: string): Promise<TeamResponseDto> {
    return this.teamsService.findByTag(tag);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get teams for a specific user' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiResponse({
    status: 200,
    description: 'User teams retrieved successfully',
    type: [TeamResponseDto],
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async findUserTeams(@Param('userId', ParseUUIDPipe) userId: string): Promise<TeamResponseDto[]> {
    return this.teamsService.findUserTeams(userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update team' })
  @ApiParam({ name: 'id', description: 'Team UUID' })
  @ApiResponse({
    status: 200,
    description: 'Team updated successfully',
    type: TeamResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Team not found' })
  @ApiResponse({ status: 409, description: 'Team with this name or tag already exists' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTeamDto: UpdateTeamDto,
  ): Promise<TeamResponseDto> {
    return this.teamsService.update(id, updateTeamDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete team' })
  @ApiParam({ name: 'id', description: 'Team UUID' })
  @ApiResponse({ status: 204, description: 'Team deleted successfully' })
  @ApiResponse({ status: 404, description: 'Team not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.teamsService.remove(id);
  }

  // Team Members endpoints
  @Get(':id/members')
  @ApiOperation({ summary: 'Get all team members' })
  @ApiParam({ name: 'id', description: 'Team UUID' })
  @ApiResponse({
    status: 200,
    description: 'Team members retrieved successfully',
    type: [TeamMemberResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Team not found' })
  async getTeamMembers(@Param('id', ParseUUIDPipe) id: string): Promise<TeamMemberResponseDto[]> {
    return this.teamsService.getTeamMembers(id);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add member to team' })
  @ApiParam({ name: 'id', description: 'Team UUID' })
  @ApiResponse({
    status: 201,
    description: 'Member added successfully',
    type: TeamMemberResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Team or user not found' })
  @ApiResponse({ status: 409, description: 'User is already a member of this team' })
  async addMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() addMemberDto: AddTeamMemberDto,
  ): Promise<TeamMemberResponseDto> {
    return this.teamsService.addMember(id, addMemberDto);
  }

  @Patch(':id/members/:memberId')
  @ApiOperation({ summary: 'Update team member' })
  @ApiParam({ name: 'id', description: 'Team UUID' })
  @ApiParam({ name: 'memberId', description: 'Member UUID' })
  @ApiResponse({
    status: 200,
    description: 'Member updated successfully',
    type: TeamMemberResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Team or member not found' })
  async updateMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() updateMemberDto: UpdateTeamMemberDto,
  ): Promise<TeamMemberResponseDto> {
    return this.teamsService.updateMember(id, memberId, updateMemberDto);
  }

  @Delete(':id/members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove member from team' })
  @ApiParam({ name: 'id', description: 'Team UUID' })
  @ApiParam({ name: 'memberId', description: 'Member UUID' })
  @ApiResponse({ status: 204, description: 'Member removed successfully' })
  @ApiResponse({ status: 404, description: 'Team or member not found' })
  async removeMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ): Promise<void> {
    return this.teamsService.removeMember(id, memberId);
  }

  @Patch(':id/stats')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update team statistics' })
  @ApiParam({ name: 'id', description: 'Team UUID' })
  @ApiResponse({ status: 204, description: 'Team stats updated successfully' })
  @ApiResponse({ status: 404, description: 'Team not found' })
  async updateStats(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() stats: Partial<{
      games_played: number;
      games_won: number;
      tournaments_played: number;
      tournaments_won: number;
      total_prize_money: number;
      ranking_points: number;
      current_streak: number;
      best_streak: number;
    }>,
  ): Promise<void> {
    return this.teamsService.updateStats(id, stats);
  }
}