"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import { User, Lock, CreditCard, RefreshCw, Link, Bell } from "lucide-react"

type TabKey = "profile" | "password" | "payment" | "subscriptions" | "connections" | "notifications"

export function ProfileEditSidebar({
  activeTab,
  onChangeTab,
}: { activeTab: TabKey; onChangeTab: (k: TabKey) => void }) {
  const items: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "profile", label: "My account", icon: User },
    { key: "password", label: "Password", icon: Lock },
    { key: "payment", label: "Payment Methods", icon: CreditCard },
    { key: "subscriptions", label: "Subscriptions", icon: RefreshCw },
    { key: "connections", label: "Connections", icon: Link },
    { key: "notifications", label: "Notifications", icon: Bell },
  ]

  return (
    <aside className="w-64 shrink-0 bg-[#0a0f14] border-r border-gray-800 p-6 hidden md:block">
      <nav className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.key}
              onClick={() => onChangeTab(item.key)}
              className={cn(
                "w-full flex items-center gap-3 text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                "hover:bg-gray-800/50",
                activeTab === item.key
                  ? "bg-cyan-500/10 text-cyan-400 border-r-2 border-cyan-400"
                  : "text-gray-300 hover:text-gray-100",
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {item.label}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
