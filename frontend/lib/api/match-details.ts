import { apiClient } from './api-client'

// Veto interfaces
export interface MatchVeto {
  id: string
  match_id: string
  team_id: string
  map_name: string
  action: 'BAN' | 'PICK'
  order_number: number
  created_at: string
}

export interface CreateMatchVetoPayload {
  match_id: string
  team_id: string
  map_name: string
  action: 'BAN' | 'PICK'
  order_number: number
}

// Map Score interfaces
export interface MatchMapScore {
  id: string
  match_id: string
  map_name: string
  map_order: number
  team1_score: number
  team2_score: number
  winner_id?: string
  duration_seconds?: number
  created_at: string
  updated_at: string
}

export interface CreateMatchMapScorePayload {
  match_id: string
  map_name: string
  map_order: number
  team1_score: number
  team2_score: number
  winner_id?: string
  duration_seconds?: number
}

// Player Map Score interfaces
export interface PlayerMapScore {
  id: string
  map_score_id: string
  user_id: string
  team_id: string
  kills: number
  deaths: number
  assists: number
  rating: number
  adr?: number
  kast?: number
  created_at: string
  updated_at: string
}

export interface CreatePlayerMapScorePayload {
  map_score_id: string
  user_id: string
  team_id: string
  kills: number
  deaths: number
  assists: number
  rating: number
  adr?: number
  kast?: number
}

// API functions
export const matchDetailsAPI = {
  // Veto operations
  async getMatchVetos(matchId: string): Promise<MatchVeto[]> {
    return apiClient.get<MatchVeto[]>(`/match-vetos/match/${matchId}`)
  },

  async createMatchVeto(payload: CreateMatchVetoPayload): Promise<MatchVeto> {
    return apiClient.post<MatchVeto>('/match-vetos', payload)
  },

  async deleteMatchVeto(vetoId: string): Promise<void> {
    await apiClient.delete(`/match-vetos/${vetoId}`)
  },

  // Map Score operations
  async getMatchMapScores(matchId: string): Promise<MatchMapScore[]> {
    return apiClient.get<MatchMapScore[]>(`/match-map-scores/match/${matchId}`)
  },

  async createMatchMapScore(payload: CreateMatchMapScorePayload): Promise<MatchMapScore> {
    return apiClient.post<MatchMapScore>('/match-map-scores', payload)
  },

  async updateMatchMapScore(scoreId: string, payload: Partial<CreateMatchMapScorePayload>): Promise<MatchMapScore> {
    return apiClient.patch<MatchMapScore>(`/match-map-scores/${scoreId}`, payload)
  },

  async deleteMatchMapScore(scoreId: string): Promise<void> {
    await apiClient.delete(`/match-map-scores/${scoreId}`)
  },

  // Player Map Score operations
  async getPlayerMapScores(mapScoreId: string): Promise<PlayerMapScore[]> {
    return apiClient.get<PlayerMapScore[]>(`/player-map-scores/map/${mapScoreId}`)
  },

  async createPlayerMapScore(payload: CreatePlayerMapScorePayload): Promise<PlayerMapScore> {
    return apiClient.post<PlayerMapScore>('/player-map-scores', payload)
  },

  async updatePlayerMapScore(scoreId: string, payload: Partial<CreatePlayerMapScorePayload>): Promise<PlayerMapScore> {
    return apiClient.patch<PlayerMapScore>(`/player-map-scores/${scoreId}`, payload)
  },

  async deletePlayerMapScore(scoreId: string): Promise<void> {
    await apiClient.delete(`/player-map-scores/${scoreId}`)
  },

  // Get all match details (vetos, map scores, player scores)
  async getMatchDetails(matchId: string): Promise<{
    vetos: MatchVeto[]
    mapScores: MatchMapScore[]
    playerScores: { [mapScoreId: string]: PlayerMapScore[] }
  }> {
    const [vetos, mapScores] = await Promise.all([
      this.getMatchVetos(matchId),
      this.getMatchMapScores(matchId)
    ])

    const playerScores: { [mapScoreId: string]: PlayerMapScore[] } = {}
    
    // Get player scores for each map
    for (const mapScore of mapScores) {
      playerScores[mapScore.id] = await this.getPlayerMapScores(mapScore.id)
    }

    return {
      vetos,
      mapScores,
      playerScores
    }
  }
}