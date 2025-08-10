"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Trophy, BarChart3, DollarSign } from "lucide-react"
import { cn } from "@/lib/utils"

const navigationItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Tournaments", href: "/tournaments", icon: Trophy },
  { name: "Ranking", href: "/ranking", icon: BarChart3 },
  { name: "Betting", href: "/betting", icon: DollarSign },
]

export function Sidebar() {
  const pathname = usePathname()
  const stroke = 3

  return (
    <aside
      aria-label="Główna nawigacja"
      className="hidden md:block fixed left-0 top-16 z-40 h-[calc(100dvh-4rem)] w-20 border-r border-[#1a2530] bg-[#0f1317]"
    >
      <nav className="flex h-full w-full flex-col items-center gap-3 px-3 py-4">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"))

          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              title={item.name}
              className={cn(
                "group relative flex h-12 w-12 items-center justify-center rounded-2xl border text-sm transition-all",
                // Base look (no special active background)
                "border-white/8 bg-white/[0.06] shadow-inner text-white/60 hover:bg-white/[0.09] hover:text-white",
              )}
            >
              <item.icon className="h-[18px] w-[18px] text-white" strokeWidth={stroke} />
              {/* Cyan active bar on the right */}
              {isActive && (
                <span className="absolute -right-3 top-1.5 bottom-1.5 w-[3px] rounded-full bg-gradient-to-b from-cyan-300 to-cyan-500" />
              )}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
