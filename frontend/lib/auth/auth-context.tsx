'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import { UserService, User as ApiUser } from '@/lib/api/user-service'
import { apiClient } from '@/lib/api/api-client'

interface AuthContextType {
  user: User | null
  customUser: ApiUser | null
  session: Session | null
  loading: boolean
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string, username: string) => Promise<void>
  signInWithProvider: (provider: 'google' | 'discord' | 'github') => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (data: { username?: string; display_name?: string; bio?: string; avatar_url?: string }) => Promise<void>
  refreshUserData: () => Promise<void>
  refreshToken: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [customUser, setCustomUser] = useState<ApiUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUserData = useCallback(async () => {
    try {
      if (!user?.id) {
        setCustomUser(null)
        return
      }

      // First check if we have a current session
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      
      if (!currentSession) {
        console.log('No current session available, cannot refresh user data')
        setCustomUser(null)
        return
      }

      // Try to use current session first
      let sessionToUse = currentSession
      
      // Only refresh if the current session is expired or about to expire
      const now = Math.floor(Date.now() / 1000)
      const expiresAt = currentSession.expires_at || 0
      const timeUntilExpiry = expiresAt - now
      
      if (timeUntilExpiry < 300) { // Less than 5 minutes until expiry
        console.log('Session expires soon, attempting refresh...')
        try {
          const { data: { session: freshSession }, error } = await supabase.auth.refreshSession()
          
          if (error) {
            // Handle specific auth errors
            if (error.message.includes('Auth session missing') || error.message.includes('refresh_token_not_found')) {
              console.log('Session refresh failed - no valid session to refresh:', error.message)
              setCustomUser(null)
              return
            }
            console.error('Error refreshing session:', error)
            // Continue with current session if refresh fails
          } else if (freshSession?.access_token) {
            console.log('Session refreshed successfully')
            sessionToUse = freshSession
            setSession(freshSession)
          }
        } catch (refreshError) {
          console.log('Session refresh failed, using current session:', refreshError)
          // Continue with current session
        }
      }

      if (sessionToUse?.access_token) {
        console.log('Using session token for user data refresh')
        // Update the API client with the token
        apiClient.setAuthToken(sessionToUse.access_token)
        
        // Try to get current user profile using authenticated endpoint
        try {
          const customUserData = await UserService.getCurrentUserProfile()
          setCustomUser(customUserData)
          console.log('User data refreshed successfully:', customUserData)
          return
        } catch (profileError) {
          console.log('User profile not found via /me endpoint, will auto-create on backend')
          // Don't handle the error here - let the backend auto-create the user
          // Just retry the /me endpoint which should now work
          try {
            const customUserData = await UserService.getCurrentUserProfile()
            setCustomUser(customUserData)
            console.log('User data created and refreshed successfully:', customUserData)
            return
          } catch (retryError) {
            console.error('Failed to get user profile after backend auto-creation:', retryError)
            setCustomUser(null)
          }
        }
      } else {
        console.log('No valid session token available')
        setCustomUser(null)
      }
    } catch (error) {
      console.error('Error refreshing user data:', error)
      setCustomUser(null)
    }
  }, [user])

  // Auto-refresh user data when user exists but customUser is missing
  useEffect(() => {
    if (user && !customUser && !loading) {
      console.log('Auto-refreshing user data because customUser is missing')
      refreshUserData()
    }
  }, [user, customUser, loading, refreshUserData])

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      // Set auth token for initial session
      if (session?.access_token) {
        console.log('Setting initial auth token:', session.access_token.substring(0, 20) + '...')
        apiClient.setAuthToken(session.access_token)
      } else {
        console.log('No initial session token available')
        apiClient.setAuthToken(null)
      }
      
      if (session?.user) {
        await refreshUserData()
      }
      
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)

      // Set or clear auth token
      if (session?.access_token) {
        console.log('Auth state change - Setting auth token:', session.access_token.substring(0, 20) + '...')
        apiClient.setAuthToken(session.access_token)
      } else {
        console.log('Auth state change - Clearing auth token')
        apiClient.setAuthToken(null)
      }

      if (session?.user) {
        await refreshUserData()
      } else {
        setCustomUser(null)
      }

      setLoading(false)

      if (event === 'SIGNED_IN') {
        toast.success('Zalogowano pomyślnie!')
      } else if (event === 'SIGNED_OUT') {
        toast.success('Wylogowano pomyślnie!')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
    } catch (error) {
      const authError = error as AuthError
      toast.error(authError.message || 'Błąd podczas logowania')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUpWithEmail = async (email: string, password: string, username: string) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            display_name: username,
          },
        },
      })
      if (error) throw error
      toast.success('Sprawdź email aby potwierdzić konto!')
    } catch (error) {
      const authError = error as AuthError
      toast.error(authError.message || 'Błąd podczas rejestracji')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signInWithProvider = async (provider: 'google' | 'discord' | 'github') => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error) {
      const authError = error as AuthError
      toast.error(authError.message || `Błąd podczas logowania przez ${provider}`)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      
      // Clear the auth token from apiClient first
      apiClient.setAuthToken(null)
      
      // Clear local state
      setUser(null)
      setCustomUser(null)
      setSession(null)
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      toast.success('Wylogowano pomyślnie!')
    } catch (error) {
      const authError = error as AuthError
      toast.error(authError.message || 'Błąd podczas wylogowania')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (data: { username?: string; display_name?: string; bio?: string; avatar_url?: string }) => {
    try {
      setLoading(true)
      
      if (!customUser) {
        throw new Error('Brak danych użytkownika')
      }

      // Update the user profile via our API
      const updatedUser = await UserService.updateUserProfile(customUser.id, data)
      setCustomUser(updatedUser)
      
      toast.success('Profil zaktualizowany!')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error(error instanceof Error ? error.message : 'Błąd podczas aktualizacji profilu')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const refreshToken = useCallback(async () => {
    try {
      // First check if we have a current session
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      
      if (!currentSession) {
        console.log('refreshToken: No current session available')
        return false
      }

      // Check if current session is still valid
      const now = Math.floor(Date.now() / 1000)
      const expiresAt = currentSession.expires_at || 0
      const timeUntilExpiry = expiresAt - now
      
      // If session is still valid for more than 1 minute, use it
      if (timeUntilExpiry > 60) {
        console.log('refreshToken: Current session is still valid, using it')
        apiClient.setAuthToken(currentSession.access_token)
        setSession(currentSession)
        return true
      }

      // Try to refresh the session
      console.log('refreshToken: Attempting to refresh session...')
      const { data: { session: freshSession }, error } = await supabase.auth.refreshSession()
      
      if (error) {
        // Handle specific auth errors gracefully
        if (error.message.includes('Auth session missing') || error.message.includes('refresh_token_not_found')) {
          console.log('refreshToken: No valid session to refresh:', error.message)
          return false
        }
        console.error('refreshToken: Error refreshing session:', error)
        
        // If refresh fails but we have a current session, try to use it
        if (currentSession?.access_token) {
          console.log('refreshToken: Using current session as fallback')
          apiClient.setAuthToken(currentSession.access_token)
          setSession(currentSession)
          return true
        }
        
        return false
      }

      if (freshSession?.access_token) {
        console.log('refreshToken: Session refreshed successfully')
        apiClient.setAuthToken(freshSession.access_token)
        setSession(freshSession)
        return true
      }
      
      console.log('refreshToken: No access token in refreshed session')
      return false
    } catch (error) {
      console.error('refreshToken: Unexpected error:', error)
      
      // As a last resort, try to use any existing session
      try {
        const { data: { session: fallbackSession } } = await supabase.auth.getSession()
        if (fallbackSession?.access_token) {
          console.log('refreshToken: Using fallback session')
          apiClient.setAuthToken(fallbackSession.access_token)
          setSession(fallbackSession)
          return true
        }
      } catch (fallbackError) {
        console.error('refreshToken: Fallback session check failed:', fallbackError)
      }
      
      return false
    }
  }, [])

  const value = {
    user,
    customUser,
    session,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithProvider,
    signOut,
    updateProfile,
    refreshUserData,
    refreshToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}