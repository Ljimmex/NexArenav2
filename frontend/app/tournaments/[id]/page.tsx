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
import { TournamentHeader } from '@/components/tournament/tournament-header'
import { TournamentNavigation } from '@/components/tournament/tournament-navigation'
import { Tournament, tournamentsAPI } from '@/lib/api/tournaments'
import { Team, teamsAPI } from '@/lib/api/teams'
import { bracketsAPI, GroupInfo } from '@/lib/api/brackets'
import { BracketDisplay } from '@/components/tournament/bracket-display'
import { GroupSelector } from '@/components/tournament/group-selector'
import { useAuth } from '@/lib/auth/auth-context'
import { useAdmin } from '@/lib/hooks/useAdmin'
import toast from 'react-hot-toast'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { EditMatchModal, EditMatchFormState } from '@/components/tournament/edit-match-modal'
import { ScheduleTimeline } from '@/components/tournament/schedule-timeline'
import { DescriptionCard } from "@/components/cards/description-card"
import { PrizesCard } from "@/components/cards/prizes-card"
import { TeamsCard } from "@/components/cards/teams-card"
import { AdminsCard } from "@/components/cards/admins-card"
import { FormatsCard } from "@/components/cards/formats-card"
import { GameSettingsCard } from "@/components/cards/game-settings-card"
import { HostedByCard } from "@/components/cards/hosted-by-card"
import { RulesCard } from "@/components/cards/rules-card"
import { gameTypeLabels, statusLabels, statusColors, tournamentTypeLabels, formatDate, formatPrize } from "@/lib/utils/tournament"

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
    status: 'PENDING' as EditMatchFormState['status'],
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

      // Allow editing finalized and canceled/walkover/completed matches
      const finalizedStatuses = ['COMPLETED', 'WALKOVER', 'CANCELLED', 'DISQUALIFIED'] as const
      if (editingMatch?.is_finalized || finalizedStatuses.includes(editingMatch?.status) || finalizedStatuses.includes(formState.status as any)) {
        payload.force_update = true
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
                  {/* Schedule Timeline */}
                  <div className="mb-8">
                    <ScheduleTimeline
                      registrationStart={tournament.registration_start}
                      registrationEnd={tournament.registration_end}
                      tournamentStart={tournament.tournament_start}
                      tournamentEnd={tournament.tournament_end}
                      status={tournament.status}
                    />
                  </div>
                  
                  {/* Main Grid Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Description and Rules */}
                    <div className="lg:col-span-2 space-y-8">
                      <DescriptionCard>
                        <p>About the map veto/side pick process here.</p>
                      </DescriptionCard>
                      
                      <RulesCard>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                          <li>A game that has been played past the first rounds is deemed valid. If your game host starts with wrong settings you have to report it to admins before the beginning of the match.</li>
                          <li>Verify your results after the game in your lobby please, even if you lose.</li>
                          <li>You must follow the Ban/Pick Order!</li>
                          <li>Default settings are Cheats: OFF</li>
                          <li>If the server location can not be agreed upon then Frankfurt 1/2 should be played.</li>
                        </ul>
                        <p className="mt-3">You can read our Anti-Cheat and General Rules in greater detail here.</p>
                        <p className="mt-3">If you encounter any issues, please contact the Challengermode Support Chat</p>
                      </RulesCard>
                    </div>
                    
                    {/* Right Column - Side Cards */}
                    <div className="space-y-8">
                      <PrizesCard
                        prizes={[
                          { place: "1st place", amount: "$1000" },
                          { place: "2nd place", amount: "$500" },
                          { place: "3rd place", amount: "$300" },
                          { place: "4th place", amount: "$200" },
                        ]}
                      />
                      
                      <TeamsCard
                        registered={registeredTeams}
                        maxSlots={tournament.max_teams}
                      />
                      
                      <AdminsCard
                        moderatorIds={tournament.moderators || []}
                      />
                    </div>
                  </div>
                  
                  {/* Bottom Row - Wide Cards */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                    <FormatsCard tournament={tournament} />
                    
                    <GameSettingsCard
                      imageUrl="/images/demo-map.jpg"
                      settings={[
                        { label: "Selected de_mirage", value: "Rounds: Defuse" },
                        { label: "Max rounds", value: "VAC" },
                      ]}
                    />
                  </div>
                  
                  {/* Full Width Bottom Card */}
                  <div className="mt-8">
                    <HostedByCard
                      organizer={tournament.organizer}
                      description="Xtreme League je polska liga CS:GO zaprojektowana dla organizowanych turniejów esport. Narzędzie gry stworzone w celu wygodnego organizowania i rozgrywania gier grupowych pod kontrolą organizatorów oraz moderatorów pod okiem społeczności."
                      membersCount={131}
                      sinceText="over 2 years ago"
                    />
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
      <EditMatchModal
        open={editOpen}
        onOpenChange={setEditOpen}
        editingMatch={editingMatch}
        formState={formState}
        setFormState={setFormState}
        saving={saving}
        onCancel={() => setEditOpen(false)}
        onSave={handleSaveEdit}
      />
    </div>
  )
}