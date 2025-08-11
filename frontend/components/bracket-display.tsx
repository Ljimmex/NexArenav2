'use client'

import React from 'react'
import { Badge } from "@/components/ui/badge"
import { Users, Trophy } from "lucide-react"
import { MatchConnectionLines } from './match-connection-lines'

interface Participant {
  id: string
  name: string
  type: string
  logo_url?: string
  seed?: number
}

interface Match {
  id: string
  match_number: number
  round: number
  position_in_round: number
  participant1: Participant
  participant2: Participant
  winner?: Participant
  status: 'PENDING' | 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED' | 'WALKOVER' | 'DISQUALIFIED'
  scheduled_at?: string
  started_at?: string
  score1?: number
  score2?: number
  is_bronze_match?: boolean
  is_finalized?: boolean
  disqualified_participant?: Participant
  best_of?: number
}

interface BracketDisplayProps {
  bracketData: Match[] | null
  loading?: boolean
  onMatchClick?: (match: Match) => void
  selectedGroup?: string | null
  groups?: Array<{ group_id: string; group_name: string }>
}

export function BracketDisplay({ bracketData, loading, onMatchClick, selectedGroup, groups }: BracketDisplayProps) {

  // Function to format date according to user requirements
  const formatMatchDate = (dateString: string): string => {
    const matchDate = new Date(dateString)
    const now = new Date()
    
    // Calculate time difference in milliseconds
    const timeDiff = matchDate.getTime() - now.getTime()
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
    
    // Format time
    const timeFormat = matchDate.toLocaleTimeString('pl-PL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
    
    // Today
    if (daysDiff === 0) {
      return `Dziś ${timeFormat}`
    }
    
    // Tomorrow
    if (daysDiff === 1) {
      return `Jutro ${timeFormat}`
    }
    
    // Within a week (2-7 days)
    if (daysDiff > 1 && daysDiff <= 7) {
      const dayName = matchDate.toLocaleDateString('pl-PL', { weekday: 'long' })
      return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${timeFormat}`
    }
    
    // More than a week
    const dateFormat = matchDate.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
    return `${dateFormat} ${timeFormat}`
  }


  if (loading) {
    return (
        <div>
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-400">Ładowanie drabinki...</div>
          </div>
        </div>
      )
  }

  if (!bracketData || !bracketData.length) {
    return (
      <div>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-400">Drabinka nie została jeszcze wygenerowana</div>
        </div>
      </div>
    )
  }

  // Separate bronze matches from regular matches
  const regularMatches = bracketData.filter(match => !match.is_bronze_match)
  const bronzeMatches = bracketData.filter(match => match.is_bronze_match)

  // Helper function to extract group ID from match ID
  const getGroupIdFromMatchId = (matchId: string): string | null => {
    // Support new format: "group-a-...", "group-b-...", etc.
    const prefixed = matchId.match(/^(group-[a-z])/i)
    if (prefixed) {
      return prefixed[1].toLowerCase()
    }

    // Fallback for legacy format: "A-..." -> map to "group-a"
    const parts = matchId.split('-')
    if (parts.length >= 2 && /^[A-Z]$/.test(parts[0])) {
      return `group-${parts[0].toLowerCase()}`
    }
    return null
  }





  // If selectedGroup is null (showing all groups), group by groups first, then by rounds
  // Otherwise, group only by rounds as before
  let matchesByRound: { [round: number]: Match[] } = {}
  let matchesByGroup: { [groupId: string]: { [round: number]: Match[] } } = {}
  let bronzeMatchesByGroup: { [groupId: string]: Match[] } = {}
  
  if ((!selectedGroup || selectedGroup === '' || selectedGroup === 'all') && groups && groups.length > 0) {
    // Group matches by group first, then by round within each group
    regularMatches.forEach(match => {
      const groupId = getGroupIdFromMatchId(match.id)
      if (groupId) {
        if (!matchesByGroup[groupId]) {
          matchesByGroup[groupId] = {}
        }
        if (!matchesByGroup[groupId][match.round]) {
          matchesByGroup[groupId][match.round] = []
        }
        matchesByGroup[groupId][match.round].push(match)
      }
    })

    // Group bronze matches by group
    bronzeMatches.forEach(match => {
      const groupId = getGroupIdFromMatchId(match.id)
      if (groupId) {
        if (!bronzeMatchesByGroup[groupId]) {
          bronzeMatchesByGroup[groupId] = []
        }
        bronzeMatchesByGroup[groupId].push(match)
      }
    })

    // Sort matches within each group and round
    Object.keys(matchesByGroup).forEach(groupId => {
      Object.keys(matchesByGroup[groupId]).forEach(round => {
        matchesByGroup[groupId][parseInt(round)].sort((a, b) => a.position_in_round - b.position_in_round)
      })
    })



  } else {
    // Original logic for single group or specific group view
    regularMatches.forEach(match => {
      if (!matchesByRound[match.round]) {
        matchesByRound[match.round] = []
      }
      matchesByRound[match.round].push(match)
    })

    // Sort matches within each round by position
    Object.keys(matchesByRound).forEach(round => {
      matchesByRound[parseInt(round)].sort((a, b) => a.position_in_round - b.position_in_round)
    })
  }

  // Calculate total rounds for naming
  const totalRounds = Math.max(...regularMatches.map(m => m.round))

  // Helper functions for improved bracket positioning
  const maxRound = Math.max(...(regularMatches.map(m => m.round) || [0]));
  
  // Calculate number of matches in each round
  const matchCountByRound = regularMatches.reduce((acc, match) => {
    if (!match.is_bronze_match) {
      acc[match.round] = (acc[match.round] || 0) + 1;
    }
    return acc;
  }, {} as Record<number, number>);

  // Improved bracket dimensions with better spacing
  const bracketWidth = (maxRound + 1) * 460 + 200; // Increased spacing from 340 to 460

  // Calculate the height needed for each round based on pyramid structure
  const calculateBracketHeight = () => {
    // Get the number of matches in the first round
    const firstRoundMatches = matchCountByRound[1] || 0;
    
    if (firstRoundMatches === 0) {
      return 800; // Default height if no first round matches
    }
    
    // Calculate base height needed for each match in the first round
    const baseMatchHeight = 140; // Height per match
    const baseSpacing = 40; // Base spacing between matches
    
    // For each round, the matches should be centered with increased spacing
    // This gives the proper pyramid effect
    const lastMatchPosition = firstRoundMatches * 200 + 80; // Position of the last match in round 1
    return Math.max(800, lastMatchPosition + baseMatchHeight + 300); // Added 300px extra space after the last match
  };
  
  const bracketHeight = calculateBracketHeight();

  // Improved function to calculate match position with proper pyramid effect
  const getMatchPosition = (match: Match): { left: string; top: string } => {
    // For third place match, position it below the final
    if (match.is_bronze_match) {
      const finalMatch = regularMatches.find(m => m.round === maxRound && !m.is_bronze_match);
      if (finalMatch) {
        // Get the position of the final match and align the third place match with it
        const finalPosition = getMatchPosition(finalMatch);
        return {
          left: finalPosition.left, // Align with the final match horizontally
          top: `${parseInt(finalPosition.top) + 200}px`, // 200px below the final match
        };
      }
    }
    
    // Find all matches in this round
    const matchesInRound = regularMatches.filter(m => 
      m.round === match.round && !m.is_bronze_match
    );
    
    // Find the index of this match in its round
    const matchIndex = matchesInRound.findIndex(m => m.id === match.id);
    
    // Calculate spacing based on the round
    const roundSpacing = 520; // Increased horizontal spacing between rounds from 400 to 520
    const verticalSpacing = 200; // Base vertical spacing between matches
    
    // Align with round labels by adjusting the left position to match Round Labels (-160)
    const leftPosition = match.round * roundSpacing +80;
    
    // For first round (round 1), use fixed spacing
    if (match.round === 1) {
      return {
        left: `${leftPosition}px`,
        top: `${matchIndex * verticalSpacing + 150}px`,
      };
    } 
    // For later rounds, position matches to align with their connected matches
    else {
      // Get the number of matches in the first round
      const firstRoundMatches = matchCountByRound[1] || 0;
      
      // Calculate how many first round matches feed into this match
      const matchesPerCurrentRoundMatch = Math.pow(2, match.round - 1);
      
      // Calculate the starting index in the first round
      const startingFirstRoundIndex = matchIndex * matchesPerCurrentRoundMatch;
      
      // Calculate the midpoint position
      const midpoint = startingFirstRoundIndex + (matchesPerCurrentRoundMatch / 2) - 0.5;
      
      // Calculate the top position based on the midpoint
      const topPosition = midpoint * verticalSpacing + 150;
      
      return {
        left: `${leftPosition}px`,
        top: `${topPosition}px`,
      };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'LIVE':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'SCHEDULED':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'WALKOVER':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'DISQUALIFIED':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'CANCELLED':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Zakończony'
      case 'LIVE':
        return 'W trakcie'
      case 'SCHEDULED':
        return 'Zaplanowany'
      case 'WALKOVER':
        return 'Walkover'
      case 'DISQUALIFIED':
        return 'Dyskwalifikacja'
      case 'CANCELLED':
        return 'Anulowany'
      default:
        return 'Oczekuje'
    }
  }

  const getRoundName = (round: number, maxRounds: number) => {
    if (round === maxRounds) return 'Finał'
    if (round === maxRounds - 1) return 'Półfinał'
    if (round === maxRounds - 2) return 'Ćwierćfinał'
    return `Runda ${round}`
  }

  const [showLeftArrow, setShowLeftArrow] = React.useState(false)
  const [showRightArrow, setShowRightArrow] = React.useState(false)

  const checkScrollButtons = () => {
    const container = document.getElementById('bracket-container')
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container
      setShowLeftArrow(scrollLeft > 0)
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }

  React.useEffect(() => {
    const container = document.getElementById('bracket-container')
    if (container) {
      // Reset scroll position to start (show first round from the beginning)
      container.scrollLeft = 0
      
      checkScrollButtons()
      container.addEventListener('scroll', checkScrollButtons)
      window.addEventListener('resize', checkScrollButtons)
      
      return () => {
        container.removeEventListener('scroll', checkScrollButtons)
        window.removeEventListener('resize', checkScrollButtons)
      }
    }
  }, [bracketData])

  return (
    <div className="relative">
      {/* Scroll Left Arrow */}
      {showLeftArrow && (
        <button
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-gray-800/90 hover:bg-gray-700/90 text-white p-4 rounded-full shadow-lg transition-all duration-200 border border-gray-600"
          onClick={() => {
            const container = document.getElementById('bracket-container');
            if (container) {
              container.scrollBy({ left: -400, behavior: 'smooth' });
            }
          }}
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Scroll Right Arrow */}
      {showRightArrow && (
        <button
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-gray-800/90 hover:bg-gray-700/90 text-white p-4 rounded-full shadow-lg transition-all duration-200 border border-gray-600"
          onClick={() => {
            const container = document.getElementById('bracket-container');
            if (container) {
              container.scrollBy({ left: 400, behavior: 'smooth' });
            }
          }}
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Scrollable Container */}
      <div 
        id="bracket-container"
        className="overflow-x-auto scrollbar-hide pl-6"
        style={{ 
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        <div className="space-y-8">
          {(!selectedGroup || selectedGroup === '' || selectedGroup === 'all') && groups && groups.length > 0 ? (
            // Show all matches grouped by groups
            <>
              {groups
                .sort((a, b) => a.group_id.localeCompare(b.group_id))
                .map(group => {
                  // Get all matches for this group using the improved logic
                  const groupMatches = matchesByGroup[group.group_id] || {}
                  const groupBronzeMatches = bronzeMatchesByGroup[group.group_id] || []
                  
                  // Get all rounds for this group
                  const groupRounds = Object.keys(groupMatches).map(Number).sort((a, b) => a - b)
                  const hasMatches = groupRounds.length > 0 || groupBronzeMatches.length > 0

                  return (
                    <div key={group.group_id} className="space-y-6">
                      {/* Group header */}
                      <div className="border-b border-gray-600 pb-2">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                          <Trophy className="h-5 w-5 text-blue-400" />
                          Grupa {group.group_name}
                        </h2>
                      </div>
                      
                      {/* Group matches */}
                      {hasMatches ? (
                        <>
                          {/* Regular matches by rounds */}
                          {groupRounds.map(round => (
                            <div key={`${group.group_id}-round-${round}`} className="space-y-4">
                              <div className="bg-gray-800 px-6 py-3 flex items-center justify-between rounded-xl mb-6 min-w-[380px]">
                                <span className="text-lg font-semibold text-white">
                                  {getRoundName(round, totalRounds)}
                                </span>
                                <span className="text-sm text-gray-400">
                                  {groupMatches[round].length} {groupMatches[round].length === 1 ? 'Match' : 'Matches'}
                                </span>
                              </div>
                              <div className="flex gap-24 overflow-x-auto pb-4">
                                <div className="flex-shrink-0 min-w-[450px]">
                                  <div className="space-y-8">
                                    {groupMatches[round]
                                      .sort((a, b) => a.position_in_round - b.position_in_round)
                                      .map(match => (
                                  <div
                           key={match.id}
                           className={`space-y-3 transition-all duration-200 min-w-[380px] ${
                             onMatchClick ? 'cursor-pointer' : ''
                           }`}
                           onClick={() => onMatchClick?.(match)}
                         >
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <Badge className={`text-xs ${getStatusColor(match.status)}`}>
                                          {getStatusText(match.status)}
                                        </Badge>
                                        <span className="text-xs text-gray-400">
                                          Match #{match.match_number}
                                        </span>
                                        {match.best_of && (
                                          <span className="text-xs text-gray-400">
                                            BO{match.best_of}
                                          </span>
                                        )}
                                      </div>
                                      {match.scheduled_at && (
                                        <div className="text-xs text-gray-400">
                                          {formatMatchDate(match.scheduled_at)}
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="space-y-1">
                                      {/* Participant 1 */}
                                      <div className={`flex items-center justify-between p-4 rounded-lg transition-all duration-200 ${
                                        match.winner?.id === match.participant1.id 
                                          ? 'bg-green-500/20 border border-green-500/30' 
                                          : 'bg-gray-800/50 border border-gray-700/50'
                                      } ${onMatchClick ? 'hover:bg-gray-700/70 hover:border-gray-600/70' : ''}`}>
                                        <div className="flex items-center gap-3">
                                          {/* Logo placeholder */}
                                          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
                                            {match.participant1.logo_url ? (
                                              <img 
                                                src={match.participant1.logo_url} 
                                                alt={match.participant1.name} 
                                                className="w-full h-full object-cover"
                                              />
                                            ) : (
                                              <span className="text-xs font-bold text-gray-300">
                                                {match.participant1.name?.charAt(0) || 'T'}
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex flex-col">
                                            <span className="text-white font-medium text-sm">
                                              {match.participant1.name || 'TBD'}
                                            </span>
                                            {match.participant1.seed && (
                                              <span className="text-xs text-gray-400">
                                                Seed #{match.participant1.seed}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        {match.score1 !== undefined && (
                                          <span className="text-white font-bold text-lg">
                                            {match.score1}
                                          </span>
                                        )}
                                      </div>
                                      
                                      {/* Participant 2 */}
                                      <div className={`flex items-center justify-between p-4 rounded-lg transition-all duration-200 ${
                                        match.winner?.id === match.participant2.id 
                                          ? 'bg-green-500/20 border border-green-500/30' 
                                          : 'bg-gray-800/50 border border-gray-700/50'
                                      } ${onMatchClick ? 'hover:bg-gray-700/70 hover:border-gray-600/70' : ''}`}>
                                        <div className="flex items-center gap-3">
                                          {/* Logo placeholder */}
                                          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
                                            {match.participant2.logo_url ? (
                                              <img 
                                                src={match.participant2.logo_url} 
                                                alt={match.participant2.name} 
                                                className="w-full h-full object-cover"
                                              />
                                            ) : (
                                              <span className="text-xs font-bold text-gray-300">
                                                {match.participant2.name?.charAt(0) || 'T'}
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex flex-col">
                                            <span className="text-white font-medium text-sm">
                                              {match.participant2.name || 'TBD'}
                                            </span>
                                            {match.participant2.seed && (
                                              <span className="text-xs text-gray-400">
                                                Seed #{match.participant2.seed}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        {match.score2 !== undefined && (
                                          <span className="text-white font-bold text-lg">
                                            {match.score2}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                      ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {/* Bronze matches for this group */}
                          {groupBronzeMatches.length > 0 && (
                            <div className="space-y-4">
                              <div className="bg-gray-800 px-6 py-3 flex items-center justify-between rounded-xl mb-6 min-w-[380px]">
                                <span className="text-lg font-semibold text-white">
                                  Mecz o 3. miejsce
                                </span>
                                <span className="text-sm text-gray-400">
                                  {groupBronzeMatches.length} {groupBronzeMatches.length === 1 ? 'Match' : 'Matches'}
                                </span>
                              </div>
                              <div className="flex gap-24 overflow-x-auto pb-4">
                                <div className="flex-shrink-0 min-w-[450px]">
                                  <div className="space-y-8">
                                    {groupBronzeMatches
                                      .sort((a, b) => a.position_in_round - b.position_in_round)
                                      .map(match => (
                                  <div 
                                  key={match.id} 
                                  className={`space-y-3 transition-all duration-200 min-w-[380px] ${
                                    onMatchClick ? 'cursor-pointer' : ''
                                  }`}
                                  onClick={() => onMatchClick?.(match)}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <Badge className={`text-xs ${getStatusColor(match.status)}`}>
                                        {getStatusText(match.status)}
                                      </Badge>
                                      <span className="text-xs text-gray-400">
                                        Match #{match.match_number}
                                      </span>
                                      {match.best_of && (
                                        <span className="text-xs text-gray-400">
                                          BO{match.best_of}
                                        </span>
                                      )}
                                    </div>
                                    {match.scheduled_at && (
                                      <div className="text-xs text-gray-400">
                                        {formatMatchDate(match.scheduled_at)}
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="space-y-1">
                                    {/* Participant 1 */}
                                    <div className={`flex items-center justify-between p-4 rounded-lg transition-all duration-200 ${
                                      match.winner?.id === match.participant1.id 
                                        ? 'bg-orange-500/20 border border-orange-500/30' 
                                        : 'bg-gray-800/50 border border-gray-700/50'
                                    } ${onMatchClick ? 'hover:bg-gray-700/70 hover:border-gray-600/70' : ''}`}>
                                      <div className="flex items-center gap-3">
                                        {/* Logo placeholder */}
                                        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
                                          {match.participant1.logo_url ? (
                                            <img 
                                              src={match.participant1.logo_url} 
                                              alt={match.participant1.name} 
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <span className="text-xs font-bold text-gray-300">
                                              {match.participant1.name?.charAt(0) || 'T'}
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex flex-col">
                                          <span className="text-white font-medium text-sm">
                                            {match.participant1.name || 'TBD'}
                                          </span>
                                          {match.participant1.seed && (
                                            <span className="text-xs text-gray-400">
                                              Seed #{match.participant1.seed}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      {match.score1 !== undefined && (
                                        <span className="text-white font-bold text-lg">
                                          {match.score1}
                                        </span>
                                      )}
                                    </div>
                                    
                                    {/* Participant 2 */}
                                    <div className={`flex items-center justify-between p-4 rounded-lg transition-all duration-200 ${
                                      match.winner?.id === match.participant2.id 
                                        ? 'bg-orange-500/20 border border-orange-500/30' 
                                        : 'bg-gray-800/50 border border-gray-700/50'
                                    } ${onMatchClick ? 'hover:bg-gray-700/70 hover:border-gray-600/70' : ''}`}>
                                      <div className="flex items-center gap-3">
                                        {/* Logo placeholder */}
                                        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
                                          {match.participant2.logo_url ? (
                                            <img 
                                              src={match.participant2.logo_url} 
                                              alt={match.participant2.name} 
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <span className="text-xs font-bold text-gray-300">
                                              {match.participant2.name?.charAt(0) || 'T'}
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex flex-col">
                                          <span className="text-white font-medium text-sm">
                                            {match.participant2.name || 'TBD'}
                                          </span>
                                          {match.participant2.seed && (
                                            <span className="text-xs text-gray-400">
                                              Seed #{match.participant2.seed}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      {match.score2 !== undefined && (
                                        <span className="text-white font-bold text-lg">
                                          {match.score2}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                      ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <div className="text-gray-400 text-lg">Brak meczów w tej grupie</div>
                        </div>
                      )}
                    </div>
                  )
                })}
            </>
          ) : (
            // Original view for single group or specific group selection
            <div className="flex justify-center">
              <div>
                {/* Round labels */}
                <div 
                  className="relative mb-4"
                  style={{
                    width: `${bracketWidth}px`,
                    height: '40px'
                  }}
                >
                {Array.from({ length: maxRound }, (_, i) => i + 1).map(round => {
                  const matchCount = matchCountByRound[round] || 0;
                  return (
                    <div
                      key={round}
                      className="absolute"
                      style={{
                        left: `${round * 520 +80}px`, // Updated from 400 to 520
                        top: '0px',
                        width: '320px'
                      }}
                    >
                      <div className="bg-gray-800 px-6 py-3 rounded-xl text-center">
                        <span className="text-lg font-semibold text-white">
                          {getRoundName(round, totalRounds)}
                        </span>
                        <span className="text-sm text-gray-400 ml-2">
                          ({matchCount} {matchCount === 1 ? 'mecz' : 'meczów'})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Main bracket rounds - Pyramid bracket layout */}
              <div 
                className="relative overflow-x-auto pb-4"
                style={{
                  width: `${bracketWidth}px`,
                  height: `${bracketHeight}px`
                }}
              >
                {/* Connection Lines */}
                <MatchConnectionLines
                  layoutMatches={regularMatches}
                  getMatchPosition={getMatchPosition}
                />
                
                {/* Render all matches with absolute positioning */}
                {regularMatches.map(match => {
                  const position = getMatchPosition(match);
                  
                  return (
                    <div
                      key={match.id}
                      className={`absolute transition-all duration-200 ${
                        onMatchClick ? 'cursor-pointer' : ''
                      }`}
                      onClick={() => onMatchClick?.(match)}
                      style={{
                        left: position.left,
                        top: position.top,
                        width: '320px',
                        zIndex: 2
                      }}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className={`text-xs ${getStatusColor(match.status)}`}>
                              {getStatusText(match.status)}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              Match #{match.match_number}
                            </span>
                            {match.best_of && (
                              <span className="text-xs text-gray-400">
                                BO{match.best_of}
                              </span>
                            )}
                          </div>
                          {match.scheduled_at && (
                            <div className="text-xs text-gray-400">
                              {formatMatchDate(match.scheduled_at)}
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          {/* Participant 1 */}
                          <div className={`flex items-center justify-between p-4 rounded-lg transition-all duration-200 ${
                            match.winner?.id === match.participant1.id 
                              ? 'bg-green-500/20 border border-green-500/30' 
                              : 'bg-gray-800/50 border border-gray-700/50'
                          } ${onMatchClick ? 'hover:bg-gray-700/70 hover:border-gray-600/70' : ''}`}>
                            <div className="flex items-center gap-3">
                              {/* Logo placeholder */}
                              <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
                                {match.participant1.logo_url ? (
                                  <img 
                                    src={match.participant1.logo_url} 
                                    alt={match.participant1.name} 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xs font-bold text-gray-300">
                                    {match.participant1.name?.charAt(0) || 'T'}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-white font-medium text-sm">
                                  {match.participant1.name || 'TBD'}
                                </span>
                                {match.participant1.seed && (
                                  <span className="text-xs text-gray-400">
                                    Seed #{match.participant1.seed}
                                  </span>
                                )}
                              </div>
                            </div>
                            {match.score1 !== undefined && (
                              <span className="text-white font-bold text-lg">
                                {match.score1}
                              </span>
                            )}
                          </div>
                          
                          {/* Participant 2 */}
                          <div className={`flex items-center justify-between p-4 rounded-lg transition-all duration-200 ${
                            match.winner?.id === match.participant2.id 
                              ? 'bg-green-500/20 border border-green-500/30' 
                              : 'bg-gray-800/50 border border-gray-700/50'
                          } ${onMatchClick ? 'hover:bg-gray-700/70 hover:border-gray-600/70' : ''}`}>
                            <div className="flex items-center gap-3">
                              {/* Logo placeholder */}
                              <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
                                {match.participant2.logo_url ? (
                                  <img 
                                    src={match.participant2.logo_url} 
                                    alt={match.participant2.name} 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xs font-bold text-gray-300">
                                    {match.participant2.name?.charAt(0) || 'T'}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-white font-medium text-sm">
                                  {match.participant2.name || 'TBD'}
                                </span>
                                {match.participant2.seed && (
                                  <span className="text-xs text-gray-400">
                                    Seed #{match.participant2.seed}
                                  </span>
                                )}
                              </div>
                            </div>
                            {match.score2 !== undefined && (
                              <span className="text-white font-bold text-lg">
                                {match.score2}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Bronze matches if exist */}
              {bronzeMatches.length > 0 && (
                <div className="mt-12">
                  <div className="bg-gray-800 px-6 py-3 flex items-center justify-between rounded-xl mb-6 min-w-[380px]">
                    <span className="text-lg font-semibold text-white">
                      Mecz o 3. miejsce
                    </span>
                    <span className="text-sm text-gray-400">
                      {bronzeMatches.length} {bronzeMatches.length === 1 ? 'Match' : 'Matches'}
                    </span>
                  </div>
                  <div className="flex gap-24 overflow-x-auto pb-4">
                    <div className="flex-shrink-0 min-w-[450px]">
                      <div className="space-y-8">
                        {bronzeMatches
                          .sort((a, b) => a.position_in_round - b.position_in_round)
                          .map(match => (
                      <div 
                        key={match.id} 
                        className={`space-y-3 transition-all duration-200 min-w-[380px] ${
                          onMatchClick ? 'cursor-pointer' : ''
                        }`}
                        onClick={() => onMatchClick?.(match)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className={`text-xs ${getStatusColor(match.status)}`}>
                              {getStatusText(match.status)}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              Match #{match.match_number}
                            </span>
                            {match.best_of && (
                              <span className="text-xs text-gray-400">
                                BO{match.best_of}
                              </span>
                            )}
                          </div>
                          {match.scheduled_at && (
                            <div className="text-xs text-gray-400">
                              {formatMatchDate(match.scheduled_at)}
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          {/* Participant 1 */}
                          <div className={`flex items-center justify-between p-4 rounded-lg transition-all duration-200 ${
                            match.winner?.id === match.participant1.id 
                              ? 'bg-orange-500/20 border border-orange-500/30' 
                              : 'bg-gray-800/50 border border-gray-700/50'
                          } ${onMatchClick ? 'hover:bg-gray-700/70 hover:border-gray-600/70' : ''}`}>
                            <div className="flex items-center gap-3">
                              {/* Logo placeholder */}
                              <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
                                {match.participant1.logo_url ? (
                                  <img 
                                    src={match.participant1.logo_url} 
                                    alt={match.participant1.name} 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xs font-bold text-gray-300">
                                    {match.participant1.name?.charAt(0) || 'T'}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-white font-medium text-sm">
                                  {match.participant1.name || 'TBD'}
                                </span>
                                {match.participant1.seed && (
                                  <span className="text-xs text-gray-400">
                                    Seed #{match.participant1.seed}
                                  </span>
                                )}
                              </div>
                            </div>
                            {match.score1 !== undefined && (
                              <span className="text-white font-bold text-lg">
                                {match.score1}
                              </span>
                            )}
                          </div>
                          
                          {/* Participant 2 */}
                          <div className={`flex items-center justify-between p-4 rounded-lg transition-all duration-200 ${
                            match.winner?.id === match.participant2.id 
                              ? 'bg-orange-500/20 border border-orange-500/30' 
                              : 'bg-gray-800/50 border border-gray-700/50'
                          } ${onMatchClick ? 'hover:bg-gray-700/70 hover:border-gray-600/70' : ''}`}>
                            <div className="flex items-center gap-3">
                              {/* Logo placeholder */}
                              <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
                                {match.participant2.logo_url ? (
                                  <img 
                                    src={match.participant2.logo_url} 
                                    alt={match.participant2.name} 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xs font-bold text-gray-300">
                                    {match.participant2.name?.charAt(0) || 'T'}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-white font-medium text-sm">
                                  {match.participant2.name || 'TBD'}
                                </span>
                                {match.participant2.seed && (
                                  <span className="text-xs text-gray-400">
                                    Seed #{match.participant2.seed}
                                  </span>
                                )}
                              </div>
                            </div>
                            {match.score2 !== undefined && (
                              <span className="text-white font-bold text-lg">
                                {match.score2}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    )
  }