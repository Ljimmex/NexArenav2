import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AuthCodeError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Błąd autoryzacji
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Wystąpił problem podczas logowania. Spróbuj ponownie.
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <Button asChild className="w-full">
            <Link href="/auth/login">
              Spróbuj ponownie
            </Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href="/">
              Wróć do strony głównej
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}