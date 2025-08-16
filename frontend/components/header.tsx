"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import React from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
  Search,
  ArrowRight,
  Plus,
  MessageSquare,
  Bell,
  User,
  Settings,
  LogOut,
  Trophy,
  Users,
  Menu,
  X,
} from "lucide-react"
import { CreateTeamModal } from "@/components/create-team-modal"
import { useAuth } from "@/lib/auth/auth-context"
import { useAdmin } from "@/lib/hooks/useAdmin"

const ICON_STROKE = 2.5

export function Header() {
  const router = useRouter()
  const { user, customUser, loading, signOut } = useAuth()
  const { canCreateTournament, isAdmin } = useAdmin()
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = React.useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [unreadCount] = React.useState(5) // TODO: Replace with real data
  const [notificationsCount] = React.useState(3) // TODO: Replace with real data
  const ICON_STROKE = 3 // thicker stroke to simulate a more "filled" look

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const brand = (
    <Link href="/" className="group inline-flex items-center">
      <Image 
        src="/logos/LogoText.png" 
        alt="NexArena" 
        width={200} 
        height={40} 
        className="h-10 w-auto object-contain"
      />
      <span className="sr-only">Home</span>
    </Link>
  )

  const search = (
    <form onSubmit={handleSearch} className="relative w-full max-w-xl">
      {/* Filled-style icon badge */}
      <span
        className="pointer-events-none absolute left-2 top-1/2 z-10 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500/25 text-cyan-100 shadow-[0_0_10px_rgba(0,255,255,0.15)]"
        aria-hidden="true"
      >
        <Search className="h-4 w-4" strokeWidth={ICON_STROKE} />
      </span>
      {/* Borderless input with extended right padding for the longer arrow segment */}
      <input
        type="search"
        placeholder="Search..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="h-10 w-full rounded-full bg-[#0b1015] pl-11 pr-20 text-sm text-gray-200 placeholder:text-gray-500 outline-none transition focus:ring-2 focus:ring-cyan-400/40"
      />
      {/* Longer arrow segment for better usability */}
      <button
        type="submit"
        aria-label="Search"
        className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-7 w-16 items-center justify-center rounded-full bg-white/8 text-gray-200 transition hover:bg-white/12"
      >
        <ArrowRight className="h-4 w-4" strokeWidth={ICON_STROKE} />
      </button>
    </form>
  )

  return (
    <header className="sticky top-0 z-50 border-b border-[#1a2530] bg-[#0f1317]/90 backdrop-blur supports-[backdrop-filter]:bg-[#0f1317]/75">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Left: Brand */}
        <div className="flex-shrink-0">{brand}</div>

        {/* Center: Search - Hidden on mobile */}
        <div className="hidden md:flex mx-8 flex-1 justify-center max-w-2xl">{search}</div>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white hover:bg-white/10"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Right: Actions */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          {user ? (
            <>
              {/* Create (outlined cyan pill with filled plus badge) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-cyan-500/70 bg-transparent px-3 text-sm text-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.3)] transition hover:bg-cyan-500/10">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 text-[#0b1015] ring-1 ring-cyan-300/40">
                      <Plus className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                    </span>
                    <span className="hidden sm:inline">Create</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 border border-[#1a2530] bg-[#0f1317] p-1 text-white">
                  <div className="px-3 py-2">
                    <p className="text-xs text-white/60">Szybkie akcje</p>
                  </div>
                  <DropdownMenuItem
                    onClick={() => setIsCreateTeamModalOpen(true)}
                    className="cursor-pointer rounded-md px-2 py-2 text-sm text-white/90 hover:bg-white/5 focus:bg-white/5"
                  >
                    <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10">
                      <Users className="h-3.5 w-3.5 text-white/90" strokeWidth={ICON_STROKE} />
                    </span>
                    Utwórz zespół
                  </DropdownMenuItem>
                  {canCreateTournament && (
                    <DropdownMenuItem
                      asChild
                      className="rounded-md px-2 py-2 text-sm text-white/90 hover:bg-white/5 focus:bg-white/5"
                    >
                      <Link href="/tournaments/create" className="flex items-center">
                        <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10">
                          <Trophy className="h-3.5 w-3.5 text-white/90" strokeWidth={ICON_STROKE} />
                        </span>
                        Utwórz turniej
                      </Link>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-[#121821] p-1 sm:flex">
                {/* Messages */}
                <Link
                  href="/messages"
                  aria-label="Wiadomości"
                  className="inline-flex h-10 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-3 text-sm text-white/90 shadow-inner backdrop-blur transition hover:bg-white/10"
                >
                  <MessageSquare className="h-5 w-5 text-white" strokeWidth={3} />
                  <span className="inline-flex items-center rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold text-white/90">
                    {unreadCount}
                  </span>
                </Link>

                {/* Notifications */}
                <button
                  type="button"
                  aria-label="Powiadomienia"
                  className="inline-flex h-10 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-3 text-sm text-white/90 shadow-inner backdrop-blur transition hover:bg-white/10"
                >
                  <Bell className="h-5 w-5 text-white" strokeWidth={3} />
                  <span className="inline-flex items-center rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold text-white/90">
                    {notificationsCount}
                  </span>
                </button>

                {/* User */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={[
                        "relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/10 transition",
                        isAdmin ? "ring-2 ring-yellow-400/80 ring-offset-2 ring-offset-[#0f1317]" : "",
                      ].join(" ")}
                    >
                      <Image
                        src={customUser?.avatar_url || "/images/demo-avatar.png"}
                        alt="User avatar"
                        width={40}
                        height={40}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 border border-[#1a2530] bg-[#0f1317] p-1 text-white">
                    <div className="flex items-center gap-2 border-b border-[#1a2530] px-3 py-2">
                      <div
                        className={[
                          "relative h-8 w-8 overflow-hidden rounded-lg border border-white/10",
                          isAdmin ? "ring-2 ring-yellow-400/70 ring-offset-1 ring-offset-[#0f1317]" : "",
                        ].join(" ")}
                      >
                        <Image
                          src={customUser?.avatar_url || "/images/demo-avatar.png"}
                          alt=""
                          width={32}
                          height={32}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {customUser?.display_name || customUser?.username || "Użytkownik"}
                        </p>
                        <p className="truncate text-xs text-white/60">{customUser?.email}</p>
                        {isAdmin && (
                          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-yellow-300">
                            Administrator
                          </p>
                        )}
                      </div>
                    </div>
                    <DropdownMenuItem
                      asChild
                      className="rounded-md px-2 py-2 text-sm text-white/90 hover:bg-white/5 focus:bg-white/5"
                    >
                      <Link href="/profile" className="flex items-center">
                        <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10">
                          <User className="h-3.5 w-3.5 text-white/90" strokeWidth={ICON_STROKE} />
                        </span>
                        Profil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      asChild
                      className="rounded-md px-2 py-2 text-sm text-white/90 hover:bg-white/5 focus:bg-white/5"
                    >
                      <Link href="/profile/edit" className="flex items-center">
                        <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10">
                          <Settings className="h-3.5 w-3.5 text-white/90" strokeWidth={ICON_STROKE} />
                        </span>
                        Edytuj profil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-[#1a2530]" />
                    <DropdownMenuItem
                      onClick={signOut}
                      disabled={loading}
                      className="cursor-pointer rounded-md px-2 py-2 text-sm text-white/90 hover:bg-white/5 focus:bg-white/5"
                    >
                      <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10">
                        <LogOut className="h-3.5 w-3.5 text-white/90" strokeWidth={ICON_STROKE} />
                      </span>
                      Wyloguj
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Create Team Modal */}
              <CreateTeamModal
                isOpen={isCreateTeamModalOpen}
                onClose={() => setIsCreateTeamModalOpen(false)}
                onSuccess={() => {
                  setIsCreateTeamModalOpen(false)
                }}
              />
            </>
          ) : (
            <>
              {/* next/link used for client navigation and prefetching. [^2] */}
              <Button
                variant="outline"
                asChild
                className="border-white/10 bg-transparent text-white/80 hover:text-white"
              >
                <Link href="/auth/login">Zaloguj</Link>
              </Button>
              <Button asChild className="bg-cyan-600 hover:bg-cyan-500">
                <Link href="/auth/register">Zarejestruj</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-[#0f1317] border-b border-[#1a2530] z-40">
          <div className="p-4 space-y-4">
            {/* Mobile Search */}
            <div className="w-full">{search}</div>
            
            {user ? (
              <>
                {/* User Info */}
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                  <div className="h-10 w-10 overflow-hidden rounded-lg border border-white/10">
                    <Image
                      src={customUser?.avatar_url || "/images/demo-avatar.png"}
                      alt="User avatar"
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {customUser?.display_name || customUser?.username || "Użytkownik"}
                    </p>
                    <p className="text-xs text-white/60">{customUser?.email}</p>
                  </div>
                </div>

                {/* Mobile Navigation */}
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    asChild
                    className="w-full justify-start text-white hover:bg-white/10"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Link href="/profile">
                      <User className="h-4 w-4 mr-3" />
                      Profil
                    </Link>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    asChild
                    className="w-full justify-start text-white hover:bg-white/10"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Link href="/messages">
                      <MessageSquare className="h-4 w-4 mr-3" />
                      Wiadomości
                      <span className="ml-auto inline-flex items-center rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold text-white/90">{unreadCount}</span>
                    </Link>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-white hover:bg-white/10"
                  >
                    <Bell className="h-4 w-4 mr-3" />
                    Powiadomienia
                    <span className="ml-auto inline-flex items-center rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold text-white/90">{notificationsCount}</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsCreateTeamModalOpen(true)
                      setIsMobileMenuOpen(false)
                    }}
                    className="w-full justify-start text-white hover:bg-white/10"
                  >
                    <Users className="h-4 w-4 mr-3" />
                    Utwórz zespół
                  </Button>
                  
                  {canCreateTournament && (
                    <Button
                      variant="ghost"
                      asChild
                      className="w-full justify-start text-white hover:bg-white/10"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Link href="/tournaments/create">
                        <Trophy className="h-4 w-4 mr-3" />
                        Utwórz turniej
                      </Link>
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    asChild
                    className="w-full justify-start text-white hover:bg-white/10"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Link href="/profile/edit">
                      <Settings className="h-4 w-4 mr-3" />
                      Edytuj profil
                    </Link>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    onClick={() => {
                      signOut()
                      setIsMobileMenuOpen(false)
                    }}
                    className="w-full justify-start text-white hover:bg-white/10"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Wyloguj
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  asChild
                  className="w-full border-white/10 bg-transparent text-white/80 hover:text-white"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Link href="/auth/login">Zaloguj</Link>
                </Button>
                <Button 
                  asChild 
                  className="w-full bg-cyan-600 hover:bg-cyan-500"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Link href="/auth/register">Zarejestruj</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
