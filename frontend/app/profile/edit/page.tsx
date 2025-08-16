"use client"

import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'
import { ProfileEditLayout } from '@/components/profile-edit/layout'

export default function EditProfilePage() {
  return (
    <div className="min-h-screen bg-[#0a0f14] text-white flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 pl-20">
          <ProfileEditLayout />
        </main>
      </div>
    </div>
  )
}