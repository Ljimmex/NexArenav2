'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useAuth } from '@/lib/auth/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Mail, Calendar, Shield, Edit, Trophy, Target, Users, Star } from 'lucide-react'
import toast from 'react-hot-toast'


// Dostępne avatary
const availableAvatars = [
  '/images/demo-avatar.png',
  '/images/Avatar1.png',
  '/images/Avatar2.png',
  '/images/Avatar3.png',
  '/images/Avatar4.png',
  '/images/Avatar5.png',
]

export function UserProfile() {
  const { user, customUser, updateProfile, loading, refreshUserData } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    username: customUser?.username || '',
    display_name: customUser?.display_name || '',
    bio: customUser?.bio || '',
    avatar_url: customUser?.avatar_url || '/images/demo-avatar.png',
    banner_url: customUser?.banner_url || '/banners/ProfilBaner.png',
  })

  // Update form data when customUser changes
  useEffect(() => {
    if (customUser) {
      setFormData({
        username: customUser.username || '',
        display_name: customUser.display_name || '',
        bio: customUser.bio || '',
        avatar_url: customUser.avatar_url || '/images/demo-avatar.png',
        banner_url: customUser.banner_url || '/banners/ProfilBaner.png',
      })
    }
  }, [customUser])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await updateProfile(formData)
      await refreshUserData() // Refresh custom user data
      setIsEditing(false)
      toast.success('Profil został zaktualizowany')
    } catch (error) {
      toast.error('Błąd podczas aktualizacji profilu')
    }
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Musisz być zalogowany aby zobaczyć profil</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profil użytkownika
          </CardTitle>
          <CardDescription>
            Zarządzaj swoimi danymi osobowymi i ustawieniami konta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Podstawowe informacje */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Data rejestracji</p>
                <p className="text-sm text-gray-600">
                  {new Date(user.created_at).toLocaleDateString('pl-PL')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Shield className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Status konta</p>
                <p className="text-sm text-green-600">Aktywne</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <User className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Provider</p>
                <p className="text-sm text-gray-600 capitalize">
                  {user?.app_metadata?.provider || 'email'}
                </p>
              </div>
            </div>
          </div>

          {/* Custom User Info */}
          {customUser && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Nazwa użytkownika</p>
                  <p className="text-lg font-bold text-blue-600">{customUser.username}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <p className="text-lg font-bold text-green-600">
                    {customUser.is_active ? 'Aktywny' : 'Nieaktywny'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="hidden">
              <User className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Provider</p>
                <p className="text-sm text-gray-600 capitalize">
                  {user?.app_metadata?.provider || 'email'}
                </p>
              </div>
            </div>
          </div>

          {/* Formularz edycji */}
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Wybór avatara */}
              <div className="space-y-3">
                <Label>Wybierz avatar</Label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {availableAvatars.map((avatarUrl, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, avatar_url: avatarUrl }))}
                      className={`relative w-16 h-16 rounded-full overflow-hidden border-2 transition-all hover:scale-105 ${
                        formData.avatar_url === avatarUrl 
                          ? 'border-blue-500 ring-2 ring-blue-200' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <Image
                        src={avatarUrl}
                        alt={`Avatar ${index + 1}`}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500">Kliknij na avatar aby go wybrać</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Nazwa użytkownika</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Wprowadź nazwę użytkownika"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="display_name">Nazwa wyświetlana</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                  placeholder="Wprowadź nazwę wyświetlaną"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Opowiedz coś o sobie..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Zapisywanie...' : 'Zapisz zmiany'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                >
                  Anuluj
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Aktualny avatar */}
              <div className="space-y-2">
                <Label>Aktualny avatar</Label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-300">
                    <Image
                      src={customUser?.avatar_url || '/images/demo-avatar.png'}
                      alt="Aktualny avatar"
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    Twój aktualny avatar
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nazwa użytkownika</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {customUser?.username || 'Nie ustawiono'}
                  </p>
                </div>
                
                <div>
                  <Label>Nazwa wyświetlana</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {customUser?.display_name || 'Nie ustawiono'}
                  </p>
                </div>
              </div>

              <div>
                <Label>Bio</Label>
                <p className="text-sm text-gray-600 mt-1">
                  {customUser?.bio || 'Nie ustawiono'}
                </p>
              </div>
              
              <Button onClick={() => setIsEditing(true)}>
                Edytuj profil
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}