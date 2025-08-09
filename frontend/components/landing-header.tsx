'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  Trophy, 
  Menu, 
  X, 
  LogIn, 
  UserPlus,
  Gamepad2,
  Users,
  Star
} from 'lucide-react'

export function LandingHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  return (
    <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="relative">
              <Trophy className="h-8 w-8 text-cyan-400" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-pulse" />
            </div>
            <span className="text-xl font-bold">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Esports
              </span>
              <span className="text-white ml-1">Hub</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="#features" 
              className="text-gray-300 hover:text-cyan-400 transition-colors font-medium"
            >
              Funkcje
            </Link>
            <Link 
              href="#tournaments" 
              className="text-gray-300 hover:text-cyan-400 transition-colors font-medium"
            >
              Turnieje
            </Link>
            <Link 
              href="#games" 
              className="text-gray-300 hover:text-cyan-400 transition-colors font-medium"
            >
              Gry
            </Link>
            <Link 
              href="#about" 
              className="text-gray-300 hover:text-cyan-400 transition-colors font-medium"
            >
              O nas
            </Link>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/auth/login">
              <Button 
                variant="ghost" 
                className="text-gray-300 hover:text-white hover:bg-gray-800"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Zaloguj się
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white">
                <UserPlus className="h-4 w-4 mr-2" />
                Zarejestruj się
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-[#111111] rounded-lg mt-2 border border-gray-800">
              <Link
                href="#features"
                className="block px-3 py-2 text-gray-300 hover:text-cyan-400 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="flex items-center">
                  <Star className="h-4 w-4 mr-2" />
                  Funkcje
                </div>
              </Link>
              <Link
                href="#tournaments"
                className="block px-3 py-2 text-gray-300 hover:text-cyan-400 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="flex items-center">
                  <Trophy className="h-4 w-4 mr-2" />
                  Turnieje
                </div>
              </Link>
              <Link
                href="#games"
                className="block px-3 py-2 text-gray-300 hover:text-cyan-400 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="flex items-center">
                  <Gamepad2 className="h-4 w-4 mr-2" />
                  Gry
                </div>
              </Link>
              <Link
                href="#about"
                className="block px-3 py-2 text-gray-300 hover:text-cyan-400 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  O nas
                </div>
              </Link>
              
              <div className="border-t border-gray-700 pt-3 mt-3 space-y-2">
                <Link href="/auth/login" onClick={() => setIsMenuOpen(false)}>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Zaloguj się
                  </Button>
                </Link>
                <Link href="/auth/register" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Zarejestruj się
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}