import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import {
  SingleEliminationBracketDto,
  BracketMatchDto,
  BracketType,
  ParticipantType,
} from '../dto/bracket.dto';

@Injectable()
export class BracketPlacementsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Lists current placements for a tournament
   */
  async listPlacements(tournament_id: string) {
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

    const placements = (bracket.metadata.placements || []).slice().sort((a, b) => a.place - b.place);
    return placements;
  }

  /**
   * Gets final placements for a tournament
   */
  async getFinalPlacements(tournament_id: string) {
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

    const placements = this.calculateFinalPlacements(bracket);
    
    // Update the metadata with computed placements if the bracket is finalized
    if (bracket.metadata?.is_finalized) {
      bracket.metadata.placements = placements;
      // Persist the updated placements
      await this.supabaseService.client
        .from('tournaments')
        .update({ bracket_data: bracket, updated_at: new Date().toISOString() })
        .eq('id', tournament_id);
    }

    return placements.sort((a, b) => a.place - b.place);
  }

  /**
   * Recomputes final placements for a tournament
   */
  async recomputeFinalPlacements(tournament_id: string) {
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

    const placements = this.calculateFinalPlacements(bracket);
    bracket.metadata = bracket.metadata || ({} as any);
    bracket.metadata.placements = placements;

    await this.supabaseService.client
      .from('tournaments')
      .update({ bracket_data: bracket, updated_at: new Date().toISOString() })
      .eq('id', tournament_id);

    return placements.sort((a, b) => a.place - b.place);
  }

  /**
   * Calculates final placements based on bracket results
   */
  private calculateFinalPlacements(bracket: SingleEliminationBracketDto) {
    const placements: Array<{ 
      participant_id: string; 
      name?: string; 
      place: number; 
      dsq?: boolean; 
      ex_aequo?: boolean 
    }> = [];
    
    // Start with existing DQ placements
    if (bracket.metadata.placements) {
      placements.push(...bracket.metadata.placements.filter(p => p.dsq));
    }

    // Find the final match
    const lastRound = bracket.rounds[bracket.rounds.length - 1];
    let finalMatch: BracketMatchDto | undefined;
    let bronzeMatch: BracketMatchDto | undefined;

    if (lastRound?.is_bronze_round && bracket.rounds.length >= 2) {
      // Bronze round exists, final is in previous round
      const finalRound = bracket.rounds[bracket.rounds.length - 2];
      finalMatch = finalRound.matches[finalRound.matches.length - 1];
      bronzeMatch = lastRound.matches[0];
    } else if (lastRound) {
      finalMatch = lastRound.matches[lastRound.matches.length - 1];
    }

    // Assign places based on completed matches
    if (finalMatch?.winner && finalMatch.is_finalized) {
      // 1st place: Winner of final
      const winner = finalMatch.winner;
      if (winner && !this.isDQParticipant(winner.id, placements)) {
        placements.push({ participant_id: winner.id, name: winner.name, place: 1 });
      }

      // 2nd place: Loser of final
      const loser = finalMatch.participant1?.id === winner?.id ? finalMatch.participant2 : finalMatch.participant1;
      if (loser && !this.isDQParticipant(loser.id, placements)) {
        placements.push({ participant_id: loser.id, name: loser.name, place: 2 });
      }
    }

    // Bronze match placements
    if (bronzeMatch?.winner && bronzeMatch.is_finalized) {
      const bronzeWinner = bronzeMatch.winner;
      const bronzeLoser = bronzeMatch.participant1?.id === bronzeWinner?.id ? bronzeMatch.participant2 : bronzeMatch.participant1;

      // 3rd place: Winner of bronze match
      if (bronzeWinner && !this.isDQParticipant(bronzeWinner.id, placements)) {
        placements.push({ participant_id: bronzeWinner.id, name: bronzeWinner.name, place: 3 });
      }

      // 4th place: Loser of bronze match
      if (bronzeLoser && !this.isDQParticipant(bronzeLoser.id, placements)) {
        placements.push({ participant_id: bronzeLoser.id, name: bronzeLoser.name, place: 4 });
      }
    } else if (finalMatch?.is_finalized) {
      // No bronze match, both semifinal losers get 3rd place (ex aequo)
      const semifinalRound = bracket.rounds[bracket.rounds.length - (lastRound?.is_bronze_round ? 3 : 2)];
      if (semifinalRound) {
        for (const semi of semifinalRound.matches) {
          if (semi.is_finalized && semi.winner) {
            const semiLoser = semi.participant1?.id === semi.winner.id ? semi.participant2 : semi.participant1;
            if (semiLoser && !this.isDQParticipant(semiLoser.id, placements)) {
              placements.push({ participant_id: semiLoser.id, name: semiLoser.name, place: 3, ex_aequo: true });
            }
          }
        }
      }
    }

    // Calculate remaining placements for earlier round eliminations
    this.calculateEarlyRoundPlacements(bracket, placements);

    return placements;
  }

  /**
   * Calculates placements for participants eliminated in earlier rounds
   */
  private calculateEarlyRoundPlacements(
    bracket: SingleEliminationBracketDto, 
    placements: Array<{ participant_id: string; name?: string; place: number; dsq?: boolean }>
  ) {
    const placedParticipants = new Set(placements.map(p => p.participant_id));
    
    // Start from semifinals and work backwards
    const rounds = bracket.rounds.filter(r => !r.is_bronze_round);
    
    for (let roundIndex = rounds.length - 2; roundIndex >= 0; roundIndex--) {
      const round = rounds[roundIndex];
      const eliminatedInThisRound: any[] = [];
      
      for (const match of round.matches) {
        if (match.is_finalized && match.winner) {
          const loser = match.participant1?.id === match.winner.id ? match.participant2 : match.participant1;
          if (loser && !placedParticipants.has(loser.id) && loser.type === ParticipantType.TEAM) {
            eliminatedInThisRound.push(loser);
            placedParticipants.add(loser.id);
          }
        }
      }

      // Assign places to eliminated participants
      if (eliminatedInThisRound.length > 0) {
        // Calculate the place range for this round
        const nextPlace = this.getNextAvailablePlace(placements);
        
        for (let i = 0; i < eliminatedInThisRound.length; i++) {
          const participant = eliminatedInThisRound[i];
          placements.push({
            participant_id: participant.id,
            name: participant.name,
            place: nextPlace + i
          });
        }
      }
    }
  }

  /**
   * Checks if a participant is disqualified
   */
  private isDQParticipant(participantId: string, placements: Array<{ participant_id: string; dsq?: boolean }>): boolean {
    return placements.some(p => p.participant_id === participantId && p.dsq);
  }

  /**
   * Gets the next available place number
   */
  private getNextAvailablePlace(placements: Array<{ place: number }>): number {
    const usedPlaces = new Set(placements.map(p => p.place));
    let place = 1;
    while (usedPlaces.has(place)) {
      place++;
    }
    return place;
  }
}