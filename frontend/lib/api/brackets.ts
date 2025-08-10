import { apiClient } from './api-client'

export interface GenerateSingleEliminationPayload {
  tournament_id: string
  max_participants: number
  bronze_match?: boolean
  number_of_groups?: number
}

export const bracketsAPI = {
  async generateSingleElimination(payload: GenerateSingleEliminationPayload): Promise<unknown> {
    return apiClient.post<unknown>('/brackets/single-elimination/generate', payload)
  },
  
  async getBracket(tournamentId: string): Promise<unknown> {
    return apiClient.get<unknown>(`/brackets/single-elimination/${tournamentId}`)
  },

  async getMatches(tournamentId: string): Promise<unknown> {
    return apiClient.get<unknown>(`/brackets/single-elimination/${tournamentId}/matches`)
  },

  async syncBracketMatches(tournamentId: string): Promise<{ message: string; matchesCreated: number }> {
    return apiClient.post<{ message: string; matchesCreated: number }>(`/brackets/single-elimination/${tournamentId}/sync-matches`)
  },
}