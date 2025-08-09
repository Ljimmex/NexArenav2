'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { TeamService } from '@/lib/api/team-service'
import { UserService } from '@/lib/api/user-service'
import { apiClient } from '@/lib/api/api-client'
import { supabase } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { z } from 'zod'
import { X } from 'lucide-react'

// Schema walidacji formularza
const teamSchema = z.object({
  name: z.string()
    .min(2, 'Nazwa drużyny musi mieć co najmniej 2 znaki')
    .max(50, 'Nazwa drużyny nie może przekraczać 50 znaków')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Nazwa może zawierać tylko litery, cyfry, spacje, myślniki i podkreślenia'),
  tag: z.string()
    .min(2, 'Tag drużyny musi mieć co najmniej 2 znaki')
    .max(10, 'Tag drużyny nie może przekraczać 10 znaków')
    .regex(/^[A-Z0-9]+$/, 'Tag może zawierać tylko wielkie litery i cyfry'),
  description: z.string()
    .max(1000, 'Opis nie może przekraczać 1000 znaków')
    .optional(),
  logo_url: z.string()
    .url('Podaj prawidłowy URL')
    .optional()
    .or(z.literal('')),
  banner_url: z.string()
    .url('Podaj prawidłowy URL')
    .optional()
    .or(z.literal('')),
  country: z.string()
    .length(2, 'Kod kraju musi mieć 2 znaki')
    .regex(/^[A-Z]{2}$/, 'Kod kraju musi składać się z wielkich liter')
    .optional()
    .or(z.literal('')),
  website_url: z.string()
    .url('Podaj prawidłowy URL')
    .optional()
    .or(z.literal('')),
  discord_url: z.string()
    .url('Podaj prawidłowy URL Discord')
    .optional()
    .or(z.literal('')),
  twitter_url: z.string()
    .url('Podaj prawidłowy URL Twitter')
    .optional()
    .or(z.literal('')),
  max_members: z.number()
    .min(2, 'Drużyna musi mieć co najmniej 2 członków')
    .max(50, 'Drużyna nie może mieć więcej niż 50 członków')
    .default(10)
})

type TeamFormData = z.infer<typeof teamSchema>

interface FormErrors {
  [key: string]: string
}

interface CreateTeamModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateTeamModal({ isOpen, onClose, onSuccess }: CreateTeamModalProps) {
  const { user, customUser, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [formData, setFormData] = useState<TeamFormData>({
    name: '',
    tag: '',
    description: '',
    logo_url: '',
    banner_url: '',
    country: '',
    website_url: '',
    discord_url: '',
    twitter_url: '',
    max_members: 10
  })

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        tag: '',
        description: '',
        logo_url: '',
        banner_url: '',
        country: '',
        website_url: '',
        discord_url: '',
        twitter_url: '',
        max_members: 10
      })
      setErrors({})
    }
  }, [isOpen])

  const validateField = (name: string, value: string | number) => {
    try {
      const fieldSchema = teamSchema.shape[name as keyof typeof teamSchema.shape]
      if (fieldSchema) {
        fieldSchema.parse(value)
        setErrors(prev => ({ ...prev, [name]: '' }))
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({ ...prev, [name]: error.errors[0].message }))
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const parsedValue = type === 'number' ? parseInt(value) || 0 : value

    setFormData(prev => ({
      ...prev,
      [name]: parsedValue
    }))

    // Walidacja w czasie rzeczywistym
    validateField(name, parsedValue)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast.error('Musisz być zalogowany, aby utworzyć drużynę')
      return
    }

    // Jeśli nie ma customUser, spróbuj go pobrać/utworzyć
    let currentCustomUser = customUser
    if (!currentCustomUser) {
      try {
        toast.loading('Przygotowuję dane użytkownika...')
        
        // Upewnij się, że token jest ustawiony
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          apiClient.setAuthToken(session.access_token)
        } else {
          throw new Error('Brak tokenu uwierzytelniającego')
        }
        
        // Spróbuj pobrać dane użytkownika używając uwierzytelnionego endpointu
        try {
          currentCustomUser = await UserService.getCurrentUserProfile()
        } catch (profileError) {
          // Jeśli profil nie istnieje, utwórz nowy
          currentCustomUser = await UserService.createUserProfile(user)
        }
        toast.dismiss()
      } catch (error) {
        toast.dismiss()
        toast.error('Błąd podczas przygotowywania danych użytkownika')
        return
      }
    }

    // Walidacja całego formularza
    try {
      const validatedData = teamSchema.parse(formData)
      setErrors({})

      setLoading(true)

      // Przygotuj dane do wysłania
      const teamData = {
        name: validatedData.name.trim(),
        tag: validatedData.tag.trim(),
        description: validatedData.description?.trim() || undefined,
        logo_url: validatedData.logo_url?.trim() || undefined,
        banner_url: validatedData.banner_url?.trim() || undefined,
        country: validatedData.country?.trim() || undefined,
        website_url: validatedData.website_url?.trim() || undefined,
        discord_url: validatedData.discord_url?.trim() || undefined,
        twitter_url: validatedData.twitter_url?.trim() || undefined,
        max_members: validatedData.max_members,
        created_by: currentCustomUser.id
      }

      await TeamService.createTeam(teamData)

      toast.success('Drużyna została pomyślnie utworzona!')
      onClose()
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: FormErrors = {}
        error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message
          }
        })
        setErrors(fieldErrors)
        toast.error('Sprawdź poprawność danych w formularzu')
      } else {
        console.error('Error creating team:', error)
        toast.error('Wystąpił błąd podczas tworzenia drużyny')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  // Jeśli jeszcze ładuje dane, pokaż loader
  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Ładowanie...</h2>
            <p className="text-gray-600">Sprawdzam dane użytkownika...</p>
          </div>
        </div>
      </div>
    )
  }

  // Sprawdź czy użytkownik jest zalogowany - pokazuj komunikat tylko jeśli nie ma user
  if (!user) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Wymagane logowanie</h2>
            <p className="text-gray-600 mb-6">Musisz być zalogowany, aby utworzyć drużynę.</p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={() => {
                  onClose()
                  window.location.href = '/auth/login'
                }}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Zaloguj się
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Utwórz nową drużynę</h2>
            <p className="text-gray-600">Stwórz swoją drużynę esportową</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Podstawowe informacje */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Podstawowe informacje
                </h3>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nazwa drużyny *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="np. Team Phoenix"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="tag" className="block text-sm font-medium text-gray-700 mb-1">
                  Tag drużyny *
                </label>
                <input
                  type="text"
                  id="tag"
                  name="tag"
                  value={formData.tag}
                  onChange={handleChange}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.tag ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="np. PHX"
                  style={{ textTransform: 'uppercase' }}
                />
                {errors.tag && <p className="mt-1 text-sm text-red-600">{errors.tag}</p>}
                <p className="mt-1 text-xs text-gray-500">Krótki identyfikator (2-10 znaków)</p>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Opis drużyny
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none ${
                    errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Opisz swoją drużynę, cele i styl gry..."
                />
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                <p className="mt-1 text-xs text-gray-500">
                  {formData.description?.length || 0}/1000 znaków
                </p>
              </div>
            </div>

            {/* Ustawienia */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Ustawienia
                </h3>
              </div>

              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                  Kraj
                </label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.country ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="np. PL"
                  maxLength={2}
                  style={{ textTransform: 'uppercase' }}
                />
                {errors.country && <p className="mt-1 text-sm text-red-600">{errors.country}</p>}
              </div>

              <div>
                <label htmlFor="max_members" className="block text-sm font-medium text-gray-700 mb-1">
                  Maks. członków
                </label>
                <input
                  type="number"
                  id="max_members"
                  name="max_members"
                  value={formData.max_members}
                  onChange={handleChange}
                  min={2}
                  max={50}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.max_members ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.max_members && <p className="mt-1 text-sm text-red-600">{errors.max_members}</p>}
              </div>
            </div>

            {/* Media i linki */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Media i linki (opcjonalne)
                </h3>
              </div>

              <div>
                <label htmlFor="logo_url" className="block text-sm font-medium text-gray-700 mb-1">
                  Logo URL
                </label>
                <input
                  type="url"
                  id="logo_url"
                  name="logo_url"
                  value={formData.logo_url}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.logo_url ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="https://example.com/logo.png"
                />
                {errors.logo_url && <p className="mt-1 text-sm text-red-600">{errors.logo_url}</p>}
              </div>

              <div>
                <label htmlFor="website_url" className="block text-sm font-medium text-gray-700 mb-1">
                  Strona WWW
                </label>
                <input
                  type="url"
                  id="website_url"
                  name="website_url"
                  value={formData.website_url}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.website_url ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="https://yourteam.com"
                />
                {errors.website_url && <p className="mt-1 text-sm text-red-600">{errors.website_url}</p>}
              </div>

              <div>
                <label htmlFor="discord_url" className="block text-sm font-medium text-gray-700 mb-1">
                  Discord
                </label>
                <input
                  type="url"
                  id="discord_url"
                  name="discord_url"
                  value={formData.discord_url}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.discord_url ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="https://discord.gg/yourteam"
                />
                {errors.discord_url && <p className="mt-1 text-sm text-red-600">{errors.discord_url}</p>}
              </div>

              <div>
                <label htmlFor="twitter_url" className="block text-sm font-medium text-gray-700 mb-1">
                  Twitter/X
                </label>
                <input
                  type="url"
                  id="twitter_url"
                  name="twitter_url"
                  value={formData.twitter_url}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.twitter_url ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="https://twitter.com/yourteam"
                />
                {errors.twitter_url && <p className="mt-1 text-sm text-red-600">{errors.twitter_url}</p>}
              </div>
            </div>

            {/* Przyciski */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Anuluj
              </button>
              <button
                type="submit"
                disabled={loading || !formData.name.trim() || !formData.tag.trim() || Object.values(errors).some(error => error)}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-medium"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Tworzenie...
                  </span>
                ) : (
                  'Utwórz drużynę'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}