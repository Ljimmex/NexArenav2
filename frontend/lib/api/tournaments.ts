import { apiClient } from './api-client';
import { createClient } from '@supabase/supabase-js';

;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to ensure auth token is set
async function ensureAuthToken(): Promise<void> {
  try {
    console.log('TournamentsAPI: Starting ensureAuthToken...');
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('TournamentsAPI: Error getting session:', sessionError);
      throw new Error(`Session error: ${sessionError.message}`);
    }
    
    console.log('TournamentsAPI: Current session status:', {
      hasSession: !!session,
      hasAccessToken: !!session?.access_token,
      tokenLength: session?.access_token?.length || 0,
      expiresAt: session?.expires_at,
      user: session?.user?.id
    });
    
    if (session?.access_token) {
      console.log('TournamentsAPI: Setting auth token from current session');
      apiClient.setAuthToken(session.access_token);
      console.log('TournamentsAPI: Auth token set successfully');
    } else {
      console.log('TournamentsAPI: No session found, attempting refresh...');
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('TournamentsAPI: Error refreshing session:', refreshError);
        throw new Error(`Refresh error: ${refreshError.message}`);
      }
      
      console.log('TournamentsAPI: Refresh result:', {
        hasRefreshedSession: !!refreshedSession,
        hasRefreshedToken: !!refreshedSession?.access_token,
        refreshedTokenLength: refreshedSession?.access_token?.length || 0
      });
      
      if (refreshedSession?.access_token) {
        console.log('TournamentsAPI: Setting auth token from refreshed session');
        apiClient.setAuthToken(refreshedSession.access_token);
        console.log('TournamentsAPI: Refreshed auth token set successfully');
      } else {
        console.error('TournamentsAPI: No valid session available after refresh');
        throw new Error('No valid session available');
      }
    }
  } catch (error) {
    console.error('TournamentsAPI: Failed to ensure auth token:', error);
    if (error instanceof Error) {
      throw new Error(`Authentication failed: ${error.message}`);
    } else {
      throw new Error('Authentication required');
    }
  }
}

export interface Organizer {
  id: string;
  name: string;
  logo_url?: string;
}

export interface Tournament {
  id: string;
  title: string;
  description?: string;
  short_description?: string;
  game_type: 'CS2' | 'VALORANT' | 'LOL' | 'DOTA2' | 'ROCKET_LEAGUE' | 'OVERWATCH';
  tournament_type: 'SWISS' | 'SINGLE_ELIMINATION' | 'DOUBLE_ELIMINATION' | 'ROUND_ROBIN';
  status: 'DRAFT' | 'REGISTRATION' | 'READY' | 'RUNNING' | 'COMPLETED' | 'CANCELLED' | 'POSTPONED';
  seeding_mode: 'AUTO' | 'MANUAL' | 'RANDOM';
  registration_start?: string;
  registration_end?: string;
  tournament_start?: string;
  tournament_end?: string;
  max_teams: number;
  min_teams: number;
  team_size: number;
  entry_fee: number;
  prize_pool: number;
  is_public: boolean;
  requires_approval: boolean;
  rules?: string;
  organizer_id: string;
  organizer?: Organizer;
  moderators: string[];
  banner_url?: string;
  logo_url?: string;
  stream_url?: string;
  discord_invite?: string;
  registered_teams_count: number;
  created_at: string;
  updated_at: string;
  // Added fields returned by backend
  format_settings?: Record<string, unknown>;
  bracket_data?: Record<string, unknown>;
}

export interface CreateTournamentData {
  title: string;
  description?: string;
  short_description?: string;
  game_type: Tournament['game_type'];
  tournament_type: Tournament['tournament_type'];
  seeding_mode?: Tournament['seeding_mode'];
  registration_start?: string;
  registration_end?: string;
  tournament_start?: string;
  tournament_end?: string;
  max_teams?: number;
  min_teams?: number;
  team_size?: number;
  entry_fee?: number;
  prize_pool?: number;
  is_public?: boolean;
  requires_approval?: boolean;
  rules?: string;
  banner_url?: string;
  logo_url?: string;
  stream_url?: string;
  discord_invite?: string;
  // New optional format-specific settings (stored as JSONB)
  format_settings?: Record<string, unknown>;
}

export interface TournamentsResponse {
  tournaments: Tournament[];
  total: number;
  page: number;
  limit: number;
}

export interface TournamentsFilters {
  page?: number;
  limit?: number;
  gameType?: string;
  status?: string;
  isPublic?: boolean;
}

class TournamentsAPI {

  async getTournaments(filters: TournamentsFilters = {}): Promise<TournamentsResponse> {
    console.log('TournamentsAPI.getTournaments: Starting with filters:', filters);
    
    const params = new URLSearchParams();
    
    // Backend używa innych nazw parametrów
    if (filters.gameType) params.append('game_type', filters.gameType);
    if (filters.status) params.append('status', filters.status);

    const query = params.toString();
    const endpoint = `/tournaments${query ? `?${query}` : ''}`;
    
    console.log('TournamentsAPI.getTournaments: Making request to:', endpoint);
    
    const backendTournaments = await apiClient.get<Tournament[]>(endpoint);
    
    console.log('TournamentsAPI.getTournaments: Raw backend response:', {
      type: typeof backendTournaments,
      isArray: Array.isArray(backendTournaments),
      length: Array.isArray(backendTournaments) ? backendTournaments.length : 'N/A',
      data: backendTournaments
    });
    
    // Mapujemy dane z backendu do formatu oczekiwanego przez frontend
    const tournaments: Tournament[] = backendTournaments.map(tournament => ({
      ...tournament,
      organizer: tournament.organizer || {
        id: tournament.organizer_id,
        name: 'Unknown Organizer',
        logo_url: undefined
      },
      registered_teams_count: tournament.registered_teams_count || 0
    }));
    
    console.log('TournamentsAPI.getTournaments: Mapped tournaments:', {
      count: tournaments.length,
      tournaments: tournaments.map(t => ({ id: t.id, title: t.title }))
    });
    
    // Symulujemy paginację po stronie frontendu
    const page = filters.page || 1;
    const limit = filters.limit || 16;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const result = {
      tournaments: tournaments.slice(startIndex, endIndex),
      total: tournaments.length,
      page,
      limit
    };
    
    console.log('TournamentsAPI.getTournaments: Final result:', {
      tournamentsCount: result.tournaments.length,
      total: result.total,
      page: result.page,
      limit: result.limit
    });
    
    return result;
  }

  async getTournament(id: string): Promise<Tournament> {
    return apiClient.get<Tournament>(`/tournaments/${id}`);
  }

  async createTournament(data: CreateTournamentData): Promise<Tournament> {
    await ensureAuthToken();
    return apiClient.post<Tournament>('/tournaments', data);
  }

  async updateTournament(id: string, data: Partial<CreateTournamentData>): Promise<Tournament> {
    await ensureAuthToken();
    return apiClient.patch<Tournament>(`/tournaments/${id}`, data);
  }

  async deleteTournament(id: string): Promise<void> {
    await ensureAuthToken();
    await apiClient.delete<void>(`/tournaments/${id}`);
  }

  async updateTournamentStatus(id: string, status: Tournament['status']): Promise<Tournament> {
    await ensureAuthToken();
    return apiClient.patch<Tournament>(`/tournaments/${id}/status`, { status });
  }

  async registerTeam(tournamentId: string, teamId: string): Promise<{ message: string }> {
    await ensureAuthToken();
    return apiClient.post<{ message: string }>(`/tournaments/${tournamentId}/teams/${teamId}`, {});
  }

  async unregisterTeam(tournamentId: string, teamId: string): Promise<{ message: string }> {
    await ensureAuthToken();
    return apiClient.delete<{ message: string }>(`/tournaments/${tournamentId}/teams/${teamId}`);
  }

  async getRegisteredTeams(tournamentId: string): Promise<unknown[]> {
    return apiClient.get<unknown[]>(`/tournaments/${tournamentId}/teams`);
  }
}

export const tournamentsAPI = new TournamentsAPI();