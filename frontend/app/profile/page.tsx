import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'
import { UserProfile } from '@/components/auth/user-profile'

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white">Mój profil</h1>
              <p className="text-gray-400 mt-2">
                Zarządzaj swoimi danymi osobowymi i ustawieniami konta
              </p>
            </div>
            <UserProfile />
          </div>
        </main>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Profil - Esports Tournament Management',
  description: 'Zarządzaj swoim profilem użytkownika',
}