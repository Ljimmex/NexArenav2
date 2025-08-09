'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth/auth-context'
import { MessageCircle, Mail } from 'lucide-react'
import Link from 'next/link'


const registerSchema = z.object({
  username: z.string().min(3, 'Nazwa użytkownika musi mieć co najmniej 3 znaki'),
  email: z.string().email('Nieprawidłowy adres email'),
  password: z.string().min(6, 'Hasło musi mieć co najmniej 6 znaków'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Hasła nie są identyczne",
  path: ["confirmPassword"],
})

type RegisterFormData = z.infer<typeof registerSchema>

export function RegisterForm() {
  const { signUpWithEmail, signInWithProvider, loading } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsSubmitting(true)
      await signUpWithEmail(data.email, data.password, data.username)
      // Po udanej rejestracji użytkownik musi potwierdzić email
      // Przekierowanie nastąpi automatycznie po potwierdzeniu
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
      // Error is handled in auth context
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Utwórz konto</CardTitle>
        <CardDescription className="text-center">
          Wybierz sposób rejestracji nowego konta
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
            Zarejestruj przez Google
          </Button>
          <Button
            variant="outline"
            onClick={() => handleProviderLogin('discord')}
            disabled={loading}
            className="w-full"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Zarejestruj przez Discord
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
            <Label htmlFor="username">Nazwa użytkownika</Label>
            <Input
              id="username"
              type="text"
              placeholder="twoja_nazwa"
              {...register('username')}
              disabled={isSubmitting || loading}
            />
            {errors.username && (
              <p className="text-sm text-red-600">{errors.username.message}</p>
            )}
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...register('confirmPassword')}
              disabled={isSubmitting || loading}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || loading}
          >
            {isSubmitting ? 'Rejestracja...' : 'Utwórz konto'}
          </Button>
        </form>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Masz już konto? </span>
          <Link href="/auth/login" className="text-primary hover:underline">
            Zaloguj się
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}