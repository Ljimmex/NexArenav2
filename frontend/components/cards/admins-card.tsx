"use client"

import React, { useEffect, useState } from "react"
import Image from "next/image"
import { Shield, MoreHorizontal } from "lucide-react"
import { User, UserService } from "@/lib/api/user-service"

interface AdminsCardProps {
  title?: string
  moderatorIds: string[]
}

export const AdminsCard: React.FC<AdminsCardProps> = ({ title = "Admins", moderatorIds }) => {
  const [admins, setAdmins] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchAdmins = async () => {
      if (!moderatorIds || moderatorIds.length === 0) {
        setAdmins([])
        return
      }
      try {
        setLoading(true)
        const results = await Promise.allSettled(moderatorIds.map(id => UserService.getUserById(id)))
        const users: User[] = results
          .filter(r => r.status === "fulfilled")
          .map((r: any) => r.value as User)
        setAdmins(users)
      } catch (e) {
        console.error("Failed to load admins", e)
      } finally {
        setLoading(false)
      }
    }
    fetchAdmins()
  }, [moderatorIds])

  return (
    <div className="bg-gray-800/60 rounded-xl p-5 border border-gray-700/50 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-7 w-7 rounded-md bg-gray-700/60 flex items-center justify-center">
          <Shield className="h-4 w-4 text-cyan-300" />
        </div>
        <h3 className="text-white font-semibold tracking-tight">{title} {admins.length ? `(${admins.length})` : ""}</h3>
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm">Loading admins...</div>
      ) : admins.length === 0 ? (
        <div className="text-gray-400 text-sm">No admins assigned.</div>
      ) : (
        <div className="space-y-3">
          {admins.slice(0, 5).map((u) => (
            <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/80 border border-gray-700/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700/60 border border-gray-700">
                  {u.avatar_url ? (
                    <Image src={u.avatar_url} alt={u.display_name || u.username} width={40} height={40} className="object-cover w-10 h-10" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">{(u.display_name || u.username || '?').slice(0,1)}</div>
                  )}
                </div>
                <div>
                  <div className="text-white font-semibold leading-tight">{u.display_name || u.username}</div>
                  <div className="text-xs text-gray-400">{u.role || "Staff"}</div>
                </div>
              </div>
              <MoreHorizontal className="h-5 w-5 text-gray-400" />
            </div>
          ))}
          {admins.length > 5 && (
            <button className="w-full py-2 text-sm rounded-lg bg-gray-800/80 border border-gray-700/40 text-white hover:bg-gray-700/50">Show all</button>
          )}
        </div>
      )}
    </div>
  )
}