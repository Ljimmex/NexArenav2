'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Trophy, Target, Users, Gamepad2, Star, TrendingUp } from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-context'

export function ProfileStatsNav() {
  const [activeTab, setActiveTab] = useState('overview')
  const { customUser } = useAuth()

  const countryCodeToFlagEmoji = (code?: string) => {
    if (!code) return ''
    const upper = code.trim().toUpperCase()
    if (upper.length !== 2) return ''
    const OFFSET = 127397
    return String.fromCodePoint(...Array.from(upper).map(c => c.charCodeAt(0) + OFFSET))
  }

  const getCountryName = (code?: string) => {
    if (!code) return undefined
    try {
      // Prefer English names; could be enhanced with user settings later
      const display = new Intl.DisplayNames(['en'], { type: 'region' })
      return display.of(code.toUpperCase()) || code.toUpperCase()
    } catch {
      return code.toUpperCase()
    }
  }

  const getLanguageName = (lang?: string) => {
    if (!lang) return undefined
    try {
      const display = new Intl.DisplayNames(['en'], { type: 'language' })
      return display.of(lang) || lang
    } catch {
      return lang
    }
  }

  const lastMatches = [
    {
      id: 1,
      game: 'CS2',
      map: 'Dust2',
      result: 'Win',
      score: '16-12',
      kd: '24/15',
      date: '2024-01-15',
      tournament: 'Weekly Cup #45'
    },
    {
      id: 2,
      game: 'CS2',
      map: 'Mirage',
      result: 'Loss',
      score: '13-16',
      kd: '18/19',
      date: '2024-01-14',
      tournament: 'Pro League'
    },
    {
      id: 3,
      game: 'CS2',
      map: 'Inferno',
      result: 'Win',
      score: '16-8',
      kd: '26/12',
      date: '2024-01-13',
      tournament: 'Weekly Cup #44'
    },
    {
      id: 4,
      game: 'CS2',
      map: 'Cache',
      result: 'Win',
      score: '16-14',
      kd: '22/16',
      date: '2024-01-12',
      tournament: 'Ranked Match'
    }
  ]

  return (
    <div className="bg-[#0a0f14] pt-20">
      {/* Navigation Section - Below header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-gray-800/95 backdrop-blur-sm rounded-lg border border-gray-700/50 p-4">
          <nav className="flex items-center gap-4 sm:gap-6 lg:gap-8 overflow-x-auto">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`font-medium border-b-2 pb-2 whitespace-nowrap transition-colors ${
                activeTab === 'overview' 
                  ? 'text-blue-400 border-blue-400' 
                  : 'text-gray-400 hover:text-white border-transparent'
              }`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('tournaments')}
              className={`font-medium border-b-2 pb-2 whitespace-nowrap transition-colors ${
                activeTab === 'tournaments' 
                  ? 'text-blue-400 border-blue-400' 
                  : 'text-gray-400 hover:text-white border-transparent'
              }`}
            >
              Tournaments
            </button>
            <button 
              onClick={() => setActiveTab('achievements')}
              className={`font-medium border-b-2 pb-2 whitespace-nowrap transition-colors ${
                activeTab === 'achievements' 
                  ? 'text-blue-400 border-blue-400' 
                  : 'text-gray-400 hover:text-white border-transparent'
              }`}
            >
              Achievements
            </button>
            <button 
              onClick={() => setActiveTab('ranking')}
              className={`font-medium border-b-2 pb-2 whitespace-nowrap transition-colors ${
                activeTab === 'ranking' 
                  ? 'text-blue-400 border-blue-400' 
                  : 'text-gray-400 hover:text-white border-transparent'
              }`}
            >
              Ranking
            </button>
          </nav>
        </div>

        {/* Content Section */}
        <div className="mt-6 pb-8">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* About Section */}
              <div className="lg:col-span-1">
                <Card className="bg-gray-800/95 backdrop-blur-sm border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="text-white text-lg font-bold">
                      About
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Achievements */}
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-3">Latest Achievements</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="group relative">
                          <div className="w-12 h-12 bg-gray-700/30 rounded-lg p-2 hover:bg-gray-700/50 transition-all duration-200 hover:scale-105 cursor-pointer">
                            <Image
                              src="/icons/achievements/Achivment1.png"
                              alt="Tournament Winner"
                              width={32}
                              height={32}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                            <div className="font-medium">Tournament Winner</div>
                            <div className="text-gray-400">CS2 Championship 2024</div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>

                        <div className="group relative">
                          <div className="w-12 h-12 bg-gray-700/30 rounded-lg p-2 hover:bg-gray-700/50 transition-all duration-200 hover:scale-105 cursor-pointer">
                            <Image
                              src="/icons/achievements/Achivment2.png"
                              alt="Perfect Game"
                              width={32}
                              height={32}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                            <div className="font-medium">Perfect Game</div>
                            <div className="text-gray-400">Valorant Pro League</div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>

                        <div className="group relative">
                          <div className="w-12 h-12 bg-gray-700/30 rounded-lg p-2 hover:bg-gray-700/50 transition-all duration-200 hover:scale-105 cursor-pointer">
                            <Image
                              src="/icons/achievements/Achivment3.png"
                              alt="Win Streak"
                              width={32}
                              height={32}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                            <div className="font-medium">Win Streak</div>
                            <div className="text-gray-400">10 wins in a row</div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>

                        <div className="group relative">
                          <div className="w-12 h-12 bg-gray-700/30 rounded-lg p-2 hover:bg-gray-700/50 transition-all duration-200 hover:scale-105 cursor-pointer">
                            <Image
                              src="/icons/achievements/Achivment4.png"
                              alt="First Victory"
                              width={32}
                              height={32}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                            <div className="font-medium">First Victory</div>
                            <div className="text-gray-400">Welcome to NexArena!</div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>

                        <div className="group relative">
                          <div className="w-12 h-12 bg-gray-700/30 rounded-lg p-2 hover:bg-gray-700/50 transition-all duration-200 hover:scale-105 cursor-pointer">
                            <Image
                              src="/icons/achievements/Achivment5.png"
                              alt="Team Player"
                              width={32}
                              height={32}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                            <div className="font-medium">Team Player</div>
                            <div className="text-gray-400">Joined 5 team tournaments</div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>

                        <div className="group relative">
                          <div className="w-12 h-12 bg-gray-700/30 rounded-lg p-2 hover:bg-gray-700/50 transition-all duration-200 hover:scale-105 cursor-pointer">
                            <Image
                              src="/icons/achievements/Achivment6.png"
                              alt="Veteran"
                              width={32}
                              height={32}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                            <div className="font-medium">Veteran</div>
                            <div className="text-gray-400">100 tournaments completed</div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Nationality */}
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">Nationality</h4>
                      {customUser?.country ? (
                        <div className="flex items-center gap-2">
                          <span className="text-base" aria-label={getCountryName(customUser.country)}>
                            {countryCodeToFlagEmoji(customUser.country)}
                          </span>
                          <span className="text-sm text-gray-300">{getCountryName(customUser.country)}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Not specified</span>
                      )}
                    </div>

                    {/* Languages */}
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">Languages</h4>
                      <div className="flex gap-2">
                        {(() => {
                          const language = customUser?.settings?.language
                          const name = getLanguageName(language || 'en')
                          return (
                            <Badge variant="secondary" className="bg-blue-600/20 text-blue-400 border-blue-600/30">
                              {name}
                            </Badge>
                          )
                        })()}
                      </div>
                    </div>

                    {/* Game accounts */}
                    <div>
                      <h4 className="text-white text-lg font-bold mb-4">Game accounts</h4>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-blue-400 hover:text-blue-300 cursor-pointer">Add account</span>
                      </div>
                      
                      {/* Counter-Strike: Global Offensive */}
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-white">Counter-Strike: Global Offensive</span>
                            <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30 text-xs">
                              TIER II
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 p-2 bg-gray-700/30 rounded-lg">
                            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                              <span className="text-xs text-white">B</span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-white font-medium">Bartus</span>
                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              </div>
                            </div>
                            <button className="text-gray-400 hover:text-white">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Counter-Strike 2 */}
                        <div>
                          <span className="text-sm text-white">Counter-Strike 2</span>
                          <div className="flex items-center gap-3 p-2 bg-gray-700/30 rounded-lg mt-2">
                            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                              <span className="text-xs text-white">B</span>
                            </div>
                            <div className="flex-1">
                              <span className="text-sm text-white font-medium">Bartus</span>
                            </div>
                            <button className="text-gray-400 hover:text-white">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Matches Section */}
              <div className="lg:col-span-2">
                <Card className="bg-gray-800/95 backdrop-blur-sm border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Recent matches
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Recent Matches */}
                      {[
                        { game: 'League of Legends', icon: 'lol.png', gameName: 'LEAGUE OF LEGENDS', team1: 'FaZe', team2: 'Fnatic' },
                        { game: 'Counter-Strike 2', icon: 'cs2.png', gameName: 'COUNTER-STRIKE 2', team1: 'G2', team2: 'Team Liquid' },
                        { game: 'Valorant', icon: 'valorant.png', gameName: 'VALORANT', team1: 'Sentinels', team2: 'NRG' }
                      ].map((match, index) => (
                        <div 
                          key={index}
                          className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] items-center gap-4 p-4 bg-gray-700/30 rounded-lg border border-gray-600/30 hover:bg-gray-700/50 transition-colors"
                        >
                          {/* Game Icon */}
                          <div className="w-8 h-8 rounded-lg overflow-hidden">
                            <img 
                              src={`/icons/games/${match.icon}`} 
                              alt={match.game}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          {/* Game Info */}
                          <div className="text-sm text-gray-300 min-w-0">
                            <span>{match.gameName}</span>
                          </div>
                          
                          {/* Team 1 Champions */}
                          <div className="flex -space-x-1">
                            {[1, 2, 3, 4, 5].map((champion) => (
                              <div key={champion} className="w-6 h-6 rounded-full border border-gray-600 overflow-hidden">
                                <img 
                                  src={`/images/Avatar${champion}.png`} 
                                  alt={`Avatar ${champion}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                          
                          {/* Team 1 */}
                          <div className="flex items-center gap-2 justify-end w-28">
                            <span className="text-white font-medium text-right truncate max-w-16" title={match.team1}>
                              {match.team1}
                            </span>
                            <div className="w-6 h-6 rounded overflow-hidden flex-shrink-0">
                              <img 
                                src="/images/team-avatar.png" 
                                alt={`${match.team1} logo`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                          
                          {/* VS */}
                          <span className="text-gray-400 text-center w-8">vs</span>
                          
                          {/* Team 2 */}
                          <div className="flex items-center gap-2 w-28">
                            <div className="w-6 h-6 rounded overflow-hidden flex-shrink-0">
                              <img 
                                src="/images/team-avatar.png" 
                                alt={`${match.team2} logo`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span className="text-white font-medium text-left truncate max-w-16" title={match.team2}>
                              {match.team2}
                            </span>
                          </div>
                          
                          {/* Team 2 Champions */}
                          <div className="flex -space-x-1">
                            {[1, 2, 3, 4, 5].map((champion) => (
                              <div key={champion} className="w-6 h-6 rounded-full border border-gray-600 overflow-hidden">
                                <img 
                                  src={`/images/Avatar${champion}.png`} 
                                  alt={`Avatar ${champion}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'tournaments' && (
            <Card className="bg-gray-800/95 backdrop-blur-sm border-gray-700/50">
              <CardContent className="p-8 text-center">
                <p className="text-gray-400">Tournaments content coming soon...</p>
              </CardContent>
            </Card>
          )}

          {activeTab === 'achievements' && (
            <Card className="bg-gray-800/95 backdrop-blur-sm border-gray-700/50">
              <CardContent className="p-8 text-center">
                <p className="text-gray-400">Achievements content coming soon...</p>
              </CardContent>
            </Card>
          )}

          {activeTab === 'ranking' && (
            <Card className="bg-gray-800/95 backdrop-blur-sm border-gray-700/50">
              <CardContent className="p-8 text-center">
                <p className="text-gray-400">Ranking content coming soon...</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}