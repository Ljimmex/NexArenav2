import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Esports Tournament Management',
  description: 'Platforma do zarządzania turniejami e-sportowymi',
  icons: {
    icon: '/icons/app-icon.png',
    shortcut: '/icons/app-icon.png',
    apple: '/icons/app-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pl" className="dark">
      <body className={`${inter.className} bg-gray-950 text-white`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
