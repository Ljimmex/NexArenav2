'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Users } from "lucide-react"

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
  score1?: number
  score2?: number
  is_bronze_match?: boolean
  is_finalized?: boolean
  disqualified_participant?: Participant
}

interface BracketDisplayProps {
  bracketData: Match[] | null
  loading?: boolean
  onMatchClick?: (match: Match) => void
  selectedGroup?: string | null
  groups?: Array<{ group_id: string; group_name: string }>
}

export function BracketDisplay({ bracketData, loading, onMatchClick, selectedGroup, groups }: BracketDisplayProps) {
  if (loading) {
    return (
      <Card className="bg-[#1a1a1a] border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Trophy className="h-5 w-5" />
            Drabinka turnieju
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-400">Ładowanie drabinki...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!bracketData || !bracketData.length) {
    return (
      <Card className="bg-[#1a1a1a] border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Trophy className="h-5 w-5" />
            Drabinka turnieju
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-400">Drabinka nie została jeszcze wygenerowana</div>
          </div>
        </CardContent>
      </Card>
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

  return (
    <Card className="bg-[#1a1a1a] border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Trophy className="h-5 w-5" />
          Drabinka turnieju
          {selectedGroup && groups && (
            <span className="text-sm font-normal text-gray-400">
              - Grupa {groups.find(g => g.group_id === selectedGroup)?.group_name || selectedGroup}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
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
                              <h3 className="text-lg font-semibold text-white flex items-center gap-2 ml-4">
                                <Users className="h-4 w-4" />
                                {getRoundName(round, totalRounds)}
                              </h3>
                              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {groupMatches[round].map(match => (
                                  <div
                                    key={match.id}
                                    className={`bg-[#2a2a2a] border border-gray-600 rounded-lg p-4 space-y-3 transition-all duration-200 ${
                                      onMatchClick ? 'cursor-pointer hover:bg-[#3a3a3a] hover:border-gray-500' : ''
                                    }`}
                                    onClick={() => onMatchClick?.(match)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <Badge className={`text-xs ${getStatusColor(match.status)}`}>
                                        {getStatusText(match.status)}
                                      </Badge>
                                      {match.scheduled_at && (
                                        <div className="text-xs text-gray-400">
                                          {new Date(match.scheduled_at).toLocaleString('pl-PL')}
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="space-y-2">
                                      {/* Participant 1 */}
                                      <div className={`flex items-center justify-between p-2 rounded ${
                                        match.winner?.id === match.participant1.id ? 'bg-green-500/20 border border-green-500/30' : 'bg-gray-700/30'
                                      }`}>
                                        <span className="text-white font-medium">
                                          {match.participant1.name || 'TBD'}
                                        </span>
                                        {match.score1 !== undefined && (
                                          <span className="text-white font-bold">
                                            {match.score1}
                                          </span>
                                        )}
                                      </div>
                                      
                                      {/* VS */}
                                      <div className="text-center text-gray-400 text-sm">VS</div>
                                      
                                      {/* Participant 2 */}
                                      <div className={`flex items-center justify-between p-2 rounded ${
                                        match.winner?.id === match.participant2.id ? 'bg-green-500/20 border border-green-500/30' : 'bg-gray-700/30'
                                      }`}>
                                        <span className="text-white font-medium">
                                          {match.participant2.name || 'TBD'}
                                        </span>
                                        {match.score2 !== undefined && (
                                          <span className="text-white font-bold">
                                            {match.score2}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                          
                          {/* Bronze matches for this group */}
                          {groupBronzeMatches.length > 0 && (
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold text-white flex items-center gap-2 ml-4">
                                <Trophy className="h-4 w-4 text-orange-400" />
                                Mecz o 3. miejsce
                              </h3>
                              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {groupBronzeMatches.map(match => (
                                  <div 
                                    key={match.id} 
                                    className={`bg-[#2a2a2a] border border-gray-600 rounded-lg p-4 space-y-3 transition-all duration-200 ${
                                      onMatchClick ? 'cursor-pointer hover:bg-[#3a3a3a] hover:border-gray-500' : ''
                                    }`}
                                    onClick={() => onMatchClick?.(match)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <Badge className={`text-xs ${getStatusColor(match.status)}`}>
                                        {getStatusText(match.status)}
                                      </Badge>
                                      {match.scheduled_at && (
                                        <div className="text-xs text-gray-400">
                                          {new Date(match.scheduled_at).toLocaleString('pl-PL')}
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="space-y-2">
                                      {/* Participant 1 */}
                                      <div className={`flex items-center justify-between p-2 rounded ${
                                        match.winner?.id === match.participant1.id ? 'bg-orange-500/20 border border-orange-500/30' : 'bg-gray-700/30'
                                      }`}>
                                        <span className="text-white font-medium">
                                          {match.participant1.name || 'TBD'}
                                        </span>
                                        {match.score1 !== undefined && (
                                          <span className="text-white font-bold">
                                            {match.score1}
                                          </span>
                                        )}
                                      </div>
                                      
                                      {/* VS */}
                                      <div className="text-center text-gray-400 text-sm">VS</div>
                                      
                                      {/* Participant 2 */}
                                      <div className={`flex items-center justify-between p-2 rounded ${
                                        match.winner?.id === match.participant2.id ? 'bg-orange-500/20 border border-orange-500/30' : 'bg-gray-700/30'
                                      }`}>
                                        <span className="text-white font-medium">
                                          {match.participant2.name || 'TBD'}
                                        </span>
                                        {match.score2 !== undefined && (
                                          <span className="text-white font-bold">
                                            {match.score2}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
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
            <>
              {/* Main bracket rounds */}
              {Object.keys(matchesByRound)
                .map(Number)
                .sort((a, b) => a - b)
                .map(round => (
                  <div key={round} className="space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {getRoundName(round, totalRounds)}
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {matchesByRound[round].map(match => (
                        <div
                          key={match.id}
                          className={`bg-[#2a2a2a] border border-gray-600 rounded-lg p-4 space-y-3 transition-all duration-200 ${
                            onMatchClick ? 'cursor-pointer hover:bg-[#3a3a3a] hover:border-gray-500' : ''
                          }`}
                          onClick={() => onMatchClick?.(match)}
                        >
                          <div className="flex items-center justify-between">
                            <Badge className={`text-xs ${getStatusColor(match.status)}`}>
                              {getStatusText(match.status)}
                            </Badge>
                            {match.scheduled_at && (
                              <div className="text-xs text-gray-400">
                                {new Date(match.scheduled_at).toLocaleString('pl-PL')}
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            {/* Participant 1 */}
                            <div className={`flex items-center justify-between p-2 rounded ${
                              match.winner?.id === match.participant1.id ? 'bg-green-500/20 border border-green-500/30' : 'bg-gray-700/30'
                            }`}>
                              <span className="text-white font-medium">
                                {match.participant1.name || 'TBD'}
                              </span>
                              {match.score1 !== undefined && (
                                <span className="text-white font-bold">
                                  {match.score1}
                                </span>
                              )}
                            </div>
                            
                            {/* VS */}
                            <div className="text-center text-gray-400 text-sm">VS</div>
                            
                            {/* Participant 2 */}
                            <div className={`flex items-center justify-between p-2 rounded ${
                              match.winner?.id === match.participant2.id ? 'bg-green-500/20 border border-green-500/30' : 'bg-gray-700/30'
                            }`}>
                              <span className="text-white font-medium">
                                {match.participant2.name || 'TBD'}
                              </span>
                              {match.score2 !== undefined && (
                                <span className="text-white font-bold">
                                  {match.score2}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              
              {/* Bronze matches if exist */}
              {bronzeMatches.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-orange-400" />
                    Mecz o 3. miejsce
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {bronzeMatches.map(match => (
                      <div 
                        key={match.id} 
                        className={`bg-[#2a2a2a] border border-gray-600 rounded-lg p-4 space-y-3 transition-all duration-200 ${
                          onMatchClick ? 'cursor-pointer hover:bg-[#3a3a3a] hover:border-gray-500' : ''
                        }`}
                        onClick={() => onMatchClick?.(match)}
                      >
                        <div className="flex items-center justify-between">
                          <Badge className={`text-xs ${getStatusColor(match.status)}`}>
                            {getStatusText(match.status)}
                          </Badge>
                          {match.scheduled_at && (
                            <div className="text-xs text-gray-400">
                              {new Date(match.scheduled_at).toLocaleString('pl-PL')}
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          {/* Participant 1 */}
                          <div className={`flex items-center justify-between p-2 rounded ${
                            match.winner?.id === match.participant1.id ? 'bg-orange-500/20 border border-orange-500/30' : 'bg-gray-700/30'
                          }`}>
                            <span className="text-white font-medium">
                              {match.participant1.name || 'TBD'}
                            </span>
                            {match.score1 !== undefined && (
                              <span className="text-white font-bold">
                                {match.score1}
                              </span>
                            )}
                          </div>
                          
                          {/* VS */}
                          <div className="text-center text-gray-400 text-sm">VS</div>
                          
                          {/* Participant 2 */}
                          <div className={`flex items-center justify-between p-2 rounded ${
                            match.winner?.id === match.participant2.id ? 'bg-orange-500/20 border border-orange-500/30' : 'bg-gray-700/30'
                          }`}>
                            <span className="text-white font-medium">
                              {match.participant2.name || 'TBD'}
                            </span>
                            {match.score2 !== undefined && (
                              <span className="text-white font-bold">
                                {match.score2}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}