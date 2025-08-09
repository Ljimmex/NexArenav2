'use client'

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface TournamentNavigationProps {
  activeTab: string
  onTabChange: (value: string) => void
}

export function TournamentNavigation({ activeTab, onTabChange }: TournamentNavigationProps) {
  return (
    <div className=" border-gray-700">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-0">
        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="bg-gray-800/50 p-0 gap-6 w-full justify-start">
        <TabsTrigger 
          value="overview" 
          className="py-2 px-6 text-gray-400 data-[state=active]:text-white data-[state=active]:border-b data-[state=active]:border-blue-600 transition-colors duration-200 bg-transparent data-[state=active]:bg-transparent border-0 rounded-none"
        >
          Overview
        </TabsTrigger>
        <TabsTrigger 
          value="brackets" 
          className="py-2 px-6 text-gray-400 data-[state=active]:text-white data-[state=active]:border-b data-[state=active]:border-blue-600 transition-colors duration-200 bg-transparent data-[state=active]:bg-transparent border-0 rounded-none"
        >
          Brackets
        </TabsTrigger>
        <TabsTrigger 
          value="matches" 
          className="py-2 px-6 text-gray-400 data-[state=active]:text-white data-[state=active]:border-b data-[state=active]:border-blue-600 transition-colors duration-200 bg-transparent data-[state=active]:bg-transparent border-0 rounded-none"
        >
          Matches
        </TabsTrigger>
        <TabsTrigger 
          value="teams" 
          className="py-2 px-6 text-gray-400 data-[state=active]:text-white data-[state=active]:border-b data-[state=active]:border-blue-600 transition-colors duration-200 bg-transparent data-[state=active]:bg-transparent border-0 rounded-none"
        >
          Teams
        </TabsTrigger>
        <TabsTrigger 
          value="prizes" 
          className="py-2 px-6 text-gray-400 data-[state=active]:text-white data-[state=active]:border-b data-[state=active]:border-blue-600 transition-colors duration-200 bg-transparent data-[state=active]:bg-transparent border-0 rounded-none"
        >
          Prizes
        </TabsTrigger>
        </TabsList>
        </Tabs>
      </div>
    </div>
  )
}