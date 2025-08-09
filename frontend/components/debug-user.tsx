'use client'

import { useAuth } from '@/lib/auth/auth-context'
import { useAdmin } from '@/lib/hooks/useAdmin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useEffect, useState } from 'react'
import { UserService } from '@/lib/api/user-service'

export function DebugUser() {
  const { user, customUser, session, loading, refreshUserData } = useAuth()
  const { isAdmin, isModerator, isOrganizer, isCommentator } = useAdmin()
  const [apiTest, setApiTest] = useState<string>('Not tested')

  const testApiCall = async () => {
    try {
      setApiTest('Testing...')
      const userData = await UserService.getCurrentUserProfile()
      setApiTest(`Success: ${userData.role}`)
    } catch (error) {
      setApiTest(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  if (loading) {
    return <div className="p-4 text-white">Loading...</div>
  }

  return (
    <Card className="m-4 bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Debug User State</CardTitle>
      </CardHeader>
      <CardContent className="text-white space-y-2">
        <div>
          <strong>Supabase User:</strong> {user ? 'Logged in' : 'Not logged in'}
        </div>
        {user && (
          <div className="ml-4 text-sm text-gray-300">
            <div>ID: {user.id}</div>
            <div>Email: {user.email}</div>
          </div>
        )}
        
        <div>
          <strong>Custom User:</strong> {customUser ? 'Loaded' : 'Not loaded'}
        </div>
        {customUser && (
          <div className="ml-4 text-sm text-gray-300">
            <div>ID: {customUser.id}</div>
            <div>Username: {customUser.username}</div>
            <div>Email: {customUser.email}</div>
            <div>Role: {customUser.role}</div>
            <div>Supabase User ID: {customUser.supabase_user_id}</div>
          </div>
        )}
        
        <div>
          <strong>Session:</strong> {session ? 'Active' : 'No session'}
        </div>
        {session && (
          <div className="ml-4 text-sm text-gray-300">
            <div>Token: {session.access_token ? 'Present' : 'Missing'}</div>
          </div>
        )}
        
        <div>
          <strong>Admin Status:</strong>
        </div>
        <div className="ml-4 text-sm text-gray-300">
          <div>Is Admin: {isAdmin ? 'YES' : 'NO'}</div>
          <div>Is Moderator: {isModerator ? 'YES' : 'NO'}</div>
          <div>Is Organizer: {isOrganizer ? 'YES' : 'NO'}</div>
          <div>Is Commentator: {isCommentator ? 'YES' : 'NO'}</div>
        </div>

        <div>
          <strong>API Test:</strong> <span className="text-gray-300">{apiTest}</span>
        </div>
        <div className="mt-2 space-x-2">
          <button 
            onClick={testApiCall}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
          >
            Test API Call
          </button>
          <button 
            onClick={refreshUserData}
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
          >
            Refresh User Data
          </button>
        </div>
        
        {!customUser && user && (
          <div className="mt-4 p-3 bg-yellow-800 rounded text-yellow-100">
            <div className="text-sm">
              <strong>Issue:</strong> Supabase user exists but custom user profile is missing.
              <br />
              <strong>Solution:</strong> The backend should auto-create your profile when you call the API.
              <br />
              <strong>Action:</strong> Click "Test API Call" to trigger profile creation.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}