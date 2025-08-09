# Esports Tournament Management Platform

Profesjonalna platforma do zarządzania turniejami e-sportowymi z rozbudowanym systemem formatów turniejowych, rankingów i obsługi ról.

## 🚀 Funkcjonalności

- **Formaty turniejowe**: Swiss, Single Elimination, Round Robin
- **System autoryzacji**: Google, Discord, Steam OAuth
- **Zarządzanie drużynami**: Rejestracja, profile, statystyki
- **Live updates**: WebSocket dla meczów i czatu
- **System zakładów**: Tokeny (darmowe)
- **Panel administracyjny**: Zarządzanie turniejami i użytkownikami
- **Ranking system**: Globalne rankingi graczy i drużyn

## 🛠️ Stos technologiczny

### Frontend
- **Next.js 14** (App Router)
- **TypeScript**
- **TailwindCSS**
- **React Query** (TanStack Query)
- **Zustand** (stan globalny)
- **React Hook Form** + **Zod**

### Backend
- **NestJS** (TypeScript)
- **MongoDB** + **Mongoose**
- **Redis** (cache, pub/sub)
- **Socket.IO** (WebSocket)
- **JWT** + **Passport.js**
- **Swagger** (dokumentacja API)

## 📦 Instalacja i uruchomienie

### Wymagania
- Node.js 18+
- Docker i Docker Compose
- MongoDB (lokalnie lub Atlas)
- Redis (opcjonalnie)

### Szybki start z Docker

1. **Klonuj repozytorium**
```bash
git clone <repository-url>
cd esports-tournament-management
```

2. **Skonfiguruj zmienne środowiskowe**
```bash
cp env.example .env
# Edytuj .env z odpowiednimi wartościami
```

3. **Uruchom z Docker Compose**
```bash
docker-compose up -d
```

Aplikacja będzie dostępna pod adresami:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Swagger docs: http://localhost:3001/api/docs

### Instalacja lokalna

1. **Instaluj zależności**
```bash
npm install
npm run install:all
```

2. **Uruchom MongoDB i Redis**
```bash
# Opcja 1: Docker
docker-compose up mongodb redis -d

# Opcja 2: Lokalnie
# Zainstaluj i uruchom MongoDB oraz Redis
```

3. **Uruchom aplikację**
```bash
# Development (oba serwisy)
npm run dev

# Lub osobno
npm run dev:frontend
npm run dev:backend
```

## 📁 Struktura projektu

```
├── frontend/                 # Next.js aplikacja
│   ├── app/                 # App Router
│   ├── components/          # Komponenty React
│   ├── lib/                 # Utility functions
│   ├── types/               # TypeScript types
│   └── store/               # Zustand stores
├── backend/                 # NestJS API
│   ├── src/
│   │   ├── modules/         # Feature modules
│   │   ├── common/          # Shared utilities
│   │   └── types/           # TypeScript types
│   └── test/                # Tests
├── docs/                    # Dokumentacja
└── scripts/                 # Utility scripts
```

## 🔧 Konfiguracja

### Zmienne środowiskowe

Skopiuj `env.example` do `.env` i skonfiguruj:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/esports-tournaments
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
STEAM_API_KEY=your-steam-api-key

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## 🧪 Testy

```bash
# Wszystkie testy
npm run test

# Frontend testy
npm run test --workspace=frontend

# Backend testy
npm run test --workspace=backend

# E2E testy
npm run test:e2e --workspace=frontend
```

## 📚 API Dokumentacja

Po uruchomieniu backendu, dokumentacja Swagger jest dostępna pod adresem:
http://localhost:3001/api/docs

## 🚀 Deployment

### Frontend (Vercel)
```bash
npm run build --workspace=frontend
```

### Backend (Render/Fly.io)
```bash
npm run build --workspace=backend
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 Licencja

Ten projekt jest licencjonowany pod MIT License - zobacz [LICENSE](LICENSE) dla szczegółów.

## 📞 Support

- 📧 Email: support@esports-tournaments.com
- 💬 Discord: [Join our server](https://discord.gg/esports-tournaments)
- 📖 Dokumentacja: [docs/](docs/)

---

**Made with ❤️ for the esports community**