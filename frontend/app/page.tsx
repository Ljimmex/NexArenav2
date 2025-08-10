'use client'

import { useEffect } from 'react'
import { LandingHeader } from '@/components/landing-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Trophy, 
  Users, 
  Crown,
  Gamepad2,
  Star,
  Shield,
  Zap,
  Target,
  ArrowRight,
  Play,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/lib/auth/auth-context'
import { useRouter } from 'next/navigation'

const features = [
    {
      icon: Gamepad2,
      title: "Różnorodne gry",
      description: "CS2, League of Legends, Valorant i wiele innych popularnych tytułów e-sportowych.",
      gradient: "from-cyan-500 to-blue-600"
    },
    {
      icon: Trophy,
      title: "Atrakcyjne nagrody",
      description: "Walcz o nagrody pieniężne, sprzęt gamingowy i prestiżowe tytuły.",
      gradient: "from-green-500 to-emerald-600"
    },
    {
      icon: Star,
      title: "Profesjonalna organizacja",
      description: "Doświadczeni organizatorzy zapewniają najwyższą jakość rozgrywek.",
      gradient: "from-purple-500 to-pink-600"
    },
    {
      icon: Shield,
      title: "Bezpieczna platforma",
      description: "Zaawansowane systemy zabezpieczeń i fair play dla wszystkich graczy.",
      gradient: "from-orange-500 to-red-600"
    },
    {
      icon: Zap,
      title: "Szybkie rozgrywki",
      description: "Automatyczne systemy zarządzania turniejami i błyskawiczne wyniki.",
      gradient: "from-yellow-500 to-orange-600"
    },
    {
      icon: Target,
      title: "Ranking i statystyki",
      description: "Śledź swoje postępy i rywalizuj o najwyższe pozycje w rankingach.",
      gradient: "from-indigo-500 to-purple-600"
    }
  ]

  const benefits = [
    "Darmowa rejestracja i uczestnictwo w turniejach",
    "Profesjonalne wsparcie techniczne 24/7",
    "Regularne turnieje z atrakcyjnymi nagrodami",
    "Społeczność ponad 10,000 aktywnych graczy",
    "Zaawansowane systemy antyoszukańcze",
    "Możliwość tworzenia własnych drużyn"
  ]

export default function LandingPage() {
  const { user } = useAuth()
  const router = useRouter()

  // Redirect authenticated users to main page
  useEffect(() => {
    if (user) {
      router.push('/main')
    }
  }, [user, router])

  // Don't render landing page for authenticated users
  if (user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Przekierowywanie...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <LandingHeader />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              Przyszłość E-sportu
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              Dołącz do największej platformy turniejów e-sportowych w Polsce. 
              Rywalizuj z najlepszymi, wygrywaj nagrody i buduj swoją legendę w świecie gier.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/auth/register">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-lg px-10 py-4 h-auto font-semibold shadow-lg hover:shadow-cyan-500/25 transition-all duration-300"
                >
                  <Play className="h-6 w-6 mr-3" />
                  Zacznij grać już dziś
                </Button>
              </Link>
              <Link href="/tournaments">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black text-lg px-10 py-4 h-auto font-semibold transition-all duration-300"
                >
                  <Trophy className="h-6 w-6 mr-3" />
                  Przeglądaj turnieje
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-[#111111]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Trophy className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-4xl font-bold text-white mb-3">500+</h3>
              <p className="text-gray-400 text-lg">Aktywnych turniejów miesięcznie</p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Users className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-4xl font-bold text-white mb-3">10,000+</h3>
              <p className="text-gray-400 text-lg">Zarejestrowanych graczy</p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-r from-yellow-500 to-orange-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Crown className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-4xl font-bold text-white mb-3">1M+</h3>
              <p className="text-gray-400 text-lg">PLN wypłaconych nagród</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Dlaczego warto wybrać naszą platformę?
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Oferujemy kompletne rozwiązanie dla graczy e-sportowych na każdym poziomie zaawansowania
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="bg-[#1a1a1a] border-gray-800 hover:border-cyan-400/50 transition-all duration-300 group hover:transform hover:scale-105"
              >
                <CardContent className="p-8 text-center">
                  <div className={`bg-gradient-to-r ${feature.gradient} w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-lg transition-all duration-300`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-cyan-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-[#111111]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
                Wszystko czego potrzebujesz w jednym miejscu
              </h2>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300 text-lg">{benefit}</span>
                  </div>
                ))}
              </div>
              <div className="mt-10">
                <Link href="/auth/register">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-lg px-8 py-4 h-auto font-semibold"
                  >
                    Dołącz do nas bezpłatnie
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-2xl p-8 backdrop-blur-sm border border-gray-800">
                <div className="text-center">
                  <Trophy className="h-24 w-24 text-cyan-400 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Gotowy na wyzwanie?
                  </h3>
                  <p className="text-gray-300 mb-6">
                    Dołącz do tysięcy graczy, którzy już budują swoje e-sportowe kariery na naszej platformie.
                  </p>
                  <div className="bg-[#0a0a0a] rounded-lg p-4 border border-gray-700">
                    <p className="text-cyan-400 font-semibold text-lg">
                      Następny turniej startuje już za:
                    </p>
                    <p className="text-white text-2xl font-bold mt-2">
                      2 dni 14 godzin
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
            Rozpocznij swoją e-sportową przygodę
          </h2>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Rejestracja zajmuje mniej niż minutę. Już dziś możesz uczestniczyć w swoim pierwszym turnieju!
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/auth/register">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-lg px-12 py-4 h-auto font-semibold shadow-xl hover:shadow-cyan-500/25 transition-all duration-300"
              >
                Zarejestruj się teraz
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button 
                variant="outline" 
                size="lg" 
                className="border-2 border-gray-600 text-gray-300 hover:border-cyan-400 hover:text-cyan-400 text-lg px-12 py-4 h-auto font-semibold transition-all duration-300"
              >
                Mam już konto
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#111111] border-t border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <Image
                src="/logos/LogoText.png"
                alt="NexArena Logo"
                width={120}
                height={32}
                className="h-8 w-auto object-contain"
              />
            </div>
            <p className="text-gray-400 mb-6">
              Największa platforma turniejów e-sportowych w Polsce
            </p>
            <div className="flex justify-center space-x-8 text-sm text-gray-500">
              <Link href="/privacy" className="hover:text-cyan-400 transition-colors">
                Polityka prywatności
              </Link>
              <Link href="/terms" className="hover:text-cyan-400 transition-colors">
                Regulamin
              </Link>
              <Link href="/contact" className="hover:text-cyan-400 transition-colors">
                Kontakt
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
