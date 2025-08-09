import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamResponseDto } from './dto/team-response.dto';
import { AddTeamMemberDto, UpdateTeamMemberDto, TeamMemberResponseDto, TeamRole } from './dto/team-member.dto';

@Injectable()
export class TeamsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async create(createTeamDto: CreateTeamDto): Promise<TeamResponseDto> {
    // Check if team name or tag already exists
    const { data: existingTeam } = await this.supabaseService.client
      .from('teams')
      .select('id')
      .or(`name.eq.${createTeamDto.name},tag.eq.${createTeamDto.tag}`)
      .single();

    if (existingTeam) {
      throw new ConflictException('Team with this name or tag already exists');
    }

    // Verify that the creator exists
    const { data: creator } = await this.supabaseService.client
      .from('users')
      .select('id')
      .eq('id', createTeamDto.created_by)
      .single();

    if (!creator) {
      throw new BadRequestException('Creator user not found');
    }

    const { data, error } = await this.supabaseService.client
      .from('teams')
      .insert([createTeamDto])
      .select(`
        *,
        stats:team_stats(*),
        creator:users!teams_created_by_fkey(id, username, display_name, avatar_url)
      `)
      .single();

    if (error) {
      throw new BadRequestException(`Failed to create team: ${error.message}`);
    }

    // Add creator as captain
    await this.addMember(data.id, {
      user_id: createTeamDto.created_by,
      role: TeamRole.CAPTAIN
    });

    return data;
  }

  async findAll(page: number = 1, limit: number = 10, search?: string): Promise<{
    data: TeamResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;
    
    let query = this.supabaseService.client
      .from('teams')
      .select(`
        *,
        stats:team_stats(*),
        creator:users!teams_created_by_fkey(id, username, display_name, avatar_url),
        members:team_members(
          *,
          user:users(id, username, display_name, avatar_url, country)
        )
      `, { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,tag.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .eq('is_active', true)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      throw new BadRequestException(`Failed to fetch teams: ${error.message}`);
    }

    // Add member count to each team
    const teamsWithMemberCount = (data || []).map(team => ({
      ...team,
      member_count: team.members?.filter(member => member.is_active).length || 0
    }));

    const totalPages = Math.ceil((count || 0) / limit);

    return {
      data: teamsWithMemberCount,
      total: count || 0,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: string): Promise<TeamResponseDto> {
    const { data, error } = await this.supabaseService.client
      .from('teams')
      .select(`
        *,
        stats:team_stats(*),
        creator:users!teams_created_by_fkey(id, username, display_name, avatar_url),
        members:team_members(
          *,
          user:users(id, username, display_name, avatar_url, country)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Team with ID ${id} not found`);
    }

    return {
      ...data,
      member_count: data.members?.filter(member => member.is_active).length || 0
    };
  }

  async findByTag(tag: string): Promise<TeamResponseDto> {
    const { data, error } = await this.supabaseService.client
      .from('teams')
      .select(`
        *,
        stats:team_stats(*),
        creator:users!teams_created_by_fkey(id, username, display_name, avatar_url),
        members:team_members(
          *,
          user:users(id, username, display_name, avatar_url, country)
        )
      `)
      .eq('tag', tag)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Team with tag ${tag} not found`);
    }

    return {
      ...data,
      member_count: data.members?.filter(member => member.is_active).length || 0
    };
  }

  async update(id: string, updateTeamDto: UpdateTeamDto): Promise<TeamResponseDto> {
    // Check if team exists
    await this.findOne(id);

    // Check for name/tag conflicts if they're being updated
    if (updateTeamDto.name || updateTeamDto.tag) {
      const conditions = [];
      if (updateTeamDto.name) conditions.push(`name.eq.${updateTeamDto.name}`);
      if (updateTeamDto.tag) conditions.push(`tag.eq.${updateTeamDto.tag}`);

      const { data: existingTeam } = await this.supabaseService.client
        .from('teams')
        .select('id')
        .or(conditions.join(','))
        .neq('id', id)
        .single();

      if (existingTeam) {
        throw new ConflictException('Team with this name or tag already exists');
      }
    }

    const { data, error } = await this.supabaseService.client
      .from('teams')
      .update(updateTeamDto)
      .eq('id', id)
      .select(`
        *,
        stats:team_stats(*),
        creator:users!teams_created_by_fkey(id, username, display_name, avatar_url),
        members:team_members(
          *,
          user:users(id, username, display_name, avatar_url, country)
        )
      `)
      .single();

    if (error) {
      throw new BadRequestException(`Failed to update team: ${error.message}`);
    }

    return {
      ...data,
      member_count: data.members?.filter(member => member.is_active).length || 0
    };
  }

  async remove(id: string): Promise<void> {
    // Check if team exists
    await this.findOne(id);

    const { error } = await this.supabaseService.client
      .from('teams')
      .delete()
      .eq('id', id);

    if (error) {
      throw new BadRequestException(`Failed to delete team: ${error.message}`);
    }
  }

  async addMember(teamId: string, addMemberDto: AddTeamMemberDto): Promise<TeamMemberResponseDto> {
    // Check if team exists
    const team = await this.findOne(teamId);

    // Check if user exists
    const { data: user } = await this.supabaseService.client
      .from('users')
      .select('id')
      .eq('id', addMemberDto.user_id)
      .single();

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Check if user is already a member
    const { data: existingMember } = await this.supabaseService.client
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', addMemberDto.user_id)
      .eq('is_active', true)
      .single();

    if (existingMember) {
      throw new ConflictException('User is already a member of this team');
    }

    // Check team capacity
    const activeMembersCount = team.members?.filter(member => member.is_active).length || 0;
    if (activeMembersCount >= team.max_members) {
      throw new BadRequestException('Team has reached maximum capacity');
    }

    const { data, error } = await this.supabaseService.client
      .from('team_members')
      .insert([{
        team_id: teamId,
        ...addMemberDto
      }])
      .select(`
        *,
        user:users(id, username, display_name, avatar_url, country)
      `)
      .single();

    if (error) {
      throw new BadRequestException(`Failed to add team member: ${error.message}`);
    }

    return data;
  }

  async updateMember(teamId: string, memberId: string, updateMemberDto: UpdateTeamMemberDto): Promise<TeamMemberResponseDto> {
    // Check if team exists
    await this.findOne(teamId);

    // Check if member exists
    const { data: existingMember } = await this.supabaseService.client
      .from('team_members')
      .select('*')
      .eq('id', memberId)
      .eq('team_id', teamId)
      .single();

    if (!existingMember) {
      throw new NotFoundException('Team member not found');
    }

    const { data, error } = await this.supabaseService.client
      .from('team_members')
      .update(updateMemberDto)
      .eq('id', memberId)
      .select(`
        *,
        user:users(id, username, display_name, avatar_url, country)
      `)
      .single();

    if (error) {
      throw new BadRequestException(`Failed to update team member: ${error.message}`);
    }

    return data;
  }

  async removeMember(teamId: string, memberId: string): Promise<void> {
    // Check if team exists
    await this.findOne(teamId);

    // Check if member exists
    const { data: existingMember } = await this.supabaseService.client
      .from('team_members')
      .select('*')
      .eq('id', memberId)
      .eq('team_id', teamId)
      .single();

    if (!existingMember) {
      throw new NotFoundException('Team member not found');
    }

    const { error } = await this.supabaseService.client
      .from('team_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      throw new BadRequestException(`Failed to remove team member: ${error.message}`);
    }
  }

  async getTeamMembers(teamId: string): Promise<TeamMemberResponseDto[]> {
    // Check if team exists
    await this.findOne(teamId);

    const { data, error } = await this.supabaseService.client
      .from('team_members')
      .select(`
        *,
        user:users(id, username, display_name, avatar_url, country)
      `)
      .eq('team_id', teamId)
      .eq('is_active', true)
      .order('joined_at', { ascending: true });

    if (error) {
      throw new BadRequestException(`Failed to fetch team members: ${error.message}`);
    }

    return data || [];
  }

  async updateStats(teamId: string, stats: Partial<{
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
      .from('team_stats')
      .update(stats)
      .eq('team_id', teamId);

    if (error) {
      throw new BadRequestException(`Failed to update team stats: ${error.message}`);
    }
  }

  async findUserTeams(userId: string): Promise<TeamResponseDto[]> {
    const { data: memberships, error } = await this.supabaseService.client
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      throw new BadRequestException(`Failed to fetch user teams: ${error.message}`);
    }

    if (!memberships || memberships.length === 0) {
      return [];
    }

    const teamIds = memberships.map(m => m.team_id);

    const { data: teams, error: teamsError } = await this.supabaseService.client
      .from('teams')
      .select(`
        *,
        team_stats(*),
        creator:users!teams_created_by_fkey(id, username, display_name, avatar_url)
      `)
      .in('id', teamIds);

    if (teamsError) {
      throw new BadRequestException(`Failed to fetch teams: ${teamsError.message}`);
    }

    return (teams || []).map(team => ({
      id: team.id,
      name: team.name,
      tag: team.tag,
      description: team.description,
      logo_url: team.logo_url,
      banner_url: team.banner_url,
      country: team.country,
      website: team.website,
      discord_url: team.discord_url,
      twitter_url: team.twitter_url,
      is_active: team.is_active,
      is_verified: team.is_verified,
      max_members: team.max_members,
      created_by: team.created_by,
      created_at: team.created_at,
      updated_at: team.updated_at,
      stats: team.team_stats?.[0] || null,
      creator: team.creator
    }));
  }
}