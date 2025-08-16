'use client'

import Image from 'next/image'
import { useAuth } from '@/lib/auth/auth-context'
import { Button } from '@/components/ui/button'
import { Settings, UserPlus, MoreHorizontal, Shield, Flag, MessageCircle } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDiscord, faTwitter, faSteam } from '@fortawesome/free-brands-svg-icons'
import Link from 'next/link'

interface ProfileHeaderProps {
  profileUserId?: string // ID of the profile being viewed
}

export function ProfileHeader({ profileUserId }: ProfileHeaderProps) {
  const { customUser } = useAuth()
  
  // Check if this is the current user's profile
  // If no profileUserId is provided, assume it's the current user's profile (for /profile page)
  // If profileUserId is provided, compare it with current user's ID
  const isOwnProfile = profileUserId ? customUser?.id === profileUserId : true

  const currentBanner = customUser?.banner_url || '/banners/ProfilBaner.png'

  return (
    <div className="relative w-full">
      {/* Banner */}
      <div className="relative h-48 sm:h-56 md:h-64 lg:h-72 xl:h-80 w-full overflow-hidden">
        <Image
          src={currentBanner}
          alt="Banner profilu"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Settings button - only show for own profile */}
      </div>

      {/* Profile Info Overlay - positioned lower */}
      <div className="absolute top-2/3 left-0 right-0 bottom-0 flex items-center justify-center px-2 sm:px-4">
        <div className="w-full max-w-7xl bg-gray-800/95 backdrop-blur-sm rounded-lg border border-gray-700/50 p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 sm:gap-6">
            {/* Left side - Avatar and Info */}
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="relative">
                <Image
                  src={customUser?.avatar_url || '/images/demo-avatar.png'}
                  alt="Avatar użytkownika"
                  width={80}
                  height={80}
                  className="rounded-lg w-16 h-16 sm:w-20 sm:h-20 object-cover"
                />
              </div>
              
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-white">
                    {customUser?.display_name || customUser?.username || 'Użytkownik'}
                  </h1>
                  <p className="text-xs text-gray-400">
                    @{customUser?.username || 'username'}
                  </p>
                </div>
                
                {/* Social Media Buttons */}
                <div className="flex items-center gap-2 mt-2">
                  <Button size="sm" variant="outline" className="p-2 bg-white/10 border-white/20 text-white hover:bg-white/20">
                    <FontAwesomeIcon icon={faDiscord} className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="p-2 bg-white/10 border-white/20 text-white hover:bg-white/20">
                    <FontAwesomeIcon icon={faSteam} className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="p-2 bg-white/10 border-white/20 text-white hover:bg-white/20">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16c-.169 1.858-.896 3.463-2.001 4.568C14.463 13.832 12.858 14.559 11 14.728V16.5h-2v-1.772C7.142 14.559 5.537 13.832 4.433 12.728 3.328 11.623 2.601 10.018 2.432 8.16H4.204c.148 1.416.722 2.67 1.573 3.521.851.851 2.105 1.425 3.521 1.573v-2.772h2v2.772c1.416-.148 2.67-.722 3.521-1.573.851-.851 1.425-2.105 1.573-3.521H19.568z"/>
                    </svg>
                  </Button>
                  <Button size="sm" variant="outline" className="p-2 bg-white/10 border-white/20 text-white hover:bg-white/20">
                    <FontAwesomeIcon icon={faTwitter} className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Right side - Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {isOwnProfile ? (
                <>
                  <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm">
                    <Link href="/profile/edit">
                      <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Edytuj profil</span>
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs sm:text-sm">
                    <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Message</span>
                  </Button>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm">
                     <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                     <span className="hidden sm:inline">Add Friend</span>
                   </Button>
                   <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                       <Button variant="outline" size="sm" className="p-2 bg-white/10 border-white/20 text-white hover:bg-white/20">
                         <MoreHorizontal className="w-4 h-4" />
                       </Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                       <DropdownMenuItem className="text-white hover:bg-gray-700 cursor-pointer">
                         <Shield className="w-4 h-4 mr-2" />
                         Block User
                       </DropdownMenuItem>
                       <DropdownMenuItem className="text-red-400 hover:bg-gray-700 cursor-pointer">
                         <Flag className="w-4 h-4 mr-2" />
                         Report User
                       </DropdownMenuItem>
                     </DropdownMenuContent>
                   </DropdownMenu>
                </>
              )}
            </div>
          </div>

          {/* Bottom section - About Me and Statistics on same level */}
          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/20">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 sm:gap-6">
              {/* About Me Section */}
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white mb-2">About Me</h3>
                <p className="text-xs text-gray-300 leading-relaxed max-w-md">
                  {customUser?.bio && customUser.bio.trim().length > 0
                    ? customUser.bio
                    : 'No bio yet.'}
                </p>
              </div>
              
              {/* Statistics Section */}
               <div className="flex-1">
                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-center">
                   <div>
                     <p className="text-xs text-gray-400 uppercase tracking-wide">Winrate</p>
                     <p className="text-lg font-bold text-white">87%</p>
                   </div>
                   <div>
                     <p className="text-xs text-gray-400 uppercase tracking-wide">Played</p>
                     <p className="text-lg font-bold text-white">245</p>
                   </div>
                   <div>
                     <p className="text-xs text-gray-400 uppercase tracking-wide">Headshot %</p>
                     <p className="text-lg font-bold text-white">73%</p>
                   </div>
                   <div>
                     <p className="text-xs text-gray-400 uppercase tracking-wide">KD Ratio</p>
                     <p className="text-lg font-bold text-white">1.8</p>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}