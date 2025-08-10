'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Trophy, Users, Settings, Shield, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { CreateTournamentData, tournamentsAPI } from '@/lib/api/tournaments'
import { useAdmin } from '@/lib/hooks/useAdmin'
import { useAuth } from '@/lib/auth/auth-context'
import toast from 'react-hot-toast'
import { bracketsAPI } from '@/lib/api/brackets'

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
  { value: 'SWISS', label: 'Swiss System' },
  { value: 'ROUND_ROBIN', label: 'Round Robin' },
]

const seedingModes = [
  { value: 'AUTO', label: 'Automatyczny' },
  { value: 'MANUAL', label: 'Manualny' },
  { value: 'RANDOM', label: 'Losowy' },
]

export default function CreateTournamentPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { isAdmin, canCreateTournament } = useAdmin()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect if user is not admin
  useEffect(() => {
    if (!authLoading && user && !canCreateTournament) {
      router.push('/tournaments')
    }
  }, [user, canCreateTournament, authLoading, router])

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Sprawdzanie uprawnień...</p>
        </div>
      </div>
    )
  }

  // Show access denied if user is not admin
  if (user && !canCreateTournament) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="bg-[#2a2a2a] border-red-500">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-red-500 mb-2">Brak uprawnień</h2>
              <p className="text-gray-400 mb-6">
                Tylko administratorzy i organizatorzy mogą tworzyć nowe turnieje.
              </p>
              <Link href="/tournaments">
                <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-700">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Powrót do turniejów
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Show login prompt if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="bg-[#2a2a2a] border-yellow-500">
            <CardContent className="p-8 text-center">
              <Shield className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-yellow-500 mb-2">Wymagane logowanie</h2>
              <p className="text-gray-400 mb-6">
                Musisz być zalogowany jako administrator lub organizator, aby tworzyć turnieje.
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/auth/login">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Zaloguj się
                  </Button>
                </Link>
                <Link href="/tournaments">
                  <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-700">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Powrót do turniejów
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }
  
  const [formData, setFormData] = useState<CreateTournamentData>({
    title: '',
    description: '',
    short_description: '',
    game_type: 'CS2',
    tournament_type: 'SINGLE_ELIMINATION',
    seeding_mode: 'AUTO',
    max_teams: 16,
    min_teams: 8,
    team_size: 5,
    entry_fee: 0,
    prize_pool: 0,
    is_public: true,
    requires_approval: false,
    // Default Single Elimination format settings
    format_settings: {
      single_elimination: {
        bronze_match: false,
        number_of_groups: 1,
      },
    },
  })

  const handleInputChange = (field: keyof CreateTournamentData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        toast.error('Tytuł turnieju jest wymagany')
        return
      }

      if ((formData.min_teams || 0) > (formData.max_teams || 0)) {
        toast.error('Minimalna liczba drużyn nie może być większa niż maksymalna')
        return
      }

      // Show loading toast
      toast.loading('Tworzenie turnieju...', { id: 'create-tournament' })

      // Create tournament via API
      const tournament = await tournamentsAPI.createTournament(formData)
      
      // If Single Elimination, trigger bracket generation
      if (tournament.tournament_type === 'SINGLE_ELIMINATION') {
        const bronze = Boolean((formData.format_settings as any)?.single_elimination?.bronze_match)
        const numberOfGroups = Number((formData.format_settings as any)?.single_elimination?.number_of_groups) || 1
        try {
          await bracketsAPI.generateSingleElimination({
            tournament_id: tournament.id,
            max_participants: tournament.max_teams || 16,
            bronze_match: bronze,
            number_of_groups: numberOfGroups,
          })
        } catch (genErr) {
          console.error('Bracket generation failed:', genErr)
          // Non-fatal: inform user but allow navigation
          toast.error('Nie udało się wygenerować drabinki. Możesz spróbować później z panelu edycji.')
        }
      }
      
      // Show success toast
      toast.success('Turniej został utworzony pomyślnie!', { id: 'create-tournament' })
      
      // Redirect to tournament page
      router.push(`/tournaments/${tournament.id}`)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Wystąpił błąd podczas tworzenia turnieju'
      toast.error(errorMessage, { id: 'create-tournament' })
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/tournaments">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Powrót do turniejów
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Utwórz nowy turniej</h1>
            <p className="text-gray-400 mt-2">Skonfiguruj swój turniej esportowy</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card className="bg-[#2a2a2a] border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Trophy className="h-5 w-5" />
                Podstawowe informacje
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-white">Tytuł turnieju *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="np. CS2 Winter Championship"
                    className="bg-[#1a1a1a] border-gray-600 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="short_description" className="text-white">Krótki opis</Label>
                  <Input
                    id="short_description"
                    value={formData.short_description}
                    onChange={(e) => handleInputChange('short_description', e.target.value)}
                    placeholder="Krótki opis turnieju"
                    className="bg-[#1a1a1a] border-gray-600 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">Szczegółowy opis</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description', e.target.value)}
                  placeholder="Szczegółowy opis turnieju, zasady, nagrody..."
                  rows={4}
                  className="bg-[#1a1a1a] border-gray-600 text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-white">Gra *</Label>
                  <Select
                    value={formData.game_type}
                    onValueChange={(value: string) => handleInputChange('game_type', value)}
                  >
                    <SelectTrigger className="bg-[#1a1a1a] border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2a2a2a] border-gray-600">
                      {gameTypes.map((game) => (
                        <SelectItem key={game.value} value={game.value}>
                          {game.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Format turnieju *</Label>
                  <Select
                    value={formData.tournament_type}
                    onValueChange={(value: string) => handleInputChange('tournament_type', value)}
                  >
                    <SelectTrigger className="bg-[#1a1a1a] border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2a2a2a] border-gray-600">
                      {tournamentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select> 
                </div>
              </div>

              {formData.tournament_type === 'SINGLE_ELIMINATION' && (
                <div className="mt-4 p-4 border border-gray-700 rounded-lg bg-[#1f1f1f]">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="se_number_of_groups" className="text-white">Liczba grup</Label>
                      <Input
                        id="se_number_of_groups"
                        type="number"
                        min={1}
                        max={8}
                        step={1}
                        value={Number((formData.format_settings as any)?.single_elimination?.number_of_groups) || 1}
                        onChange={(e) => handleSESettingChange('number_of_groups', parseInt(e.target.value) || 1)}
                        className="bg-[#1a1a1a] border-gray-600 text-white"
                      />
                      <p className="text-xs text-gray-400">Liczba grup w fazie grupowej (1 = bez grup)</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team Settings */}
          <Card className="bg-[#2a2a2a] border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Users className="h-5 w-5" />
                Ustawienia drużyn
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="team_size" className="text-white">Rozmiar drużyny *</Label>
                  <Input
                    id="team_size"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.team_size}
                    onChange={(e) => handleInputChange('team_size', parseInt(e.target.value) || 1)}
                    className="bg-[#1a1a1a] border-gray-600 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_teams" className="text-white">Minimalna liczba drużyn *</Label>
                  <Input
                    id="min_teams"
                    type="number"
                    min="2"
                    value={formData.min_teams}
                    onChange={(e) => handleInputChange('min_teams', parseInt(e.target.value) || 2)}
                    className="bg-[#1a1a1a] border-gray-600 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="max_teams" className="text-white">Maksymalna liczba drużyn *</Label>
                  <Input
                    id="max_teams"
                    type="number"
                    min="2"
                    value={formData.max_teams}
                    onChange={(e) => handleInputChange('max_teams', parseInt(e.target.value) || 2)}
                    className="bg-[#1a1a1a] border-gray-600 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Tryb seedowania</Label>
                  <Select
                    value={formData.seeding_mode}
                    onValueChange={(value: string) => handleInputChange('seeding_mode', value)}
                  >
                    <SelectTrigger className="bg-[#1a1a1a] border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2a2a2a] border-gray-600">
                      {seedingModes.map((mode) => (
                        <SelectItem key={mode.value} value={mode.value}>
                          {mode.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Settings */}
          <Card className="bg-[#2a2a2a] border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Trophy className="h-5 w-5" />
                Ustawienia finansowe
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="entry_fee" className="text-white">Opłata startowa (PLN)</Label>
                  <Input
                    id="entry_fee"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.entry_fee}
                    onChange={(e) => handleInputChange('entry_fee', parseFloat(e.target.value) || 0)}
                    className="bg-[#1a1a1a] border-gray-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prize_pool" className="text-white">Pula nagród (PLN)</Label>
                  <Input
                    id="prize_pool"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.prize_pool}
                    onChange={(e) => handleInputChange('prize_pool', parseFloat(e.target.value) || 0)}
                    className="bg-[#1a1a1a] border-gray-600 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tournament Settings */}
          <Card className="bg-[#2a2a2a] border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Settings className="h-5 w-5" />
                Ustawienia turnieju
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-white">Turniej publiczny</Label>
                  <p className="text-sm text-gray-400">Czy turniej ma być widoczny dla wszystkich</p>
                </div>
                <Switch
                  checked={formData.is_public}
                  onCheckedChange={(checked: boolean) => handleInputChange('is_public', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-white">Wymaga zatwierdzenia</Label>
                  <p className="text-sm text-gray-400">Czy rejestracje wymagają zatwierdzenia organizatora</p>
                </div>
                <Switch
                  checked={formData.requires_approval}
                  onCheckedChange={(checked: boolean) => handleInputChange('requires_approval', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-4 justify-end">
            <Link href="/tournaments">
              <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-700">
                Anuluj
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={loading}
              className="bg-cyan-400 text-black hover:bg-cyan-300 disabled:opacity-50"
            >
              {loading ? 'Tworzenie...' : 'Utwórz turniej'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}