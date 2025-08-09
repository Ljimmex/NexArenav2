"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, ChevronDown, Trophy, Globe2, Users } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { useAdmin } from "@/lib/hooks/useAdmin"
import { type Tournament, tournamentsAPI, type TournamentsFilters } from "@/lib/api/tournaments"

const TEAM_SIZES = [1, 2, 3, 4, 5] as const

const GAMES = [
  { id: 'CS2', name: 'Counter-Strike 2', icon: '/icons/games/cs2.png' },
  { id: 'VALORANT', name: 'Valorant', icon: '/icons/games/valorant.png' },
  { id: 'LOL', name: 'League of Legends', icon: '/icons/games/lol.png' },
  { id: 'DOTA2', name: 'Dota 2', icon: '/icons/games/dota2.png' },
  { id: 'ROCKET_LEAGUE', name: 'Rocket League', icon: '/icons/games/rocket-league.png' },
  { id: 'OVERWATCH', name: 'Overwatch 2', icon: '/icons/games/overwatch.png' },
] as const

const TOURNAMENT_STATUSES = [
  { id: 'DRAFT', name: 'Szkic', color: 'bg-gray-500' },
  { id: 'READY', name: 'Gotowy', color: 'bg-yellow-500' },
  { id: 'RUNNING', name: 'W trakcie', color: 'bg-blue-500' },
  { id: 'COMPLETED', name: 'Zakończony', color: 'bg-purple-500' },
  { id: 'CANCELLED', name: 'Anulowany', color: 'bg-red-500' },
] as const

function formatDateTime(dateString?: string) {
  if (!dateString) return "TBD"
  const d = new Date(dateString)
  const date = d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
  })
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  // SEP 10 Starting at 12:00 AM
  return `${date} Starting at ${time}`
}

function formatPrizePLN(amount: number) {
  if (amount <= 0) return "0 zł"
  try {
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: "PLN",
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${amount.toLocaleString("pl-PL")} zł`
  }
}

// Get region icon
const getRegionIcon = (region: string) => {
  switch (region.toLowerCase()) {
    case 'europe':
      return '/icons/regions/europe.png';
    case 'north america':
      return '/icons/regions/north-america.png';
    case 'south america':
      return '/icons/regions/south-america.png';
    case 'asia':
      return '/icons/regions/asia.png';
    case 'oceania':
      return '/icons/regions/oceania.png';
    case 'africa':
      return '/icons/regions/africa.png';
    case 'global':
      return '/icons/regions/global.png';
    default:
      return '/icons/regions/global.png';
  }
};

// Get game info
const getGameInfo = (gameType: string) => {
  const game = GAMES.find(g => g.id === gameType);
  return {
    name: game?.name || 'Unknown Game',
    icon: game?.icon || '/icons/games/cs2.png'
  };
};

// Get tournament format info
const getFormatInfo = (tournamentType: string) => {
  const formatMap = {
    'SINGLE_ELIMINATION': { name: 'Single Elimination', icon: '/icons/formats/single-elimination.svg' },
    'DOUBLE_ELIMINATION': { name: 'Double Elimination', icon: '/icons/formats/double-elimination.svg' },
    'SWISS': { name: 'Swiss', icon: '/icons/formats/swiss.svg' },
    'ROUND_ROBIN': { name: 'Round Robin', icon: '/icons/formats/round-robin.svg' }
  };
  return formatMap[tournamentType as keyof typeof formatMap] || { name: 'Single Elimination', icon: '/icons/formats/single-elimination.svg' };
};

export default function TournamentsPage() {
  const { user } = useAuth()
  const { canCreateTournament } = useAdmin()

  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<TournamentsFilters>({ page: 1, limit: 12 })
  const [total, setTotal] = useState(0)

  // Local UI state that maps to API filters when changed
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [teamSize, setTeamSize] = useState<number | null>(null)
  const [region, setRegion] = useState<"Europe" | "North America" | "South America" | "Asia" | "Oceania" | "Africa" | "Global">("Global")

  useEffect(() => {
    const run = async () => {
      try {
        console.log('TournamentsPage: Starting to fetch tournaments...')
        setLoading(true)
        setError(null)
        const next: TournamentsFilters = {
          ...filters,
          page: filters.page || 1,
          limit: filters.limit || 12,
          gameType: selectedGame ?? undefined,
          status: selectedStatus ?? undefined,
          team_size: teamSize ?? undefined,
        } as any
        console.log('TournamentsPage: Filters being sent:', next)
        const res = await tournamentsAPI.getTournaments(next)
        console.log('TournamentsPage: API response:', res)
        setTournaments(res.tournaments)
        setTotal(res.total)
        console.log('TournamentsPage: Tournaments set:', res.tournaments.length, 'tournaments')
      } catch (e) {
        console.error('TournamentsPage: Error fetching tournaments:', e)
        setError(e instanceof Error ? e.message : "Błąd podczas pobierania turniejów")
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [filters, selectedGame, selectedStatus, teamSize]) // Updated to include selectedGame, selectedStatus and teamSize as dependencies

  const pages = useMemo(() => Math.max(1, Math.ceil((total || 0) / (filters.limit || 12))), [total, filters.limit])

  return (
    <div className="min-h-screen bg-[#0a0f14] text-white">
      {/* Header */}
      <Header />

      {/* Sidebar fixed under header; page content offset by its width */}
      <Sidebar />
      <main className="pl-20">
        <section className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {/* Games Section */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-3">
              {GAMES.map((game) => (
                <button
                  key={game.id}
                  onClick={() => setSelectedGame(selectedGame === game.id ? null : game.id)}
                  className={[
                    "flex items-center justify-center rounded-xl p-3 transition-all",
                    selectedGame === game.id
                      ? "bg-cyan-500/20 ring-2 ring-cyan-400/50"
                      : "bg-white/[0.06] hover:bg-white/[0.1] ring-1 ring-white/10"
                  ].join(" ")}
                >
                  <Image src={game.icon} alt={game.name} width={24} height={24} className="h-6 w-6" />
                </button>
              ))}
            </div>
          </div>

          {/* Filters Row */}
          <div className="mb-6 flex items-center justify-between">
            {/* Left: tray of chips (matches screenshot) */}
            <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-[#121821] px-2 py-2">
              {/* Status dropdown chip */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="inline-flex items-center gap-2 rounded-xl bg-white/[0.06] px-3 py-2 text-sm font-medium text-white/90 ring-1 ring-white/10 hover:bg-white/[0.1]">
                    <span className="inline-block">
                      {selectedStatus ? TOURNAMENT_STATUSES.find(s => s.id === selectedStatus)?.name : "Wszystkie statusy"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-white/80" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44 border border-white/10 bg-[#0f1317] text-white">
                  <DropdownMenuItem onClick={() => setSelectedStatus(null)} className="text-sm">
                    Wszystkie statusy
                  </DropdownMenuItem>
                  {TOURNAMENT_STATUSES.map((status) => (
                    <DropdownMenuItem key={status.id} onClick={() => setSelectedStatus(status.id)} className="text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${status.color}`} />
                        {status.name}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Segmented team size chips */}
              <div className="inline-flex items-center gap-2 rounded-xl bg-white/[0.06] p-1 ring-1 ring-white/10">
                {TEAM_SIZES.map((sz) => {
                  const active = teamSize === sz
                  return (
                    <button
                      key={sz}
                      onClick={() => setTeamSize(active ? null : sz)}
                      className={[
                        "min-w-[52px] rounded-lg px-3 py-2 text-sm font-medium transition",
                        active ? "bg-white/15 text-white ring-1 ring-cyan-400/40" : "text-white/70 hover:bg-white/10",
                      ].join(" ")}
                    >
                      {sz}v{sz}
                    </button>
                  )
                })}
              </div>

              {/* Region dropdown */}
              <Select value={region} onValueChange={(value: typeof region) => setRegion(value)}>
                <SelectTrigger className="w-[180px] rounded-xl border-white/10 bg-white/[0.06] text-white ring-1 ring-white/10 hover:bg-white/[0.1]">
                  <div className="flex items-center gap-2">
                    <Image src={getRegionIcon(region)} alt={region} width={16} height={16} className="h-4 w-4" />
                    <SelectValue placeholder="Select region" />
                  </div>
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#0f1317]">
                  <SelectGroup>
                    <SelectItem value="Global">Global</SelectItem>
                    <SelectItem value="Europe">Europe</SelectItem>
                    <SelectItem value="North America">North America</SelectItem>
                    <SelectItem value="South America">South America</SelectItem>
                    <SelectItem value="Asia">Asia</SelectItem>
                    <SelectItem value="Oceania">Oceania</SelectItem>
                    <SelectItem value="Africa">Africa</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Right: Filters button; Create on admins */}
            <div className="flex items-center gap-3">
              {canCreateTournament && (
                <Link href="/tournaments/create">
                  <Button className="h-10 rounded-xl border border-cyan-500/40 bg-transparent px-4 text-white hover:bg-cyan-500/10">
                    <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 text-[#0b1015]">
                      +
                    </span>
                    Create
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="py-20 text-center">
              <div className="mx-auto h-16 w-16 animate-spin rounded-full border-b-2 border-cyan-400" />
              <p className="mt-6 text-lg text-white/70">Ładowanie turniejów...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="py-20 text-center">
              <p className="text-lg text-red-400">{error}</p>
              <Button onClick={() => location.reload()} className="mt-6 rounded-xl bg-cyan-600 px-6 hover:bg-cyan-500">
                Spróbuj ponownie
              </Button>
            </div>
          )}

          {/* Grid */}
          {!loading && !error && (
            <>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {tournaments.map((t) => {
                  const gameInfo = getGameInfo(t.game_type)
                  const formatInfo = getFormatInfo(t.tournament_type)
                  return (
                    <article
                      key={t.id}
                      className="group overflow-hidden rounded-2xl border border-white/10 bg-[#0f1317] shadow-sm transition hover:border-cyan-400/30 hover:shadow-[0_10px_40px_-10px_rgba(0,255,255,0.15)]"
                    >
                      {/* Banner */}
                      <div className="relative h-40 w-full overflow-hidden">
                        {t.banner_url ? (
                          <Image
                            src={"/banners/Tournament-card.png"}
                            alt={t.title}
                            fill
                            className="object-cover transition duration-300 group-hover:scale-[1.02]"
                          />
                        ) : (
                          <Image
                            src="/banners/Tournament-card.png"
                            alt="banner"
                            fill
                            className="object-cover opacity-80"
                          />
                        )}

                        {/* Date chip - left */}
                        <div className="absolute left-3 top-3">
                          <div className="rounded-lg bg-black/60 px-3 py-1 text-xs text-white backdrop-blur">
                            {formatDateTime(t.tournament_start)}
                          </div>
                        </div>

                        {/* Format chip - right */}
                        <div className="absolute right-3 top-3">
                          <div className="flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-xs text-white backdrop-blur">
                            <Image
                              src={formatInfo.icon}
                              alt={formatInfo.name}
                              width={12}
                              height={12}
                              className="h-3 w-3"
                            />
                            <span>{formatInfo.name}</span>
                          </div>
                        </div>
                      </div>

                      {/* Body */}
                      <div className="space-y-4 p-4">
                        {/* Title */}
                        <h3 className="line-clamp-2 text-lg font-extrabold text-white">{t.title}</h3>

                        {/* Stats row */}
                        <div className="grid grid-cols-3 items-center gap-3">
                          <div>
                            <div className="text-[11px] uppercase tracking-wide text-white/50">Prize pool</div>
                            <div className="text-sm font-semibold text-white/90">
                              {formatPrizePLN(t.prize_pool || 0)}
                            </div>
                          </div>
                          <div className="overflow-hidden">
                            <div className="text-[11px] uppercase tracking-wide text-white/50">Game</div>
                            <div className="flex items-center gap-1">
                              <Image src={gameInfo.icon} alt={gameInfo.name} width={16} height={16} className="h-4 w-4 flex-shrink-0" />
                              <span className="text-sm font-semibold text-white/90 truncate">{gameInfo.name}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[11px] uppercase tracking-wide text-white/50">Team Size</div>
                            <div className="text-sm font-semibold text-white/90">{t.team_size || 5} vs {t.team_size || 5}</div>
                          </div>
                        </div>

                        {/* Footer row: Host + Signed */}
                        <div className="flex items-center justify-between gap-3">
                          {/* Host */}
                          <div className="inline-flex items-center gap-2 rounded-xl bg-white/[0.06] px-2 py-1 ring-1 ring-white/10">
                            <div className="h-6 w-6 overflow-hidden rounded-full ring-2 ring-[#0f1317]">
                              <Image
                                src="/images/organizer-avatar.png"
                                alt={t.organizer?.name || "Organizer"}
                                width={24}
                                height={24}
                                className="h-6 w-6 object-cover"
                              />
                            </div>
                            <span className="text-xs text-white/70">Host by</span>
                            <span className="text-xs font-medium text-white">{t.organizer?.name || "Unknown"}</span>
                          </div>

                          {/* Signed */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-white/70">
                              Signed{" "}
                              <span className="font-semibold text-white">
                                {t.registered_teams_count || 0}/{t.max_teams || 0}
                              </span>
                            </span>
                            <div className="flex -space-x-2">
                              {[0, 1, 2, 3].map((i) => (
                                <div key={i} className="h-6 w-6 rounded-full border-2 border-[#0f1317] bg-white/10">
                                  <Image
                                    src="/images/team-avatar.png"
                                    alt=""
                                    width={24}
                                    height={24}
                                    className="h-full w-full rounded-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>

              {/* Empty state */}
              {tournaments.length === 0 && (
                <div className="py-20 text-center">
                  <Trophy className="mx-auto h-20 w-20 text-cyan-400" />
                  <h3 className="mt-6 text-2xl font-bold">Brak turniejów</h3>
                  <p className="mx-auto mt-2 max-w-md text-white/70">
                    {selectedGame || selectedStatus || teamSize
                      ? "Nie znaleziono turniejów spełniających kryteria."
                      : "Nie ma jeszcze żadnych turniejów. Bądź pierwszy i utwórz turniej!"}
                  </p>
                  {canCreateTournament && (
                    <Link href="/tournaments/create">
                      <Button className="mt-6 rounded-xl bg-cyan-600 px-6 hover:bg-cyan-500">
                        Utwórz pierwszy turniej
                      </Button>
                    </Link>
                  )}
                </div>
              )}

              {/* Pagination */}
              {pages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    disabled={(filters.page || 1) <= 1}
                    onClick={() => setFilters((f) => ({ ...f, page: (f.page || 1) - 1 }))}
                    className="rounded-xl border-white/10 text-white hover:bg-white/[0.06]"
                  >
                    Poprzednia
                  </Button>
                  <div className="rounded-xl border border-white/10 bg-[#121821] px-5 py-2.5 text-white/80">
                    Strona {filters.page || 1} z {pages}
                  </div>
                  <Button
                    variant="outline"
                    disabled={(filters.page || 1) >= pages}
                    onClick={() => setFilters((f) => ({ ...f, page: (f.page || 1) + 1 }))}
                    className="rounded-xl border-white/10 text-white hover:bg-white/[0.06]"
                  >
                    Następna
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  )
}
