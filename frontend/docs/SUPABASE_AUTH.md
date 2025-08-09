# Supabase Authentication Implementation

## Przegląd

Implementacja systemu autoryzacji opartego na Supabase z obsługą:
- Logowanie/rejestracja email + hasło
- OAuth providers (Google, Discord, GitHub)
- Steam OpenID authentication
- Zarządzanie sesjami
- Aktualizacja profilu użytkownika
- Łączenie kont Steam z profilami użytkowników

## Struktura plików

```
frontend/
├── lib/auth/
│   ├── auth-context.tsx          # Context i hook useAuth
│   └── steam-provider.ts         # Steam OpenID provider
├── components/auth/
│   ├── login-form.tsx            # Formularz logowania
│   ├── register-form.tsx         # Formularz rejestracji
│   ├── user-profile.tsx          # Komponent profilu
│   └── steam-connection.tsx      # Zarządzanie połączeniem Steam
├── app/auth/
│   ├── login/page.tsx            # Strona logowania
│   ├── register/page.tsx         # Strona rejestracji
│   ├── callback/route.ts         # OAuth callback handler
│   ├── steam/callback/page.tsx   # Steam callback handler
│   └── auth-code-error/page.tsx  # Strona błędów OAuth
├── app/api/steam/
│   └── user-info/route.ts        # API proxy dla Steam API
└── app/profile/page.tsx          # Strona profilu użytkownika
```

## Konfiguracja

### 1. Zmienne środowiskowe (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_STEAM_API_KEY=your_steam_api_key
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
```

### 2. Konfiguracja OAuth w Supabase Dashboard

#### Google OAuth:
1. Idź do Authentication > Providers > Google
2. Włącz Google provider
3. Dodaj Client ID i Client Secret z Google Cloud Console
4. Redirect URL: `https://your-project.supabase.co/auth/v1/callback`

#### Discord OAuth:
1. Idź do Authentication > Providers > Discord
2. Włącz Discord provider
3. Dodaj Client ID i Client Secret z Discord Developer Portal
4. Redirect URL: `https://your-project.supabase.co/auth/v1/callback`

#### GitHub OAuth:
1. Idź do Authentication > Providers > GitHub
2. Włącz GitHub provider
3. Dodaj Client ID i Client Secret z GitHub Developer Settings
4. Redirect URL: `https://your-project.supabase.co/auth/v1/callback`

#### Steam OpenID:
1. Uzyskaj Steam Web API Key z https://steamcommunity.com/dev/apikey
2. Dodaj klucz do zmiennych środowiskowych jako `NEXT_PUBLIC_STEAM_API_KEY`
3. Steam używa OpenID, więc nie wymaga konfiguracji w Supabase Dashboard
4. Return URL: `http://localhost:3000/auth/steam/callback` (development)

### 3. URL Redirects w Supabase

W Authentication > URL Configuration:
- Site URL: `http://localhost:3000` (development)
- Redirect URLs: 
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/auth/auth-code-error`

## Użycie

### AuthContext

```tsx
import { useAuth } from '@/lib/auth/auth-context'

function MyComponent() {
  const { 
    user, 
    loading, 
    signInWithEmail, 
    signUpWithEmail, 
    signInWithProvider, 
    signOut, 
    updateProfile 
  } = useAuth()

  // Sprawdź czy użytkownik jest zalogowany
  if (user) {
    return <div>Witaj, {user.email}!</div>
  }

  return <div>Nie jesteś zalogowany</div>
}
```

### Logowanie z email

```tsx
const handleLogin = async (email: string, password: string) => {
  try {
    await signInWithEmail(email, password)
    // Przekierowanie nastąpi automatycznie
  } catch (error) {
    console.error('Błąd logowania:', error)
  }
}
```

### Logowanie z OAuth

```tsx
const handleOAuthLogin = async (provider: 'google' | 'discord' | 'github') => {
  try {
    await signInWithProvider(provider)
    // Przekierowanie do providera nastąpi automatycznie
  } catch (error) {
    console.error('Błąd OAuth:', error)
  }
}
```

### Logowanie z Steam

```tsx
import { steamAuth } from '@/lib/auth/steam-provider'

const handleSteamLogin = async () => {
  try {
    await steamAuth.signInWithSteam()
    // Przekierowanie do Steam nastąpi automatycznie
  } catch (error) {
    console.error('Błąd Steam:', error)
  }
}
```

### Zarządzanie połączeniem Steam

```tsx
import { steamAuth } from '@/lib/auth/steam-provider'

// Sprawdź czy Steam jest połączony
const isLinked = await steamAuth.hasSteamLinked()

// Pobierz dane Steam
const steamData = await steamAuth.getSteamData()

// Odłącz konto Steam
await steamAuth.unlinkSteamAccount()
```

### Rejestracja

```tsx
const handleRegister = async (email: string, password: string, username: string) => {
  try {
    await signUpWithEmail(email, password, { username })
    // Sprawdź email w celu potwierdzenia konta
  } catch (error) {
    console.error('Błąd rejestracji:', error)
  }
}
```

### Aktualizacja profilu

```tsx
const handleUpdateProfile = async (data: { username?: string, fullName?: string }) => {
  try {
    await updateProfile(data)
    toast.success('Profil zaktualizowany')
  } catch (error) {
    toast.error('Błąd aktualizacji profilu')
  }
}
```

## Komponenty

### LoginForm
- Formularz logowania z email/hasło
- Przyciski OAuth providers
- Walidacja formularza
- Obsługa błędów

### RegisterForm
- Formularz rejestracji z email/hasło/username
- Przyciski OAuth providers
- Walidacja formularza
- Obsługa błędów

### UserProfile
- Wyświetlanie informacji o użytkowniku
- Edycja profilu (username, full name)
- Informacje o koncie (data rejestracji, provider)

## Middleware

Middleware automatycznie odświeża sesje użytkowników na każdym żądaniu:

```typescript
// middleware.ts
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}
```

## Bezpieczeństwo

1. **Row Level Security (RLS)**: Włączone w bazie danych
2. **Secure cookies**: Sesje przechowywane w bezpiecznych cookies
3. **HTTPS only**: W produkcji używaj tylko HTTPS
4. **Environment variables**: Nigdy nie commituj kluczy do repo

## Testowanie

### Testowanie email auth:
1. Idź na `/auth/register`
2. Zarejestruj się z email/hasło
3. Sprawdź email w celu potwierdzenia
4. Zaloguj się na `/auth/login`

### Testowanie OAuth:
1. Skonfiguruj providers w Supabase Dashboard
2. Idź na `/auth/login`
3. Kliknij przycisk providera
4. Autoryzuj aplikację
5. Sprawdź czy zostałeś przekierowany z powrotem

## Rozwiązywanie problemów

### Błąd "Invalid login credentials"
- Sprawdź czy email/hasło są poprawne
- Sprawdź czy konto zostało potwierdzone

### Błąd OAuth callback
- Sprawdź konfigurację redirect URLs
- Sprawdź Client ID/Secret w Supabase Dashboard
- Sprawdź czy provider jest włączony

### Błąd "User not found"
- Sprawdź czy użytkownik istnieje w Supabase Auth
- Sprawdź czy RLS policies pozwalają na dostęp

### Problemy z sesjami
- Sprawdź middleware configuration
- Sprawdź czy cookies są ustawione poprawnie
- Sprawdź network tab w dev tools