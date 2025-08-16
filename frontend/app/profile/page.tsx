import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'
import { UserProfile } from '@/components/auth/user-profile'
import { ProfileHeader } from '@/components/profile-header'
import { ProfileStatsNav } from '@/components/profile-stats-nav'

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-[#0a0f14] text-white flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 flex flex-col">
          {/* Profile Header with Banner - Full width without gaps */}
          <ProfileHeader />
          
          {/* Profile Statistics and Navigation */}
          <ProfileStatsNav />
          
        </main>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Profil - Esports Tournament Management',
  description: 'Zarządzaj swoim profilem użytkownika',
}