"use client"

import { Trophy } from "lucide-react"
import React from "react"

interface PrizeItem {
  place: string
  amount: string
}

interface PrizesCardProps {
  title?: string
  prizes: PrizeItem[]
}

export const PrizesCard: React.FC<PrizesCardProps> = ({ title = "Prizes", prizes }) => {
  return (
    <div className="bg-gray-800/60 rounded-xl p-5 border border-gray-700/50 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-7 w-7 rounded-md bg-gray-700/60 flex items-center justify-center">
          <Trophy className="h-4 w-4 text-cyan-300" />
        </div>
        <h3 className="text-white font-semibold tracking-tight">{title}</h3>
      </div>

      <div className="space-y-3">
        {prizes.map((p, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between rounded-lg bg-gray-800/80 border border-gray-700/40 px-4 py-3"
          >
            <div className="text-gray-200 font-semibold">{p.place}</div>
            <div className="text-right">
              <div className="text-white font-bold">{p.amount}</div>
              <div className="text-[10px] tracking-widest text-gray-500">AMOUNT</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}