'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { 
  Trophy, 
  Users, 
  Settings,
  Info,
  RefreshCw,
  Maximize,
  Minimize
} from 'lucide-react'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'
import { TournamentHeader } from '@/components/tournament-header'
import { TournamentNavigation } from '@/components/tournament-navigation'
import { Tournament, tournamentsAPI } from '@/lib/api/tournaments'
import { Team, teamsAPI } from '@/lib/api/teams'
import { bracketsAPI, GroupInfo } from '@/lib/api/brackets'
import { BracketDisplay } from '@/components/bracket-display'
import { GroupSelector } from '@/components/group-selector'
import { useAuth } from '@/lib/auth/auth-context'
import { useAdmin } from '@/lib/hooks/useAdmin'
import toast from 'react-hot-toast'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button as UIButton } from '@/components/ui/button'

const gameTypeLabels = {
  CS2: 'Counter-Strike 2',
  VALORANT: 'Valorant',
  LOL: 'League of Legends',
  DOTA2: 'Dota 2',
  ROCKET_LEAGUE: 'Rocket League',
  OVERWATCH: 'Overwatch 2',
}

const tournamentTypeLabels = {
  SINGLE_ELIMINATION: 'Single Elimination',
  DOUBLE_ELIMINATION: 'Double Elimination',
  ROUND_ROBIN: 'Round Robin',
  SWISS: 'Swiss System',
}

const statusLabels = {
  DRAFT: 'Szkic',
  REGISTRATION: 'Rejestracja',
  READY: 'Gotowy',
  RUNNING: 'W trakcie',
  COMPLETED: 'Zakończony',
  CANCELLED: 'Anulowany',
  POSTPONED: 'Przełożony',
}

const statusColors = {
  DRAFT: 'bg-gray-500',
  REGISTRATION: 'bg-green-500',
  READY: 'bg-yellow-500',
  RUNNING: 'bg-blue-500',
  COMPLETED: 'bg-purple-500',
  CANCELLED: 'bg-red-500',
  POSTPONED: 'bg-orange-500',
}

export default function TournamentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { canEditTournament, canDeleteTournament } = useAdmin()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [userTeams, setUserTeams] = useState<Team[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')
  const [registeredTeams, setRegisteredTeams] = useState<any[]>([])
  const [isRegistering, setIsRegistering] = useState(false)
  const [loadingTeams, setLoadingTeams] = useState(false)
  const [bracketData, setBracketData] = useState<any>(null)
  const [loadingBracket, setLoadingBracket] = useState(false)

  const [groups, setGroups] = useState<GroupInfo[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [loadingGroups, setLoadingGroups] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Edit Match Modal State
  const [editOpen, setEditOpen] = useState(false)
  const [editingMatch, setEditingMatch] = useState<any | null>(null)
  const [formState, setFormState] = useState({
    score1: '' as string,
    score2: '' as string,
    best_of: '' as string,
    status: 'PENDING' as 'PENDING' | 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED' | 'WALKOVER' | 'DISQUALIFIED',
    scheduled_at: '' as string,
    walkoverFor: '' as string,
    dqFor: '' as string,
  })
  const [saving, setSaving] = useState(false)

  const openEditModal = (match: any) => {
    setEditingMatch(match)
    setFormState({
      score1: match.score1 !== undefined ? String(match.score1) : '',
      score2: match.score2 !== undefined ? String(match.score2) : '',
      best_of: match.best_of !== undefined ? String(match.best_of) : '',
      status: match.status,
      scheduled_at: match.scheduled_at ? new Date(match.scheduled_at).toISOString().slice(0,16) : '',
      walkoverFor: '',
      dqFor: '',
    })
    setEditOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingMatch || !tournament) return
    try {
      setSaving(true)

      // Build payload for bracket update
      const payload: any = {
        tournament_id: tournament.id,
        match_id: editingMatch.id,
        status: formState.status,
      }

      if (formState.score1 !== '') payload.score1 = Number(formState.score1)
      if (formState.score2 !== '') payload.score2 = Number(formState.score2)
      if (formState.best_of !== '') payload.best_of = Number(formState.best_of)
      if (formState.scheduled_at !== '') payload.scheduled_at = new Date(formState.scheduled_at).toISOString()
      
      // Walkover shortcut: if walkoverFor selected, set status to WALKOVER and winner
      if (formState.walkoverFor) {
        payload.status = 'WALKOVER'
        const winnerId = formState.walkoverFor === 'p1' ? editingMatch.participant1?.id : editingMatch.participant2?.id
        payload.winner_id = winnerId
      }

      // Disqualification: set status and mark disqualified participant
      if (formState.dqFor) {
        payload.status = 'DISQUALIFIED'
        payload.disqualified_participant_id = formState.dqFor === 'p1' ? editingMatch.participant1?.id : editingMatch.participant2?.id
      }

      await bracketsAPI.updateMatch(payload)

      // Refresh data
      await handleRefreshBracket()
      setEditOpen(false)
      toast.success('Mecz został zaktualizowany')
    } catch (e: any) {
      console.error(e)
      toast.error(e?.message || 'Błąd zapisu meczu')
    } finally {
      setSaving(false)
    }
  }

  const handleRefreshBracket = async () => {
    if (!tournament?.id) return
    
    try {
      setLoadingBracket(true)
      const toastId = toast.loading('Odświeżanie danych...')
      
      // Refresh bracket data and groups
      const [bracket, groupsData] = await Promise.all([
        bracketsAPI.getMatches(tournament.id, selectedGroup || undefined),
        bracketsAPI.getGroups(tournament.id)
      ])
      setBracketData(bracket)
      setGroups(groupsData)
      
      toast.success('Dane zostały odświeżone', { id: toastId })
    } catch (error) {
      console.error('Error refreshing bracket:', error)
      toast.error('Błąd podczas odświeżania danych')
    } finally {
      setLoadingBracket(false)
    }
  }

  useEffect(() => {
    const fetchTournament = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Debug: Sprawdź wartość params.id
        console.log('Tournament ID from params:', params.id)
        console.log('Tournament ID type:', typeof params.id)
        
        // Sprawdź czy params.id jest poprawnym UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(params.id as string)) {
          console.error('Invalid UUID format:', params.id)
          setError('Nieprawidłowy format ID turnieju')
          return
        }
        
        const tournamentData = await tournamentsAPI.getTournament(params.id as string)
        setTournament(tournamentData)
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

  useEffect(() => {
    const fetchUserTeams = async () => {
      if (!user?.id) return
      
      try {
        setLoadingTeams(true)
        const teams = await teamsAPI.getUserTeams(user.id)
        setUserTeams(teams)
      } catch (error) {
        console.error('Error fetching user teams:', error)
      } finally {
        setLoadingTeams(false)
      }
    }

    fetchUserTeams()
  }, [user?.id])

  useEffect(() => {
    const fetchRegisteredTeams = async () => {
      if (!tournament?.id) return
      
      try {
        const teams = await tournamentsAPI.getRegisteredTeams(tournament.id)
        setRegisteredTeams(teams)
      } catch (error) {
        console.error('Error fetching registered teams:', error)
      }
    }

    fetchRegisteredTeams()
  }, [tournament?.id])

  useEffect(() => {
    const fetchGroups = async () => {
      if (!tournament?.id || tournament.tournament_type !== 'SINGLE_ELIMINATION') return
      
      try {
        setLoadingGroups(true)
        const groupsData = await bracketsAPI.getGroups(tournament.id)
        setGroups(groupsData)
        
        // Set the first group as default if no group is selected and groups exist
        if (groupsData.length > 0 && !selectedGroup) {
          setSelectedGroup(groupsData[0].group_id)
        }
      } catch (error) {
        console.error('Error fetching groups:', error)
        setGroups([])
      } finally {
        setLoadingGroups(false)
      }
    }

    fetchGroups()
  }, [tournament?.id, tournament?.tournament_type, selectedGroup])

  useEffect(() => {
    const fetchBracket = async () => {
      if (!tournament?.id || tournament.tournament_type !== 'SINGLE_ELIMINATION') return
      
      try {
        setLoadingBracket(true)
        const bracket = await bracketsAPI.getMatches(tournament.id, selectedGroup || undefined)
        setBracketData(bracket)
      } catch (error) {
        console.error('Error fetching bracket:', error)
        // Don't set error state here as bracket might not exist yet
      } finally {
        setLoadingBracket(false)
      }
    }

    fetchBracket()
  }, [tournament?.id, tournament?.tournament_type, selectedGroup])

  // Auto-refresh data when user returns to the tab
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden && tournament?.id && tournament.tournament_type === 'SINGLE_ELIMINATION') {
        // Refresh bracket data silently when user returns to the tab
        try {
          const [bracket, groupsData] = await Promise.all([
            bracketsAPI.getMatches(tournament.id, selectedGroup || undefined),
            bracketsAPI.getGroups(tournament.id)
          ])
          setBracketData(bracket)
          setGroups(groupsData)
        } catch (error) {
          console.error('Error auto-refreshing bracket:', error)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [tournament?.id, tournament?.tournament_type, selectedGroup])

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'TBD'
    return new Date(dateString).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatPrize = (amount: number) => {
    if (amount === 0) return 'Darmowy'
    return `${amount.toLocaleString('pl-PL')} PLN`
  }

  const handleDeleteTournament = async () => {
    if (!tournament || !canDeleteTournament) return
    
    setShowDeleteDialog(true)
  }

  const confirmDeleteTournament = async () => {
    if (!tournament) return
    
    setIsDeleting(true)
    const toastId = toast.loading('Usuwanie turnieju...')
    
    try {
      await tournamentsAPI.deleteTournament(tournament.id)
      toast.success('Turniej został pomyślnie usunięty', { id: toastId })
      router.push('/tournaments')
    } catch (error) {
      console.error('Error deleting tournament:', error)
      toast.error('Błąd podczas usuwania turnieju', { id: toastId })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleRegisterTeam = async () => {
    if (!tournament || !selectedTeamId || !user?.id) return

    try {
      setIsRegistering(true)
      await tournamentsAPI.registerTeam(tournament.id, selectedTeamId)
      
      // Refresh registered teams
      const teams = await tournamentsAPI.getRegisteredTeams(tournament.id)
      setRegisteredTeams(teams)
      setSelectedTeamId('')
    } catch (error) {
      console.error('Error registering team:', error)
      setError(error instanceof Error ? error.message : 'Błąd podczas rejestracji drużyny')
    } finally {
      setIsRegistering(false)
    }
  }

  const handleUnregisterTeam = async (teamId: string) => {
    if (!tournament) return

    try {
      await tournamentsAPI.unregisterTeam(tournament.id, teamId)
      
      // Refresh registered teams
      const teams = await tournamentsAPI.getRegisteredTeams(tournament.id)
      setRegisteredTeams(teams)
    } catch (error) {
      console.error('Error unregistering team:', error)
      setError(error instanceof Error ? error.message : 'Błąd podczas wyrejestrowania drużyny')
    }
  }

  const handleEditTournament = () => {
    router.push(`/tournaments/${tournament?.id}/edit`)
  }

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        // Enter fullscreen
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
      } else {
        // Exit fullscreen
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error)
    }
  }

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const isUserRegistered = registeredTeams.some(team => 
    userTeams.some(userTeam => userTeam.id === team.id)
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1317] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="text-gray-400 mt-6 text-lg">Ładowanie turnieju...</p>
        </div>
      </div>
    )
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-[#0f1317] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg">{error || 'Turniej nie został znaleziony'}</p>
          <Link href="/tournaments">
            <Button className="mt-6 bg-cyan-400 text-black hover:bg-cyan-300">
              Powrót do turniejów
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (isFullscreen) {
    return (
      <div className="min-h-screen bg-[#0f1317] text-white p-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <GroupSelector
              groups={groups}
              selectedGroup={selectedGroup}
              onGroupChange={setSelectedGroup}
              loading={loadingGroups}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleToggleFullscreen}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <Minimize className="h-4 w-4 mr-2" />
              Wyjdź z pełnego ekranu
            </Button>
            <Button
              onClick={handleRefreshBracket}
              disabled={loadingBracket}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loadingBracket ? 'animate-spin' : ''}`} />
              {loadingBracket ? 'Odświeżanie...' : 'Odśwież'}
            </Button>
          </div>
        </div>
        <BracketDisplay 
          bracketData={bracketData} 
          loading={loadingBracket}
          selectedGroup={selectedGroup}
          groups={groups}
          onMatchClick={(match) => {
            const participant1Name = match.participant1?.name || 'TBD';
            const participant2Name = match.participant2?.name || 'TBD';
            const statusText = match.status === 'PENDING' ? 'Oczekuje' : 
                             match.status === 'LIVE' ? 'Na żywo' :
                             match.status === 'COMPLETED' ? 'Zakończony' :
                             match.status === 'SCHEDULED' ? 'Zaplanowany' : match.status;
            const details = [
              `Mecz: ${participant1Name} vs ${participant2Name}`,
              `Status: ${statusText}`,
              `Runda: ${match.round}`,
              `ID meczu: ${match.id}`,
            ];
            if (match.score1 !== undefined && match.score2 !== undefined) {
              details.push(`Wynik: ${match.score1} - ${match.score2}`);
            }
            if (match.scheduled_at) {
              const scheduledDate = new Date(match.scheduled_at).toLocaleString('pl-PL');
              details.push(`Zaplanowany na: ${scheduledDate}`);
            }
            alert(details.join('\n'));
          }}
          onEditClick={(m) => openEditModal(m)}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f1317] text-white">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 pl-20">
          <div className="mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8">
            {/* Tournament Header */}
            <div className="mt-6">
              <TournamentHeader
                tournament={{
                  id: tournament.id,
                  title: tournament.title,
                  game: gameTypeLabels[tournament.game_type as keyof typeof gameTypeLabels] || tournament.game_type,
                  maxPlayers: tournament.max_teams * tournament.team_size,
                  prizePool: tournament.prize_pool,
                  startDate: tournament.tournament_start || new Date().toISOString(),
                  bannerUrl: tournament.banner_url,
                  logoUrl: tournament.logo_url
                }}
                isRegistered={isUserRegistered}
                onRegister={handleRegisterTeam}
                onUnregister={() => {
                  const userTeam = registeredTeams.find(team => 
                    userTeams.some(userTeam => userTeam.id === team.id)
                  )
                  if (userTeam) {
                    handleUnregisterTeam(userTeam.id)
                  }
                }}
                onEdit={canEditTournament ? handleEditTournament : undefined}
                onDelete={canDeleteTournament ? handleDeleteTournament : undefined}
              />
            </div>

            {/* Tournament Navigation */}
            <div className="mt-4">
              <TournamentNavigation
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            </div>

            {/* Content Section */}
            <div className="pb-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  
                <TabsContent value="overview" className="mt-8">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Registration Status */}
                    <div className="lg:col-span-1">
                      <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-white font-semibold">Registration</h3>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-green-400">Check-in started</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="lg:col-span-2">
                      <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Info className="h-5 w-5 text-white" />
                          <h3 className="text-white font-semibold">Description</h3>
                        </div>
                        <div className="text-gray-300 space-y-4">
                          <p>About the map veto/side pick process here.</p>
                          <p><strong>Rules:</strong></p>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>A game that has been played past the first rounds is deemed valid. If your game host starts with wrong settings you have to report it to admins before the game starts.</li>
                            <li>Verify your results after the game in your lobby please, even if you lose.</li>
                            <li>You must follow the Ban Pick Order!</li>
                            <li>Default settings are Chinks OFF</li>
                            <li>If the server location can not be agreed upon then Frankfurt T2 should be used.</li>
                          </ul>
                          <p>You can read our Anti-Cheat and General Rules in greater detail here.</p>
                          <p><strong>Rules:</strong></p>
                          <p>If you encounter any issues please contact the Challengemode Support Chat</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Prizes Section */}
                  <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Trophy className="h-5 w-5 text-white" />
                      <h3 className="text-white font-semibold">Prizes</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white mb-1">$1000</div>
                        <div className="text-sm text-gray-400">1st place</div>
                        <div className="text-xs text-gray-500">AMOUNT</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white mb-1">$500</div>
                        <div className="text-sm text-gray-400">2nd place</div>
                        <div className="text-xs text-gray-500">AMOUNT</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white mb-1">$300</div>
                        <div className="text-sm text-gray-400">3rd place</div>
                        <div className="text-xs text-gray-500">AMOUNT</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white mb-1">$200</div>
                        <div className="text-sm text-gray-400">4th place</div>
                        <div className="text-xs text-gray-500">AMOUNT</div>
                      </div>
                    </div>
                  </div>

                  {/* Rules Section */}
                  <div className="bg-gray-800/50 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Settings className="h-5 w-5 text-white" />
                      <h3 className="text-white font-semibold">Rules</h3>
                    </div>
                    <div className="text-gray-300">
                      {tournament.rules || 'Tournament rules will be posted here.'}
                    </div>
                  </div>
                </TabsContent>
                    
                <TabsContent value="brackets" className="mt-8">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                      <GroupSelector
                        groups={groups}
                        selectedGroup={selectedGroup}
                        onGroupChange={setSelectedGroup}
                        loading={loadingGroups}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleToggleFullscreen}
                        variant="outline"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                      >
                        {isFullscreen ? (
                          <Minimize className="h-4 w-4 mr-2" />
                        ) : (
                          <Maximize className="h-4 w-4 mr-2" />
                        )}
                        {isFullscreen ? 'Wyjdź z pełnego ekranu' : 'Pełny ekran'}
                      </Button>
                      <Button
                        onClick={handleRefreshBracket}
                        disabled={loadingBracket}
                        variant="outline"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loadingBracket ? 'animate-spin' : ''}`} />
                        {loadingBracket ? 'Odświeżanie...' : 'Odśwież'}
                      </Button>
                    </div>
                  </div>
                  <BracketDisplay 
                    bracketData={bracketData} 
                    loading={loadingBracket}
                    selectedGroup={selectedGroup}
                    groups={groups}
                    onMatchClick={(match) => {
                      const participant1Name = match.participant1?.name || 'TBD';
                      const participant2Name = match.participant2?.name || 'TBD';
                      const statusText = match.status === 'PENDING' ? 'Oczekuje' : 
                                       match.status === 'LIVE' ? 'Na żywo' :
                                       match.status === 'COMPLETED' ? 'Zakończony' :
                                       match.status === 'SCHEDULED' ? 'Zaplanowany' : match.status;
                      const details = [
                        `Mecz: ${participant1Name} vs ${participant2Name}`,
                        `Status: ${statusText}`,
                        `Runda: ${match.round}`,
                        `ID meczu: ${match.id}`,
                      ];
                      if (match.score1 !== undefined && match.score2 !== undefined) {
                        details.push(`Wynik: ${match.score1} - ${match.score2}`);
                      }
                      if (match.scheduled_at) {
                        const scheduledDate = new Date(match.scheduled_at).toLocaleString('pl-PL');
                        details.push(`Zaplanowany na: ${scheduledDate}`);
                      }
                      alert(details.join('\n'));
                    }}
                    onEditClick={(m) => openEditModal(m)}
                  />
                </TabsContent>

                <TabsContent value="matches" className="mt-8">
                  <div className="bg-gray-800/50 rounded-lg p-6">
                    <p className="text-gray-400">Match schedule will be available once the tournament starts.</p>
                  </div>
                </TabsContent>

                <TabsContent value="teams" className="mt-8">
                  <div className="bg-gray-800/50 rounded-lg p-6">
                    <h3 className="text-white font-semibold mb-4">Registered Teams ({registeredTeams.length})</h3>
                    {registeredTeams.length > 0 ? (
                      <div className="space-y-4">
                        {registeredTeams.map((team) => (
                          <div key={team.team_id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                                <Users className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <h4 className="text-white font-semibold">{team.team?.name || 'Unknown Team'}</h4>
                                <p className="text-gray-400 text-sm">Status: {team.status}</p>
                              </div>
                            </div>
                            {user && team.team?.creator_id === user.id && (
                              <Button
                                onClick={() => handleUnregisterTeam(team.team_id)}
                                variant="outline"
                                size="sm"
                                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                              >
                                Unregister
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-400">No teams registered yet.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="prizes" className="mt-8">
                  <div className="bg-gray-800/50 rounded-lg p-6">
                    <h3 className="text-white font-semibold mb-4">Prize Distribution</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white mb-1">$1000</div>
                        <div className="text-sm text-gray-400">1st place</div>
                        <div className="text-xs text-gray-500">AMOUNT</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white mb-1">$500</div>
                        <div className="text-sm text-gray-400">2nd place</div>
                        <div className="text-xs text-gray-500">AMOUNT</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white mb-1">$300</div>
                        <div className="text-sm text-gray-400">3rd place</div>
                        <div className="text-xs text-gray-500">AMOUNT</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white mb-1">$200</div>
                        <div className="text-sm text-gray-400">4th place</div>
                        <div className="text-xs text-gray-500">AMOUNT</div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDeleteTournament}
        title="Delete Tournament"
        description="Are you sure you want to delete this tournament? This action cannot be undone."
        confirmText="Delete Tournament"
        cancelText="Cancel"
        variant="destructive"
        loading={isDeleting}
      />

      {/* Edit Match Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edytuj mecz</DialogTitle>
          </DialogHeader>

          {editingMatch && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-gray-300">Wynik - {editingMatch.participant1?.name || 'TBD'}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formState.score1}
                    onChange={(e) => setFormState(s => ({ ...s, score1: e.target.value }))}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Wynik - {editingMatch.participant2?.name || 'TBD'}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formState.score2}
                    onChange={(e) => setFormState(s => ({ ...s, score2: e.target.value }))}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-gray-300">BOx (best of)</Label>
                  <Input
                    type="number"
                    min={1}
                    step={2}
                    placeholder="1,3,5..."
                    value={formState.best_of}
                    onChange={(e) => setFormState(s => ({ ...s, best_of: e.target.value }))}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                  <p className="text-xs text-gray-400 mt-1">Uwaga: zmiana BOx może wymagać aktualizacji w harmonogramie meczów.</p>
                </div>
                <div>
                  <Label className="text-gray-300">Status</Label>
                  <select
                    value={formState.status}
                    onChange={(e) => setFormState(s => ({ ...s, status: e.target.value as any }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white"
                  >
                    <option value="PENDING">Oczekuje</option>
                    <option value="SCHEDULED">Zaplanowany</option>
                    <option value="LIVE">W trakcie</option>
                    <option value="COMPLETED">Zakończony</option>
                    <option value="CANCELLED">Anulowany</option>
                    <option value="WALKOVER">Walkover</option>
                    <option value="DISQUALIFIED">Dyskwalifikacja</option>
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-gray-300">Czas (zaplanowany)</Label>
                <input
                  type="datetime-local"
                  value={formState.scheduled_at}
                  onChange={(e) => setFormState(s => ({ ...s, scheduled_at: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white"
                />
                <p className="text-xs text-gray-400 mt-1">Format: lokalny czas przeglądarki.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-gray-300">Walkover dla</Label>
                  <select
                    value={formState.walkoverFor}
                    onChange={(e) => setFormState(s => ({ ...s, walkoverFor: e.target.value, dqFor: '' }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white"
                  >
                    <option value="">— brak —</option>
                    <option value="p1">{editingMatch.participant1?.name || 'TBD'}</option>
                    <option value="p2">{editingMatch.participant2?.name || 'TBD'}</option>
                  </select>
                </div>
                <div>
                  <Label className="text-gray-300">Dyskwalifikacja</Label>
                  <select
                    value={formState.dqFor}
                    onChange={(e) => setFormState(s => ({ ...s, dqFor: e.target.value, walkoverFor: '' }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white"
                  >
                    <option value="">— brak —</option>
                    <option value="p1">{editingMatch.participant1?.name || 'TBD'}</option>
                    <option value="p2">{editingMatch.participant2?.name || 'TBD'}</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-6">
            <UIButton variant="outline" onClick={() => setEditOpen(false)} className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white">
              Anuluj
            </UIButton>
            <UIButton onClick={handleSaveEdit} disabled={saving} className="bg-cyan-600 hover:bg-cyan-700">
              {saving ? 'Zapisywanie...' : 'Zapisz'}
            </UIButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}