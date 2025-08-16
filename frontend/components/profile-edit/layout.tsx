"use client"

import { useState } from 'react'
import { ProfileEditSidebar } from './sidebar'
import { ProfileEditProfileTab } from './tabs/profile-tab'
import { ProfileEditPasswordTab } from './tabs/password-tab'
import { ProfileEditConnectionsTab } from './tabs/connections-tab'
import { ProfileEditNotificationsTab } from './tabs/notifications-tab'

export function ProfileEditLayout() {
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'connections' | 'notifications' | 'payment' | 'subscriptions'>('profile')

  return (
    <div className="flex w-full">
      <ProfileEditSidebar activeTab={activeTab} onChangeTab={setActiveTab} />
      <div className="flex-1 p-4 sm:p-6">
        <div className="mt-4">
          {activeTab === 'profile' && <ProfileEditProfileTab />}
          {activeTab === 'password' && <ProfileEditPasswordTab />}
          {/* Removed payment tab comparison since it's not in the allowed activeTab types */}
          {/* Removed subscriptions tab since it's not in the allowed activeTab types */}
          {activeTab === 'connections' && <ProfileEditConnectionsTab />}
          {activeTab === 'notifications' && <ProfileEditNotificationsTab />}
        </div>
      </div>
    </div>
  )
}