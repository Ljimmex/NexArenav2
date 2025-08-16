"use client"

import React from "react"
import { Gamepad2, Users2, Trophy } from "lucide-react"
import { Tournament } from "@/lib/api/tournaments"

interface FormatsCardProps {
  title?: string
  tournament: Pick<Tournament, "game_type" | "team_size" | "tournament_type" | "format_settings" | "prize_pool">
}

export const FormatsCard: React.FC<FormatsCardProps> = ({ title = "Format", tournament }) => {
  const cells = [
    {
      icon: <Gamepad2 className="h-4 w-4 text-cyan-300" />,
      label: "Game",
      value: tournament.game_type
    },
    {
      icon: <Users2 className="h-4 w-4 text-cyan-300" />,
      label: "Team size",
      value: `${tournament.team_size}v${tournament.team_size} ${""}`.trim()
    },
    {
      icon: <Trophy className="h-4 w-4 text-cyan-300" />,
      label: "Custom prize",
      value: tournament.prize_pool ? `${tournament.prize_pool}` : "—"
    },
    {
      icon: <Gamepad2 className="h-4 w-4 text-cyan-300" />,
      label: "Format",
      value: tournament.tournament_type.replace("_", " ")
    }
  ]

  return (
    <div className="bg-gray-800/60 rounded-xl p-5 border border-gray-700/50 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-7 w-7 rounded-md bg-gray-700/60 flex items-center justify-center">
          <Gamepad2 className="h-4 w-4 text-cyan-300" />
        </div>
        <h3 className="text-white font-semibold tracking-tight">{title}</h3>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {cells.map((c, idx) => (
          <div key={idx} className="rounded-lg bg-gray-800/80 border border-gray-700/40 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-6 w-6 rounded-md bg-gray-700/60 flex items-center justify-center">
                {c.icon}
              </div>
              <div className="text-gray-300 text-sm">{c.label}</div>
            </div>
            <div className="text-white font-semibold">{c.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}