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
}

export function BracketDisplay({ bracketData, loading, onMatchClick }: BracketDisplayProps) {
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

  // Group regular matches by round
  const matchesByRound: { [round: number]: Match[] } = {}
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
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
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
        </div>
      </CardContent>
    </Card>
  )
}