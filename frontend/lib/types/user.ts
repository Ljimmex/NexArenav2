export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  ORGANIZER = 'ORGANIZER',
  COMMENTATOR = 'COMMENTATOR'
}

export interface User {
  id: string;
  supabase_user_id: string;
  username: string;
  display_name?: string;
  email: string;
  bio?: string;
  avatar_url?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  stats?: UserStats;
  settings?: UserSettings;
}

export interface UserStats {
  games_played: number;
  games_won: number;
  tournaments_played: number;
  tournaments_won: number;
  total_prize_money: number;
  current_rank: number;
  highest_rank: number;
  rating: number;
}

export interface UserSettings {
  notifications_enabled: boolean;
  email_notifications: boolean;
  privacy_level: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
  language: string;
  timezone: string;
}