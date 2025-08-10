import { apiClient } from './api-client'

export interface GenerateSingleEliminationPayload {
  tournament_id: string
  max_participants: number
  bronze_match?: boolean
  number_of_groups?: number
}

export interface GroupInfo {
  group_id: string
  group_name: string
  total_rounds: number
  has_bronze_match: boolean
}

export const bracketsAPI = {
  async generateSingleElimination(payload: GenerateSingleEliminationPayload): Promise<unknown> {
    return apiClient.post<unknown>('/brackets/single-elimination/generate', payload)
  },
  
  async getBracket(tournamentId: string): Promise<unknown> {
    return apiClient.get<unknown>(`/brackets/single-elimination/${tournamentId}`)
  },

  async getMatches(tournamentId: string, groupId?: string): Promise<unknown> {
    const url = groupId 
      ? `/brackets/single-elimination/${tournamentId}/matches?groupId=${groupId}`
      : `/brackets/single-elimination/${tournamentId}/matches`
    return apiClient.get<unknown>(url)
  },

  async getGroups(tournamentId: string): Promise<GroupInfo[]> {
    return apiClient.get<GroupInfo[]>(`/brackets/single-elimination/${tournamentId}/groups`)
  },

  async syncBracketMatches(tournamentId: string): Promise<{ message: string; matchesCreated: number }> {
    return apiClient.post<{ message: string; matchesCreated: number }>(`/brackets/single-elimination/${tournamentId}/sync-matches`)
  },
}