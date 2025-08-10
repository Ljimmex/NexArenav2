'use client'

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, MoreHorizontal, Edit, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


interface TournamentHeaderProps {
  tournament?: {
    id: string
    title: string
    game: string
    maxPlayers: number
    prizePool: number
    startDate: string
    bannerUrl?: string
    logoUrl?: string
  }
  isRegistered: boolean
  onRegister: () => void
  onUnregister: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function TournamentHeader({
  tournament,
  isRegistered,
  onRegister,
  onUnregister,
  onEdit,
  onDelete
}: TournamentHeaderProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatPrize = (amount: number) => {
    return `$${amount.toLocaleString()}`
  }

  return (
    <div className="relative h-80 overflow-hidden rounded-lg">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: tournament?.bannerUrl 
            ? `url(${tournament.bannerUrl})` 
            : `url(/banners/default-tournament-banner.png)`
        }}
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />
      
      {/* Content */}
      <div className="relative h-full flex flex-col justify-between p-4 sm:p-6 lg:p-8">
        {/* Top Section - Badges and Actions */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="bg-green-600 hover:bg-green-700 text-white border-0 px-3 py-1.5 text-sm font-medium">
                {tournament?.game || 'Xbox'}
              </Badge>
              <Badge variant="secondary" className="bg-gray-700 hover:bg-gray-800 text-white border-0 px-3 py-1.5 text-sm font-medium">
                Players {tournament?.maxPlayers || 32}
              </Badge>
              <Badge variant="secondary" className="bg-yellow-600 hover:bg-yellow-700 text-white border-0 px-3 py-1.5 text-sm font-medium">
                Prize {formatPrize(tournament?.prizePool || 2000)}
              </Badge>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              onClick={isRegistered ? onUnregister : onRegister}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 text-sm font-semibold"
            >
              {isRegistered ? 'Leave Tournament' : 'Join Tournament'}
            </Button>
            
            {/* More Options Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-10 w-10 p-0 text-white hover:bg-white/10"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Tournament
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={onDelete} 
                  className="cursor-pointer text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Tournament
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Bottom Section - Logo, Date and Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
          {/* Tournament Logo */}
          <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-lg border-2 border-white/20 overflow-hidden bg-white/10 flex items-center justify-center flex-shrink-0">
            {tournament?.logoUrl ? (
              <img 
                src={tournament.logoUrl} 
                alt="Tournament Logo" 
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-white font-bold text-lg sm:text-xl">
                {tournament?.title?.charAt(0) || 'T'}
              </span>
            )}
          </div>
          
          {/* Date and Title */}
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 text-white/90">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-lg font-medium">
                SEP 10 Starting at {formatDate(tournament?.startDate || '2024-09-10T12:00:00Z')}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
              {tournament?.title || 'Predator League Asia Pacific 2024'}
            </h1>
          </div>
        </div>
      </div>
    </div>
  )
}