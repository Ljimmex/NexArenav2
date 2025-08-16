import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  SingleEliminationBracketDto,
  BracketMatchDto,
  BracketRoundDto,
  ParticipantDto,
  ParticipantType,
  MatchStatus,
  UpdateBracketMatchRequestDto,
} from '../dto/bracket.dto';

@Injectable()
export class BracketMatchManagerService {
  /**
   * Finds a match in the bracket rounds
   */
  findMatch(
    rounds: BracketRoundDto[],
    matchId: string,
  ): { roundIndex: number; matchIndex: number; match: BracketMatchDto } | null {
    for (let ri = 0; ri < rounds.length; ri++) {
      const r = rounds[ri];
      const mi = r.matches.findIndex(m => m.id === matchId);
      if (mi !== -1) return { roundIndex: ri, matchIndex: mi, match: r.matches[mi] };
    }
    return null;
  }

  /**
   * Finds a match across a bracket, including within groups when present
   */
  private findMatchAcrossBracket(
    bracket: SingleEliminationBracketDto,
    matchId: string,
  ): { rounds: BracketRoundDto[]; matchRef: { roundIndex: number; matchIndex: number; match: BracketMatchDto } } | null {
    // First, try in root rounds
    let matchRef = this.findMatch(bracket.rounds, matchId);
    if (matchRef) return { rounds: bracket.rounds, matchRef };

    // If not found, search inside groups if they exist
    if (bracket.groups && bracket.groups.length > 0) {
      for (const group of bracket.groups) {
        const ref = this.findMatch(group.rounds, matchId);
        if (ref) {
          return { rounds: group.rounds, matchRef: ref };
        }
      }
    }

    return null;
  }

  /**
   * Finds the feeder match for a given match and slot
   */
  findFeederMatch(
    rounds: BracketRoundDto[],
    currentMatchId: string,
    slot: number,
  ): BracketMatchDto | undefined {
    for (const r of rounds) {
      for (const m of r.matches) {
        if (m.next_match_id === currentMatchId && m.next_match_position === slot) return m;
      }
    }
    return undefined;
  }

  /**
   * Updates a single elimination match
   */
  updateMatch(
    bracket: SingleEliminationBracketDto,
    dto: UpdateBracketMatchRequestDto,
  ): SingleEliminationBracketDto {
    const found = this.findMatchAcrossBracket(bracket, dto.match_id);
    if (!found) throw new NotFoundException('Match not found in bracket');
    const { rounds: roundsRef, matchRef } = found;
    const match = matchRef.match;

    // Safety: prevent overwriting finalized matches unless forced
    if (match.is_finalized && !dto.force_update) {
      throw new BadRequestException('Match is finalized and cannot be modified');
    }

    // Keep track of previous winner to detect changes
    const prevWinnerId = match.winner?.id;

    // Reset disqualification info
    match.disqualified_participant = undefined;

    // Update scores/status and handle DQ
    if (typeof dto.score1 === 'number') match.score1 = dto.score1;
    if (typeof dto.score2 === 'number') match.score2 = dto.score2;
    if (dto.status) match.status = dto.status;
    if (typeof (dto as any).best_of === 'number') match.best_of = (dto as any).best_of;
    if (typeof (dto as any).scheduled_at === 'string') match.scheduled_at = (dto as any).scheduled_at;

    const p1 = match.participant1;
    const p2 = match.participant2;

    let winner: ParticipantDto | undefined;
    let loser: ParticipantDto | undefined;
    let dqId: string | undefined;
    let dqParticipant: ParticipantDto | undefined;

    if (dto.status === MatchStatus.DISQUALIFIED && dto.disqualified_participant_id) {
      dqId = dto.disqualified_participant_id;
      dqParticipant = p1 && p1.id === dqId ? p1 : p2 && p2.id === dqId ? p2 : undefined;
      
      // Ensure placements array
      bracket.metadata.placements = bracket.metadata.placements || [];
      
      // Compute last place as total_participants or next available from bottom
      const usedPlaces = new Set((bracket.metadata.placements || []).map(pl => pl.place));
      let place = bracket.total_participants;
      while (usedPlaces.has(place) && place > 0) place--;
      
      if (dqParticipant) {
        // Upsert placement for dqId
        const idx = bracket.metadata.placements.findIndex(pl => pl.participant_id === dqParticipant.id);
        const record = { participant_id: dqParticipant.id, name: dqParticipant.name, place, dsq: true };
        if (idx >= 0) bracket.metadata.placements[idx] = record;
        else bracket.metadata.placements.push(record);
      }
    }

    // Handle disqualification logic
    let dqSlot: 1 | 2 | undefined;
    if (p1 && p1.id === dqId) dqSlot = 1;
    else if (p2 && p2.id === dqId) dqSlot = 2;

    if (dqSlot) {
      const feeder = this.findFeederMatch(roundsRef, match.id, dqSlot);
      if (feeder) {
        // Identify opponent from feeder match
        const opp = feeder.participant1 && feeder.participant1.id !== dqId ? feeder.participant1
                  : feeder.participant2 && feeder.participant2.id !== dqId ? feeder.participant2
                  : undefined;
        if (opp) {
          // Record who got DQ'ed
          if (dqParticipant) match.disqualified_participant = dqParticipant;
          
          // Replace participant in current match
          if (dqSlot === 1) match.participant1 = opp;
          else match.participant2 = opp;
          
          // Normalize current match to be replayed
          match.winner = undefined;
          match.status = MatchStatus.PENDING;
          match.is_finalized = false;
          match.score1 = undefined;
          match.score2 = undefined;

          // Update feeder match outcome to reflect retroactive promotion
          const prevFeederWinnerId = feeder.winner?.id;
          feeder.winner = opp;
          feeder.is_finalized = true;
          if (!feeder.status || feeder.status === MatchStatus.PENDING) feeder.status = MatchStatus.COMPLETED;

          // Ensure feeder scores reflect the promoted winner
          const oppIsP1 = feeder.participant1?.id === opp.id;
          // Override scores if missing or if previous winner changed
          if (
            typeof feeder.score1 !== 'number' ||
            typeof feeder.score2 !== 'number' ||
            (prevFeederWinnerId && prevFeederWinnerId !== opp.id)
          ) {
            feeder.score1 = oppIsP1 ? 1 : 0;
            feeder.score2 = oppIsP1 ? 0 : 1;
          }

          // Propagate from feeder
          this.replacePlaceholders(roundsRef, 'winner', feeder.id, opp);
          if (dqParticipant) {
            this.replacePlaceholders(roundsRef, 'loser', feeder.id, dqParticipant);
          }

          winner = undefined;
          loser = undefined;
        }
      } else {
        // Fallback: if no feeder found, auto-win to the other side
        if (p1 && p1.id === dqId) {
          match.disqualified_participant = p1;
          winner = p2;
          loser = p1;
        } else if (p2 && p2.id === dqId) {
          match.disqualified_participant = p2;
          winner = p1;
          loser = p2;
        }
        if (typeof match.score1 !== 'number' && typeof match.score2 !== 'number') {
          match.score1 = winner === p1 ? 1 : 0;
          match.score2 = winner === p2 ? 1 : 0;
        }
      }
    }

    // Determine winner from winner_id
    if (!winner && dto.winner_id) {
      if (p1 && p1.id === dto.winner_id) {
        winner = p1;
        loser = p2;
      } else if (p2 && p2.id === dto.winner_id) {
        winner = p2;
        loser = p1;
      }
    }

    // Determine winner from scores
    if (!winner && typeof match.score1 === 'number' && typeof match.score2 === 'number' && dto.status === MatchStatus.COMPLETED) {
      if (match.score1 > match.score2) {
        winner = p1;
        loser = p2;
      } else if (match.score2 > match.score1) {
        winner = p2;
        loser = p1;
      }
    }

    // Handle walkover
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
      match.is_finalized = dto.status === MatchStatus.COMPLETED || 
                          dto.status === MatchStatus.WALKOVER || 
                          dto.status === MatchStatus.DISQUALIFIED;
    }

    // Propagate winners and losers to placeholders across bracket
    if (winner) {
      this.replacePlaceholders(roundsRef, 'winner', match.id, winner);
    }
    if (loser) {
      this.replacePlaceholders(roundsRef, 'loser', match.id, loser);
    }

    // If the winner changed and there is a downstream match, normalize that next match
    if (prevWinnerId && winner && prevWinnerId !== winner.id && match.next_match_id) {
      const nextRef = this.findMatch(roundsRef, match.next_match_id);
      if (nextRef) {
        const nextMatch = nextRef.match;
        // Ensure the new winner is set in the correct slot (already handled by replacePlaceholders, but enforce for safety)
        if (match.next_match_position === 1) nextMatch.participant1 = winner;
        else if (match.next_match_position === 2) nextMatch.participant2 = winner;

        // If the next match was finalized or depended on the previous winner, reset it
        if (nextMatch.is_finalized || nextMatch.winner?.id === prevWinnerId) {
          nextMatch.winner = undefined;
          nextMatch.score1 = undefined;
          nextMatch.score2 = undefined;
          nextMatch.status = MatchStatus.PENDING;
          nextMatch.is_finalized = false;

          // Also restore downstream placeholders that referenced the next match outcome
          this.restorePlaceholders(roundsRef, nextMatch);
        }
      }
    }

    // Auto-finalize bracket if final match has winner
    this.updateBracketFinalization(bracket);

    // Update metadata
    if (bracket.metadata) bracket.metadata.updated_at = new Date().toISOString();

    return bracket;
  }

  /**
   * Resets a match and clears downstream placements
   */
  resetMatch(bracket: SingleEliminationBracketDto, matchId: string): SingleEliminationBracketDto {
    const found = this.findMatchAcrossBracket(bracket, matchId);
    if (!found) throw new NotFoundException('Match not found in bracket');

    const { rounds: roundsRef, matchRef } = found;
    const match = matchRef.match;

    // Clear match state
    match.score1 = undefined;
    match.score2 = undefined;
    match.winner = undefined;
    match.status = MatchStatus.PENDING;
    match.is_finalized = false;
    match.disqualified_participant = undefined;

    // Recreate placeholders for downstream references to this match
    this.restorePlaceholders(roundsRef, match);

    // Bracket no longer final if previously marked
    if (bracket.metadata) bracket.metadata.is_finalized = false;

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

  private replacePlaceholders(
    rounds: BracketRoundDto[],
    kind: 'winner' | 'loser',
    sourceMatchId: string,
    participant: ParticipantDto,
  ) {
    const isWinner = kind === 'winner';
    const placeholderType = isWinner ? ParticipantType.PLACEHOLDER_WINNER : ParticipantType.PLACEHOLDER_LOSER;

    for (const round of rounds) {
      for (const m of round.matches) {
        if (
          m.participant1 &&
          m.participant1.type === placeholderType &&
          m.participant1.placeholder_reference?.match_id === sourceMatchId
        ) {
          m.participant1 = participant;
        }
        if (
          m.participant2 &&
          m.participant2.type === placeholderType &&
          m.participant2.placeholder_reference?.match_id === sourceMatchId
        ) {
          m.participant2 = participant;
        }
      }
    }
  }
}