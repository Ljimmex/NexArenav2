import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'User with this username or email already exists' })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getCurrentUser(@CurrentUser() currentUser: any): Promise<UserResponseDto> {
    return this.usersService.findBySupabaseId(currentUser.id);
  }

  @Patch(':id/role')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user role (admin only)' })
  @ApiResponse({ status: 200, description: 'User role updated successfully', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUserRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRoleDto: { role: string },
    @CurrentUser() currentUser: any
  ): Promise<UserResponseDto> {
    return this.usersService.updateUserRole(id, updateRoleDto.role, currentUser.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users with pagination and search' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by username, display name, or email' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.usersService.findAll(page, limit, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User found', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  @Get('username/:username')
  @ApiOperation({ summary: 'Get user by username' })
  @ApiParam({ name: 'username', description: 'Username' })
  @ApiResponse({ status: 200, description: 'User found', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findByUsername(@Param('username') username: string): Promise<UserResponseDto> {
    return this.usersService.findByUsername(username);
  }

  @Get('supabase/:supabaseUserId')
  @ApiOperation({ summary: 'Get user by Supabase user ID' })
  @ApiParam({ name: 'supabaseUserId', description: 'Supabase user UUID' })
  @ApiResponse({ status: 200, description: 'User found', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findBySupabaseId(@Param('supabaseUserId', ParseUUIDPipe) supabaseUserId: string): Promise<UserResponseDto> {
    return this.usersService.findBySupabaseId(supabaseUserId);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User updated successfully', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Username or email already exists' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: any,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: any,
  ): Promise<void> {
    return this.usersService.remove(id);
  }

  @Patch(':id/stats')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update user statistics' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 204, description: 'User stats updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateStats(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() stats: {
      games_played?: number;
      games_won?: number;
      tournaments_played?: number;
      tournaments_won?: number;
      total_prize_money?: number;
      ranking_points?: number;
      current_streak?: number;
      best_streak?: number;
    },
    @CurrentUser() currentUser: any,
  ): Promise<void> {
    return this.usersService.updateStats(id, stats);
  }

  @Patch(':id/settings')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update user settings' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 204, description: 'User settings updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateSettings(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() settings: {
      theme?: string;
      language?: string;
      timezone?: string;
      email_notifications?: boolean;
      push_notifications?: boolean;
      privacy_profile?: string;
      privacy_stats?: string;
      privacy_matches?: string;
    },
    @CurrentUser() currentUser: any,
  ): Promise<void> {
    return this.usersService.updateSettings(id, settings);
  }
}