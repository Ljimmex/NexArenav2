'use client'

import { Button } from './ui/button'
import Link from 'next/link'
import { useAdmin } from '@/lib/hooks/useAdmin'

export function Hero() {
  const { canCreateTournament } = useAdmin()
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Zarządzaj turniejami</span>
            <span className="block text-blue-600">e-sportowymi</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Profesjonalna platforma do tworzenia, zarządzania i oglądania turniejów e-sportowych. 
            Swiss, Single Elimination i więcej formatów w jednym miejscu.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <Link href="/tournaments">
                <Button size="lg" className="w-full">
                  Przeglądaj turnieje
                </Button>
              </Link>
            </div>
            {canCreateTournament && (
              <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                <Link href="/tournaments/create">
                  <Button variant="outline" size="lg" className="w-full">
                    Stwórz turniej
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
