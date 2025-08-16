"use client"

import React from "react"
import Image from "next/image"
import { Users } from "lucide-react"
import { Organizer } from "@/lib/api/tournaments"

interface HostedByCardProps {
  title?: string
  organizer?: Organizer
  description?: string
  membersCount?: number
  sinceText?: string
}

export const HostedByCard: React.FC<HostedByCardProps> = ({ title = "Hosted by", organizer, description, membersCount, sinceText }) => {
  return (
    <div className="bg-gray-800/60 rounded-xl p-5 border border-gray-700/50 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-7 w-7 rounded-md bg-gray-700/60 flex items-center justify-center">
          <Users className="h-4 w-4 text-cyan-300" />
        </div>
        <h3 className="text-white font-semibold tracking-tight">{title}</h3>
      </div>

      <div className="flex gap-4">
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-700/60 border border-gray-700">
          <Image src={organizer?.logo_url || "/images/organizer-avatar.png"} alt={organizer?.name || "Organizer"} width={64} height={64} className="object-cover w-16 h-16" />
        </div>
        <div className="flex-1">
          <div className="text-white font-semibold">{organizer?.name || "Unknown Organizer"}</div>
          {description && <p className="text-gray-300 text-sm mt-1">{description}</p>}
          <div className="flex gap-6 text-xs text-gray-400 mt-2">
            {sinceText && <div>Joined {sinceText}</div>}
            {typeof membersCount === 'number' && <div>{membersCount} members</div>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-3">
        <a href="#" className="w-8 h-8 rounded-full bg-gray-700/60 border border-gray-700 flex items-center justify-center text-gray-300">f</a>
        <a href="#" className="w-8 h-8 rounded-full bg-gray-700/60 border border-gray-700 flex items-center justify-center text-gray-300">X</a>
        <a href="#" className="w-8 h-8 rounded-full bg-gray-700/60 border border-gray-700 flex items-center justify-center text-gray-300">T</a>
      </div>
    </div>
  )
}