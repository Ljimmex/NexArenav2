"use client"

import { Switch } from "@/components/ui/switch"
import { useState } from "react"

const notificationSettings = [
  { id: "live-sessions", label: "Live sessions", enabled: false },
  { id: "friend-requests", label: "Friend requests", enabled: true },
  { id: "new-followers", label: "New followers", enabled: true },
  { id: "mentions", label: "Mentions", enabled: false },
  { id: "messages", label: "Messages", enabled: false },
  { id: "tournament-updates", label: "Tournament updates", enabled: false },
]

export function ProfileEditNotificationsTab() {
  const [settings, setSettings] = useState(notificationSettings)

  const handleToggle = (id: string) => {
    setSettings((prev) =>
      prev.map((setting) => (setting.id === id ? { ...setting, enabled: !setting.enabled } : setting)),
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-white">Notifications settings</h2>
        <p className="text-sm text-gray-400">It is a long established fact that a reader will be distracted.</p>
      </div>

      <div className="space-y-1">
        {settings.map((setting) => (
          <div
            key={setting.id}
            className="flex items-center justify-between py-4 px-0 border-b border-gray-800 last:border-b-0"
          >
            <span className="text-white font-medium">{setting.label}</span>
            <Switch
              checked={setting.enabled}
              onCheckedChange={() => handleToggle(setting.id)}
              className="data-[state=checked]:bg-cyan-500"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
