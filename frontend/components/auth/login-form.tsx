'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle, Mail } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const loginSchema = z.object({
  email: z.string().email('Nieprawidłowy adres email'),
  password: z.string().min(6, 'Hasło musi mieć co najmniej 6 znaków'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const { signInWithEmail, signInWithProvider, loading } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsSubmitting(true)
      await signInWithEmail(data.email, data.password)
      // Przekieruj na stronę główną po udanym logowaniu
      router.push('/')
    } catch (error) {
      // Error is handled in auth context
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleProviderLogin = async (provider: 'google' | 'discord' | 'github') => {
    try {
      await signInWithProvider(provider)
      // Przekierowanie będzie obsłużone przez callback page
    } catch (error) {
      toast.error('Błąd podczas logowania przez ' + provider)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Zaloguj się</CardTitle>
        <CardDescription className="text-center">
          Wybierz sposób logowania do swojego konta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* OAuth Providers */}
        <div className="grid grid-cols-1 gap-3">
          <Button
            variant="outline"
            onClick={() => handleProviderLogin('google')}
            disabled={loading}
            className="w-full"
          >
            <Mail className="mr-2 h-4 w-4" />
            Zaloguj przez Google
          </Button>
          <Button
            variant="outline"
            onClick={() => handleProviderLogin('discord')}
            disabled={loading}
            className="w-full"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Zaloguj przez Discord
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Lub kontynuuj z emailem
            </span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="twoj@email.com"
              {...register('email')}
              disabled={isSubmitting || loading}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Hasło</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              disabled={isSubmitting || loading}
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || loading}
          >
            {isSubmitting ? 'Logowanie...' : 'Zaloguj się'}
          </Button>
        </form>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Nie masz konta? </span>
          <Link href="/auth/register" className="text-primary hover:underline">
            Zarejestruj się
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}