import { v4 as uuidv4 } from 'uuid';
import { BracketType, MatchStatus, ParticipantDto, ParticipantType, BracketMatchDto, BracketRoundDto, SingleEliminationBracketDto } from './dto/bracket.dto';
import { SingleEliminationGenerator } from './single-elimination.generator';

export interface SingleEliminationGroupsOptions {
  tournament_id: string;
  max_participants_per_group: number; // teams per group (e.g., 8)
  number_of_groups: number; // number of groups (e.g., 4 for groups A, B, C, D)
  bronze_match?: boolean; // add 3rd-place match for each group
  participants?: ParticipantDto[]; // optional pre-seeded participants
}

export interface GroupBracket {
  group_id: string;
  group_name: string; // A, B, C, etc.
  bracket: SingleEliminationBracketDto;
}

export interface SingleEliminationGroupsBracketDto {
  tournament_id: string;
  type: BracketType;
  total_participants: number;
  number_of_groups: number;
  max_participants_per_group: number;
  bronze_match?: boolean;
  groups: GroupBracket[];
  metadata: {
    created_at: string;
    updated_at: string;
    is_finalized: boolean;
    advancement_rules?: string;
    placements?: Array<{
      participant_id: string;
      name?: string;
      place: number;
      group_id: string;
      dsq?: boolean;
      ex_aequo?: boolean;
    }>;
  };
}

export class SingleEliminationGroupsGenerator {
  private seGen = new SingleEliminationGenerator();

  generate(options: SingleEliminationGroupsOptions): SingleEliminationGroupsBracketDto {
    const { 
      tournament_id, 
      max_participants_per_group, 
      number_of_groups, 
      bronze_match = false,
      participants = []
    } = options;

    if (max_participants_per_group < 2) {
      throw new Error('max_participants_per_group must be >= 2');
    }
    if (number_of_groups < 1) {
      throw new Error('number_of_groups must be >= 1');
    }

    const groups: GroupBracket[] = [];
    const totalParticipants = max_participants_per_group * number_of_groups;

    // Distribute participants across groups
    const groupParticipants = this.distributeParticipants(participants, number_of_groups, max_participants_per_group);

    // Generate brackets for each group
    for (let i = 0; i < number_of_groups; i++) {
      const groupLetter = String.fromCharCode(65 + i); // A, B, C, etc.
      const groupId = `group-${groupLetter.toLowerCase()}`;
      
      // Generate single elimination bracket for this group
      const groupBracket = this.seGen.generate({
        tournament_id: `${tournament_id}-${groupId}`,
        max_participants: max_participants_per_group,
        bronze_match,
        participants: groupParticipants[i] || []
      });

      // Update match IDs to include group prefix
      this.prefixMatchIds(groupBracket, groupId);

      groups.push({
        group_id: groupId,
        group_name: groupLetter,
        bracket: groupBracket
      });
    }

    const groupsBracket: SingleEliminationGroupsBracketDto = {
      tournament_id,
      type: BracketType.SINGLE_ELIMINATION,
      total_participants: totalParticipants,
      number_of_groups,
      max_participants_per_group,
      bronze_match,
      groups,
      metadata: {
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_finalized: false,
        advancement_rules: `Each group is a separate Single Elimination bracket with ${max_participants_per_group} teams. ${bronze_match ? 'Bronze match enabled for each group.' : ''}`,
        placements: []
      }
    };

    return groupsBracket;
  }

  private distributeParticipants(
    participants: ParticipantDto[], 
    numberOfGroups: number, 
    maxPerGroup: number
  ): ParticipantDto[][] {
    const groups: ParticipantDto[][] = Array.from({ length: numberOfGroups }, () => []);
    
    // Distribute participants in round-robin fashion for better balance
    participants.forEach((participant, index) => {
      const groupIndex = index % numberOfGroups;
      if (groups[groupIndex].length < maxPerGroup) {
        groups[groupIndex].push(participant);
      }
    });

    // Fill remaining slots with placeholders
    for (let i = 0; i < numberOfGroups; i++) {
      const groupLetter = String.fromCharCode(65 + i);
      while (groups[i].length < maxPerGroup) {
        groups[i].push({
          id: `seed-${groupLetter}${groups[i].length + 1}`,
          name: `Seed ${groupLetter}${groups[i].length + 1}`,
          type: ParticipantType.PLACEHOLDER_SEED,
          seed: groups[i].length + 1
        });
      }
    }

    return groups;
  }

  private prefixMatchIds(bracket: SingleEliminationBracketDto, groupId: string): void {
    for (const round of bracket.rounds) {
      for (const match of round.matches) {
        // Update match ID
        const oldId = match.id;
        match.id = `${groupId}-${match.id}`;
        
        // Update participant references
        this.updateParticipantReferences(match.participant1, oldId, match.id);
        this.updateParticipantReferences(match.participant2, oldId, match.id);
        if (match.winner) {
          this.updateParticipantReferences(match.winner, oldId, match.id);
        }

        // Update next_match_id references
        if (match.next_match_id) {
          match.next_match_id = `${groupId}-${match.next_match_id}`;
        }
      }
    }

    // Update all placeholder references in the bracket
    this.updateAllPlaceholderReferences(bracket, groupId);
  }

  private updateParticipantReferences(participant: ParticipantDto, oldMatchId: string, newMatchId: string): void {
    if (participant.placeholder_reference?.match_id === oldMatchId) {
      participant.placeholder_reference.match_id = newMatchId;
    }
    
    // Update participant ID if it references the old match
    if (participant.id.includes(oldMatchId)) {
      participant.id = participant.id.replace(oldMatchId, newMatchId);
    }
  }

  private updateAllPlaceholderReferences(bracket: SingleEliminationBracketDto, groupId: string): void {
    for (const round of bracket.rounds) {
      for (const match of round.matches) {
        // Update all participant references that might point to other matches in this group
        [match.participant1, match.participant2].forEach(participant => {
          if (participant.placeholder_reference?.match_id && 
              !participant.placeholder_reference.match_id.startsWith(groupId)) {
            participant.placeholder_reference.match_id = `${groupId}-${participant.placeholder_reference.match_id}`;
          }
        });
      }
    }
  }

  // Helper method to get all matches from all groups
  public static getAllMatches(groupsBracket: SingleEliminationGroupsBracketDto): BracketMatchDto[] {
    const allMatches: BracketMatchDto[] = [];
    
    for (const group of groupsBracket.groups) {
      for (const round of group.bracket.rounds) {
        for (const match of round.matches) {
          allMatches.push(match);
        }
      }
    }
    
    return allMatches;
  }

  // Helper method to get matches for a specific group
  public static getGroupMatches(groupsBracket: SingleEliminationGroupsBracketDto, groupId: string): BracketMatchDto[] {
    const group = groupsBracket.groups.find(g => g.group_id === groupId);
    if (!group) return [];
    
    const matches: BracketMatchDto[] = [];
    for (const round of group.bracket.rounds) {
      for (const match of round.matches) {
        matches.push(match);
      }
    }
    
    return matches;
  }

  // Helper method to find a specific match across all groups
  public static findMatch(groupsBracket: SingleEliminationGroupsBracketDto, matchId: string): { match: BracketMatchDto; group: GroupBracket; round: BracketRoundDto } | null {
    for (const group of groupsBracket.groups) {
      for (const round of group.bracket.rounds) {
        for (const match of round.matches) {
          if (match.id === matchId) {
            return { match, group, round };
          }
        }
      }
    }
    return null;
  }
}