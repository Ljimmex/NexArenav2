import { apiClient, PaginatedResponse } from './api-client'

export interface Team {
  id: string
  name: string
  description?: string
  logo_url?: string
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
  members?: TeamMember[]
  creator?: {
    id: string
    username: string
    display_name?: string
    avatar_url?: string
  }
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  joined_at: string
  user?: {
    id: string
    username: string
    display_name?: string
    avatar_url?: string
  }
}

export interface CreateTeamDto {
  name: string
  tag?: string
  description?: string
  logo_url?: string
  banner_url?: string
  country?: string
  website_url?: string
  discord_url?: string
  twitter_url?: string
  max_members?: number
  created_by: string
}

export interface UpdateTeamDto {
  name?: string
  description?: string
  logo_url?: string
  is_active?: boolean
}

export interface TeamSearchParams {
  search?: string
  page?: number
  limit?: number
}

export class TeamService {
  // Get all teams with pagination and search
  static async getTeams(params: TeamSearchParams = {}): Promise<PaginatedResponse<Team>> {
    const searchParams = new URLSearchParams()
    
    if (params.search) searchParams.append('search', params.search)
    if (params.page) searchParams.append('page', params.page.toString())
    if (params.limit) searchParams.append('limit', params.limit.toString())

    const queryString = searchParams.toString()
    const endpoint = `/teams${queryString ? `?${queryString}` : ''}`
    
    return apiClient.get<PaginatedResponse<Team>>(endpoint)
  }

  // Get team by ID
  static async getTeamById(id: string): Promise<Team> {
    return apiClient.get<Team>(`/teams/${id}`)
  }

  // Create new team
  static async createTeam(teamData: CreateTeamDto): Promise<Team> {
    return apiClient.post<Team>('/teams', teamData)
  }

  // Update team
  static async updateTeam(id: string, teamData: UpdateTeamDto): Promise<Team> {
    return apiClient.patch<Team>(`/teams/${id}`, teamData)
  }

  // Delete team
  static async deleteTeam(id: string): Promise<void> {
    return apiClient.delete<void>(`/teams/${id}`)
  }

  // Get teams created by user
  static async getUserTeams(userId: string): Promise<Team[]> {
    const response = await apiClient.get<PaginatedResponse<Team>>(`/teams?created_by=${userId}`)
    return response.data
  }

  // Search teams
  static async searchTeams(query: string, limit = 20): Promise<Team[]> {
    const response = await this.getTeams({ search: query, limit })
    return response.data
  }

  // Get team members
  static async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    return apiClient.get<TeamMember[]>(`/teams/${teamId}/members`)
  }

  // Add member to team
  static async addTeamMember(teamId: string, userId: string, role: 'admin' | 'member' = 'member'): Promise<TeamMember> {
    return apiClient.post<TeamMember>(`/teams/${teamId}/members`, { user_id: userId, role })
  }

  // Update member role
  static async updateMemberRole(teamId: string, memberId: string, role: 'admin' | 'member'): Promise<TeamMember> {
    return apiClient.patch<TeamMember>(`/teams/${teamId}/members/${memberId}`, { role })
  }

  // Remove member from team
  static async removeMember(teamId: string, memberId: string): Promise<void> {
    return apiClient.delete<void>(`/teams/${teamId}/members/${memberId}`)
  }
}