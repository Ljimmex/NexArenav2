'use client'

import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Play, ArrowRight, Trophy } from 'lucide-react'

// Mock data - później będzie z API
const featuredGames = [
  {
    id: '1',
    title: 'CS2',
    subtitle: 'Counter-Strike 2',
    image: '/icons/games/cs2.png',
    tournaments: 25,
    status: 'active'
  },
  {
    id: '2',
    title: 'Valorant',
    subtitle: 'Tactical FPS',
    image: '/icons/games/valorant.png',
    tournaments: 18,
    status: 'active'
  },
  {
    id: '3',
    title: 'League of Legends',
    subtitle: 'MOBA',
    image: '/icons/games/lol.png',
    tournaments: 32,
    status: 'active'
  },
  {
    id: '4',
    title: 'Dota 2',
    subtitle: 'MOBA',
    image: '/icons/games/dota2.png',
    tournaments: 15,
    status: 'active'
  },
  {
    id: '5',
    title: 'Rocket League',
    subtitle: 'Sports',
    image: '/icons/games/rocket-league.png',
    tournaments: 12,
    status: 'active'
  },
  {
    id: '6',
    title: 'Overwatch 2',
    subtitle: 'Hero Shooter',
    image: '/icons/games/overwatch.png',
    tournaments: 8,
    status: 'active'
  }
]

const recentlyPlayed = [
  {
    id: '1',
    title: 'CS2 Winter Championship',
    lastPlayed: '2 dni temu',
    totalTime: '2:30min',
    image: '/banners/cs2-tournament.webp'
  },
  {
    id: '2',
    title: 'Valorant Spring Cup',
    lastPlayed: '3 dni temu',
    totalTime: '1:45min',
    image: '/banners/default-tournament-banner.png'
  },
  {
    id: '3',
    title: 'LoL Masters',
    lastPlayed: '1 tydzień temu',
    totalTime: '3:15min',
    image: '/banners/default-tournament-banner.png'
  }
]

const upcomingTournaments = [
  {
    id: '1',
    title: 'CS2 Pro League',
    status: 'Rejestracja',
    date: '15 Jan 2024',
    prize: '5000 PLN',
    teams: 16
  },
  {
    id: '2',
    title: 'Valorant Champions',
    status: 'Rozpoczyna się',
    date: '20 Jan 2024',
    prize: '10000 PLN',
    teams: 32
  },
  {
    id: '3',
    title: 'LoL Winter Cup',
    status: 'W trakcie',
    date: '10 Jan 2024',
    prize: '7500 PLN',
    teams: 24
  }
]

export function MainContent() {
  return (
    <div className="flex-1 bg-gray-950 text-white overflow-y-auto">
      {/* Hero Section */}
      <section>
        <div className="relative h-80 bg-gradient-to-r from-purple-900 via-blue-900 to-purple-900 overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 h-full flex items-center px-4 md:px-8">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Online soon
            </h1>
            <p className="text-lg md:text-xl mb-2">
              Build your <span className="text-purple-400">team</span>
            </p>
            <p className="text-gray-300 mb-6">more details ▸</p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Play className="h-4 w-4 mr-2" />
                Rozpocznij grę
              </Button>
              <Button variant="outline" className="border-gray-600 text-gray-300">
                Dołącz do drużyny
              </Button>
            </div>
          </div>
        </div>
      </div>
      </section>

      <div className="p-4 md:p-8 space-y-8">
        {/* Featured Games */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Polecane gry</h2>
            <Button variant="ghost" className="text-gray-400 hover:text-white">
              Zobacz wszystkie
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredGames.map((game) => (
              <Card key={game.id} className="bg-gray-900 border-gray-800 hover:border-purple-500 transition-colors cursor-pointer group">
                <CardContent className="p-0">
                  <div className="aspect-video bg-gray-800 rounded-t-lg relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <h3 className="text-lg font-bold">{game.title}</h3>
                      <p className="text-sm text-gray-300">{game.subtitle}</p>
                    </div>
                    <Badge className="absolute top-4 right-4 bg-green-600">
                      {game.tournaments} turniejów
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Recently Played */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Ostatnio grane</h2>
            <Button variant="ghost" className="text-gray-400 hover:text-white">
              Zobacz wszystkie
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentlyPlayed.map((item) => (
              <Card key={item.id} className="bg-gray-900 border-gray-800 hover:border-purple-500 transition-colors cursor-pointer">
                <CardContent className="p-0">
                  <div className="aspect-video bg-gray-800 rounded-t-lg relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <h3 className="text-lg font-bold">{item.title}</h3>
                      <p className="text-sm text-gray-300">Ostatnio grane: {item.lastPlayed}</p>
                      <p className="text-sm text-gray-400">Czas gry: {item.totalTime}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Tournaments & Events */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Turnieje i wydarzenia</h2>
            <Button variant="ghost" className="text-gray-400 hover:text-white">
              Zobacz wszystkie
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {upcomingTournaments.map((tournament) => (
              <Card key={tournament.id} className="bg-gray-900 border-gray-800 hover:border-purple-500 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{tournament.title}</CardTitle>
                    <Badge 
                      variant={tournament.status === 'W trakcie' ? 'default' : 'secondary'}
                      className={
                        tournament.status === 'W trakcie' 
                          ? 'bg-green-600' 
                          : tournament.status === 'Rozpoczyna się'
                          ? 'bg-orange-600'
                          : 'bg-blue-600'
                      }
                    >
                      {tournament.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Data:</span>
                    <span>{tournament.date}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Nagroda:</span>
                    <span className="text-green-400">{tournament.prize}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Drużyny:</span>
                    <span>{tournament.teams}</span>
                  </div>
                  <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700">
                    <Trophy className="h-4 w-4 mr-2" />
                    Dołącz do turnieju
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}