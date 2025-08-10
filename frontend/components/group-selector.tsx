'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
      <div className="w-48">
        <Select disabled>
          <SelectTrigger className="bg-[#2a2a2a] border-gray-600 text-white">
            <SelectValue placeholder="Ładowanie grup..." />
          </SelectTrigger>
        </Select>
      </div>
    )
  }

  if (!groups || groups.length === 0) {
    return null
  }

  return (
    <div className="w-48">
      <Select value={selectedGroup || "all"} onValueChange={(value) => onGroupChange(value === "all" ? null : value)}>
        <SelectTrigger className="bg-[#2a2a2a] border-gray-600 text-white">
          <SelectValue placeholder="Wybierz grupę" />
        </SelectTrigger>
        <SelectContent className="bg-[#2a2a2a] border-gray-600">
          <SelectItem value="all" className="text-white hover:bg-[#3a3a3a]">
            Wszystkie grupy
          </SelectItem>
          {groups.map((group) => (
            <SelectItem 
              key={group.group_id} 
              value={group.group_id}
              className="text-white hover:bg-[#3a3a3a]"
            >
              Grupa {group.group_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}