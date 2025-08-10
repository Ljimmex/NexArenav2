import { v4 as uuidv4 } from 'uuid';
import { BracketType, MatchStatus, ParticipantDto, ParticipantType, BracketMatchDto, BracketRoundDto, SingleEliminationBracketDto } from './dto/bracket.dto';

export interface SingleEliminationOptions {
  tournament_id: string;
  max_participants: number; // bracket size (e.g., 8, 16). If non power of two, byes will be inserted
  bronze_match?: boolean; // add 3rd-place match
  participants?: ParticipantDto[]; // optional pre-seeded participants
}

export class SingleEliminationGenerator {
  generate(options: SingleEliminationOptions): SingleEliminationBracketDto {
    const { tournament_id, max_participants, bronze_match = false } = options;
    if (max_participants < 2) throw new Error('max_participants must be >= 2');

    const size = this.nextPowerOfTwo(max_participants);
    const total_rounds = Math.log2(size);

    const seeded = this.seedParticipants(options.participants ?? [], max_participants);
    const withByes = this.fillByes(seeded, size);

    const rounds: BracketRoundDto[] = [];
    let matchCounter = 1;

    // Round names helper
    const roundName = (roundIndex: number, totalRounds: number) => {
      const remaining = totalRounds - roundIndex;
      if (remaining === 0) return 'Final';
      if (remaining === 1) return 'Semifinals';
      if (remaining === 2) return 'Quarterfinals';
      return `Round of ${2 ** (remaining + 1)}`;
    };

    // Generate rounds and matches
    let currentParticipants = withByes;
    for (let r = 1; r <= total_rounds; r++) {
      const matches: BracketMatchDto[] = [];
      const roundParticipants: ParticipantDto[] = [];

      for (let i = 0; i < currentParticipants.length; i += 2) {
        const p1 = currentParticipants[i] ?? this.tbd();
        const p2 = currentParticipants[i + 1] ?? this.tbd();

        const match: BracketMatchDto = {
          id: uuidv4(),
          match_number: matchCounter++,
          round: r,
          position_in_round: i / 2 + 1,
          participant1: p1,
          participant2: p2,
          status: MatchStatus.PENDING,
        };

        matches.push(match);
        // For next round placeholders (winners)
        roundParticipants.push(this.placeholderWinner(match));
      }

      rounds.push({ round: r, name: roundName(r, total_rounds), matches });
      currentParticipants = roundParticipants;
    }

    // Link matches to next matches
    this.linkNextMatches(rounds);

    // Optional bronze match (losers of semifinals)
    if (bronze_match && rounds.length >= 2) {
      const semifinalRound = rounds[rounds.length - 2];
      const bronzeMatch: BracketMatchDto = {
        id: uuidv4(),
        match_number: matchCounter++,
        round: rounds.length, // same level as final for placement
        position_in_round: (rounds[rounds.length - 1].matches.length ?? 1) + 1,
        participant1: this.placeholderLoser(semifinalRound.matches[0]),
        participant2: this.placeholderLoser(semifinalRound.matches[1]),
        status: MatchStatus.PENDING,
        is_bronze_match: true,
      } as any;

      const bronzeRound: BracketRoundDto = {
        round: rounds.length,
        name: 'Bronze Match',
        matches: [bronzeMatch],
        is_bronze_round: true,
      };

      rounds.push(bronzeRound);
    }

    const bracket: SingleEliminationBracketDto = {
      tournament_id,
      type: BracketType.SINGLE_ELIMINATION,
      total_participants: max_participants,
      total_rounds: rounds.length,
      bronze_match,
      rounds,
      metadata: {
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_finalized: false,
        advancement_rules: 'Winners advance, byes auto-advance; bronze match between semifinal losers if enabled.',
        placements: [],
      },
    };

    return bracket;
  }

  // Seed logic: if participants provided with seed field, place them; otherwise generate placeholders Seed #n
  private seedParticipants(participants: ParticipantDto[], max: number): ParticipantDto[] {
    if (!participants.length) {
      return Array.from({ length: max }, (_, i) => this.placeholderSeed(i + 1));
    }
    // Ensure we have at most max entries
    const limited = participants.slice(0, max);
    // Fill remaining with seeds placeholders
    while (limited.length < max) {
      limited.push(this.tbd());
    }
    return limited;
  }

  private fillByes(list: ParticipantDto[], size: number): ParticipantDto[] {
    const filled = list.slice();
    while (filled.length < size) {
      filled.push(this.tbd('BYE'));
    }
    return filled;
  }

  private nextPowerOfTwo(n: number): number {
    return 1 << Math.ceil(Math.log2(Math.max(1, n)));
  }

  private tbd(name: string = 'TBD'): ParticipantDto {
    return {
      id: `tbd-${uuidv4()}`,
      name,
      type: ParticipantType.TBD,
    };
  }

  private placeholderSeed(seed: number): ParticipantDto {
    return {
      id: `seed-${seed}`,
      name: `Seed #${seed}`,
      type: ParticipantType.PLACEHOLDER_SEED,
      seed,
    };
  }

  private placeholderWinner(match: BracketMatchDto): ParticipantDto {
    return {
      id: `winner-of-${match.id}`,
      name: `Winner of Match ${match.match_number}`,
      type: ParticipantType.PLACEHOLDER_WINNER,
      placeholder_reference: { match_id: match.id },
    };
  }

  private placeholderLoser(match: BracketMatchDto): ParticipantDto {
    return {
      id: `loser-of-${match.id}`,
      name: `Loser of Match ${match.match_number}`,
      type: ParticipantType.PLACEHOLDER_LOSER,
      placeholder_reference: { match_id: match.id },
    };
  }

  // Utility linking function
  private linkNextMatches(rounds: BracketRoundDto[]) {
    for (let i = 0; i < rounds.length - 1; i++) {
      const current = rounds[i];
      const next = rounds[i + 1];
      next.matches.forEach((nm, idx) => {
        const s = idx * 2;
        const m1 = current.matches[s];
        const m2 = current.matches[s + 1];
        if (!m1 || !m2) return;
        m1.next_match_id = nm.id;
        m1.next_match_position = 1;
        m2.next_match_id = nm.id;
        m2.next_match_position = 2;
      });
    }
  }

  // Helper placeholders for other formats to be used in integration brackets
  public static fromSwissPlace(position: number): ParticipantDto {
    return {
      id: `swiss-place-${position}`,
      name: `Swiss place ${position}`,
      type: ParticipantType.PLACEHOLDER_SWISS,
      placeholder_reference: { swiss_place: position },
    };
  }

  public static fromRoundRobinPosition(pos: string): ParticipantDto {
    return {
      id: `rr-${pos}`,
      name: `Round Robin ${pos}`,
      type: ParticipantType.PLACEHOLDER_ROUND_ROBIN,
      placeholder_reference: { round_robin_position: pos },
    };
  }

  public static fromGroupPlacement(groupId: string, place: number, labelPrefix: string = 'Groups'): ParticipantDto {
    return {
      id: `group-${groupId}-${place}`,
      name: `${labelPrefix} ${groupId}${place}`,
      type: ParticipantType.PLACEHOLDER_GROUP,
      placeholder_reference: { group_id: `${groupId}${place}` },
    };
  }

  public static fromSingleElimGroupPlacement(groupId: string, place: number): ParticipantDto {
    return SingleEliminationGenerator.fromGroupPlacement(groupId, place, 'Single Elimination Groups');
  }

  public static fromDoubleElimGroupPlacement(groupId: string, place: number): ParticipantDto {
    return SingleEliminationGenerator.fromGroupPlacement(groupId, place, 'Double Elimination Groups');
  }
}