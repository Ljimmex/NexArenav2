import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserRole } from '../../common/enums';

@Injectable()
export class UsersService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const { data: existingUser } = await this.supabaseService.client
      .from('users')
      .select('id')
      .or(`username.eq.${createUserDto.username},email.eq.${createUserDto.email}`)
      .single();

    if (existingUser) {
      throw new ConflictException('User with this username or email already exists');
    }

    const { data, error } = await this.supabaseService.client
      .from('users')
      .insert([{
        ...createUserDto,
      }])
      .select(`
        *,
        stats:user_stats(*),
        settings:user_settings(*)
      `)
      .single();

    if (error) {
      throw new BadRequestException(`Failed to create user: ${error.message}`);
    }

    return data;
  }

  async findAll(page: number = 1, limit: number = 10, search?: string): Promise<{
    data: UserResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;
    
    let query = this.supabaseService.client
      .from('users')
      .select(`
        *,
        stats:user_stats(*),
        settings:user_settings(*)
      `, { count: 'exact' });

    if (search) {
      query = query.or(`username.ilike.%${search}%,display_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      throw new BadRequestException(`Failed to fetch users: ${error.message}`);
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return {
      data: data || [],
      total: count || 0,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const { data, error } = await this.supabaseService.client
      .from('users')
      .select(`
        *,
        stats:user_stats(*),
        settings:user_settings(*)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return data;
  }

  async findByUsername(username: string): Promise<UserResponseDto> {
    const { data, error } = await this.supabaseService.client
      .from('users')
      .select(`
        *,
        stats:user_stats(*),
        settings:user_settings(*)
      `)
      .eq('username', username)
      .single();

    if (error || !data) {
      throw new NotFoundException(`User with username ${username} not found`);
    }

    return data;
  }

  async findBySupabaseId(supabaseUserId: string): Promise<UserResponseDto> {
    const { data, error } = await this.supabaseService.client
      .from('users')
      .select(`
        *,
        stats:user_stats(*),
        settings:user_settings(*)
      `)
      .eq('supabase_user_id', supabaseUserId)
      .single();

    if (error || !data) {
      // If user doesn't exist, try to create them automatically
      console.log(`User with Supabase ID ${supabaseUserId} not found, attempting to create...`);
      
      try {
        // Get user info from Supabase Auth
        const supabaseUser = await this.supabaseService.getSupabaseUser(supabaseUserId);
        
        if (supabaseUser) {
          // Create user profile from Supabase Auth data
          const userData = {
            supabase_user_id: supabaseUserId,
            username: supabaseUser.user_metadata?.username || supabaseUser.email?.split('@')[0] || 'user',
            display_name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || null,
            email: supabaseUser.email,
            avatar_url: supabaseUser.user_metadata?.avatar_url || null,
            banner_url: '/banners/ProfilBaner.png', // Default banner
            bio: null,
            role: UserRole.USER, // Default role
          };
          
          console.log('Creating user profile with data:', userData);
          const newUser = await this.create(userData);
          return newUser;
        }
      } catch (createError) {
        console.error('Failed to auto-create user profile:', createError);
      }
      
      throw new NotFoundException(`User with Supabase ID ${supabaseUserId} not found and could not be created`);
    }

    return data;
  }

  async updateUserRole(userId: string, newRole: string, requestingUserId: string): Promise<UserResponseDto> {
    // First, check if the requesting user is an admin
    const requestingUser = await this.findBySupabaseId(requestingUserId);
    if (requestingUser.role !== UserRole.ADMIN) {
      throw new BadRequestException('Only administrators can update user roles');
    }

    // Validate the new role
    if (!Object.values(UserRole).includes(newRole as UserRole)) {
      throw new BadRequestException(`Invalid role: ${newRole}. Valid roles are: ${Object.values(UserRole).join(', ')}`);
    }

    // Update the user's role
    const { data, error } = await this.supabaseService.client
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)
      .select(`
        *,
        stats:user_stats(*),
        settings:user_settings(*)
      `)
      .single();

    if (error) {
      throw new BadRequestException(`Failed to update user role: ${error.message}`);
    }

    if (!data) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return data;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    // Check if user exists
    await this.findOne(id);

    // Check for username/email conflicts if they're being updated
    if (updateUserDto.username || updateUserDto.email) {
      const conditions = [];
      if (updateUserDto.username) conditions.push(`username.eq.${updateUserDto.username}`);
      if (updateUserDto.email) conditions.push(`email.eq.${updateUserDto.email}`);

      const { data: existingUser } = await this.supabaseService.client
        .from('users')
        .select('id, username, email')
        .or(conditions.join(','))
        .neq('id', id)
        .single();

      if (existingUser) {
        if (existingUser.username === updateUserDto.username) {
          throw new ConflictException('Username already exists');
        }
        if (existingUser.email === updateUserDto.email) {
          throw new ConflictException('Email already exists');
        }
      }
    }

    const { data, error } = await this.supabaseService.client
      .from('users')
      .update(updateUserDto)
      .eq('id', id)
      .select(`
        *,
        stats:user_stats(*),
        settings:user_settings(*)
      `)
      .single();

    if (error) {
      throw new BadRequestException(`Failed to update user: ${error.message}`);
    }

    return data;
  }

  async remove(id: string): Promise<void> {
    // Check if user exists
    await this.findOne(id);

    const { error } = await this.supabaseService.client
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      throw new BadRequestException(`Failed to delete user: ${error.message}`);
    }
  }

  async updateStats(userId: string, stats: Partial<{
    games_played: number;
    games_won: number;
    tournaments_played: number;
    tournaments_won: number;
    total_prize_money: number;
    ranking_points: number;
    current_streak: number;
    best_streak: number;
  }>): Promise<void> {
    const { error } = await this.supabaseService.client
      .from('user_stats')
      .update(stats)
      .eq('user_id', userId);

    if (error) {
      throw new BadRequestException(`Failed to update user stats: ${error.message}`);
    }
  }

  async updateSettings(userId: string, settings: Partial<{
    theme: string;
    language: string;
    timezone: string;
    email_notifications: boolean;
    push_notifications: boolean;
    privacy_profile: string;
    privacy_stats: string;
    privacy_matches: string;
  }>): Promise<void> {
    const { error } = await this.supabaseService.client
      .from('user_settings')
      .update(settings)
      .eq('user_id', userId);

    if (error) {
      throw new BadRequestException(`Failed to update user settings: ${error.message}`);
    }
  }
}