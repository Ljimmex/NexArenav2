'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Trophy, Users, Settings, Shield, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateTournamentData, Tournament, tournamentsAPI } from '@/lib/api/tournaments'
import { bracketsAPI } from '@/lib/api/brackets'
import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'
import { useAuth } from '@/lib/auth/auth-context'
import { useAdmin } from '@/lib/hooks/useAdmin'
import toast from 'react-hot-toast'
import { createClient } from '@supabase/supabase-js'
import { Switch } from '@/components/ui/switch'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

const gameTypes = [
  { value: 'CS2', label: 'Counter-Strike 2' },
  { value: 'VALORANT', label: 'Valorant' },
  { value: 'LOL', label: 'League of Legends' },
  { value: 'DOTA2', label: 'Dota 2' },
  { value: 'ROCKET_LEAGUE', label: 'Rocket League' },
  { value: 'OVERWATCH', label: 'Overwatch 2' },
]

const tournamentTypes = [
  { value: 'SINGLE_ELIMINATION', label: 'Single Elimination' },
  { value: 'DOUBLE_ELIMINATION', label: 'Double Elimination' },
  { value: 'ROUND_ROBIN', label: 'Round Robin' },
  { value: 'SWISS', label: 'Swiss System' },
]

export default function EditTournamentPage() {
  const params = useParams()
  const router = useRouter()
  const { user, session, customUser, loading: authLoading, refreshToken } = useAuth()
  const { isAdmin, canEditTournament } = useAdmin()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [regeneratingBracket, setRegeneratingBracket] = useState(false)
  const [formData, setFormData] = useState<Partial<CreateTournamentData>>({})

  // Redirect non-admin users
  useEffect(() => {
    if (!authLoading && user && !canEditTournament) {
      router.push('/tournaments')
    }
  }, [user, canEditTournament, authLoading, router])

  // Fetch tournament data
  useEffect(() => {
    const fetchTournament = async () => {
      try {
        setLoading(true)
        setError(null)
        const tournamentData = await tournamentsAPI.getTournament(params.id as string)
        setTournament(tournamentData)
        setFormData({
          title: tournamentData.title,
          description: tournamentData.description || '',
          short_description: tournamentData.short_description || '',
          game_type: tournamentData.game_type,
          tournament_type: tournamentData.tournament_type,
          max_teams: tournamentData.max_teams,
          min_teams: tournamentData.min_teams,
          team_size: tournamentData.team_size,
          entry_fee: tournamentData.entry_fee,
          prize_pool: tournamentData.prize_pool,
          registration_start: tournamentData.registration_start ? new Date(tournamentData.registration_start).toISOString().slice(0, 16) : '',
          registration_end: tournamentData.registration_end ? new Date(tournamentData.registration_end).toISOString().slice(0, 16) : '',
          tournament_start: tournamentData.tournament_start ? new Date(tournamentData.tournament_start).toISOString().slice(0, 16) : '',
          tournament_end: tournamentData.tournament_end ? new Date(tournamentData.tournament_end).toISOString().slice(0, 16) : '',
          rules: tournamentData.rules || '',
          banner_url: tournamentData.banner_url || '',
          // include existing format_settings or set sensible defaults for Single Elimination
          format_settings: tournamentData.format_settings || {
            single_elimination: {
              bronze_match: false,
              number_of_groups: 1,
            },
          },
        })
      } catch (error) {
        console.error('Error fetching tournament:', error)
        setError(error instanceof Error ? error.message : 'Błąd podczas pobierania turnieju')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchTournament()
    }
  }, [params.id])

  // Show loading state during auth check
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <Header />
        <div className="flex">
          <div className="h-screen sticky top-0">
            <Sidebar />
          </div>
          <main className="flex-1 p-8">
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto"></div>
              <p className="text-gray-400 mt-6 text-lg">Ładowanie...</p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Show access denied for non-admin users
  if (user && !canEditTournament) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <Header />
        <div className="flex">
          <div className="h-screen sticky top-0">
            <Sidebar />
          </div>
          <main className="flex-1 p-8">
            <div className="text-center py-20">
              <AlertTriangle className="h-24 w-24 text-red-400 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-white mb-4">Brak dostępu</h1>
              <p className="text-gray-400 mb-8 text-lg">
                Nie masz uprawnień do edycji turniejów. Tylko administratorzy i organizatorzy mogą edytować turnieje.
              </p>
              <Link href="/tournaments">
                <Button className="bg-cyan-400 text-black hover:bg-cyan-300">
                  Powrót do turniejów
                </Button>
              </Link>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Show login required for unauthenticated users
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <Header />
        <div className="flex">
          <div className="h-screen sticky top-0">
            <Sidebar />
          </div>
          <main className="flex-1 p-8">
            <div className="text-center py-20">
              <Shield className="h-24 w-24 text-cyan-400 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-white mb-4">Wymagane logowanie</h1>
              <p className="text-gray-400 mb-8 text-lg">
                Musisz być zalogowany aby edytować turnieje.
              </p>
              <Link href="/auth/login">
                <Button className="bg-cyan-400 text-black hover:bg-cyan-300">
                  Zaloguj się
                </Button>
              </Link>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <Header />
        <div className="flex">
          <div className="h-screen sticky top-0">
            <Sidebar />
          </div>
          <main className="flex-1 p-8">
            <div className="text-center py-20">
              <p className="text-red-400 text-lg">{error || 'Turniej nie został znaleziony'}</p>
              <Link href="/tournaments">
                <Button className="mt-6 bg-cyan-400 text-black hover:bg-cyan-300">
                  Powrót do turniejów
                </Button>
              </Link>
            </div>
          </main>
        </div>
      </div>
    )
  }

  const handleInputChange = (field: keyof CreateTournamentData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSESettingChange = (path: 'bronze_match' | 'max_participants' | 'number_of_groups', value: boolean | number) => {
    setFormData(prev => ({
      ...prev,
      format_settings: {
        ...(prev.format_settings || {}),
        single_elimination: {
          ...(prev.format_settings?.single_elimination || {}),
          [path]: value,
        },
      },
    }))
  }

  const handleNumberChange = (field: keyof CreateTournamentData, value: string, isFloat = false) => {
    if (value === '') {
      setFormData(prev => ({
        ...prev,
        [field]: undefined
      }))
      return
    }
    
    const numValue = isFloat ? parseFloat(value) : parseInt(value, 10)
    if (!isNaN(numValue)) {
      setFormData(prev => ({
        ...prev,
        [field]: numValue
      }))
    }
  }

  const validateForm = (): boolean => {
    if (!formData.title?.trim()) {
      setError('Nazwa turnieju jest wymagana')
      return false
    }
    
    if (!formData.game_type?.trim()) {
      setError('Gra jest wymagana')
      return false
    }
    
    if (!formData.tournament_type?.trim()) {
      setError('Format turnieju jest wymagany')
      return false
    }
    
    if (!formData.team_size || formData.team_size < 1 || formData.team_size > 10) {
      setError('Rozmiar drużyny musi być między 1 a 10')
      return false
    }
    
    if (!formData.max_teams || formData.max_teams < 2) {
      setError('Maksymalna liczba drużyn musi być co najmniej 2')
      return false
    }
    
    if (formData.min_teams && formData.max_teams && formData.min_teams > formData.max_teams) {
      setError('Minimalna liczba drużyn nie może być większa niż maksymalna')
      return false
    }
    
    if (formData.tournament_start) {
      const startDate = new Date(formData.tournament_start)
      if (startDate <= new Date()) {
        setError('Data rozpoczęcia turnieju musi być w przyszłości')
        return false
      }
    }
    
    if (formData.registration_end && formData.tournament_start) {
      const regEnd = new Date(formData.registration_end)
      const tournStart = new Date(formData.tournament_start)
      if (regEnd >= tournStart) {
        setError('Koniec rejestracji musi być przed rozpoczęciem turnieju')
        return false
      }
    }
    
    return true
  }

  // Funkcja do konwersji dat z formatu datetime-local do ISO 8601
  const formatDateForAPI = (dateString: string): string => {
    if (!dateString || dateString.trim() === '') return ''
    
    try {
      // Jeśli data jest już w formacie ISO, zwróć ją
      if (dateString.includes('T') && dateString.includes('Z')) {
        return dateString
      }
      
      // Konwertuj z formatu datetime-local (YYYY-MM-DDTHH:MM) do ISO 8601
      const date = new Date(dateString)
      
      // Sprawdź czy data jest prawidłowa
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string:', dateString)
        return ''
      }
      
      return date.toISOString()
    } catch (error) {
      console.error('Error formatting date:', dateString, error)
      return ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!tournament) {
      toast.error('Brak danych turnieju')
      return
    }

    if (!user) {
      toast.error('Musisz być zalogowany aby edytować turniej')
      setError('Musisz być zalogowany aby edytować turniej')
      return
    }

    if (!validateForm()) {
      return
    }

    try {
      setSaving(true)
      
      // Przygotuj dane z poprawnie sformatowanymi datami
      const formattedData = {
        ...formData,
        registration_start: formData.registration_start ? formatDateForAPI(formData.registration_start) : undefined,
        registration_end: formData.registration_end ? formatDateForAPI(formData.registration_end) : undefined,
        tournament_start: formData.tournament_start ? formatDateForAPI(formData.tournament_start) : undefined,
        tournament_end: formData.tournament_end ? formatDateForAPI(formData.tournament_end) : undefined,
      }
      
      // Szczegółowe debugowanie stanu autoryzacji
      console.log('=== DEBUGGING TOURNAMENT UPDATE ===')
      console.log('User:', user?.id)
      console.log('Session:', session?.access_token ? 'Present' : 'Missing')
      console.log('Custom User:', customUser?.id)
      console.log('Tournament ID:', tournament.id)
      console.log('Original Form Data:', formData)
      console.log('Formatted Form Data:', formattedData)
      
      toast.loading('Odświeżanie tokenu autoryzacji...', { id: 'update-tournament' })
      
      console.log('Refreshing token before update...')
      const tokenRefreshed = await refreshToken()
      
      if (!tokenRefreshed) {
        console.error('Token refresh failed')
        toast.error('Nie udało się odświeżyć tokenu autoryzacji', { id: 'update-tournament' })
        throw new Error('Nie udało się odświeżyć tokenu autoryzacji')
      }
      
      console.log('Token refreshed successfully, checking session again...')
      
      // Sprawdź sesję po odświeżeniu
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      console.log('Current session after refresh:', currentSession?.access_token ? 'Present' : 'Missing')
      
      if (!currentSession?.access_token) {
        console.error('No session after refresh')
        toast.error('Brak sesji po odświeżeniu tokenu', { id: 'update-tournament' })
        throw new Error('Brak sesji po odświeżeniu tokenu')
      }
      
      toast.loading('Aktualizowanie turnieju...', { id: 'update-tournament' })
      
      console.log('Proceeding with tournament update...')
      const updatedTournament = await tournamentsAPI.updateTournament(tournament.id, formattedData)
      console.log('Tournament updated successfully:', updatedTournament)
      
      toast.success('Turniej został zaktualizowany pomyślnie!', { id: 'update-tournament' })
      
      // Przekieruj po krótkim opóźnieniu z parametrem refresh
      setTimeout(() => {
        router.push(`/tournaments/${updatedTournament.id}?refresh=${Date.now()}`)
      }, 1000)
      
    } catch (error) {
      console.error('=== ERROR UPDATING TOURNAMENT ===')
      console.error('Error details:', error)
      
      if (error instanceof Error) {
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Nie udało się zaktualizować turnieju'
      
      toast.error(`Błąd: ${errorMessage}`, { id: 'update-tournament' })
      setError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleRegenerateBracket = async () => {
    if (!tournament || tournament.tournament_type !== 'SINGLE_ELIMINATION') return

    setRegeneratingBracket(true)
    setError(null)
    setSuccess(null)

    try {
      const formatSettings = formData.format_settings as any
      const numberOfGroups = formatSettings?.single_elimination?.number_of_groups || 1
      const bronzeMatch = formatSettings?.single_elimination?.bronze_match || false

      await bracketsAPI.generateSingleElimination({
        tournament_id: tournament.id,
        max_participants: formData.max_teams || tournament.max_teams,
        bronze_match: bronzeMatch,
        number_of_groups: numberOfGroups,
      })

      setSuccess('Drabinka została pomyślnie wygenerowana!')
    } catch (err: any) {
      console.error('Error regenerating bracket:', err)
      setError(err.message || 'Wystąpił błąd podczas generowania drabinki')
    } finally {
      setRegeneratingBracket(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />
      <div className="flex">
        <div className="h-screen sticky top-0">
          <Sidebar />
        </div>
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <Link href={`/tournaments/${tournament.id}`}>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Powrót
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">Edytuj turniej</h1>
                <p className="text-gray-400 mt-1">Modyfikuj szczegóły turnieju</p>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <Card className="bg-[#1a1a1a] border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Trophy className="h-5 w-5" />
                    Podstawowe informacje
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-gray-300">Nazwa turnieju *</Label>
                      <Input
                        id="title"
                        type="text"
                        value={formData.title || ''}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        className="bg-[#2a2a2a] border-gray-600 text-white"
                        placeholder="Wprowadź nazwę turnieju"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="game_type" className="text-gray-300">Gra *</Label>
                      <Select value={formData.game_type || ''} onValueChange={(value) => handleInputChange('game_type', value)}>
                        <SelectTrigger className="bg-[#2a2a2a] border-gray-600 text-white">
                          <SelectValue placeholder="Wybierz grę" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#2a2a2a] border-gray-600">
                          {gameTypes.map((game) => (
                            <SelectItem key={game.value} value={game.value} className="text-white hover:bg-gray-700">
                              {game.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="short_description" className="text-gray-300">Krótki opis</Label>
                    <Input
                      id="short_description"
                      type="text"
                      value={formData.short_description || ''}
                      onChange={(e) => handleInputChange('short_description', e.target.value)}
                      className="bg-[#2a2a2a] border-gray-600 text-white"
                      placeholder="Krótki opis turnieju (wyświetlany na liście)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-gray-300">Szczegółowy opis</Label>
                    <Textarea
                      id="description"
                      value={formData.description || ''}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="bg-[#2a2a2a] border-gray-600 text-white min-h-[120px]"
                      placeholder="Szczegółowy opis turnieju"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="banner_url" className="text-gray-300">URL bannera</Label>
                    <Input
                      id="banner_url"
                      type="url"
                      value={formData.banner_url || ''}
                      onChange={(e) => handleInputChange('banner_url', e.target.value)}
                      className="bg-[#2a2a2a] border-gray-600 text-white"
                      placeholder="https://example.com/banner.jpg"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Tournament Settings */}
              <Card className="bg-[#1a1a1a] border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Settings className="h-5 w-5" />
                    Ustawienia turnieju
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="tournament_type" className="text-gray-300">Format turnieju *</Label>
                      <Select value={formData.tournament_type || ''} onValueChange={(value) => handleInputChange('tournament_type', value)}>
                        <SelectTrigger className="bg-[#2a2a2a] border-gray-600 text-white">
                          <SelectValue placeholder="Wybierz format" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#2a2a2a] border-gray-600">
                          {tournamentTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value} className="text-white hover:bg-gray-700">
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="team_size" className="text-gray-300">Rozmiar drużyny *</Label>
                      <Input
                        id="team_size"
                        type="number"
                        min="1"
                        max="10"
                        value={formData.team_size || ''}
                        onChange={(e) => handleNumberChange('team_size', e.target.value)}
                        className="bg-[#2a2a2a] border-gray-600 text-white"
                        required
                      />
                    </div>
                  </div>

                  {formData.tournament_type === 'SINGLE_ELIMINATION' && (
                    <div className="mt-2 p-4 border border-gray-700 rounded-lg bg-[#1f1f1f]">
                      <div className="flex items-center justify-between mb-4">
                        <div className="space-y-1">
                          <Label className="text-white">Mecz o 3. miejsce</Label>
                          <p className="text-sm text-gray-400">Dodaj dodatkowy mecz dla drużyn przegranych w półfinałach</p>
                        </div>
                        <Switch
                          checked={Boolean((formData.format_settings as any)?.single_elimination?.bronze_match)}
                          onCheckedChange={(checked: boolean) => handleSESettingChange('bronze_match', checked)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="se_number_of_groups" className="text-white">Liczba grup</Label>
                        <Input
                          id="se_number_of_groups"
                          type="number"
                          min={1}
                          step={1}
                          value={Number((formData.format_settings as any)?.single_elimination?.number_of_groups) || 1}
                          onChange={(e) => handleSESettingChange('number_of_groups', parseInt(e.target.value) || 1)}
                          className="bg-[#2a2a2a] border-gray-600 text-white"
                        />
                        <p className="text-xs text-gray-400">Liczba grup w fazie grupowej (domyślnie 1 = bez fazy grupowej)</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="min_teams" className="text-gray-300">Minimalna liczba drużyn *</Label>
                      <Input
                        id="min_teams"
                        type="number"
                        min="2"
                        value={formData.min_teams || ''}
                        onChange={(e) => handleNumberChange('min_teams', e.target.value)}
                        className="bg-[#2a2a2a] border-gray-600 text-white"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="max_teams" className="text-gray-300">Maksymalna liczba drużyn *</Label>
                      <Input
                        id="max_teams"
                        type="number"
                        min="2"
                        value={formData.max_teams || ''}
                        onChange={(e) => handleNumberChange('max_teams', e.target.value)}
                        className="bg-[#2a2a2a] border-gray-600 text-white"
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Settings */}
              <Card className="bg-[#1a1a1a] border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Trophy className="h-5 w-5" />
                    Ustawienia finansowe
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="entry_fee" className="text-gray-300">Opłata startowa (PLN)</Label>
                      <Input
                        id="entry_fee"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.entry_fee || ''}
                        onChange={(e) => handleNumberChange('entry_fee', e.target.value, true)}
                        className="bg-[#2a2a2a] border-gray-600 text-white"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="prize_pool" className="text-gray-300">Pula nagród (PLN)</Label>
                      <Input
                        id="prize_pool"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.prize_pool || ''}
                        onChange={(e) => handleNumberChange('prize_pool', e.target.value, true)}
                        className="bg-[#2a2a2a] border-gray-600 text-white"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Schedule */}
              <Card className="bg-[#1a1a1a] border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Users className="h-5 w-5" />
                    Harmonogram
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="registration_start" className="text-gray-300">Początek rejestracji</Label>
                      <Input
                        id="registration_start"
                        type="datetime-local"
                        value={formData.registration_start || ''}
                        onChange={(e) => handleInputChange('registration_start', e.target.value)}
                        className="bg-[#2a2a2a] border-gray-600 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="registration_end" className="text-gray-300">Koniec rejestracji</Label>
                      <Input
                        id="registration_end"
                        type="datetime-local"
                        value={formData.registration_end || ''}
                        onChange={(e) => handleInputChange('registration_end', e.target.value)}
                        className="bg-[#2a2a2a] border-gray-600 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="tournament_start" className="text-gray-300">Początek turnieju</Label>
                      <Input
                        id="tournament_start"
                        type="datetime-local"
                        value={formData.tournament_start || ''}
                        onChange={(e) => handleInputChange('tournament_start', e.target.value)}
                        className="bg-[#2a2a2a] border-gray-600 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tournament_end" className="text-gray-300">Koniec turnieju</Label>
                      <Input
                        id="tournament_end"
                        type="datetime-local"
                        value={formData.tournament_end || ''}
                        onChange={(e) => handleInputChange('tournament_end', e.target.value)}
                        className="bg-[#2a2a2a] border-gray-600 text-white"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Rules */}
              <Card className="bg-[#1a1a1a] border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Settings className="h-5 w-5" />
                    Zasady turnieju
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="rules" className="text-gray-300">Zasady i regulamin</Label>
                    <Textarea
                      id="rules"
                      value={formData.rules || ''}
                      onChange={(e) => handleInputChange('rules', e.target.value)}
                      className="bg-[#2a2a2a] border-gray-600 text-white min-h-[200px]"
                      placeholder="Wprowadź zasady turnieju..."
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Link href={`/tournaments/${tournament.id}`}>
                  <Button type="button" variant="outline" className="border-gray-600 text-white hover:bg-gray-700">
                    Anuluj
                  </Button>
                </Link>
                {tournament.tournament_type === 'SINGLE_ELIMINATION' && (
                  <Button 
                    type="button"
                    onClick={handleRegenerateBracket}
                    disabled={regeneratingBracket}
                    variant="outline"
                    className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
                  >
                    {regeneratingBracket ? 'Generowanie...' : 'Regeneruj Drabinkę'}
                  </Button>
                )}
                <Button 
                  type="submit" 
                  disabled={saving}
                  className="bg-gradient-to-r from-cyan-400 to-blue-500 text-black hover:from-cyan-300 hover:to-blue-400 font-bold px-8"
                >
                  {saving ? 'Zapisywanie...' : 'Zapisz zmiany'}
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}