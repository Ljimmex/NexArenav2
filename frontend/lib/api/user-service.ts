import { apiClient, PaginatedResponse } from './api-client'

export interface User {
  id: string
  supabase_user_id: string | null
  username: string
  display_name?: string
  email?: string
  avatar_url?: string
  bio?: string
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateUserDto {
  username: string
  display_name?: string
  email?: string
  avatar_url?: string
  bio?: string
  supabase_user_id?: string
}

export interface UpdateUserDto {
  username?: string
  display_name?: string
  email?: string
  avatar_url?: string
  bio?: string
  is_active?: boolean
}

export interface UserSearchParams {
  search?: string
  page?: number
  limit?: number
}

export class UserService {
  // Get all users with pagination and search
  static async getUsers(params: UserSearchParams = {}): Promise<PaginatedResponse<User>> {
    const searchParams = new URLSearchParams()
    
    if (params.search) searchParams.append('search', params.search)
    if (params.page) searchParams.append('page', params.page.toString())
    if (params.limit) searchParams.append('limit', params.limit.toString())

    const queryString = searchParams.toString()
    const endpoint = `/users${queryString ? `?${queryString}` : ''}`
    
    return apiClient.get<PaginatedResponse<User>>(endpoint)
  }

  // Get user by ID
  static async getUserById(id: string): Promise<User> {
    return apiClient.get<User>(`/users/${id}`)
  }

  // Get current user profile (requires authentication)
  static async getCurrentUserProfile(): Promise<User> {
    return apiClient.get<User>('/users/me')
  }

  // Get current user by supabase_user_id (legacy method)
  static async getCurrentUser(supabaseUserId: string): Promise<User | null> {
    try {
      const response = await this.getUsers({ search: supabaseUserId })
      // Find user with matching supabase_user_id
      const user = response.data.find(u => u.supabase_user_id === supabaseUserId)
      return user || null
    } catch (error) {
      console.error('Error fetching current user:', error)
      return null
    }
  }

  // Create new user
  static async createUser(userData: CreateUserDto): Promise<User> {
    return apiClient.post<User>('/users', userData)
  }

  // Update user
  static async updateUser(id: string, userData: UpdateUserDto): Promise<User> {
    return apiClient.patch<User>(`/users/${id}`, userData)
  }

  // Delete user
  static async deleteUser(id: string): Promise<void> {
    return apiClient.delete<void>(`/users/${id}`)
  }

  // Search users
  static async searchUsers(query: string, limit = 20): Promise<User[]> {
    const response = await this.getUsers({ search: query, limit })
    return response.data
  }

  // Create user profile after Supabase auth registration
  static async createUserProfile(supabaseUser: unknown): Promise<User> {
    // Type guard to ensure supabaseUser is an object
    if (!supabaseUser || typeof supabaseUser !== 'object') {
      throw new Error('Invalid user data provided')
    }
    
    const user = supabaseUser as Record<string, unknown>
    const userMetadata = (user.user_metadata as Record<string, unknown>) || {}
    const email = user.email as string
    const id = user.id as string
    
    const userData: CreateUserDto = {
      username: (userMetadata.username as string) || email?.split('@')[0] || 'user',
      display_name: (userMetadata.full_name as string) || (userMetadata.name as string),
      email: email,
      avatar_url: userMetadata.avatar_url as string,
      supabase_user_id: id
    }

    return this.createUser(userData)
  }

  // Update user profile
  static async updateUserProfile(id: string, updates: Partial<UpdateUserDto>): Promise<User> {
    return this.updateUser(id, updates)
  }
}