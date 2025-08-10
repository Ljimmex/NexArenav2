import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SingleEliminationGenerator } from './single-elimination.generator';
import { GenerateBracketDto, SingleEliminationBracketDto, UpdateBracketMatchRequestDto, BracketMatchDto, BracketRoundDto, ParticipantDto, ParticipantType, MatchStatus, BracketType } from './dto/bracket.dto';
import { TournamentsService } from '../tournaments/tournaments.service';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateMatchDto } from '../matches/dto/create-match.dto';
import { MatchesService } from '../matches/matches.service';
import { MatchStage } from '../matches/dto/match.dto';

@Injectable()
export class BracketsService {
  private readonly seGen = new SingleEliminationGenerator();
  constructor(
    private readonly tournamentsService: TournamentsService,
    private readonly supabaseService: SupabaseService,
    private readonly matchesService: MatchesService,
  ) {}

  async generateSingleElimination(dto: GenerateBracketDto): Promise<SingleEliminationBracketDto> {
    if (!dto.max_participants || dto.max_participants < 2)
      throw new BadRequestException('max_participants must be >= 2');

    // Ensure tournament exists
    const tournament = await this.tournamentsService.findOne(dto.tournament_id);
    if (!tournament) throw new NotFoundException('Tournament not found');

    const bracket = this.seGen.generate({
      tournament_id: dto.tournament_id,
      max_participants: dto.max_participants,
      bronze_match: dto.bronze_match ?? false,
      participants: dto.participants,
    });

    if (dto.number_of_groups) {
      (bracket as any).number_of_groups = dto.number_of_groups;
    }

    // Persist into tournaments.bracket_data
    const { error } = await this.supabaseService.client
      .from('tournaments')
      .update({ bracket_data: bracket, updated_at: new Date().toISOString(), status: 'READY' })
      .eq('id', dto.tournament_id);
    if (error) throw new BadRequestException(`Failed to save bracket: ${error.message}`);

    // Synchronize bracket matches with the matches table
    await this.syncBracketToMatches(bracket);

    return bracket;
  }

  /**
   * Synchronizes bracket matches with the matches table
   */
  async syncBracketToMatches(bracket: SingleEliminationBracketDto): Promise<void> {
    try {
      // First, delete existing bracket-phase matches for this tournament to avoid duplicates
      const { error: deleteError } = await this.supabaseService.client
        .from('matches')
        .delete()
        .eq('tournament_id', bracket.tournament_id)
        .in('stage', [MatchStage.PLAYOFF, MatchStage.FINAL, MatchStage.THIRD_PLACE]);

      if (deleteError) {
        console.error('Error deleting existing matches:', deleteError);
        // Continue anyway, as this might be the first time creating matches
      }

      // Determine which match is the grand final (to set stage = FINAL)
      let finalMatchId: string | undefined;
      const lastRound = bracket.rounds[bracket.rounds.length - 1];
      if (lastRound?.is_bronze_round && bracket.rounds.length >= 2) {
        const prev = bracket.rounds[bracket.rounds.length - 2];
        const fm = prev?.matches?.[prev.matches.length - 1];
        finalMatchId = fm?.id;
      } else if (lastRound) {
        const fm = lastRound.matches[lastRound.matches.length - 1];
        finalMatchId = fm?.id;
      }

      // Create matches from bracket data
      const matchesToCreate: CreateMatchDto[] = [];

      for (const round of bracket.rounds) {
        for (const bracketMatch of round.matches) {
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

          const matchDto: CreateMatchDto = {
             tournament_id: bracket.tournament_id,
             round: bracketMatch.round,
             stage,
             team1_id,
             team2_id,
             scheduled_at: bracketMatch.scheduled_at,
             best_of: 1, // Default to best of 1
             notes: bracketMatch.is_bronze_match ? 'Bronze Medal Match' : undefined,
           };

          matchesToCreate.push(matchDto);
        }
      }

      // Bulk insert matches
      if (matchesToCreate.length > 0) {
        const { error: insertError } = await this.supabaseService.client
          .from('matches')
          .insert(matchesToCreate);

        if (insertError) {
          console.error('Error creating matches:', insertError);
          throw new BadRequestException(`Failed to create matches: ${insertError.message}`);
        }
      }
    } catch (error) {
      console.error('Error in syncBracketToMatches:', error);
      // Don't throw here to avoid breaking bracket generation
      // The bracket will still be created even if match sync fails
    }
   }

   /**
    * Public method to synchronize bracket matches with database
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

     await this.syncBracketToMatches(bracket);
     
     // Count matches that were created
     const matchesCount = bracket.rounds.reduce((total, round) => total + round.matches.length, 0);
     
     return {
       message: 'Bracket matches synchronized successfully',
       matchesCreated: matchesCount
     };
   }

   async listSingleEliminationMatches(tournament_id: string): Promise<BracketMatchDto[]> {
    const { data, error } = await this.supabaseService.client
      .from('tournaments')
      .select('id, bracket_data')
      .eq('id', tournament_id)
      .single();

    if (error || !data) throw new NotFoundException('Tournament not found');
    const bracket: SingleEliminationBracketDto = data.bracket_data as SingleEliminationBracketDto;
    if (!bracket || bracket.type !== BracketType.SINGLE_ELIMINATION) throw new BadRequestException('Invalid or missing Single Elimination bracket');

    const flat: BracketMatchDto[] = [];
    for (const r of bracket.rounds) {
      for (const m of r.matches) flat.push(m);
    }
    return flat;
  }

  async getSingleEliminationBracket(tournament_id: string): Promise<SingleEliminationBracketDto> {
    const { data, error } = await this.supabaseService.client
      .from('tournaments')
      .select('id, bracket_data')
      .eq('id', tournament_id)
      .single();

    if (error || !data) throw new NotFoundException('Tournament not found');
    const bracket: SingleEliminationBracketDto = data.bracket_data as SingleEliminationBracketDto;
    if (!bracket || bracket.type !== BracketType.SINGLE_ELIMINATION) throw new BadRequestException('Invalid or missing Single Elimination bracket');

    return bracket;
  }

  async getSingleEliminationMatch(tournament_id: string, match_id: string): Promise<BracketMatchDto> {
    const { data, error } = await this.supabaseService.client
      .from('tournaments')
      .select('id, bracket_data')
      .eq('id', tournament_id)
      .single();

    if (error || !data) throw new NotFoundException('Tournament not found');
    const bracket: SingleEliminationBracketDto = data.bracket_data as SingleEliminationBracketDto;
    if (!bracket || bracket.type !== BracketType.SINGLE_ELIMINATION) throw new BadRequestException('Invalid or missing Single Elimination bracket');

    const ref = this.findMatch(bracket.rounds, match_id);
    if (!ref) throw new NotFoundException('Match not found in bracket');
    return ref.match;
  }

  // Update method enhancement: ensure DQ advances the previous round opponent and set DQ flag as last place marker
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

    const matchRef = this.findMatch(bracket.rounds, dto.match_id);
    if (!matchRef) throw new NotFoundException('Match not found in bracket');
    const match = matchRef.match;

    // Safety: prevent overwriting finalized matches unless forced
    if (match.is_finalized && !dto.force_update) {
      throw new BadRequestException('Match is finalized and cannot be modified');
    }

    // Reset disqualification info
    match.disqualified_participant = undefined;

    // Update scores/status and handle DQ
    if (typeof dto.score1 === 'number') match.score1 = dto.score1;
    if (typeof dto.score2 === 'number') match.score2 = dto.score2;
    if (dto.status) match.status = dto.status;

    const p1 = match.participant1;
    const p2 = match.participant2;

    let winner: ParticipantDto | undefined;
    let loser: ParticipantDto | undefined;
    let dqId: string | undefined;
    let dqParticipant: ParticipantDto | undefined;

    if (dto.status === MatchStatus.DISQUALIFIED && dto.disqualified_participant_id) {
      dqId = dto.disqualified_participant_id;
      dqParticipant = p1 && p1.id === dqId ? p1 : p2 && p2.id === dqId ? p2 : undefined;
      // ensure placements array
      bracket.metadata.placements = bracket.metadata.placements || [];
      // compute last place as total_participants or next available from bottom
      const usedPlaces = new Set((bracket.metadata.placements || []).map(pl => pl.place));
      let place = bracket.total_participants;
      while (usedPlaces.has(place) && place > 0) place--;
      if (dqParticipant) {
        // upsert placement for dqId
        const idx = bracket.metadata.placements.findIndex(pl => pl.participant_id === dqParticipant.id);
        const record = { participant_id: dqParticipant.id, name: dqParticipant.name, place, dsq: true };
        if (idx >= 0) bracket.metadata.placements[idx] = record; else bracket.metadata.placements.push(record);
      }
    }

    // Winner is NOT auto-decided; instead, bring forward previous round opponent into this slot
    let dqSlot: 1 | 2 | undefined;
    if (p1 && p1.id === dqId) dqSlot = 1; else if (p2 && p2.id === dqId) dqSlot = 2;

    if (dqSlot) {
      const feeder = this.findFeederMatch(bracket.rounds, match.id, dqSlot);
      if (feeder) {
        // Identify opponent from feeder match
        const opp = feeder.participant1 && feeder.participant1.id !== dqId ? feeder.participant1
                  : feeder.participant2 && feeder.participant2.id !== dqId ? feeder.participant2
                  : undefined;
        if (opp) {
          // Record who got DQ'ed
          if (dqParticipant) match.disqualified_participant = dqParticipant;
          // Replace participant in current match
          if (dqSlot === 1) match.participant1 = opp; else match.participant2 = opp;
          // Normalize current match to be replayed
          match.winner = undefined;
          match.status = MatchStatus.PENDING;
          match.is_finalized = false;
          match.score1 = undefined;
          match.score2 = undefined;

          // Update feeder match outcome to reflect retroactive promotion
          feeder.winner = opp;
          feeder.is_finalized = true;
          if (!feeder.status || feeder.status === MatchStatus.PENDING) feeder.status = MatchStatus.COMPLETED;

          // Propagate from feeder (winner becomes opp, loser becomes dq participant)
          this.replacePlaceholders(bracket.rounds, 'winner', feeder.id, opp);
          if (dqParticipant) {
            this.replacePlaceholders(bracket.rounds, 'loser', feeder.id, dqParticipant);
          }

          // Do not set local winner/loser here; the match should be played with the new participant
          winner = undefined;
          loser = undefined;
        }
      } else {
        // Fallback: if no feeder found, auto-win to the other side
        if (p1 && p1.id === dqId) { match.disqualified_participant = p1; winner = p2; loser = p1; }
        else if (p2 && p2.id === dqId) { match.disqualified_participant = p2; winner = p1; loser = p2; }
        if (typeof match.score1 !== 'number' && typeof match.score2 !== 'number') {
          match.score1 = winner === p1 ? 1 : 0;
          match.score2 = winner === p2 ? 1 : 0;
        }
      }
    }

    if (!winner && dto.winner_id) {
      if (p1 && p1.id === dto.winner_id) {
        winner = p1;
        loser = p2;
      } else if (p2 && p2.id === dto.winner_id) {
        winner = p2;
        loser = p1;
      }
    }

    if (!winner && typeof match.score1 === 'number' && typeof match.score2 === 'number' && dto.status === MatchStatus.COMPLETED) {
      if (match.score1 > match.score2) {
        winner = p1;
        loser = p2;
      } else if (match.score2 > match.score1) {
        winner = p2;
        loser = p1;
      }
    }

    if (dto.status === MatchStatus.WALKOVER) {
      if (!winner) {
        if (p1 && p1.type !== ParticipantType.TBD && (!p2 || p2.type === ParticipantType.TBD)) winner = p1;
        else if (p2 && p2.type !== ParticipantType.TBD && (!p1 || p1.type === ParticipantType.TBD)) winner = p2;
      }
      if (winner) loser = winner === p1 ? p2 : p1;
      // Default score for WO if none
      if (typeof match.score1 !== 'number' && typeof match.score2 !== 'number') {
        match.score1 = winner === p1 ? 1 : 0;
        match.score2 = winner === p2 ? 1 : 0;
      }
    }

    if (winner) {
      match.winner = winner;
      match.is_finalized = dto.status === MatchStatus.COMPLETED || dto.status === MatchStatus.WALKOVER || dto.status === MatchStatus.DISQUALIFIED;
    }

    // Propagate winners and losers to placeholders across bracket
    if (winner) {
      this.replacePlaceholders(bracket.rounds, 'winner', match.id, winner);
    }
    if (loser) {
      this.replacePlaceholders(bracket.rounds, 'loser', match.id, loser);
    }

    // Auto-finalize bracket if final match has winner
    this.updateBracketFinalization(bracket);

    // Update metadata
    if (bracket.metadata) bracket.metadata.updated_at = new Date().toISOString();

    // Persist
    const save = await this.supabaseService.client
      .from('tournaments')
      .update({ bracket_data: bracket, updated_at: new Date().toISOString() })
      .eq('id', dto.tournament_id);

    if (save.error) throw new BadRequestException(`Failed to update bracket: ${save.error.message}`);

    return bracket;
  }

  // Reset a match and clear downstream placements depending on placeholders
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

    const matchRef = this.findMatch(bracket.rounds, match_id);
    if (!matchRef) throw new NotFoundException('Match not found in bracket');

    const match = matchRef.match;

    // Clear match state
    match.score1 = undefined;
    match.score2 = undefined;
    match.winner = undefined;
    match.status = MatchStatus.PENDING;
    match.is_finalized = false;
    match.disqualified_participant = undefined;

    // Recreate placeholders for downstream references to this match
    this.restorePlaceholders(bracket.rounds, match);

    // Bracket no longer final if previously marked
    if (bracket.metadata) bracket.metadata.is_finalized = false;

    // Persist
    const save = await this.supabaseService.client
      .from('tournaments')
      .update({ bracket_data: bracket, updated_at: new Date().toISOString() })
      .eq('id', tournament_id);

    if (save.error) throw new BadRequestException(`Failed to reset match: ${save.error.message}`);

    return bracket;
  }

  private updateBracketFinalization(bracket: SingleEliminationBracketDto) {
    const lastRound = bracket.rounds[bracket.rounds.length - 1];
    // If bronze round exists, the actual final is either the previous round's last match or the last round match that is not bronze
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

  private restorePlaceholders(rounds: BracketRoundDto[], sourceMatch: BracketMatchDto) {
    // Replace any participant that was previously winner/loser of sourceMatch back to placeholders
    for (const round of rounds) {
      for (const m of round.matches) {
        if (m.participant1 && m.participant1.placeholder_reference?.match_id === sourceMatch.id) {
          const isLoser = m.participant1.type === ParticipantType.PLACEHOLDER_LOSER;
          m.participant1 = isLoser ? this.createLoserPlaceholder(sourceMatch) : this.createWinnerPlaceholder(sourceMatch);
        }
        if (m.participant2 && m.participant2.placeholder_reference?.match_id === sourceMatch.id) {
          const isLoser = m.participant2.type === ParticipantType.PLACEHOLDER_LOSER;
          m.participant2 = isLoser ? this.createLoserPlaceholder(sourceMatch) : this.createWinnerPlaceholder(sourceMatch);
        }
      }
    }
  }

  private createWinnerPlaceholder(match: BracketMatchDto): ParticipantDto {
    return {
      id: `winner-of-${match.id}`,
      name: `Winner of Match ${match.match_number}`,
      type: ParticipantType.PLACEHOLDER_WINNER,
      placeholder_reference: { match_id: match.id },
    };
  }

  private createLoserPlaceholder(match: BracketMatchDto): ParticipantDto {
    return {
      id: `loser-of-${match.id}`,
      name: `Loser of Match ${match.match_number}`,
      type: ParticipantType.PLACEHOLDER_LOSER,
      placeholder_reference: { match_id: match.id },
    };
  }

  private findMatch(rounds: BracketRoundDto[], matchId: string): { roundIndex: number; matchIndex: number; match: BracketMatchDto } | null {
    for (let ri = 0; ri < rounds.length; ri++) {
      const r = rounds[ri];
      const mi = r.matches.findIndex(m => m.id === matchId);
      if (mi !== -1) return { roundIndex: ri, matchIndex: mi, match: r.matches[mi] };
    }
    return null;
  }

  private findFeederMatch(rounds: BracketRoundDto[], currentMatchId: string, slot: number): BracketMatchDto | undefined {
    for (const r of rounds) {
      for (const m of r.matches) {
        if (m.next_match_id === currentMatchId && m.next_match_position === slot) return m;
      }
    }
    return undefined;
  }

  private replacePlaceholders(rounds: BracketRoundDto[], kind: 'winner' | 'loser', sourceMatchId: string, participant: ParticipantDto) {
    const isWinner = kind === 'winner';
    const placeholderType = isWinner ? ParticipantType.PLACEHOLDER_WINNER : ParticipantType.PLACEHOLDER_LOSER;

    for (const round of rounds) {
      for (const m of round.matches) {
        if (m.participant1 && m.participant1.type === placeholderType && m.participant1.placeholder_reference?.match_id === sourceMatchId) {
          m.participant1 = participant;
        }
        if (m.participant2 && m.participant2.type === placeholderType && m.participant2.placeholder_reference?.match_id === sourceMatchId) {
          m.participant2 = participant;
        }
      }
    }
  }

  async listPlacements(tournament_id: string) {
    const { data, error } = await this.supabaseService.client
      .from('tournaments')
      .select('id, bracket_data')
      .eq('id', tournament_id)
      .single();

    if (error || !data) throw new NotFoundException('Tournament not found');
    const bracket: SingleEliminationBracketDto = data.bracket_data as SingleEliminationBracketDto;
    if (!bracket || bracket.type !== BracketType.SINGLE_ELIMINATION) throw new BadRequestException('Invalid or missing Single Elimination bracket');

    const placements = (bracket.metadata.placements || []).slice().sort((a,b) => a.place - b.place);
    return placements;
  }

  async getFinalPlacements(tournament_id: string) {
    const { data, error } = await this.supabaseService.client
      .from('tournaments')
      .select('id, bracket_data')
      .eq('id', tournament_id)
      .single();

    if (error || !data) throw new NotFoundException('Tournament not found');
    const bracket: SingleEliminationBracketDto = data.bracket_data as SingleEliminationBracketDto;
    if (!bracket || bracket.type !== BracketType.SINGLE_ELIMINATION) throw new BadRequestException('Invalid or missing Single Elimination bracket');

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

  async recomputeFinalPlacements(tournament_id: string) {
    const { data, error } = await this.supabaseService.client
      .from('tournaments')
      .select('id, bracket_data')
      .eq('id', tournament_id)
      .single();

    if (error || !data) throw new NotFoundException('Tournament not found');
    const bracket: SingleEliminationBracketDto = data.bracket_data as SingleEliminationBracketDto;
    if (!bracket || bracket.type !== BracketType.SINGLE_ELIMINATION) throw new BadRequestException('Invalid or missing Single Elimination bracket');

    const placements = this.calculateFinalPlacements(bracket);
    bracket.metadata = bracket.metadata || ({} as any);
    bracket.metadata.placements = placements;

    await this.supabaseService.client
      .from('tournaments')
      .update({ bracket_data: bracket, updated_at: new Date().toISOString() })
      .eq('id', tournament_id);

    return placements.sort((a, b) => a.place - b.place);
  }

  private calculateFinalPlacements(bracket: SingleEliminationBracketDto) {
    const placements: Array<{ participant_id: string; name?: string; place: number; dsq?: boolean; ex_aequo?: boolean }> = [];
    
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

  private calculateEarlyRoundPlacements(bracket: SingleEliminationBracketDto, placements: Array<{ participant_id: string; name?: string; place: number; dsq?: boolean }>) {
    // Calculate placements for participants eliminated in earlier rounds
    const placedParticipants = new Set(placements.map(p => p.participant_id));
    
    // Start from semifinals and work backwards
    const rounds = bracket.rounds.filter(r => !r.is_bronze_round);
    
    for (let roundIndex = rounds.length - 2; roundIndex >= 0; roundIndex--) {
      const round = rounds[roundIndex];
      const eliminatedInThisRound: ParticipantDto[] = [];
      
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

  private isDQParticipant(participantId: string, placements: Array<{ participant_id: string; dsq?: boolean }>): boolean {
    return placements.some(p => p.participant_id === participantId && p.dsq);
  }

  private getNextAvailablePlace(placements: Array<{ place: number }>): number {
    const usedPlaces = new Set(placements.map(p => p.place));
    let place = 1;
    while (usedPlaces.has(place)) {
      place++;
    }
    return place;
  }

  async getSummary(tournament_id: string) {
    const { data, error } = await this.supabaseService.client
      .from('tournaments')
      .select('id, bracket_data')
      .eq('id', tournament_id)
      .single();

    if (error || !data) throw new NotFoundException('Tournament not found');
    const bracket: SingleEliminationBracketDto = data.bracket_data as SingleEliminationBracketDto;
    if (!bracket || bracket.type !== BracketType.SINGLE_ELIMINATION) throw new BadRequestException('Invalid or missing Single Elimination bracket');

    const rounds = bracket.rounds.length;
    let completed = 0;
    let pending = 0;
    const dqList: Array<{ match_id: string; participant_id: string; name?: string }> = [];
    for (const r of bracket.rounds) {
      for (const m of r.matches) {
        if (m.status === MatchStatus.COMPLETED || m.status === MatchStatus.WALKOVER || m.status === MatchStatus.DISQUALIFIED) completed++;
        if (m.status === MatchStatus.PENDING || m.status === MatchStatus.SCHEDULED || m.status === MatchStatus.LIVE) pending++;
        if (m.disqualified_participant) dqList.push({ match_id: m.id, participant_id: m.disqualified_participant.id, name: m.disqualified_participant.name });
      }
    }

    // Determine current round: the smallest round with any not-finished matches; if none, it's the last round
    let current_round = rounds;
    for (const r of bracket.rounds) {
      const hasActive = r.matches.some(m => m.status === MatchStatus.PENDING || m.status === MatchStatus.SCHEDULED || m.status === MatchStatus.LIVE);
      if (hasActive) { current_round = r.round; break; }
    }

    // final status
    const lastRound = bracket.rounds[bracket.rounds.length - 1];
    let finalStatus: MatchStatus | 'NONE' = 'NONE';
    let bronzeStatus: MatchStatus | 'NONE' = 'NONE';
    if (lastRound) {
      const finalMatch = lastRound.is_bronze_round && bracket.rounds.length >= 2
        ? bracket.rounds[bracket.rounds.length - 2].matches.slice(-1)[0]
        : lastRound.matches.slice(-1)[0];
      if (finalMatch) finalStatus = finalMatch.status as MatchStatus;
      if (lastRound.is_bronze_round && lastRound.matches[0]) bronzeStatus = lastRound.matches[0].status as MatchStatus;
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