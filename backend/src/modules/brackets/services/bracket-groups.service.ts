import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { SingleEliminationGeneratorService } from './single-elimination-generator.service';
import {
  SingleEliminationBracketDto,
  GroupBracketDto,
  ParticipantDto,
  BracketType,
  ParticipantType,
} from '../dto/bracket.dto';
@Injectable()
export class BracketGroupsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly singleEliminationGenerator: SingleEliminationGeneratorService,
  ) {}

  /**
   * Generates groups for single elimination bracket
   */
  generateSingleEliminationGroups(
    tournamentId: string,
    participants: ParticipantDto[],
    groupCount: number,
    bronzeMatch: boolean = false,
  ): SingleEliminationBracketDto {
    if (participants.length < 2) {
      throw new Error('At least 2 participants are required for single elimination');
    }

    if (groupCount < 1) {
      throw new Error('At least 1 group is required');
    }

    // Distribute participants across groups
    const groups: GroupBracketDto[] = [];
    const participantsPerGroup = Math.ceil(participants.length / groupCount);
    
    for (let i = 0; i < groupCount; i++) {
      const startIndex = i * participantsPerGroup;
      const endIndex = Math.min(startIndex + participantsPerGroup, participants.length);
      const groupParticipants = participants.slice(startIndex, endIndex);
      
      if (groupParticipants.length > 0) {
        // Generate single elimination bracket for this group
        const groupBracket = this.singleEliminationGenerator.generateSingleEliminationBracket(
          tournamentId,
          groupParticipants,
          bronzeMatch,
        );

        const group: GroupBracketDto = {
          group_id: `group-${i + 1}`,
          group_name: `Group ${String.fromCharCode(65 + i)}`, // A, B, C, etc.
          total_rounds: groupBracket.total_rounds,
          bronze_match: bronzeMatch,
          rounds: groupBracket.rounds,
        };

        groups.push(group);
      }
    }

    // Calculate total rounds (max across all groups)
    const totalRounds = Math.max(...groups.map(g => g.total_rounds));

    return {
      tournament_id: tournamentId,
      type: BracketType.SINGLE_ELIMINATION,
      total_participants: participants.length,
      total_rounds: totalRounds,
      bronze_match: bronzeMatch,
      rounds: [], // Empty for grouped brackets
      groups: groups,
      metadata: {
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_finalized: false,
        is_bracket_complete: false,
        placements: [],
      },
    };
  }

  /**
   * Converts grouped bracket to regular single elimination
   */
  async convertGroupsToSingleElimination(
    tournamentId: string,
    advanceFromEachGroup: number = 1,
  ): Promise<SingleEliminationBracketDto> {
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

    if (!bracket.groups || bracket.groups.length === 0) {
      throw new BadRequestException('No groups found in bracket');
    }

    // Collect advancing participants from each group
    const advancingParticipants: ParticipantDto[] = [];
    
    for (const group of bracket.groups) {
      const groupAdvancers = this.getAdvancingParticipants(group, advanceFromEachGroup);
      advancingParticipants.push(...groupAdvancers);
    }

    if (advancingParticipants.length < 2) {
      throw new BadRequestException('Not enough participants to create single elimination bracket');
    }

    // Generate new single elimination bracket with advancing participants
    const newBracket = this.singleEliminationGenerator.generateSingleEliminationBracket(
      tournamentId,
      advancingParticipants,
      bracket.bronze_match,
    );

    // Preserve original metadata
    newBracket.metadata = {
      ...bracket.metadata,
      updated_at: new Date().toISOString(),
      original_groups: bracket.groups.length,
      advance_per_group: advanceFromEachGroup,
    };

    return newBracket;
  }

  /**
   * Gets groups for a tournament
   */
  async getGroups(tournament_id: string) {
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

    if (!bracket.groups || bracket.groups.length === 0) {
      return [];
    }

    return bracket.groups.map(group => ({
      group_id: group.group_id,
      group_name: group.group_name,
      total_rounds: group.total_rounds,
      bronze_match: group.bronze_match
    }));
  }

  /**
   * Gets advancing participants from a group
   */
  private getAdvancingParticipants(group: GroupBracketDto, count: number): ParticipantDto[] {
    const advancers: ParticipantDto[] = [];
    
    // Find completed matches and their winners
    const winners: ParticipantDto[] = [];
    
    for (const round of group.rounds) {
      for (const match of round.matches) {
        if (match.is_finalized && match.winner) {
          winners.push(match.winner);
        }
      }
    }

    // For single elimination, the final winner is the group winner
    const finalRound = group.rounds[group.rounds.length - 1];
    if (!finalRound?.is_bronze_round && finalRound?.matches.length > 0) {
      const finalMatch = finalRound.matches[0];
      if (finalMatch.is_finalized && finalMatch.winner) {
        advancers.push(finalMatch.winner);
      }
    }

    // If we need more than just the winner, we need to look at earlier rounds
    if (count > 1) {
      // Add runner-up (final match loser)
      const finalMatch = finalRound?.matches[0];
      if (finalMatch?.is_finalized && finalMatch.winner && count > advancers.length) {
        const runnerUp = finalMatch.participant1?.id === finalMatch.winner.id 
          ? finalMatch.participant2 
          : finalMatch.participant1;
        if (runnerUp) {
          advancers.push(runnerUp);
        }
      }

      // Add semifinal losers if needed
      if (count > advancers.length && group.rounds.length >= 2) {
        const semifinalRound = group.rounds[group.rounds.length - 2];
        for (const match of semifinalRound.matches) {
          if (match.is_finalized && match.winner && count > advancers.length) {
            const loser = match.participant1?.id === match.winner.id 
              ? match.participant2 
              : match.participant1;
            if (loser && !advancers.some(p => p.id === loser.id)) {
              advancers.push(loser);
            }
          }
        }
      }
    }

    return advancers.slice(0, count);
  }
}