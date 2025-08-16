"use client"

import React from "react"
import Image from "next/image"
import { Users } from "lucide-react"

interface TeamLike {
  team_id?: string
  status?: string
  team?: {
    id?: string
    name?: string
    logo_url?: string
  } | null
}

interface TeamsCardProps {
  title?: string
  registered: TeamLike[]
  maxSlots?: number
}

export const TeamsCard: React.FC<TeamsCardProps> = ({ title = "Teams", registered, maxSlots }) => {
  const registeredCount = registered?.length || 0
  const confirmedCount = registered?.filter(t => (t.status || "").toUpperCase() === "APPROVED" || (t.status || "").toUpperCase() === "CONFIRMED").length || 0

  // Pick first few team names for subtitle
  const firstNames = registered.slice(0, 2).map(t => t.team?.name || "Unknown Team")
  const remaining = Math.max(0, registeredCount - firstNames.length)

  return (
    <div className="bg-gray-800/60 rounded-xl p-5 border border-gray-700/50 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-7 w-7 rounded-md bg-gray-700/60 flex items-center justify-center">
          <Users className="h-4 w-4 text-cyan-300" />
        </div>
        <h3 className="text-white font-semibold tracking-tight">{title}</h3>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-4">
        <div>
          <div className="text-xs text-gray-400">Registered</div>
          <div className="text-2xl font-bold text-white">{registeredCount}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400">Confirmed</div>
          <div className="text-2xl font-bold text-white">{confirmedCount}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400">Slots</div>
          <div className="text-2xl font-bold text-white">{maxSlots ?? "—"}</div>
        </div>
      </div>

      <div className="flex -space-x-2 mb-2">
        {registered.slice(0, 8).map((t, i) => (
          <div key={t.team?.id || t.team_id || i} className="w-10 h-10 rounded-full overflow-hidden border border-gray-700 bg-gray-700/40">
            {t.team?.logo_url ? (
              <Image src={t.team.logo_url} alt={t.team?.name || "Team"} width={40} height={40} className="object-cover w-10 h-10" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">{(t.team?.name || "?").slice(0,1)}</div>
            )}
          </div>
        ))}
      </div>

      <div className="text-sm text-gray-300">
        {firstNames.length > 0 ? (
          <span>
            <span className="font-semibold text-white">{firstNames[0]}</span>
            {firstNames[1] ? <>, <span className="font-semibold text-white">{firstNames[1]}</span></> : null}
            {remaining > 0 ? <> and <span className="font-semibold text-white">{remaining} others</span> are registered.</> : <> are registered.</>}
          </span>
        ) : (
          <span>No teams registered yet.</span>
        )}
      </div>
    </div>
  )
}