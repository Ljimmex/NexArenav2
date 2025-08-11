'use client'

import { GroupInfo } from "@/lib/api/brackets"

interface GroupSelectorProps {
  groups: GroupInfo[]
  selectedGroup: string | null
  onGroupChange: (groupId: string | null) => void
  loading?: boolean
}

export function GroupSelector({ groups, selectedGroup, onGroupChange, loading }: GroupSelectorProps) {
  if (loading) {
    return (
      <div className="flex gap-2">
        <div className="px-4 py-2 bg-gray-700 text-gray-400 rounded-lg">
          Ładowanie grup...
        </div>
      </div>
    )
  }

  if (!groups || groups.length === 0) {
    return null
  }

  return (
    <div className="flex gap-2">
      {groups.map((group) => (
        <button
          key={group.group_id}
          onClick={() => onGroupChange(group.group_id)}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            selectedGroup === group.group_id
              ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
          }`}
        >
          Grupa {group.group_name}
        </button>
      ))}
    </div>
  )
}