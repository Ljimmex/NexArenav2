// API Client for backend communication
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
  }

  setAuthToken(token: string | null) {
    console.log('ApiClient: Setting auth token...', {
      previousToken: this.token ? `${this.token.substring(0, 20)}...` : 'NULL',
      newToken: token ? `${token.substring(0, 20)}...` : 'NULL',
      tokenLength: token?.length || 0
    })
    this.token = token
    console.log('ApiClient: Token set successfully')
  }

  // Debug method to check current token
  getCurrentToken(): string | null {
    return this.token
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
      console.log(`API Request to ${endpoint}: Token present (${this.token.substring(0, 20)}...)`)
    } else {
      console.log(`API Request to ${endpoint}: NO TOKEN AVAILABLE`)
    }

    const config: RequestInit = {
      ...options,
      headers,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error(`API Error ${response.status} for ${endpoint}:`, errorData)
        throw new Error(`API Error: ${response.status} - ${JSON.stringify(errorData)}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error)
      throw error
    }
  }

  // GET request
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  // POST request
  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // PUT request
  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // PATCH request
  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const apiClient = new ApiClient()