import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { TournamentsService } from '../tournaments/tournaments.service';
import { MatchesService } from '../matches/matches.service';
import { SingleEliminationGeneratorService } from './services/single-elimination-generator.service';
import { BracketMatchManagerService } from './services/bracket-match-manager.service';
import { BracketSyncService } from './services/bracket-sync.service';
import { BracketPlacementsService } from './services/bracket-placements.service';
import { BracketGroupsService } from './services/bracket-groups.service';
import {
  GenerateBracketDto,
  SingleEliminationBracketDto,
  BracketMatchDto,
  UpdateBracketMatchRequestDto,
  BracketType,
  MatchStatus,
  ParticipantType,
} from './dto/bracket.dto';

@Injectable()
export class BracketsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly tournamentsService: TournamentsService,
    private readonly matchesService: MatchesService,
    private readonly singleEliminationGenerator: SingleEliminationGeneratorService,
    private readonly bracketMatchManager: BracketMatchManagerService,
    private readonly bracketSync: BracketSyncService,
    private readonly bracketPlacements: BracketPlacementsService,
    private readonly bracketGroups: BracketGroupsService,
  ) {}

  /**
   * Generates a single elimination bracket
   */
  async generateSingleElimination(dto: GenerateBracketDto): Promise<SingleEliminationBracketDto> {
    console.log('=== BRACKET GENERATION START ===');
    console.log('DTO received:', JSON.stringify(dto, null, 2));
    
    // Validate tournament ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(dto.tournament_id)) {
      console.error('Invalid tournament ID format:', dto.tournament_id);
      throw new BadRequestException('Invalid tournament ID format');
    }
    
    if (!dto.max_participants || dto.max_participants < 2) {
      throw new BadRequestException('max_participants must be >= 2');
    }

    // Ensure tournament exists
    console.log('Finding tournament with ID:', dto.tournament_id);
    let tournament;
    try {
      tournament = await this.tournamentsService.findOne(dto.tournament_id);
      if (!tournament) throw new NotFoundException('Tournament not found');
      console.log('Tournament found:', tournament.id);
    } catch (tournamentError) {
      console.error('Tournament lookup failed:', tournamentError);
      throw tournamentError;
    }

    // If no participants provided, try to get registered teams with seeds, otherwise generate placeholder participants
    let participants = dto.participants;
    if (!participants || participants.length === 0) {
      console.log('No participants provided, fetching registered teams with seeds...');
      
      try {
        // Fetch registered teams with their seeds from tournament_teams table
        const { data: registeredTeams, error: teamsError } = await this.supabaseService.client
          .from('tournament_teams')
          .select(`
            seed,
            teams:team_id (
              id,
              name,
              tag,
              logo_url
            )
          `)
          .eq('tournament_id', dto.tournament_id)
          .in('status', ['CONFIRMED', 'READY'])
          .order('seed', { ascending: true, nullsFirst: false });

        if (!teamsError && registeredTeams && registeredTeams.length > 0) {
          console.log(`Found ${registeredTeams.length} registered teams with seeds`);
          participants = registeredTeams.map((teamReg, index) => {
            // Handle both single object and array cases for teams
            const team = Array.isArray(teamReg.teams) ? teamReg.teams[0] : teamReg.teams;
            return {
              id: team.id,
              name: team.name,
              type: ParticipantType.TEAM,
              logo_url: team.logo_url,
              seed: teamReg.seed || (index + 1), // Use seed from DB or fallback to order
            };
          });
        } else {
          console.log('No registered teams found, generating placeholders');
          // For groups: max_participants is per group, so total = max_participants * number_of_groups
          // For regular bracket: max_participants is total
          const totalParticipants = (dto.number_of_groups && dto.number_of_groups > 1) 
            ? dto.max_participants * dto.number_of_groups 
            : dto.max_participants;
          
          participants = [];
          for (let i = 1; i <= totalParticipants; i++) {
            participants.push({
              id: `placeholder-${i}`,
              name: `Team ${i}`,
              type: ParticipantType.TBD,
              seed: i,
            });
          }
        }
      } catch (fetchError) {
        console.error('Error fetching registered teams:', fetchError);
        // Fallback to placeholders
        const totalParticipants = (dto.number_of_groups && dto.number_of_groups > 1) 
          ? dto.max_participants * dto.number_of_groups 
          : dto.max_participants;
        
        participants = [];
        for (let i = 1; i <= totalParticipants; i++) {
          participants.push({
            id: `placeholder-${i}`,
            name: `Team ${i}`,
            type: ParticipantType.TBD,
            seed: i,
          });
        }
      }
    }
    console.log('Participants to use:', participants.length);

    let bracket: SingleEliminationBracketDto;

    // Check if this is a group-based tournament
    try {
      if (dto.number_of_groups && dto.number_of_groups > 1) {
        console.log('Generating groups bracket with', dto.number_of_groups, 'groups and', dto.max_participants, 'participants per group');
        // Generate groups bracket
        bracket = this.bracketGroups.generateSingleEliminationGroups(
          dto.tournament_id,
          participants,
          dto.number_of_groups,
          dto.max_participants, // This is now max participants per group
          dto.bronze_match ?? false,
        );
      } else {
        console.log('Generating regular single elimination bracket');
        // Generate regular single elimination bracket
        bracket = this.singleEliminationGenerator.generateSingleEliminationBracket(
          dto.tournament_id,
          participants,
          dto.bronze_match ?? false,
        );
      }
      console.log('Bracket generated successfully');
    } catch (bracketError) {
      console.error('Bracket generation failed:', bracketError);
      throw new BadRequestException(`Failed to generate bracket: ${bracketError.message}`);
    }

    // Persist into tournaments.bracket_data
    console.log('Saving bracket to database...');
    const { error } = await this.supabaseService.client
      .from('tournaments')
      .update({ 
        bracket_data: bracket, 
        updated_at: new Date().toISOString(), 
        status: 'READY' 
      })
      .eq('id', dto.tournament_id);

    if (error) {
      console.error('Failed to save bracket:', error);
      throw new BadRequestException(`Failed to save bracket: ${error.message}`);
    }
    console.log('Bracket saved to database successfully');

    // Synchronize bracket matches with the matches table (clear existing matches first)
    console.log('Synchronizing bracket matches (clearing existing matches first)...');
    try {
      await this.bracketSync.syncBracketToMatches(bracket, true); // true = clear existing matches
      console.log('Bracket sync completed successfully');
    } catch (syncError) {
      console.error('Bracket sync failed:', syncError);
      throw new BadRequestException(`Failed to sync bracket matches: ${syncError.message}`);
    }

    // Synchronize data back from matches table to bracket_data (to include scheduled_at, started_at, etc.)
    console.log('Synchronizing data back from matches table to bracket_data...');
    try {
      await this.bracketSync.syncMatchesToBracket(dto.tournament_id);
      console.log('Reverse sync completed successfully');
      
      // Get the updated bracket with synchronized data
      const { data: updatedData, error: updatedError } = await this.supabaseService.client
        .from('tournaments')
        .select('bracket_data')
        .eq('id', dto.tournament_id)
        .single();
      
      if (!updatedError && updatedData) {
        bracket = updatedData.bracket_data as SingleEliminationBracketDto;
        console.log('Updated bracket retrieved successfully');
      }
    } catch (reverseSyncError) {
      console.error('Reverse sync failed:', reverseSyncError);
      throw new BadRequestException(`Failed to sync data back to bracket: ${reverseSyncError.message}`);
    }

    console.log('=== BRACKET GENERATION COMPLETE ===');
    return bracket;
  }

  /**
   * Clears all matches for a tournament
   */
  async clearTournamentMatches(tournamentId: string): Promise<{ message: string; matchesDeleted: number }> {
    console.log(`Clearing all matches for tournament: ${tournamentId}`);
    
    try {
      const result = await this.bracketSync.clearExistingMatches(tournamentId);
      console.log(`Successfully cleared ${result.matchesDeleted} matches for tournament ${tournamentId}`);
      
      return {
        message: 'Tournament matches cleared successfully',
        matchesDeleted: result.matchesDeleted
      };
    } catch (error) {
      console.error('Error clearing tournament matches:', error);
      throw new BadRequestException(`Failed to clear tournament matches: ${error.message}`);
    }
  }

  /**
   * Synchronizes bracket matches to database
   */
  async syncBracketMatchesToDatabase(tournamentId: string): Promise<{ message: string; matchesCreated: number }> {
    const { data, error } = await this.supabaseService.client
      .from('tournaments')
      .select('id, bracket_data')
      .eq('id', tournamentId)
      .single();

    if (error || !data) throw new NotFoundException('Tournament not found');
    const bracket: SingleEliminationBracketDto = data.bracket_data as SingleEliminationBracketDto;
    
    if (!bracket || bracket.type !== BracketType.SINGLE_ELIMINATION) {
      throw new BadRequestException('Invalid or missing Single Elimination bracket');
    }

    await this.bracketSync.syncBracketToMatches(bracket);
    
    // Count matches that were created
    let matchesCount = 0;
    if (bracket.groups && bracket.groups.length > 0) {
      // Count matches in all groups
      for (const group of bracket.groups) {
        matchesCount += group.rounds.reduce((total, round) => total + round.matches.length, 0);
      }
    } else {
      // Count matches in regular bracket
      matchesCount = bracket.rounds.reduce((total, round) => total + round.matches.length, 0);
    }
    
    return {
      message: 'Bracket matches synchronized successfully',
      matchesCreated: matchesCount
    };
  }

  /**
   * Lists single elimination matches
   */
  async listSingleEliminationMatches(tournament_id: string, groupId?: string): Promise<BracketMatchDto[]> {
    console.log(`=== listSingleEliminationMatches ===`);
    console.log(`Tournament ID: ${tournament_id}`);
    console.log(`Group ID: ${groupId}`);
    
    const { data, error } = await this.supabaseService.client
      .from('tournaments')
      .select('id, bracket_data')
      .eq('id', tournament_id)
      .single();

    if (error || !data) throw new NotFoundException('Tournament not found');
    const bracket: SingleEliminationBracketDto = data.bracket_data as SingleEliminationBracketDto;
    
    if (!bracket || bracket.type !== BracketType.SINGLE_ELIMINATION) {
      throw new BadRequestException('Invalid or missing Single Elimination bracket');
    }

    console.log(`Bracket has groups: ${bracket.groups ? bracket.groups.length : 0}`);

    const flat: BracketMatchDto[] = [];
    
    // Handle groups if they exist
    if (bracket.groups && bracket.groups.length > 0) {
      if (groupId) {
        console.log(`Looking for specific group: ${groupId}`);
        // Return matches for specific group
        const group = bracket.groups.find(g => g.group_id === groupId);
        if (!group) throw new NotFoundException(`Group ${groupId} not found`);
        
        for (const r of group.rounds) {
          for (const m of r.matches) flat.push(m);
        }
        console.log(`Found ${flat.length} matches for group ${groupId}`);
      } else {
        console.log(`Getting matches for all groups`);
        // Return matches for all groups
        for (const group of bracket.groups) {
          console.log(`Processing group ${group.group_id} with ${group.rounds.length} rounds`);
          for (const r of group.rounds) {
            console.log(`Round has ${r.matches.length} matches`);
            for (const m of r.matches) flat.push(m);
          }
        }
        console.log(`Found ${flat.length} total matches from all groups`);
      }
    } else {
      console.log(`No groups found, processing regular bracket`);
      // Handle regular single elimination bracket
      for (const r of bracket.rounds) {
        for (const m of r.matches) flat.push(m);
      }
      console.log(`Found ${flat.length} matches from regular bracket`);
    }
    
    // Fetch additional data from matches table to enrich bracket data
    try {
      const { data: matchesData, error: matchesError } = await this.supabaseService.client
        .from('matches')
        .select('id, best_of, match_number, scheduled_at, started_at')
        .eq('tournament_id', tournament_id);

      if (!matchesError && matchesData) {
        // Create a map for quick lookup
        const matchesMap = new Map(matchesData.map(m => [m.id, m]));
        
        // Enrich bracket matches with data from matches table
        for (const bracketMatch of flat) {
          const matchData = matchesMap.get(bracketMatch.id);
          if (matchData) {
            // Override with data from matches table if available
            if (matchData.best_of !== null && matchData.best_of !== undefined) {
              bracketMatch.best_of = matchData.best_of;
            }
            if (matchData.match_number !== null && matchData.match_number !== undefined) {
              bracketMatch.match_number = matchData.match_number;
            }
            if (matchData.scheduled_at !== null && matchData.scheduled_at !== undefined) {
              bracketMatch.scheduled_at = matchData.scheduled_at;
            }
            if (matchData.started_at !== null && matchData.started_at !== undefined) {
              bracketMatch.started_at = matchData.started_at;
            }
          }
        }
      }
    } catch (enrichError) {
      // Log error but don't fail the request
      console.error('Error enriching bracket matches with database data:', enrichError);
    }
    
    // Ensure all matches have best_of set (fallback to 1 if not set)
    for (const bracketMatch of flat) {
      if (bracketMatch.best_of === null || bracketMatch.best_of === undefined) {
        bracketMatch.best_of = 1;
      }
    }
    
    console.log(`=== Returning ${flat.length} matches ===`);
    console.log(`Match IDs: ${flat.map(m => m.id).join(', ')}`);
    
    return flat;
  }

  /**
   * Gets groups for a tournament
   */
  async getGroups(tournament_id: string) {
    return this.bracketGroups.getGroups(tournament_id);
  }

  /**
   * Gets single elimination bracket
   */
  async getSingleEliminationBracket(tournament_id: string): Promise<SingleEliminationBracketDto> {
    const { data, error } = await this.supabaseService.client
      .from('tournaments')
      .select('id, bracket_data')
      .eq('id', tournament_id)
      .single();

    if (error || !data) throw new NotFoundException('Tournament not found');
    const bracket: SingleEliminationBracketDto = data.bracket_data as SingleEliminationBracketDto;
    
    if (!bracket || bracket.type !== BracketType.SINGLE_ELIMINATION) {
      throw new BadRequestException('Invalid or missing Single Elimination bracket');
    }

    return bracket;
  }

  /**
   * Gets a single elimination match
   */
  async getSingleEliminationMatch(tournament_id: string, match_id: string): Promise<BracketMatchDto> {
    const { data, error } = await this.supabaseService.client
      .from('tournaments')
      .select('id, bracket_data')
      .eq('id', tournament_id)
      .single();

    if (error || !data) throw new NotFoundException('Tournament not found');
    const bracket: SingleEliminationBracketDto = data.bracket_data as SingleEliminationBracketDto;
    
    if (!bracket || bracket.type !== BracketType.SINGLE_ELIMINATION) {
      throw new BadRequestException('Invalid or missing Single Elimination bracket');
    }

    const ref = this.bracketMatchManager.findMatch(bracket.rounds, match_id);
    if (!ref) throw new NotFoundException('Match not found in bracket');
    return ref.match;
  }

  /**
   * Updates a single elimination match
   */
  async updateSingleEliminationMatch(dto: UpdateBracketMatchRequestDto): Promise<SingleEliminationBracketDto> {
    // Load tournament and bracket
    const { data, error } = await this.supabaseService.client
      .from('tournaments')
      .select('id, bracket_data')
      .eq('id', dto.tournament_id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Tournament not found');
    }

    const bracket: SingleEliminationBracketDto = data.bracket_data as SingleEliminationBracketDto;
    if (!bracket || bracket.type !== 'SINGLE_ELIMINATION') {
      throw new BadRequestException('Invalid or missing Single Elimination bracket');
    }

    // Check if this is a grouped bracket and verify match exists
    if (bracket.groups && bracket.groups.length > 0) {
      // For grouped brackets, use the groups-specific findMatch
      const { SingleEliminationGroupsGenerator } = await import('./single-elimination-groups.generator');
      const matchRef = SingleEliminationGroupsGenerator.findMatch(bracket as any, dto.match_id);
      if (!matchRef) {
        throw new NotFoundException('Match not found in bracket');
      }
      
      // In updateSingleEliminationMatch grouped branch, create a temp bracket with group's rounds
      const groupBracket = {
        tournament_id: bracket.tournament_id,
        type: bracket.type,
        total_participants: bracket.total_participants,
        total_rounds: matchRef.group.total_rounds,
        bronze_match: matchRef.group.bronze_match,
        rounds: matchRef.group.rounds,
        metadata: bracket.metadata,
      } as any;
      const updatedGroupBracket = this.bracketMatchManager.updateMatch(groupBracket, dto);
      // Replace the group's rounds with the updated ones
      const groupIndex = bracket.groups.findIndex(g => g.group_id === matchRef.group.group_id);
      if (groupIndex >= 0) {
        bracket.groups[groupIndex].rounds = updatedGroupBracket.rounds;
      }
    } else {
      // For regular brackets, update normally
      const updatedBracket = this.bracketMatchManager.updateMatch(bracket, dto);
      Object.assign(bracket, updatedBracket);
    }

    // Update metadata
    if (bracket.metadata) {
      bracket.metadata.updated_at = new Date().toISOString();
    }

    // Persist the updated bracket
    const save = await this.supabaseService.client
      .from('tournaments')
      .update({ bracket_data: bracket, updated_at: new Date().toISOString() })
      .eq('id', dto.tournament_id);

    if (save.error) throw new BadRequestException(`Failed to update bracket: ${save.error.message}`);

    // Synchronize the updated match to matches table
    try {
      await this.bracketSync.syncSingleMatchToDatabase(dto.tournament_id, dto.match_id, bracket);
    } catch (error) {
      console.error('Error synchronizing match to database:', error);
      // Don't throw here to avoid breaking bracket update
    }

    return bracket;
  }

  /**
   * Resets a single elimination match
   */
  async resetSingleEliminationMatch(tournament_id: string, match_id: string): Promise<SingleEliminationBracketDto> {
    const { data, error } = await this.supabaseService.client
      .from('tournaments')
      .select('id, bracket_data')
      .eq('id', tournament_id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Tournament not found');
    }

    const bracket: SingleEliminationBracketDto = data.bracket_data as SingleEliminationBracketDto;
    if (!bracket || bracket.type !== 'SINGLE_ELIMINATION') {
      throw new BadRequestException('Invalid or missing Single Elimination bracket');
    }

    // Check if this is a grouped bracket and verify match exists
    if (bracket.groups && bracket.groups.length > 0) {
      // For grouped brackets, use the groups-specific findMatch
      const { SingleEliminationGroupsGenerator } = await import('./single-elimination-groups.generator');
      const matchRef = SingleEliminationGroupsGenerator.findMatch(bracket as any, match_id);
      if (!matchRef) {
        throw new NotFoundException('Match not found in bracket');
      }
      
      // In resetSingleEliminationMatch grouped branch, same pattern
      const groupBracket2 = {
        tournament_id: bracket.tournament_id,
        type: bracket.type,
        total_participants: bracket.total_participants,
        total_rounds: matchRef.group.total_rounds,
        bronze_match: matchRef.group.bronze_match,
        rounds: matchRef.group.rounds,
        metadata: bracket.metadata,
      } as any;
      const updatedGroupBracket2 = this.bracketMatchManager.resetMatch(groupBracket2, match_id);
      const groupIndex2 = bracket.groups.findIndex(g => g.group_id === matchRef.group.group_id);
      if (groupIndex2 >= 0) {
        bracket.groups[groupIndex2].rounds = updatedGroupBracket2.rounds;
      }
    } else {
      // For regular brackets, reset normally
      const updatedBracket = this.bracketMatchManager.resetMatch(bracket, match_id);
      Object.assign(bracket, updatedBracket);
    }

    // Update metadata
    if (bracket.metadata) {
      bracket.metadata.updated_at = new Date().toISOString();
    }

    // Persist the updated bracket
    const save = await this.supabaseService.client
      .from('tournaments')
      .update({ bracket_data: bracket, updated_at: new Date().toISOString() })
      .eq('id', tournament_id);

    if (save.error) throw new BadRequestException(`Failed to reset match: ${save.error.message}`);

    // Synchronize the reset match to matches table
    try {
      await this.bracketSync.syncSingleMatchToDatabase(tournament_id, match_id, bracket);
    } catch (error) {
      console.error('Error synchronizing reset match to database:', error);
      // Don't throw here to avoid breaking bracket reset
    }

    return bracket;
  }

  /**
   * Lists placements for a tournament
   */
  async listPlacements(tournament_id: string) {
    return this.bracketPlacements.listPlacements(tournament_id);
  }

  /**
   * Gets final placements for a tournament
   */
  async getFinalPlacements(tournament_id: string) {
    return this.bracketPlacements.getFinalPlacements(tournament_id);
  }

  /**
   * Recomputes final placements for a tournament
   */
  async recomputeFinalPlacements(tournament_id: string) {
    return this.bracketPlacements.recomputeFinalPlacements(tournament_id);
  }

  /**
   * Synchronizes changes from matches table back to bracket_data
   */
  async syncMatchesToBracket(tournamentId: string): Promise<{ message: string; matchesUpdated: number }> {
    return this.bracketSync.syncMatchesToBracket(tournamentId);
  }

  /**
   * Converts groups to single elimination
   */
  async convertGroupsToSingleElimination(tournamentId: string, advanceFromEachGroup: number = 1): Promise<SingleEliminationBracketDto> {
    const convertedBracket = await this.bracketGroups.convertGroupsToSingleElimination(tournamentId, advanceFromEachGroup);

    // Persist the converted bracket
    const { error } = await this.supabaseService.client
      .from('tournaments')
      .update({ 
        bracket_data: convertedBracket, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', tournamentId);

    if (error) throw new BadRequestException(`Failed to save converted bracket: ${error.message}`);

    // Synchronize bracket matches with the matches table
    await this.bracketSync.syncBracketToMatches(convertedBracket);

    return convertedBracket;
  }

  /**
   * Gets summary information for a tournament bracket
   */
  async getSummary(tournament_id: string) {
    const { data, error } = await this.supabaseService.client
      .from('tournaments')
      .select('id, bracket_data')
      .eq('id', tournament_id)
      .single();

    if (error || !data) throw new NotFoundException('Tournament not found');
    const bracket: SingleEliminationBracketDto = data.bracket_data as SingleEliminationBracketDto;
    
    if (!bracket || bracket.type !== BracketType.SINGLE_ELIMINATION) {
      throw new BadRequestException('Invalid or missing Single Elimination bracket');
    }

    const rounds = bracket.rounds.length;
    let completed = 0;
    let pending = 0;
    const dqList: Array<{ match_id: string; participant_id: string; name?: string }> = [];
    
    for (const r of bracket.rounds) {
      for (const m of r.matches) {
        if (m.status === MatchStatus.COMPLETED || m.status === MatchStatus.WALKOVER || m.status === MatchStatus.DISQUALIFIED) {
          completed++;
        }
        if (m.status === MatchStatus.PENDING || m.status === MatchStatus.SCHEDULED || m.status === MatchStatus.LIVE) {
          pending++;
        }
        if (m.disqualified_participant) {
          dqList.push({ 
            match_id: m.id, 
            participant_id: m.disqualified_participant.id, 
            name: m.disqualified_participant.name 
          });
        }
      }
    }

    // Determine current round: the smallest round with any not-finished matches; if none, it's the last round
    let current_round = rounds;
    for (const r of bracket.rounds) {
      const hasActive = r.matches.some(m => 
        m.status === MatchStatus.PENDING || 
        m.status === MatchStatus.SCHEDULED || 
        m.status === MatchStatus.LIVE
      );
      if (hasActive) { 
        current_round = r.round; 
        break; 
      }
    }

    // Final status
    const lastRound = bracket.rounds[bracket.rounds.length - 1];
    let finalStatus: MatchStatus | 'NONE' = 'NONE';
    let bronzeStatus: MatchStatus | 'NONE' = 'NONE';
    
    if (lastRound) {
      const finalMatch = lastRound.is_bronze_round && bracket.rounds.length >= 2
        ? bracket.rounds[bracket.rounds.length - 2].matches.slice(-1)[0]
        : lastRound.matches.slice(-1)[0];
      if (finalMatch) finalStatus = finalMatch.status as MatchStatus;
      if (lastRound.is_bronze_round && lastRound.matches[0]) {
        bronzeStatus = lastRound.matches[0].status as MatchStatus;
      }
    }

    return {
      tournament_id,
      rounds,
      current_round,
      completed,
      pending,
      final_status: finalStatus,
      bronze_enabled: !!bracket.bronze_match,
      bronze_status: bronzeStatus,
      dq_list: dqList,
      is_bracket_complete: !!bracket.metadata?.is_bracket_complete,
    };
  }
}