import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { CreateTournamentDto, UpdateTournamentDto, TournamentResponseDto } from './dto';
import { SupabaseService } from '../supabase/supabase.service';

import { UsersService } from '../users/users.service';

@Injectable()
export class TournamentsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly usersService: UsersService,
  ) {}

  async create(createTournamentDto: CreateTournamentDto, organizerId: string): Promise<TournamentResponseDto> {
    const supabase = this.supabaseService.client;

    // Ensure the organizer exists
    try {
      await this.usersService.findOne(organizerId);
    } catch (error) {
      throw new BadRequestException(`Organizer with ID ${organizerId} not found`);
    }

    // Validate dates
    if (createTournamentDto.registration_start && createTournamentDto.registration_end) {
      if (new Date(createTournamentDto.registration_start) >= new Date(createTournamentDto.registration_end)) {
        throw new BadRequestException('Registration start date must be before end date');
      }
    }

    if (createTournamentDto.tournament_start && createTournamentDto.tournament_end) {
      if (new Date(createTournamentDto.tournament_start) >= new Date(createTournamentDto.tournament_end)) {
        throw new BadRequestException('Tournament start date must be before end date');
      }
    }

    // Map DTO fields to database fields
    const { title, tournament_type, ...otherFields } = createTournamentDto;
    
    const { data, error } = await supabase
      .from('tournaments')
      .insert({
        ...otherFields,
        name: title, // Map title to name field in database (required)
        title: title, // Also fill the title field
        tournament_type: tournament_type,
        organizer_id: organizerId,
        status: 'DRAFT',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to create tournament: ${error.message}`);
    }

    return this.mapToResponseDto(data);
  }

  async findAll(filters?: { game_type?: string; status?: string; search?: string }): Promise<TournamentResponseDto[]> {
    const supabase = this.supabaseService.client;

    let query = supabase
      .from('tournaments')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (filters?.game_type) {
      query = query.eq('game_type', filters.game_type);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw new BadRequestException(`Failed to fetch tournaments: ${error.message}`);
    }

    return data.map(tournament => this.mapToResponseDto(tournament));
  }

  async findOne(id: string): Promise<TournamentResponseDto> {
    console.log(`=== TOURNAMENTS SERVICE: Finding tournament with ID: ${id} ===`);
    const supabase = this.supabaseService.client;

    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Tournament lookup error:', error);
      throw new NotFoundException(`Tournament with ID ${id} not found`);
    }

    if (!data) {
      console.error('Tournament not found - no data returned');
      throw new NotFoundException(`Tournament with ID ${id} not found`);
    }

    console.log('Tournament found successfully:', data.id);
    return this.mapToResponseDto(data);
  }

  async update(id: string, updateTournamentDto: UpdateTournamentDto, user: any): Promise<TournamentResponseDto> {
    const supabase = this.supabaseService.client;

    // Check if user is admin, organizer or moderator
    const tournament = await this.findOne(id);
    const isAdmin = user.role === 'ADMIN';
    const isOrganizer = tournament.organizer_id === user.id;
    const isModerator = tournament.moderators?.includes(user.id);
    
    if (!isAdmin && !isOrganizer && !isModerator) {
      throw new ForbiddenException('You are not authorized to update this tournament');
    }

    // Prepare update data with proper field mapping
    const updateData = {
      ...updateTournamentDto,
      updated_at: new Date().toISOString(),
    };

    // Map tournament_type to the database field name if it exists
    if (updateTournamentDto.tournament_type) {
      updateData.tournament_type = updateTournamentDto.tournament_type;
    }

    const { data, error } = await supabase
      .from('tournaments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to update tournament: ${error.message}`);
    }

    return this.mapToResponseDto(data);
  }

  async remove(id: string, user: any): Promise<void> {
    const supabase = this.supabaseService.client;

    const tournament = await this.findOne(id);
    const isAdmin = user.role === 'ADMIN';
    const isOrganizer = tournament.organizer_id === user.id;

    if (!isAdmin && !isOrganizer) {
      throw new ForbiddenException('You are not authorized to delete this tournament');
    }

    const { error } = await supabase.from('tournaments').delete().eq('id', id);

    if (error) {
      throw new BadRequestException(`Failed to delete tournament: ${error.message}`);
    }
  }

  async updateStatus(id: string, status: string, user: any): Promise<TournamentResponseDto> {
    const supabase = this.supabaseService.client;

    // Check if user is admin, organizer or moderator
    const tournament = await this.findOne(id);
    const isAdmin = user.role === 'ADMIN';
    const isOrganizer = tournament.organizer_id === user.id;
    const isModerator = tournament.moderators?.includes(user.id);
    
    if (!isAdmin && !isOrganizer && !isModerator) {
      throw new ForbiddenException('You are not authorized to update this tournament status');
    }

    const { data, error } = await supabase
      .from('tournaments')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to update tournament status: ${error.message}`);
    }

    return this.mapToResponseDto(data);
  }

  async registerTeam(tournamentId: string, teamId: string, user: any): Promise<{ message: string }> {
    const supabase = this.supabaseService.client;

    // Check if tournament exists
    const tournament = await this.findOne(tournamentId);

    // Check if tournament is accepting registrations
    if (tournament.status !== 'OPEN') {
      throw new BadRequestException('Tournament is not accepting registrations');
    }

    // Check registration dates
    const now = new Date();
    if (tournament.registration_start && new Date(tournament.registration_start) > now) {
      throw new BadRequestException('Registration has not started yet');
    }
    if (tournament.registration_end && new Date(tournament.registration_end) < now) {
      throw new BadRequestException('Registration has ended');
    }

    // Check if team is already registered
    const { data: existingRegistration } = await supabase
      .from('tournament_teams')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('team_id', teamId)
      .single();

    if (existingRegistration) {
      throw new BadRequestException('Team is already registered for this tournament');
    }

    // Check if tournament is full
    const { count: registeredTeamsCount } = await supabase
      .from('tournament_teams')
      .select('*', { count: 'exact' })
      .eq('tournament_id', tournamentId)
      .in('status', ['PENDING', 'CONFIRMED', 'READY']);

    if (tournament.max_teams && registeredTeamsCount >= tournament.max_teams) {
      throw new BadRequestException('Tournament is full');
    }

    // Register the team
    const status = tournament.requires_approval ? 'PENDING' : 'CONFIRMED';
    
    const { error } = await supabase
      .from('tournament_teams')
      .insert({
        tournament_id: tournamentId,
        team_id: teamId,
        status,
        registration_date: new Date().toISOString(),
      });

    if (error) {
      throw new BadRequestException(`Failed to register team: ${error.message}`);
    }

    return {
      message: tournament.requires_approval 
        ? 'Team registration submitted for approval' 
        : 'Team successfully registered'
    };
  }

  async unregisterTeam(tournamentId: string, teamId: string, user: any): Promise<{ message: string }> {
    const supabase = this.supabaseService.client;

    // Check if tournament exists
    await this.findOne(tournamentId);

    // Check if team is registered
    const { data: registration, error: findError } = await supabase
      .from('tournament_teams')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('team_id', teamId)
      .single();

    if (findError || !registration) {
      throw new NotFoundException('Team is not registered for this tournament');
    }

    // Remove the registration
    const { error } = await supabase
      .from('tournament_teams')
      .delete()
      .eq('tournament_id', tournamentId)
      .eq('team_id', teamId);

    if (error) {
      throw new BadRequestException(`Failed to unregister team: ${error.message}`);
    }

    return { message: 'Team successfully unregistered' };
  }

  async getRegisteredTeams(tournamentId: string): Promise<any[]> {
    const supabase = this.supabaseService.client;

    // Check if tournament exists
    await this.findOne(tournamentId);

    const { data, error } = await supabase
      .from('tournament_teams')
      .select(`
        *,
        teams:team_id (
          id,
          name,
          tag,
          logo_url,
          created_at
        )
      `)
      .eq('tournament_id', tournamentId)
      .order('registration_date', { ascending: true });

    if (error) {
      throw new BadRequestException(`Failed to fetch registered teams: ${error.message}`);
    }

    return data || [];
  }

  async updateTeamSeed(tournamentId: string, teamId: string, seed: number, user: any): Promise<{ message: string }> {
    const supabase = this.supabaseService.client;

    // Check if tournament exists and user has permission
    const tournament = await this.findOne(tournamentId);
    const isAdmin = user.role === 'ADMIN';
    const isOrganizer = tournament.organizer_id === user.id;
    const isModerator = tournament.moderators?.includes(user.id);
    
    if (!isAdmin && !isOrganizer && !isModerator) {
      throw new ForbiddenException('You are not authorized to update team seeds for this tournament');
    }

    // Check if team is registered
    const { data: registration, error: findError } = await supabase
      .from('tournament_teams')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('team_id', teamId)
      .single();

    if (findError || !registration) {
      throw new NotFoundException('Team is not registered for this tournament');
    }

    // Check if seed is already taken by another team
    const { data: existingSeed, error: seedError } = await supabase
      .from('tournament_teams')
      .select('team_id')
      .eq('tournament_id', tournamentId)
      .eq('seed', seed)
      .neq('team_id', teamId)
      .single();

    if (!seedError && existingSeed) {
      throw new BadRequestException(`Seed ${seed} is already assigned to another team`);
    }

    // Update the seed
    const { error } = await supabase
      .from('tournament_teams')
      .update({ seed })
      .eq('tournament_id', tournamentId)
      .eq('team_id', teamId);

    if (error) {
      throw new BadRequestException(`Failed to update team seed: ${error.message}`);
    }

    return { message: `Team seed updated to ${seed} successfully` };
  }

  private mapToResponseDto(tournament: any): TournamentResponseDto {
    return {
      id: tournament.id,
      title: tournament.name || tournament.title, // Map name field to title
      description: tournament.description,
      short_description: tournament.short_description,
      game_type: tournament.game_type,
      tournament_type: tournament.tournament_type,
      status: tournament.status,
      registration_start: tournament.registration_start,
      registration_end: tournament.registration_end,
      tournament_start: tournament.tournament_start,
      tournament_end: tournament.tournament_end,
      max_teams: tournament.max_teams,
      min_teams: tournament.min_teams,
      team_size: tournament.team_size,
      entry_fee: tournament.entry_fee,
      prize_pool: tournament.prize_pool,
      is_public: tournament.is_public,
      requires_approval: tournament.requires_approval,
      rules: tournament.rules,
      format_settings: tournament.format_settings,
      bracket_data: tournament.bracket_data,
      group_settings: tournament.group_settings,
      organizer_id: tournament.organizer_id,
      moderators: tournament.moderators,
      banner_url: tournament.banner_url,
      logo_url: tournament.logo_url,
      stream_url: tournament.stream_url,
      discord_invite: tournament.discord_invite,
      created_at: tournament.created_at,
      updated_at: tournament.updated_at,
    };
  }
}