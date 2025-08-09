# Nowy Schemat Bazy Danych - Esports Tournament System

## 📋 Przegląd

Ten dokument opisuje kompletnie przeprojektowany schemat bazy danych dla systemu turniejów esportowych, stworzony od podstaw z pełną integracją z Supabase Auth.

## 🎯 Główne Założenia Projektowe

### 1. **Pełna Integracja z Supabase Auth**
- Tabela `users` jest synchronizowana z `auth.users` przez triggery
- Automatyczne tworzenie profili użytkowników przy rejestracji
- Bezpieczne usuwanie danych przy usunięciu konta

### 2. **Bezpieczeństwo i RLS**
- Row Level Security (RLS) włączone na wszystkich tabelach
- Szczegółowe polityki dostępu dla każdej tabeli
- Ochrona danych osobowych i prywatności

### 3. **Wydajność i Skalowalność**
- Przemyślane indeksy dla najczęściej używanych zapytań
- Optymalizacja dla dużej liczby użytkowników i turniejów
- JSONB dla elastycznych danych konfiguracyjnych

### 4. **Elastyczność i Rozszerzalność**
- Wsparcie dla różnych typów gier i formatów turniejów
- Konfigurowalne ustawienia turniejów
- Możliwość łatwego dodawania nowych funkcji

## 🗂️ Struktura Tabel

### 👤 **Moduł Użytkowników**

#### `users` - Główna tabela użytkowników
```sql
- id (UUID, PK)
- supabase_user_id (UUID, UNIQUE) -- Klucz do auth.users
- username (TEXT, UNIQUE)
- display_name (TEXT)
- email (TEXT, UNIQUE)
- avatar_url (TEXT)
- bio (TEXT)
- country, city (TEXT)
- date_of_birth (DATE)
- role (UserRole ENUM)
- is_active, is_verified (BOOLEAN)
- last_seen_at (TIMESTAMP)
- created_at, updated_at (TIMESTAMP)
```

#### `user_stats` - Statystyki użytkowników
```sql
- user_id (UUID, FK -> users.id)
- games_played, games_won, games_lost (INTEGER)
- tournaments_played, tournaments_won (INTEGER)
- current_rating, peak_rating (INTEGER)
- total_playtime_hours (INTEGER)
- favorite_game (GameType ENUM)
```

#### `user_settings` - Ustawienia użytkowników
```sql
- user_id (UUID, FK -> users.id)
- notifications_enabled (BOOLEAN)
- email_notifications (BOOLEAN)
- tournament_invites, team_invites (BOOLEAN)
- match_reminders (BOOLEAN)
- locale, timezone (TEXT)
- theme (TEXT)
- privacy_profile, privacy_stats (BOOLEAN)
```

### 👥 **Moduł Drużyn**

#### `teams` - Drużyny
```sql
- id (UUID, PK)
- name (TEXT)
- tag (TEXT, UNIQUE)
- description (TEXT)
- logo_url, banner_url (TEXT)
- website, discord_invite (TEXT)
- primary_game (GameType ENUM)
- region (TEXT)
- is_recruiting, is_verified (BOOLEAN)
- created_by (UUID, FK -> users.id)
```

#### `team_members` - Członkowie drużyn
```sql
- team_id (UUID, FK -> teams.id)
- user_id (UUID, FK -> users.id)
- role (TeamRole ENUM)
- joined_at (TIMESTAMP)
- is_active (BOOLEAN)
```

#### `team_stats` - Statystyki drużyn
```sql
- team_id (UUID, FK -> teams.id)
- matches_played, matches_won, matches_lost (INTEGER)
- tournaments_played, tournaments_won (INTEGER)
- current_rating, peak_rating (INTEGER)
- win_streak, best_win_streak (INTEGER)
```

### 🏆 **Moduł Turniejów**

#### `tournaments` - Turnieje
```sql
- id (UUID, PK)
- title, description (TEXT)
- game_type (GameType ENUM)
- tournament_type (TournamentType ENUM)
- status (TournamentStatus ENUM)
- seeding_mode (SeedingMode ENUM)
- registration_start/end (TIMESTAMP)
- tournament_start/end (TIMESTAMP)
- max_teams, min_teams, team_size (INTEGER)
- entry_fee, prize_pool (DECIMAL)
- is_public, requires_approval (BOOLEAN)
- rules (TEXT)
- format_settings, bracket_data (JSONB)
- organizer_id (UUID, FK -> users.id)
- moderators (UUID[])
```

#### `tournament_teams` - Drużyny w turniejach
```sql
- tournament_id (UUID, FK -> tournaments.id)
- team_id (UUID, FK -> teams.id)
- status (TournamentTeamStatus ENUM)
- seed (INTEGER)
- group_id (TEXT)
- registration_date (TIMESTAMP)
- approved_by (UUID, FK -> users.id)
```

### ⚔️ **Moduł Meczów**

#### `matches` - Mecze
```sql
- id (UUID, PK)
- tournament_id (UUID, FK -> tournaments.id)
- round (INTEGER)
- stage (MatchStage ENUM)
- status (MatchStatus ENUM)
- team1_id, team2_id (UUID, FK -> teams.id)
- winner_id (UUID, FK -> teams.id)
- scheduled_at, started_at, finished_at (TIMESTAMP)
- best_of, current_game (INTEGER)
- team1_score, team2_score (INTEGER)
- detailed_scores (JSONB)
- map_pool (TEXT[])
- map_picks (JSONB)
```

#### `match_games` - Szczegółowe wyniki gier
```sql
- match_id (UUID, FK -> matches.id)
- game_number (INTEGER)
- map_name (TEXT)
- team1_score, team2_score (INTEGER)
- winner_id (UUID, FK -> teams.id)
- duration_minutes (INTEGER)
- started_at, finished_at (TIMESTAMP)
```

### 🔔 **Moduł Pomocniczy**

#### `notifications` - Powiadomienia
```sql
- user_id (UUID, FK -> users.id)
- type (NotificationType ENUM)
- title, message (TEXT)
- data (JSONB)
- is_read (BOOLEAN)
```

#### `support_tickets` - Zgłoszenia wsparcia
```sql
- title, description (TEXT)
- status (TicketStatus ENUM)
- priority (TicketPriority ENUM)
- creator_id (UUID, FK -> users.id)
- assignee_id (UUID, FK -> users.id)
- tournament_id, match_id, team_id (UUID, FK)
```

## 📊 Typy ENUM

### `UserRole`
- `USER` - Zwykły użytkownik
- `ADMIN` - Administrator systemu
- `MODERATOR` - Moderator
- `ORGANIZER` - Organizator turniejów
- `COMMENTATOR` - Komentator

### `TeamRole`
- `CAPTAIN` - Kapitan drużyny
- `PLAYER` - Gracz
- `SUBSTITUTE` - Rezerwowy
- `COACH` - Trener
- `MANAGER` - Menedżer

### `GameType`
- `CS2` - Counter-Strike 2
- `VALORANT` - Valorant
- `LOL` - League of Legends
- `DOTA2` - Dota 2
- `ROCKET_LEAGUE` - Rocket League
- `OVERWATCH` - Overwatch
- `APEX_LEGENDS` - Apex Legends

### `TournamentType`
- `SINGLE_ELIMINATION` - Pojedyncza eliminacja
- `DOUBLE_ELIMINATION` - Podwójna eliminacja
- `ROUND_ROBIN` - Każdy z każdym
- `SWISS` - System szwajcarski
- `GROUP_STAGE` - Faza grupowa

### `TournamentStatus`
- `DRAFT` - Szkic
- `REGISTRATION` - Rejestracja otwarta
- `READY` - Gotowy do rozpoczęcia
- `RUNNING` - W trakcie
- `COMPLETED` - Zakończony
- `CANCELLED` - Anulowany
- `POSTPONED` - Przełożony

## 🔐 Bezpieczeństwo (RLS)

### Polityki Dostępu

#### Użytkownicy
- **Odczyt**: Wszyscy mogą przeglądać profile
- **Aktualizacja**: Tylko własny profil
- **Ustawienia**: Tylko własne ustawienia

#### Drużyny
- **Odczyt**: Publiczne dla wszystkich
- **Tworzenie**: Zalogowani użytkownicy
- **Aktualizacja**: Twórca lub kapitan drużyny
- **Członkowie**: Kapitan zarządza składem

#### Turnieje
- **Odczyt**: Publiczne dla wszystkich
- **Tworzenie**: Zalogowani użytkownicy
- **Aktualizacja**: Organizator turnieju
- **Mecze**: Organizator zarządza meczami

#### Powiadomienia
- **Dostęp**: Tylko własne powiadomienia

#### Wsparcie
- **Dostęp**: Twórca lub przypisany moderator

## 🚀 Funkcje Automatyczne

### Triggery Supabase Auth
- `handle_new_user()` - Automatyczne tworzenie profilu przy rejestracji
- `handle_user_update()` - Synchronizacja zmian z auth.users
- `handle_user_delete()` - Czyszczenie danych przy usunięciu konta

### Triggery Aktualizacji
- Automatyczne aktualizowanie `updated_at` we wszystkich tabelach
- Walidacja spójności danych

## 📈 Optymalizacja Wydajności

### Indeksy
- Wszystkie klucze obce
- Często używane pola filtrowania (status, typ gry, daty)
- Pola używane w sortowaniu i wyszukiwaniu

### JSONB
- Elastyczne przechowywanie konfiguracji turniejów
- Szczegółowe wyniki meczów
- Dane powiadomień

## 🔧 Instalacja

### 1. Zastosowanie Schematu
```bash
# W Supabase SQL Editor lub psql
\i apply-new-schema.sql
```

### 2. Weryfikacja
```sql
-- Sprawdź utworzone tabele
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Sprawdź triggery
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

### 3. Testowanie
```sql
-- Triggery będą automatycznie tworzyć profile
-- po zarejestrowaniu użytkowników przez Supabase Auth
```

## ⚠️ Ważne Uwagi

1. **Backup**: Przed zastosowaniem nowego schematu utwórz kopię zapasową istniejących danych
2. **Supabase Dashboard**: Upewnij się, że URL callback są skonfigurowane na port 3002
3. **Environment**: Sprawdź czy zmienne środowiskowe są aktualne
4. **Testing**: Przetestuj rejestrację i logowanie po zastosowaniu schematu

## 🔄 Migracja z Poprzedniego Schematu

Jeśli masz istniejące dane, które chcesz zachować:

1. Wyeksportuj ważne dane przed zastosowaniem nowego schematu
2. Zastosuj nowy schemat
3. Napisz skrypty migracji dla zachowania danych
4. Zaimportuj dane w nowej strukturze

## 📞 Wsparcie

W przypadku problemów:
1. Sprawdź logi Supabase
2. Zweryfikuj konfigurację RLS
3. Upewnij się, że triggery działają poprawnie
4. Sprawdź czy wszystkie indeksy zostały utworzone