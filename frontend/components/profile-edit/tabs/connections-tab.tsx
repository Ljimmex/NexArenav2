"use client"
import { Button } from "@/components/ui/button"
import { Chrome, Gamepad2, Twitch, Facebook, Apple, XIcon as Xbox, Zap, Shield } from "lucide-react"

const connectedAccounts = [
  {
    name: "Google",
    email: "blade@gmail.com",
    icon: Chrome,
  },
  {
    name: "Google",
    email: "blade@gmail.com",
    icon: Chrome,
  },
]

const availableConnections = [
  { name: "Twitch", email: "blade@gmail.com", icon: Twitch },
  { name: "Facebook", email: "blade@gmail.com", icon: Facebook },
  { name: "Steam", email: "blade@gmail.com", icon: Gamepad2 },
  { name: "Apple", email: "blade@gmail.com", icon: Apple },
  { name: "Xbox", email: "blade@gmail.com", icon: Xbox },
  { name: "Epic games", email: "blade@gmail.com", icon: Zap },
  { name: "Riot games", email: "blade@gmail.com", icon: Shield },
]

export function ProfileEditConnectionsTab() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-white mb-2">Your Connections</h2>
        <p className="text-gray-400 text-sm">It is a long established fact that a reader will be distracted.</p>
      </div>

      <div className="space-y-4">
        {connectedAccounts.map((account, index) => {
          const IconComponent = account.icon
          return (
            <div
              key={`${account.name}-${index}`}
              className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                  <IconComponent className="w-5 h-5 text-gray-300" />
                </div>
                <div>
                  <div className="text-white font-medium">{account.name}</div>
                  <div className="text-gray-400 text-sm">{account.email}</div>
                </div>
              </div>
              <Button
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white bg-transparent"
              >
                Remove
              </Button>
            </div>
          )
        })}
      </div>

      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Available connections</h3>
        <div className="space-y-4">
          {availableConnections.map((connection) => {
            const IconComponent = connection.icon
            return (
              <div
                key={connection.name}
                className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                    <IconComponent className="w-5 h-5 text-gray-300" />
                  </div>
                  <div>
                    <div className="text-white font-medium">{connection.name}</div>
                    <div className="text-gray-400 text-sm">{connection.email}</div>
                  </div>
                </div>
                <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">Connect</Button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
