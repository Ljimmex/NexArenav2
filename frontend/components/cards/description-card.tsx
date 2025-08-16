"use client"

import { Info } from "lucide-react"
import React from "react"

interface DescriptionCardProps {
  children?: React.ReactNode
  title?: string
}

export const DescriptionCard: React.FC<DescriptionCardProps> = ({ children, title = "Description" }) => {
  return (
    <div className="bg-gray-800/60 rounded-xl p-5 border border-gray-700/50 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-7 w-7 rounded-md bg-gray-700/60 flex items-center justify-center">
          <Info className="h-4 w-4 text-cyan-300" />
        </div>
        <h3 className="text-white font-semibold tracking-tight">{title}</h3>
      </div>
      <div className="text-gray-300 text-sm leading-6">
        {children}
      </div>
    </div>
  )
}