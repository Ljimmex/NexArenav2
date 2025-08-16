import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  BracketType,
  SingleEliminationBracketDto,
  BracketRoundDto,
  BracketMatchDto,
  ParticipantDto,
  ParticipantType,
  MatchStatus,
} from '../dto/bracket.dto';

@Injectable()
export class SingleEliminationGeneratorService {
  /**
   * Generates a single elimination bracket from participants
   */
  generateSingleEliminationBracket(
    tournamentId: string,
    participants: ParticipantDto[],
    bronzeMatch: boolean = false,
  ): SingleEliminationBracketDto {
    if (participants.length < 2) {
      throw new Error('At least 2 participants are required for single elimination');
    }

    const totalParticipants = participants.length;
    const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(totalParticipants)));
    const byesNeeded = nextPowerOfTwo - totalParticipants;

    // Create placeholder seed participants to fill to next power of two
    const byes: ParticipantDto[] = [];
    for (let i = 0; i < byesNeeded; i++) {
      const nextIndex = totalParticipants + i + 1;
      byes.push({
        id: `seed-${nextIndex}`,
        name: `Seed #${nextIndex}`,
        type: ParticipantType.PLACEHOLDER_SEED,
        seed: nextIndex,
      });
    }

    // Combine real participants with byes
    const allParticipants = [...participants, ...byes];
    
    // Shuffle participants for fair distribution
    const shuffled = this.shuffleArray([...allParticipants]);

    const totalRounds = Math.log2(nextPowerOfTwo);
    const rounds: BracketRoundDto[] = [];

    // Generate first round with actual participants
    const firstRoundMatches: BracketMatchDto[] = [];
    let matchNumber = 1;

    for (let i = 0; i < shuffled.length; i += 2) {
      const participant1 = shuffled[i];
      const participant2 = shuffled[i + 1];

      // Calculate default scheduled time (1 hour from now + round delay)
      const baseTime = new Date();
      baseTime.setHours(baseTime.getHours() + 1); // Base: 1 hour from now
      baseTime.setMinutes(baseTime.getMinutes() + (Math.floor(i / 2) * 30)); // 30 min between matches in same round

      const match: BracketMatchDto = {
          id: uuidv4(),
          match_number: matchNumber++,
          round: 1,
          position_in_round: Math.floor(i / 2) + 1,
          participant1,
          participant2,
          status: MatchStatus.PENDING,
          is_finalized: false,
          scheduled_at: baseTime.toISOString(),
          best_of: 1, // Default best of 1
          next_match_id: undefined,
          next_match_position: undefined,
        };

      // Auto-advance if one participant is a bye
      if (participant1.type === ParticipantType.TBD) {
        match.winner = participant2;
        match.status = MatchStatus.WALKOVER;
        match.is_finalized = true;
        match.score1 = 0;
        match.score2 = 1;
      } else if (participant2.type === ParticipantType.TBD) {
        match.winner = participant1;
        match.status = MatchStatus.WALKOVER;
        match.is_finalized = true;
        match.score1 = 1;
        match.score2 = 0;
      }

      firstRoundMatches.push(match);
    }

    rounds.push({
      round: 1,
      name: 'Round 1',
      matches: firstRoundMatches,
      is_bronze_round: false,
    });

    // Generate subsequent rounds with placeholders
    for (let round = 2; round <= totalRounds; round++) {
      const roundMatches: BracketMatchDto[] = [];
      const previousRound = rounds[round - 2];
      const matchesInRound = Math.pow(2, totalRounds - round);

      for (let i = 0; i < matchesInRound; i++) {
        const match1Index = i * 2;
        const match2Index = i * 2 + 1;
        const prevMatch1 = previousRound.matches[match1Index];
        const prevMatch2 = previousRound.matches[match2Index];

        // Calculate default scheduled time for this round (later rounds are scheduled later)
        const baseTime = new Date();
        baseTime.setHours(baseTime.getHours() + 1); // Base: 1 hour from now
        baseTime.setHours(baseTime.getHours() + (round - 1) * 2); // 2 hours between rounds
        baseTime.setMinutes(baseTime.getMinutes() + (i * 30)); // 30 min between matches in same round

        // Sequential position for column layout
        const sequentialPosition = i + 1;

        const match: BracketMatchDto = {
          id: uuidv4(),
          match_number: matchNumber++,
          round,
          position_in_round: sequentialPosition, // Use sequential positioning for column layout
          participant1: this.createWinnerPlaceholder(prevMatch1),
          participant2: this.createWinnerPlaceholder(prevMatch2),
          status: MatchStatus.PENDING,
          is_finalized: false,
          scheduled_at: baseTime.toISOString(),
          best_of: 1, // Default best of 1
          next_match_id: undefined,
          next_match_position: undefined,
        };

        // Set next match references for previous round matches
        prevMatch1.next_match_id = match.id;
        prevMatch1.next_match_position = 1;
        prevMatch2.next_match_id = match.id;
        prevMatch2.next_match_position = 2;

        roundMatches.push(match);
      }

      rounds.push({
        round,
        name: `Round ${round}`,
        matches: roundMatches,
        is_bronze_round: false,
      });
    }

    // Add bronze match if requested
    if (bronzeMatch && totalRounds >= 2) {
      const semifinalRound = rounds[rounds.length - 2];
      
      // Schedule bronze match before the final
      const baseTime = new Date();
      baseTime.setHours(baseTime.getHours() + 1); // Base: 1 hour from now
      baseTime.setHours(baseTime.getHours() + (totalRounds - 1) * 2); // Same time as final round
      baseTime.setMinutes(baseTime.getMinutes() - 30); // 30 minutes before final
      
      // Position bronze match sequentially
      const bronzePosition = 1; // First position in bronze round

      const bronzeMatchObj: BracketMatchDto = {
        id: uuidv4(),
        match_number: matchNumber++,
        round: totalRounds + 1,
        position_in_round: bronzePosition,
        participant1: this.createLoserPlaceholder(semifinalRound.matches[0]),
        participant2: this.createLoserPlaceholder(semifinalRound.matches[1]),
        status: MatchStatus.PENDING,
        is_finalized: false,
        is_bronze_match: true,
        scheduled_at: baseTime.toISOString(),
        best_of: 1, // Default best of 1
        next_match_id: undefined,
        next_match_position: undefined,
      };

      rounds.push({
        round: totalRounds + 1,
        name: 'Bronze Match',
        matches: [bronzeMatchObj],
        is_bronze_round: true,
      });
    }

    // Propagate winners from first round
    this.propagateWinners(rounds);

    return {
      tournament_id: tournamentId,
      type: BracketType.SINGLE_ELIMINATION,
      total_participants: totalParticipants,
      total_rounds: bronzeMatch ? totalRounds + 1 : totalRounds,
      bronze_match: bronzeMatch,
      rounds,
      metadata: {
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_finalized: false,
        is_bracket_complete: false,
        placements: [],
      },
    };
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
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

  private propagateWinners(rounds: BracketRoundDto[]) {
    for (const round of rounds) {
      for (const match of round.matches) {
        if (match.winner) {
          this.replacePlaceholders(rounds, 'winner', match.id, match.winner);
        }
      }
    }
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