'use client'

import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'

// Mock data - później będzie z API
const mockTournaments = [
  {
    id: '1',
    title: 'CS2 Winter Championship',
    type: 'Swiss',
    status: 'registration',
    teamsCount: 16,
    startDate: '2024-01-15',
    prizePool: '1000 tokens'
  },
  {
    id: '2',
    title: 'Valorant Pro League',
    type: 'Single Elimination',
    status: 'running',
    teamsCount: 8,
    startDate: '2024-01-10',
    prizePool: '500 tokens'
  }
]

export function TournamentList() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900">Aktualne turnieje</h2>
        <p className="mt-4 text-lg text-gray-600">
          Dołącz do rozgrywek i walcz o nagrody
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockTournaments.map((tournament) => (
          <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{tournament.title}</CardTitle>
                <Badge variant={tournament.status === 'running' ? 'default' : 'secondary'}>
                  {tournament.status === 'running' ? 'W trakcie' : 'Rejestracja'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Format:</span>
                  <span className="text-sm font-medium">{tournament.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Drużyny:</span>
                  <span className="text-sm font-medium">{tournament.teamsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Nagroda:</span>
                  <span className="text-sm font-medium">{tournament.prizePool}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
