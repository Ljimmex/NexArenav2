// Tournament utility functions and constants

export const gameTypeLabels = {
  CS2: 'Counter-Strike 2',
  VALORANT: 'Valorant',
  LOL: 'League of Legends',
  DOTA2: 'Dota 2',
  ROCKET_LEAGUE: 'Rocket League',
  OVERWATCH: 'Overwatch 2',
} as const

export const tournamentTypeLabels = {
  SINGLE_ELIMINATION: 'Single Elimination',
  DOUBLE_ELIMINATION: 'Double Elimination',
  ROUND_ROBIN: 'Round Robin',
  SWISS: 'Swiss System',
} as const

export const statusLabels = {
  DRAFT: 'Szkic',
  REGISTRATION: 'Rejestracja',
  READY: 'Gotowy',
  RUNNING: 'W trakcie',
  COMPLETED: 'Zakończony',
  CANCELLED: 'Anulowany',
  POSTPONED: 'Przełożony',
} as const

export const statusColors = {
  DRAFT: 'bg-gray-500',
  REGISTRATION: 'bg-green-500',
  READY: 'bg-yellow-500',
  RUNNING: 'bg-blue-500',
  COMPLETED: 'bg-purple-500',
  CANCELLED: 'bg-red-500',
  POSTPONED: 'bg-orange-500',
} as const

/**
 * Formats a date string into a localized Polish format
 * @param dateString - ISO date string
 * @returns Formatted date string or 'TBD' if no date provided
 */
export const formatDate = (dateString?: string): string => {
  if (!dateString) return 'TBD'
  return new Date(dateString).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Formats a prize amount for display
 * @param amount - Prize amount in PLN
 * @returns Formatted prize string
 */
export const formatPrize = (amount: number): string => {
  if (amount === 0) return 'Darmowy'
  return `${amount.toLocaleString('pl-PL')} PLN`
}

// Type exports for better type safety
export type GameType = keyof typeof gameTypeLabels
export type TournamentType = keyof typeof tournamentTypeLabels
export type TournamentStatus = keyof typeof statusLabels