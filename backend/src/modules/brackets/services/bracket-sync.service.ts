import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { MatchesService } from '../../matches/matches.service';
import {
  SingleEliminationBracketDto,
  BracketMatchDto,
  BracketRoundDto,
  BracketType,
  ParticipantType,
  MatchStatus,
} from '../dto/bracket.dto';
import { CreateMatchDto } from '../../matches/dto/create-match.dto';
import { MatchStage } from '../../matches/dto/match.dto';

@Injectable()
export class BracketSyncService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly matchesService: MatchesService,
  ) {}

  /**
   * Removes all existing matches for a tournament before regenerating bracket
   */
  async clearExistingMatches(tournamentId: string): Promise<{ matchesDeleted: number }> {
    console.log('Clearing existing matches for tournament:', tournamentId);
    
    try {
      // First, count existing matches
      const { data: existingMatches, error: countError } = await this.supabaseService.client
        .from('matches')
        .select('id')
        .eq('tournament_id', tournamentId);

      if (countError) {
        console.error('Error counting existing matches:', countError);
        throw new BadRequestException(`Failed to count existing matches: ${countError.message}`);
      }

      const matchesCount = existingMatches?.length || 0;

      // Delete matches
      const { error } = await this.supabaseService.client
        .from('matches')
        .delete()
        .eq('tournament_id', tournamentId);

      if (error) {
        console.error('Error clearing existing matches:', error);
        throw new BadRequestException(`Failed to clear existing matches: ${error.message}`);
      }
      
      console.log(`Successfully cleared ${matchesCount} existing matches for tournament:`, tournamentId);
      return { matchesDeleted: matchesCount };
    } catch (error) {
      console.error('Error in clearExistingMatches:', error);
      throw error;
    }
  }

  /**
   * Synchronizes bracket data to matches table
   */
  async syncBracketToMatches(bracket: SingleEliminationBracketDto, clearExisting: boolean = false): Promise<void> {
    try {
      // Clear existing matches if requested (for regeneration)
      if (clearExisting) {
        await this.clearExistingMatches(bracket.tournament_id);
      }

      const matchesToCreate: CreateMatchDto[] = [];
      const finalMatchId = this.getFinalMatchId(bracket);

      // Handle groups if they exist
      if (bracket.groups && bracket.groups.length > 0) {
        for (const group of bracket.groups) {
          await this.processRoundsForMatches(group.rounds, bracket, matchesToCreate, finalMatchId, clearExisting);
        }
      } else {
        // Handle regular single elimination bracket
        await this.processRoundsForMatches(bracket.rounds, bracket, matchesToCreate, finalMatchId, clearExisting);
      }

      // Create matches using MatchesService
      if (matchesToCreate.length > 0) {
        for (const matchDto of matchesToCreate) {
          try {
            await this.matchesService.create(matchDto);
          } catch (error) {
            console.error('Error creating match:', error);
            // Continue with other matches even if one fails
          }
        }
      }
    } catch (error) {
      console.error('Error in syncBracketToMatches:', error);
      // Don't throw here to avoid breaking bracket generation
    }
  }

  /**
   * Synchronizes a single match from bracket_data to matches table
   */
  async syncSingleMatchToDatabase(tournamentId: string, matchId: string, bracket: SingleEliminationBracketDto): Promise<void> {
    // Find the match in bracket_data
    let bracketMatch: BracketMatchDto | null = null;
    
    if (bracket.groups && bracket.groups.length > 0) {
      for (const group of bracket.groups) {
        for (const round of group.rounds) {
          const match = round.matches.find(m => m.id === matchId);
          if (match) {
            bracketMatch = match;
            break;
          }
        }
        if (bracketMatch) break;
      }
    } else {
      for (const round of bracket.rounds) {
        const match = round.matches.find(m => m.id === matchId);
        if (match) {
          bracketMatch = match;
          break;
        }
      }
    }

    if (!bracketMatch) {
      console.warn(`Match ${matchId} not found in bracket data`);
      return;
    }

    // Check if match exists in database
    const { data: existingMatch, error: fetchError } = await this.supabaseService.client
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error fetching match:', fetchError);
      return;
    }

    // Prepare update data from bracket match
    const updateData: any = {
      team1_score: bracketMatch.score1,
      team2_score: bracketMatch.score2,
      status: this.mapBracketStatusToDb(bracketMatch.status),
      winner_id: bracketMatch.winner?.id || null,
      scheduled_at: bracketMatch.scheduled_at,
      started_at: bracketMatch.started_at,
      finished_at: bracketMatch.finished_at,
      current_game: bracketMatch.current_game,
      detailed_scores: bracketMatch.detailed_scores,
      map_pool: bracketMatch.map_pool,
      map_picks: bracketMatch.map_picks,
      stream_url: bracketMatch.stream_url,
      notes: bracketMatch.notes,
      updated_at: new Date().toISOString(),
    };

    // Remove null/undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === null || updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    if (existingMatch) {
      // Update existing match
      const { error: updateError } = await this.supabaseService.client
        .from('matches')
        .update(updateData)
        .eq('id', matchId);

      if (updateError) {
        console.error('Error updating match in database:', updateError);
      }
    } else {
      // Create new match if it doesn't exist
      const team1_id = bracketMatch.participant1?.type === ParticipantType.TEAM 
        ? bracketMatch.participant1.id 
        : null;
      const team2_id = bracketMatch.participant2?.type === ParticipantType.TEAM 
        ? bracketMatch.participant2.id 
        : null;

      const createData = {
        id: matchId,
        tournament_id: tournamentId,
        round: bracketMatch.round,
        stage: this.determineMatchStage(bracketMatch, bracket),
        team1_id,
        team2_id,
        match_number: bracketMatch.match_number,
        best_of: bracketMatch.best_of || 1,
        ...updateData,
      };

      const { error: createError } = await this.supabaseService.client
        .from('matches')
        .insert(createData);

      if (createError) {
        console.error('Error creating match in database:', createError);
      }
    }
  }

  private mapBracketStatusToDb(bracketStatus: MatchStatus): string {
    switch (bracketStatus) {
      case MatchStatus.COMPLETED:
        return 'FINISHED';
      case MatchStatus.LIVE:
        return 'LIVE';
      case MatchStatus.SCHEDULED:
        return 'SCHEDULED';
      case MatchStatus.PENDING:
        return 'UNSCHEDULED';
      case MatchStatus.CANCELLED:
        return 'CANCELLED';
      case MatchStatus.WALKOVER:
        return 'FORFEIT';
      case MatchStatus.DISQUALIFIED:
        return 'FORFEIT';
      default:
        return 'UNSCHEDULED';
    }
  }

  private determineMatchStage(bracketMatch: BracketMatchDto, bracket: SingleEliminationBracketDto): MatchStage {
    const finalMatchId = this.getFinalMatchId(bracket);
    
    if (bracketMatch.id === finalMatchId) {
      return MatchStage.FINAL;
    } else if (bracketMatch.is_bronze_match) {
      return MatchStage.THIRD_PLACE;
    } else {
      return MatchStage.PLAYOFF;
    }
  }

  /**
   * Synchronizes changes from matches table back to bracket_data
   */
  async syncMatchesToBracket(tournamentId: string): Promise<{ message: string; matchesUpdated: number }> {
    // Get current bracket data
    const { data: tournamentData, error: tournamentError } = await this.supabaseService.client
      .from('tournaments')
      .select('id, bracket_data')
      .eq('id', tournamentId)
      .single();

    if (tournamentError || !tournamentData) {
      throw new NotFoundException('Tournament not found');
    }

    const bracket: SingleEliminationBracketDto = tournamentData.bracket_data as SingleEliminationBracketDto;
    if (!bracket || bracket.type !== BracketType.SINGLE_ELIMINATION) {
      throw new BadRequestException('Invalid or missing Single Elimination bracket');
    }

    // Get all matches for this tournament from matches table
    const { data: matchesData, error: matchesError } = await this.supabaseService.client
      .from('matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .in('stage', [MatchStage.GROUP, MatchStage.PLAYOFF, MatchStage.FINAL, MatchStage.THIRD_PLACE]);

    if (matchesError) {
      throw new BadRequestException(`Failed to fetch matches: ${matchesError.message}`);
    }

    if (!matchesData || matchesData.length === 0) {
      return { message: 'No matches found to synchronize', matchesUpdated: 0 };
    }

    // Create a map of match ID to match data for quick lookup
    const matchesMap = new Map(matchesData.map(match => [match.id, match]));
    let updatedCount = 0;

    // Update bracket matches with data from matches table
    if (bracket.groups && bracket.groups.length > 0) {
      for (const group of bracket.groups) {
        updatedCount += this.updateBracketMatches(group.rounds, matchesMap);
      }
    } else {
      updatedCount += this.updateBracketMatches(bracket.rounds, matchesMap);
    }

    // Propagate winners and update bracket state if there were changes
    if (updatedCount > 0) {
      this.propagateWinnersInBracket(bracket);
      this.updateBracketFinalization(bracket);

      // Update metadata
      if (bracket.metadata) {
        bracket.metadata.updated_at = new Date().toISOString();
      }

      // Save updated bracket
      const { error: saveError } = await this.supabaseService.client
        .from('tournaments')
        .update({ 
          bracket_data: bracket, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', tournamentId);

      if (saveError) {
        throw new BadRequestException(`Failed to update bracket: ${saveError.message}`);
      }
    }

    return {
      message: `Bracket synchronized successfully from matches table`,
      matchesUpdated: updatedCount
    };
  }

  private async processRoundsForMatches(
    rounds: BracketRoundDto[],
    bracket: SingleEliminationBracketDto,
    matchesToCreate: CreateMatchDto[],
    finalMatchId: string | undefined,
    skipExistingCheck: boolean = false,
  ): Promise<void> {
    for (const [roundIndex, round] of rounds.entries()) {
      for (const [matchIndex, bracketMatch] of round.matches.entries()) {
        // Skip matches that already exist in database (only if not clearing existing)
        if (!skipExistingCheck) {
          const { data: existingMatch } = await this.supabaseService.client
            .from('matches')
            .select('id')
            .eq('id', bracketMatch.id)
            .single();

          if (existingMatch) continue;
        }

        // Only create matches for real participants (not placeholders)
        const team1_id = bracketMatch.participant1?.type === ParticipantType.TEAM 
          ? bracketMatch.participant1.id 
          : undefined;
        const team2_id = bracketMatch.participant2?.type === ParticipantType.TEAM 
          ? bracketMatch.participant2.id 
          : undefined;

        // Decide correct stage
        const stage = bracketMatch.id === finalMatchId
          ? MatchStage.FINAL
          : (round.is_bronze_round ? MatchStage.THIRD_PLACE : MatchStage.PLAYOFF);

        // Generate appropriate notes
        const notes = this.generateMatchNotes(bracketMatch, stage, round, rounds, roundIndex, matchIndex);

        const matchDto: CreateMatchDto = {
          tournament_id: bracket.tournament_id,
          round: bracketMatch.round,
          stage,
          team1_id,
          team2_id,
          scheduled_at: bracketMatch.scheduled_at,
          best_of: bracketMatch.best_of || 1, // Use best_of from bracket or default to 1
          notes,
          match_number: bracketMatch.match_number, // Use match_number from bracket
        };

        matchesToCreate.push(matchDto);
      }
    }
  }

  private generateMatchNotes(
    bracketMatch: BracketMatchDto,
    stage: MatchStage,
    round: BracketRoundDto,
    rounds: BracketRoundDto[],
    roundIndex: number,
    matchIndex: number,
  ): string | undefined {
    const matchNumber = matchIndex + 1;
    
    if (bracketMatch.is_bronze_match) {
      return 'Bronze Medal Match';
    } else if (stage === MatchStage.FINAL) {
      return 'Grand Final';
    } else if (stage === MatchStage.THIRD_PLACE) {
      return 'Third Place Match';
    } else {
      // For playoff matches, generate descriptive round names
      const totalRounds = rounds.filter(r => !r.is_bronze_round).length;
      const roundFromEnd = totalRounds - roundIndex;
      
      let roundName: string;
      if (roundFromEnd === 1) {
        roundName = 'Final';
      } else if (roundFromEnd === 2) {
        roundName = 'Semifinal';
      } else if (roundFromEnd === 3) {
        roundName = 'Quarterfinal';
      } else if (roundFromEnd === 4) {
        roundName = 'Round of 16';
      } else if (roundFromEnd === 5) {
        roundName = 'Round of 32';
      } else {
        roundName = `Round ${bracketMatch.round}`;
      }
      
      return `${roundName} Match ${matchNumber}`;
    }
  }

  private getFinalMatchId(bracket: SingleEliminationBracketDto): string | undefined {
    const lastRound = bracket.rounds[bracket.rounds.length - 1];
    if (lastRound?.is_bronze_round && bracket.rounds.length >= 2) {
      const finalRound = bracket.rounds[bracket.rounds.length - 2];
      return finalRound.matches[finalRound.matches.length - 1]?.id;
    } else if (lastRound) {
      return lastRound.matches[lastRound.matches.length - 1]?.id;
    }
    return undefined;
  }

  private updateBracketMatches(rounds: BracketRoundDto[], matchesMap: Map<string, any>): number {
    let updatedCount = 0;

    for (const round of rounds) {
      for (const bracketMatch of round.matches) {
        const matchData = matchesMap.get(bracketMatch.id);
        if (matchData) {
          let hasChanges = false;

          // Map status from matches table to bracket format
          const bracketStatus = this.mapMatchStatus(matchData.status);
          if (bracketStatus !== bracketMatch.status) {
            bracketMatch.status = bracketStatus;
            hasChanges = true;
          }

          // Update scores
          if (matchData.team1_score !== null && matchData.team1_score !== bracketMatch.score1) {
            bracketMatch.score1 = matchData.team1_score;
            hasChanges = true;
          }
          if (matchData.team2_score !== null && matchData.team2_score !== bracketMatch.score2) {
            bracketMatch.score2 = matchData.team2_score;
            hasChanges = true;
          }

          // Update other fields
          hasChanges = this.updateBracketMatchFields(bracketMatch, matchData) || hasChanges;

          if (hasChanges) {
            updatedCount++;
          }
        }
      }
    }

    return updatedCount;
  }

  private mapMatchStatus(dbStatus: string): MatchStatus {
    switch (dbStatus) {
      case 'FINISHED':
        return MatchStatus.COMPLETED;
      case 'LIVE':
        return MatchStatus.LIVE;
      case 'SCHEDULED':
        return MatchStatus.SCHEDULED;
      case 'UNSCHEDULED':
        return MatchStatus.PENDING;
      case 'CANCELLED':
        return MatchStatus.CANCELLED;
      case 'FORFEIT':
        return MatchStatus.WALKOVER;
      case 'POSTPONED':
        return MatchStatus.PENDING;
      default:
        return MatchStatus.PENDING;
    }
  }

  private updateBracketMatchFields(bracketMatch: BracketMatchDto, matchData: any): boolean {
    let hasChanges = false;

    // Update best_of
    if (matchData.best_of !== null && matchData.best_of !== bracketMatch.best_of) {
      bracketMatch.best_of = matchData.best_of;
      hasChanges = true;
    }

    // Update winner
    if (matchData.winner_id) {
      const newWinner = bracketMatch.participant1?.id === matchData.winner_id 
        ? bracketMatch.participant1 
        : bracketMatch.participant2?.id === matchData.winner_id 
          ? bracketMatch.participant2 
          : null;

      if (newWinner && (!bracketMatch.winner || bracketMatch.winner.id !== newWinner.id)) {
        bracketMatch.winner = newWinner;
        hasChanges = true;
      }
    } else if (matchData.team1_score !== null && matchData.team2_score !== null && matchData.status === 'FINISHED') {
      // Determine winner from scores
      let newWinner = null;
      if (matchData.team1_score > matchData.team2_score) {
        newWinner = bracketMatch.participant1;
      } else if (matchData.team2_score > matchData.team1_score) {
        newWinner = bracketMatch.participant2;
      }

      if (newWinner && (!bracketMatch.winner || bracketMatch.winner.id !== newWinner.id)) {
        bracketMatch.winner = newWinner;
        hasChanges = true;
      }
    }

    // Update finalization status
    const shouldBeFinalized = matchData.status === 'FINISHED' || 
                            matchData.status === 'FORFEIT' || 
                            bracketMatch.status === MatchStatus.WALKOVER ||
                            bracketMatch.status === MatchStatus.DISQUALIFIED;
    
    if (shouldBeFinalized !== bracketMatch.is_finalized) {
      bracketMatch.is_finalized = shouldBeFinalized;
      hasChanges = true;
    }

    // Update timestamps and other fields
    const fieldsToUpdate = [
      'scheduled_at', 'started_at', 'finished_at', 'current_game',
      'detailed_scores', 'map_pool', 'map_picks', 'stream_url', 'notes'
    ];

    for (const field of fieldsToUpdate) {
      if (matchData[field] !== null && matchData[field] !== undefined) {
        const isJsonField = ['detailed_scores', 'map_pool', 'map_picks'].includes(field);
        const currentValue = isJsonField ? JSON.stringify(bracketMatch[field]) : bracketMatch[field];
        const newValue = isJsonField ? JSON.stringify(matchData[field]) : matchData[field];

        if (currentValue !== newValue) {
          bracketMatch[field] = matchData[field];
          hasChanges = true;
        }
      }
    }

    return hasChanges;
  }

  private propagateWinnersInBracket(bracket: SingleEliminationBracketDto): void {
    const processRounds = (rounds: BracketRoundDto[]) => {
      for (const round of rounds) {
        for (const match of round.matches) {
          if (match.winner) {
            this.replacePlaceholders(rounds, 'winner', match.id, match.winner);
            // Also propagate loser for elimination brackets
            const loser = match.participant1?.id === match.winner.id ? match.participant2 : match.participant1;
            if (loser) {
              this.replacePlaceholders(rounds, 'loser', match.id, loser);
            }
          }
        }
      }
    };

    if (bracket.groups && bracket.groups.length > 0) {
      for (const group of bracket.groups) {
        processRounds(group.rounds);
      }
    } else {
      processRounds(bracket.rounds);
    }
  }

  private updateBracketFinalization(bracket: SingleEliminationBracketDto): void {
    const lastRound = bracket.rounds[bracket.rounds.length - 1];
    let finalMatch: BracketMatchDto | undefined;
    
    if (lastRound?.is_bronze_round && bracket.rounds.length >= 2) {
      const prev = bracket.rounds[bracket.rounds.length - 2];
      finalMatch = prev.matches[prev.matches.length - 1];
    } else if (lastRound) {
      finalMatch = lastRound.matches[lastRound.matches.length - 1];
    }
    
    const isComplete = !!finalMatch?.winner;
    if (bracket.metadata) {
      bracket.metadata.is_finalized = isComplete;
      bracket.metadata.is_bracket_complete = isComplete;
    }
  }

  private replacePlaceholders(
    rounds: BracketRoundDto[],
    kind: 'winner' | 'loser',
    sourceMatchId: string,
    participant: any,
  ): void {
    const isWinner = kind === 'winner';
    const placeholderType = isWinner ? ParticipantType.PLACEHOLDER_WINNER : ParticipantType.PLACEHOLDER_LOSER;

    for (const round of rounds) {
      for (const match of round.matches) {
        if (
          match.participant1 &&
          match.participant1.type === placeholderType &&
          match.participant1.placeholder_reference?.match_id === sourceMatchId
        ) {
          match.participant1 = participant;
        }
        if (
          match.participant2 &&
          match.participant2.type === placeholderType &&
          match.participant2.placeholder_reference?.match_id === sourceMatchId
        ) {
          match.participant2 = participant;
        }
      }
    }
  }
}