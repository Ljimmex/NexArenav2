import { apiClient } from './api-client';

export interface Team {
  id: string;
  name: string;
  tag: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  country?: string;
  is_active: boolean;
  max_members: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  user_role?: string;
  joined_at?: string;
}

export interface CreateTeamData {
  name: string;
  tag: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  country?: string;
  max_members?: number;
  created_by: string;
}

class TeamsAPI {
  async getUserTeams(userId: string): Promise<Team[]> {
    return apiClient.get<Team[]>(`/teams/user/${userId}`);
  }

  async getTeam(id: string): Promise<Team> {
    return apiClient.get<Team>(`/teams/${id}`);
  }

  async createTeam(data: CreateTeamData): Promise<Team> {
    return apiClient.post<Team>('/teams', data);
  }

  async updateTeam(id: string, data: Partial<CreateTeamData>): Promise<Team> {
    return apiClient.patch<Team>(`/teams/${id}`, data);
  }

  async deleteTeam(id: string): Promise<void> {
    return apiClient.delete<void>(`/teams/${id}`);
  }
}

export const teamsAPI = new TeamsAPI();