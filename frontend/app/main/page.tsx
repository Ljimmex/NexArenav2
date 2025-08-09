"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { ChevronRight, CalendarDays } from "lucide-react"
import { type Tournament, tournamentsAPI } from "@/lib/api/tournaments"

const GAMES = [
  { id: 'CS2', name: 'Counter-Strike 2', icon: '/icons/games/cs2.png' },
  { id: 'VALORANT', name: 'Valorant', icon: '/icons/games/valorant.png' },
  { id: 'LOL', name: 'League of Legends', icon: '/icons/games/lol.png' },
  { id: 'DOTA2', name: 'Dota 2', icon: '/icons/games/dota2.png' },
  { id: 'ROCKET_LEAGUE', name: 'Rocket League', icon: '/icons/games/rocket-league.png' },
  { id: 'OVERWATCH', name: 'Overwatch 2', icon: '/icons/games/overwatch.png' },
] as const

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

type PopularTournament = Tournament & {
  hostName?: string
  players?: number
  signed?: { current: number; max: number }
}



const exploreGames = [
  { id: "g1", name: "Warzone", cover: "/warzone-poster.png" },
  { id: "g2", name: "Teamfight Tactics", cover: "/tft-poster.png" },
  { id: "g3", name: "Genshin Impact", cover: "/fantasy-adventure-poster.png" },
  { id: "g4", name: "Overwatch 2", cover: "/placeholder.svg?height=220&width=160" },
  { id: "g5", name: "Lineage", cover: "/placeholder.svg?height=220&width=160" },
  { id: "g6", name: "NBA 2K", cover: "/placeholder.svg?height=220&width=160" },
]

const upcomingMatches = [
  {
    id: "m1",
    game: "VALORANT",
    teams: { 
      a: { name: "FaZe Clan", logo: "/images/team-avatar.png", players: ["Player1", "Player2", "Player3", "Player4", "Player5"] },
      b: { name: "Fnatic", logo: "/images/team-avatar.png", players: ["PlayerA", "PlayerB", "PlayerC", "PlayerD", "PlayerE"] }
    },
    dateLabel: "THURSDAY • 13 JULY",
  },
  {
    id: "m2",
    game: "LOL",
    teams: { 
      a: { name: "T1", logo: "/images/team-avatar.png", players: ["Faker", "Gumayusi", "Keria", "Zeus", "Oner"] },
      b: { name: "Fnatic", logo: "/images/team-avatar.png", players: ["Humanoid", "Razork", "Jun", "Noah", "Mikyx"] }
    },
    dateLabel: "THURSDAY • 13 JULY",
  },
  {
    id: "m3",
    game: "OVERWATCH",
    teams: { 
      a: { name: "Dallas Fuel", logo: "/images/team-avatar.png", players: ["Edison", "Fearless", "Hanbin", "Sp9rk1e", "ChiYo"] },
      b: { name: "San Francisco Shock", logo: "/images/team-avatar.png", players: ["Proper", "Coluge", "Violet", "Kilo", "s9mm"] }
    },
    dateLabel: "THURSDAY • 13 JULY",
  },
  {
    id: "m4",
    game: "CS2",
    teams: { 
      a: { name: "FaZe Clan", logo: "/images/team-avatar.png", players: ["karrigan", "rain", "Twistzz", "ropz", "broky"] },
      b: { name: "Virtus.pro", logo: "/images/team-avatar.png", players: ["Jame", "sh1ro", "n0rb3r7", "magixx", "donk"] }
    },
    dateLabel: "THURSDAY • 13 JULY",
  },
]

function formatDateTime(d?: string) {
  if (!d) return "TBD"
  const date = new Date(d)
  const ds = date.toLocaleDateString("en-US", { month: "short", day: "2-digit" }).toUpperCase()
  const ts = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  return `${ds} Starting at ${ts}`
}

function formatMoneyUSD(n = 0) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)
  } catch {
    return `$${(n ?? 0).toLocaleString("en-US")}`
  }
}

export default function MainPage() {
  const [popular, setPopular] = useState<PopularTournament[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        const res = await tournamentsAPI.getTournaments({ page: 1, limit: 6 })
        if (res.tournaments?.length) {
          setPopular((prev) => {
            // Merge on id; keep our first one as mock-1 if present
            const merged = res.tournaments.slice(0, 6) as PopularTournament[]
            if (!merged.find((t) => t.id === "mock-1")) {
              merged[0] = { ...merged[0], id: "mock-1" }
            }
            return merged
          })
        }
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0f14] text-white">
      <Header />
      <Sidebar />
      <main className="pl-20">
        <section className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {/* Hero */}
          <div className="relative mb-8 overflow-hidden rounded-3xl border border-white/10 bg-[#0f1317]">
            <div className="grid gap-4 p-6 sm:p-8 md:grid-cols-2 md:items-center">
              <div className="space-y-3">
                <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Join a tournament</h1>
                <p className="text-white/70">
                  Compete in high quality tournaments from the best organizers and track your progress.
                </p>
                <div className="pt-2">
                  <Link href="/tournaments">
                    <Button className="rounded-xl bg-cyan-600 px-5 hover:bg-cyan-500">Join Tournament</Button>
                  </Link>
                </div>
              </div>
              <div className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl border border-white/10">
                <Image
                  src="/placeholder.svg?height=480&width=720"
                  alt="Esports character"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          {/* Popular tournaments */}
          <SectionHeader title="Popular tournaments" href="/tournaments" />
          <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {popular.map((t) => {
              const gameInfo = getGameInfo(t.game_type || 'CS2')
              const formatInfo = getFormatInfo(t.tournament_type || 'SINGLE_ELIMINATION')
              return (
                <Link key={t.id} href={`/tournaments/${t.id}`} className="block">
                  <article className="group overflow-hidden rounded-2xl border border-white/10 bg-[#0f1317] shadow-sm transition hover:border-cyan-400/30 hover:shadow-[0_10px_40px_-10px_rgba(0,255,255,0.15)]">
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
                </Link>
              )
            })}
          </div>

          {/* Explore games */}
          <SectionHeader title="Explore games" href="/games" />
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {exploreGames.map((g) => (
              <Link key={g.id} href={`/games/${g.id}`}>
                <div className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] ring-1 ring-white/5 transition hover:border-cyan-400/30">
                  <div className="relative aspect-[4/5] w-full">
                    <Image
                      src={g.cover || "/placeholder.svg"}
                      alt={g.name}
                      fill
                      className="object-cover transition group-hover:scale-[1.02]"
                    />
                  </div>
                  <div className="flex items-center justify-between px-3 py-2">
                    <p className="truncate text-sm font-medium">{g.name}</p>
                    <ChevronRight className="h-4 w-4 text-white/60" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Tournaments by your games */}
          <SectionHeader title="Tournaments by your games" href="/tournaments" />
          <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {popular.slice(0, 3).map((t) => {
              const gameInfo = getGameInfo(t.game_type || 'CS2')
              const formatInfo = getFormatInfo(t.tournament_type || 'SINGLE_ELIMINATION')
              return (
                <Link key={`yg-${t.id}`} href={`/tournaments/${t.id}`} className="block">
                  <article className="group overflow-hidden rounded-2xl border border-white/10 bg-[#0f1317] shadow-sm transition hover:border-cyan-400/30 hover:shadow-[0_10px_40px_-10px_rgba(0,255,255,0.15)]">
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
                    <div className="space-y-4 p-4">
                      <h3 className="line-clamp-2 text-lg font-extrabold text-white">{t.title}</h3>
                    </div>
                  </article>
                </Link>
              )
            })}
          </div>

          {/* Upcoming matches */}
          <SectionHeader title="Upcoming matches" rightContent={<WeekFilter />} />
          <div className="space-y-3">
            {upcomingMatches.map((m) => {
              const gameInfo = getGameInfo(m.game)
              return (
                <div
                  key={m.id}
                  className="flex items-center rounded-2xl border border-white/10 bg-[#0f1317] px-4 py-4"
                >
                  {/* Game info */}
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                      <Image
                        src={gameInfo.icon}
                        alt={gameInfo.name}
                        width={24}
                        height={24}
                        className="h-6 w-6"
                      />
                    </div>
                    <div className="truncate">
                      <p className="truncate text-sm font-semibold text-white">{gameInfo.name}</p>
                      <p className="text-xs text-white/60">Tournament league</p>
                    </div>
                  </div>

                  {/* Teams and players */}
                  <div className="hidden flex-1 items-center justify-center sm:flex">
                    {/* Team A */}
                    <div className="flex w-40 items-center justify-end gap-2">
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-sm font-semibold text-white truncate">{m.teams.a.name}</span>
                          <Image
                            src={m.teams.a.logo}
                            alt={m.teams.a.name}
                            width={20}
                            height={20}
                            className="h-5 w-5 rounded-full flex-shrink-0"
                          />
                        </div>
                        <div className="flex justify-end gap-1 mt-1">
                          {m.teams.a.players.slice(0, 5).map((player, i) => (
                            <div key={i} className="h-4 w-4 rounded-full bg-white/20 border border-white/30">
                              <div className="h-full w-full rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-500/20"></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* VS */}
                    <div className="px-6">
                      <span className="text-white/60 font-bold text-lg">VS</span>
                    </div>

                    {/* Team B */}
                    <div className="flex w-40 items-center justify-start gap-2">
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <Image
                            src={m.teams.b.logo}
                            alt={m.teams.b.name}
                            width={20}
                            height={20}
                            className="h-5 w-5 rounded-full flex-shrink-0"
                          />
                          <span className="text-sm font-semibold text-white truncate">{m.teams.b.name}</span>
                        </div>
                        <div className="flex gap-1 mt-1">
                          {m.teams.b.players.slice(0, 5).map((player, i) => (
                            <div key={i} className="h-4 w-4 rounded-full bg-white/20 border border-white/30">
                              <div className="h-full w-full rounded-full bg-gradient-to-br from-purple-400/20 to-pink-500/20"></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="hidden items-center gap-2 sm:flex">
                    <CalendarDays className="h-4 w-4 text-white/60" />
                    <span className="text-xs text-white/80">{m.dateLabel}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </main>
    </div>
  )
}

function SectionHeader({
  title,
  href,
  rightContent,
}: {
  title: string
  href?: string
  rightContent?: React.ReactNode
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-lg font-bold">{title}</h2>
      {rightContent ? (
        rightContent
      ) : href ? (
        <Link href={href} className="text-sm text-white/70 hover:text-white">
          View all
        </Link>
      ) : null}
    </div>
  )
}

function WeekFilter() {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl bg-white/[0.06] p-1 ring-1 ring-white/10">
      {["Today", "This week", "This month"].map((l, i) => (
        <button
          key={l}
          className={[
            "min-w-[92px] rounded-lg px-3 py-1.5 text-sm transition",
            i === 1 ? "bg-white/15 text-white ring-1 ring-cyan-400/40" : "text-white/70 hover:bg-white/10",
          ].join(" ")}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
