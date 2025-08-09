import { supabase } from '@/lib/supabase/client'

export interface CustomUser {
  id: string
  supabase_user_id: string
  username: string
  displayName?: string
  email?: string
  avatarUrl?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface UserStats {
  id: string
  userId: string
  matchesPlayed: number
  wins: number
  losses: number
  kd?: number
  rating: number
  rankPoints: number
}

export interface UserSettings {
  id: string
  userId: string
  notifications: boolean
  locale: string
  theme: string
}

export interface AuthProvider {
  id: string
  provider: string
  providerId: string
  userId: string
}

export class UserService {
  static async getCurrentUser(): Promise<CustomUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('supabase_user_id', user.id)
        .single()

      if (error) {
        console.error('Error fetching custom user:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getCurrentUser:', error)
      return null
    }
  }

  static async getUserStats(userId: string): Promise<UserStats | null> {
    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('userId', userId)
        .single()

      if (error) {
        console.error('Error fetching user stats:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getUserStats:', error)
      return null
    }
  }

  static async getUserSettings(userId: string): Promise<UserSettings | null> {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('userId', userId)
        .single()

      if (error) {
        console.error('Error fetching user settings:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getUserSettings:', error)
      return null
    }
  }

  static async getUserProviders(userId: string): Promise<AuthProvider[]> {
    try {
      const { data, error } = await supabase
        .from('auth_providers')
        .select('*')
        .eq('userId', userId)

      if (error) {
        console.error('Error fetching user providers:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getUserProviders:', error)
      return []
    }
  }

  static async updateUserProfile(userId: string, updates: Partial<CustomUser>): Promise<boolean> {
    try {
      // Remove updatedAt from updates as it's handled by database trigger
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { updatedAt: _updatedAt, ...updateData } = updates
      
      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)

      if (error) {
        console.error('Error updating user profile:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in updateUserProfile:', error)
      return false
    }
  }

  static async updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_settings')
        .update(settings)
        .eq('userId', userId)

      if (error) {
        console.error('Error updating user settings:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in updateUserSettings:', error)
      return false
    }
  }

  static async getAllUsers(limit = 50, offset = 0): Promise<CustomUser[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('isActive', true)
        .order('createdAt', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Error fetching users:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getAllUsers:', error)
      return []
    }
  }

  static async searchUsers(query: string, limit = 20): Promise<CustomUser[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`username.ilike.%${query}%,displayName.ilike.%${query}%,email.ilike.%${query}%`)
        .eq('isActive', true)
        .limit(limit)

      if (error) {
        console.error('Error searching users:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in searchUsers:', error)
      return []
    }
  }
}