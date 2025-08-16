"use client"

import React from "react"
import Image from "next/image"
import { Settings } from "lucide-react"

interface GameSettingsCardProps {
  title?: string
  imageUrl?: string
  settings: { label: string; value: string }[]
}

export const GameSettingsCard: React.FC<GameSettingsCardProps> = ({ title = "Game settings", imageUrl, settings }) => {
  return (
    <div className="bg-gray-800/60 rounded-xl p-5 border border-gray-700/50 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-7 w-7 rounded-md bg-gray-700/60 flex items-center justify-center">
          <Settings className="h-4 w-4 text-cyan-300" />
        </div>
        <h3 className="text-white font-semibold tracking-tight">{title}</h3>
      </div>

      {imageUrl && (
        <div className="mb-3 overflow-hidden rounded-lg border border-gray-700/40">
          <Image src={imageUrl} alt="Game map" width={600} height={300} className="w-full h-36 object-cover" />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {settings.map((s, idx) => (
          <div key={idx} className="rounded-lg bg-gray-800/80 border border-gray-700/40 p-3">
            <div className="text-xs text-gray-400">{s.label}</div>
            <div className="text-white font-semibold">{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}