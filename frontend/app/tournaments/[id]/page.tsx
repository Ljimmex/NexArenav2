'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Trophy, 
  Users, 
  Calendar, 
  MapPin, 
  Star, 
  Clock, 
  Crown, 
  Globe, 
  Gamepad2, 
  Share2,
  Heart,
  MessageCircle,
  Settings,
  UserPlus,
  DollarSign,
  Award,
  Info,
  Edit,
  Trash2,
  ChevronDown
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'
import { TournamentHeader } from '@/components/tournament-header'
import { TournamentNavigation } from '@/components/tournament-navigation'
import { Tournament, tournamentsAPI } from '@/lib/api/tournaments'
import { Team, teamsAPI } from '@/lib/api/teams'
import { bracketsAPI } from '@/lib/api/brackets'
import { BracketDisplay } from '@/components/bracket-display'
import { useAuth } from '@/lib/auth/auth-context'
import { useAdmin } from '@/lib/hooks/useAdmin'
import toast from 'react-hot-toast'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
  const searchParams = useSearchParams()
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
  const [syncingBracket, setSyncingBracket] = useState(false)

  useEffect(() => {
    const fetchTournament = async () => {
      try {
        setLoading(true)
        setError(null)
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
    const fetchBracket = async () => {
      if (!tournament?.id || tournament.tournament_type !== 'SINGLE_ELIMINATION') return
      
      try {
        setLoadingBracket(true)
        const bracket = await bracketsAPI.getMatches(tournament.id)
        setBracketData(bracket)
      } catch (error) {
        console.error('Error fetching bracket:', error)
        // Don't set error state here as bracket might not exist yet
      } finally {
        setLoadingBracket(false)
      }
    }

    fetchBracket()
  }, [tournament?.id, tournament?.tournament_type])

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

  const handleSyncBracket = async () => {
    if (!tournament?.id) return
    
    try {
      setSyncingBracket(true)
      const toastId = toast.loading('Synchronizowanie bracket...')
      
      await bracketsAPI.syncBracketMatches(tournament.id)
      
      // Refresh bracket data
      const bracket = await bracketsAPI.getMatches(tournament.id)
      setBracketData(bracket)
      
      toast.success('Bracket został zsynchronizowany', { id: toastId })
    } catch (error) {
      console.error('Error syncing bracket:', error)
      toast.error('Błąd podczas synchronizacji bracket')
    } finally {
      setSyncingBracket(false)
    }
  }

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
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Check-in started</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Check-in started</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Check-in started</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Check-in started</span>
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
                  <h3 className="text-white font-semibold">Tournament Bracket</h3>
                  {canEditTournament && (
                    <Button
                      onClick={handleSyncBracket}
                      disabled={syncingBracket}
                      className="bg-cyan-400 text-black hover:bg-cyan-300"
                    >
                      {syncingBracket ? 'Synchronizowanie...' : 'Synchronizuj Bracket'}
                    </Button>
                  )}
                </div>
                <BracketDisplay 
                  bracketData={bracketData} 
                  loading={loadingBracket}
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
    </div>
  )
}