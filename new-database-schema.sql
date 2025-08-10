-- =====================================================
-- NOWY SCHEMAT BAZY DANYCH - ESPORTS TOURNAMENT SYSTEM
-- =====================================================
-- Kompletny schemat zaprojektowany od podstaw z integracją Supabase Auth
-- Autor: AI Assistant
-- Data: 2024

-- =====================================================
-- 2. DEFINICJE TYPÓW ENUM
-- =====================================================

-- Role użytkowników w systemie
CREATE TYPE "UserRole" AS ENUM (
    'USER',           -- Zwykły użytkownik
    'ADMIN',          -- Administrator systemu
    'MODERATOR',      -- Moderator
    'ORGANIZER',      -- Organizator turniejów
    'COMMENTATOR'     -- Komentator
);

-- Role w drużynie
CREATE TYPE "TeamRole" AS ENUM (
    'CAPTAIN',        -- Kapitan drużyny
    'PLAYER',         -- Gracz
    'SUBSTITUTE',     -- Rezerwowy
    'COACH',          -- Trener
    'MANAGER'         -- Menedżer
);

-- Typy gier
CREATE TYPE "GameType" AS ENUM (
    'CS2',            -- Counter-Strike 2
    'VALORANT',       -- Valorant
    'LOL',            -- League of Legends
    'DOTA2',          -- Dota 2
    'ROCKET_LEAGUE',  -- Rocket League
    'OVERWATCH',      -- Overwatch
    'APEX_LEGENDS'    -- Apex Legends
);

-- Typy turniejów
CREATE TYPE "TournamentType" AS ENUM (
    'SINGLE_ELIMINATION',  -- Pojedyncza eliminacja
    'DOUBLE_ELIMINATION',  -- Podwójna eliminacja
    'ROUND_ROBIN',         -- Każdy z każdym
    'SWISS',               -- System szwajcarski
);

-- Statusy turniejów
CREATE TYPE "TournamentStatus" AS ENUM (
    'DRAFT',          -- Szkic
    'REGISTRATION',   -- Rejestracja otwarta
    'READY',          -- Gotowy do rozpoczęcia
    'RUNNING',        -- W trakcie
    'COMPLETED',      -- Zakończony
    'CANCELLED',      -- Anulowany
    'POSTPONED'       -- Przełożony
);

-- Statusy drużyn w turnieju
CREATE TYPE "TournamentTeamStatus" AS ENUM (
    'PENDING',        -- Oczekuje na akceptację
    'CONFIRMED',      -- Potwierdzona
    'DISQUALIFIED',   -- Zdyskwalifikowana
    'WITHDRAWN',      -- Wycofana
    'SUBSTITUTE',     -- Substytut
    'READY'           -- Gotowa
);

-- Tryby seedowania
CREATE TYPE "SeedingMode" AS ENUM (
    'AUTO',           -- Automatyczne na podstawie rankingu
    'MANUAL',         -- Ręczne ustawienie
    'RANDOM'          -- Losowe
);

-- Etapy meczów
CREATE TYPE "MatchStage" AS ENUM (
    'GROUP',          -- Faza grupowa
    'PLAYOFF',        -- Faza pucharowa
    'FINAL',          -- Finał
    'THIRD_PLACE'     -- Mecz o 3. miejsce
);

-- Statusy meczów
CREATE TYPE "MatchStatus" AS ENUM (
    'SCHEDULED',      -- Zaplanowany
    'UNSCHEDULED',    -- Niezaplanowany
    'LIVE',           -- W trakcie
    'FINISHED',       -- Zakończony
    'POSTPONED',      -- Przełożony
    'CANCELLED',      -- Anulowany
    'FORFEIT'         -- Walkower
);

-- Statusy zgłoszeń
CREATE TYPE "TicketStatus" AS ENUM (
    'OPEN',           -- Otwarte
    'IN_PROGRESS',    -- W trakcie
    'RESOLVED',       -- Rozwiązane
    'CLOSED'          -- Zamknięte
);

-- Priorytety zgłoszeń
CREATE TYPE "TicketPriority" AS ENUM (
    'LOW',            -- Niski
    'MEDIUM',         -- Średni
    'HIGH',           -- Wysoki
    'CRITICAL'        -- Krytyczny
);

-- Typy powiadomień
CREATE TYPE "NotificationType" AS ENUM (
    'TOURNAMENT_INVITE',    -- Zaproszenie do turnieju
    'TEAM_INVITE',         -- Zaproszenie do drużyny
    'MATCH_REMINDER',      -- Przypomnienie o meczu
    'RESULT_UPDATE',       -- Aktualizacja wyniku
    'SYSTEM_MESSAGE'       -- Wiadomość systemowa
);

-- =====================================================
-- 3. FUNKCJE POMOCNICZE
-- =====================================================

-- Funkcja do generowania UUID v4 (kompatybilna z Supabase)
CREATE OR REPLACE FUNCTION generate_uuid() RETURNS UUID AS $$
BEGIN
    RETURN gen_random_uuid();
END;
$$ LANGUAGE plpgsql;

-- Funkcja do automatycznego aktualizowania updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. TABELE GŁÓWNE
-- =====================================================

-- Tabela użytkowników (synchronizowana z auth.users)
CREATE TABLE "users" (
    "id" UUID PRIMARY KEY DEFAULT generate_uuid(),
    "supabase_user_id" UUID UNIQUE NOT NULL, -- Klucz obcy do auth.users
    "username" TEXT UNIQUE NOT NULL,
    "display_name" TEXT,
    "email" TEXT UNIQUE NOT NULL,
    "avatar_url" TEXT,
    "banner_url" TEXT DEFAULT '/banners/ProfilBaner.png',
    "bio" TEXT,
    "country" TEXT,
    "city" TEXT,
    "date_of_birth" DATE,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "last_seen_at" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Ograniczenia
    CONSTRAINT "users_username_length" CHECK (char_length(username) >= 3 AND char_length(username) <= 20),
    CONSTRAINT "users_username_format" CHECK (username ~ '^[a-zA-Z0-9_-]+$')
);

-- Tabela statystyk użytkowników
CREATE TABLE "user_stats" (
    "id" UUID PRIMARY KEY DEFAULT generate_uuid(),
    "user_id" UUID UNIQUE NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "games_played" INTEGER NOT NULL DEFAULT 0,
    "games_won" INTEGER NOT NULL DEFAULT 0,
    "games_lost" INTEGER NOT NULL DEFAULT 0,
    "tournaments_played" INTEGER NOT NULL DEFAULT 0,
    "tournaments_won" INTEGER NOT NULL DEFAULT 0,
    "current_rating" INTEGER NOT NULL DEFAULT 1000,
    "peak_rating" INTEGER NOT NULL DEFAULT 1000,
    "total_playtime_hours" INTEGER NOT NULL DEFAULT 0,
    "favorite_game" "GameType",
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Ograniczenia
    CONSTRAINT "user_stats_games_consistency" CHECK (games_played = games_won + games_lost),
    CONSTRAINT "user_stats_rating_range" CHECK (current_rating >= 0 AND current_rating <= 5000),
    CONSTRAINT "user_stats_peak_rating_range" CHECK (peak_rating >= current_rating)
);

-- Tabela ustawień użytkowników
CREATE TABLE "user_settings" (
    "id" UUID PRIMARY KEY DEFAULT generate_uuid(),
    "user_id" UUID UNIQUE NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
    "email_notifications" BOOLEAN NOT NULL DEFAULT true,
    "tournament_invites" BOOLEAN NOT NULL DEFAULT true,
    "team_invites" BOOLEAN NOT NULL DEFAULT true,
    "match_reminders" BOOLEAN NOT NULL DEFAULT true,
    "locale" TEXT NOT NULL DEFAULT 'pl',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Warsaw',
    "theme" TEXT NOT NULL DEFAULT 'light',
    "privacy_profile" BOOLEAN NOT NULL DEFAULT false,
    "privacy_stats" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 5. TABELE DRUŻYN
-- =====================================================

-- Tabela drużyn
CREATE TABLE "teams" (
    "id" UUID PRIMARY KEY DEFAULT generate_uuid(),
    "name" TEXT NOT NULL,
    "tag" TEXT UNIQUE NOT NULL,
    "description" TEXT,
    "logo_url" TEXT,
    "banner_url" TEXT,
    "website" TEXT,
    "discord_invite" TEXT,
    "primary_game" "GameType" NOT NULL,
    "region" TEXT,
    "is_recruiting" BOOLEAN NOT NULL DEFAULT false,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_by" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Ograniczenia
    CONSTRAINT "teams_name_length" CHECK (char_length(name) >= 2 AND char_length(name) <= 50),
    CONSTRAINT "teams_tag_length" CHECK (char_length(tag) >= 2 AND char_length(tag) <= 10),
    CONSTRAINT "teams_tag_format" CHECK (tag ~ '^[A-Z0-9_-]+$')
);

-- Tabela członków drużyn
CREATE TABLE "team_members" (
    "id" UUID PRIMARY KEY DEFAULT generate_uuid(),
    "team_id" UUID NOT NULL REFERENCES "teams"("id") ON DELETE CASCADE,
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "role" "TeamRole" NOT NULL DEFAULT 'PLAYER',
    "joined_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    
    -- Ograniczenia
    UNIQUE("team_id", "user_id")
);

-- Tabela statystyk drużyn
CREATE TABLE "team_stats" (
    "id" UUID PRIMARY KEY DEFAULT generate_uuid(),
    "team_id" UUID UNIQUE NOT NULL REFERENCES "teams"("id") ON DELETE CASCADE,
    "matches_played" INTEGER NOT NULL DEFAULT 0,
    "matches_won" INTEGER NOT NULL DEFAULT 0,
    "matches_lost" INTEGER NOT NULL DEFAULT 0,
    "tournaments_played" INTEGER NOT NULL DEFAULT 0,
    "tournaments_won" INTEGER NOT NULL DEFAULT 0,
    "current_rating" INTEGER NOT NULL DEFAULT 1000,
    "peak_rating" INTEGER NOT NULL DEFAULT 1000,
    "win_streak" INTEGER NOT NULL DEFAULT 0,
    "best_win_streak" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Ograniczenia
    CONSTRAINT "team_stats_matches_consistency" CHECK (matches_played = matches_won + matches_lost),
    CONSTRAINT "team_stats_rating_range" CHECK (current_rating >= 0 AND current_rating <= 5000)
);

-- =====================================================
-- 6. TABELE TURNIEJÓW
-- =====================================================

-- Tabela turniejów
CREATE TABLE "tournaments" (
    "id" UUID PRIMARY KEY DEFAULT generate_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "short_description" TEXT,
    "game_type" "GameType" NOT NULL,
    "tournament_type" "TournamentType" NOT NULL,
    "status" "TournamentStatus" NOT NULL DEFAULT 'DRAFT',
    "seeding_mode" "SeedingMode" NOT NULL DEFAULT 'AUTO',
    
    -- Daty i czasy
    "registration_start" TIMESTAMP WITH TIME ZONE,
    "registration_end" TIMESTAMP WITH TIME ZONE,
    "tournament_start" TIMESTAMP WITH TIME ZONE,
    "tournament_end" TIMESTAMP WITH TIME ZONE,
    
    -- Ustawienia turnieju
    "max_teams" INTEGER NOT NULL DEFAULT 16,
    "min_teams" INTEGER NOT NULL DEFAULT 4,
    "team_size" INTEGER NOT NULL DEFAULT 5,
    "entry_fee" DECIMAL(10,2) DEFAULT 0,
    "prize_pool" DECIMAL(10,2) DEFAULT 0,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "requires_approval" BOOLEAN NOT NULL DEFAULT false,
    
    -- Reguły i format
    "rules" TEXT,
    "format_settings" JSONB DEFAULT '{}',
    "bracket_data" JSONB DEFAULT '{}',
    "group_settings" JSONB DEFAULT '{}',
    
    -- Organizator i moderatorzy
    "organizer_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
    "moderators" UUID[] DEFAULT '{}',
    
    -- Metadane
    "banner_url" TEXT DEFAULT '/banners/default-tournament-banner.png',
    "logo_url" TEXT DEFAULT '/images/organizer-avatar.webp',
    "stream_url" TEXT,
    "discord_invite" TEXT,
    
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Ograniczenia
    CONSTRAINT "tournaments_title_length" CHECK (char_length(title) >= 3 AND char_length(title) <= 100),
    CONSTRAINT "tournaments_team_limits" CHECK (min_teams <= max_teams),
    CONSTRAINT "tournaments_team_size_range" CHECK (team_size >= 1 AND team_size <= 10),
    CONSTRAINT "tournaments_dates_consistency" CHECK (
        (registration_start IS NULL OR registration_end IS NULL OR registration_start < registration_end) AND
        (registration_end IS NULL OR tournament_start IS NULL OR registration_end <= tournament_start) AND
        (tournament_start IS NULL OR tournament_end IS NULL OR tournament_start < tournament_end)
    )
);

-- Tabela drużyn w turniejach
CREATE TABLE "tournament_teams" (
    "id" UUID PRIMARY KEY DEFAULT generate_uuid(),
    "tournament_id" UUID NOT NULL REFERENCES "tournaments"("id") ON DELETE CASCADE,
    "team_id" UUID NOT NULL REFERENCES "teams"("id") ON DELETE CASCADE,
    "status" "TournamentTeamStatus" NOT NULL DEFAULT 'PENDING',
    "seed" INTEGER,
    "group_id" TEXT,
    "registration_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "approved_by" UUID REFERENCES "users"("id"),
    "approved_at" TIMESTAMP WITH TIME ZONE,
    "notes" TEXT,
    
    -- Ograniczenia
    UNIQUE("tournament_id", "team_id"),
    CONSTRAINT "tournament_teams_seed_positive" CHECK (seed IS NULL OR seed > 0)
);

-- =====================================================
-- 7. TABELE MECZÓW
-- =====================================================

-- Tabela meczów
CREATE TABLE "matches" (
    "id" UUID PRIMARY KEY DEFAULT generate_uuid(),
    "tournament_id" UUID NOT NULL REFERENCES "tournaments"("id") ON DELETE CASCADE,
    "round" INTEGER NOT NULL,
    "stage" "MatchStage" NOT NULL DEFAULT 'PLAYOFF',
    "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    
    -- Drużyny
    "team1_id" UUID REFERENCES "teams"("id") ON DELETE SET NULL,
    "team2_id" UUID REFERENCES "teams"("id") ON DELETE SET NULL,
    "winner_id" UUID REFERENCES "teams"("id") ON DELETE SET NULL,
    
    -- Daty i czasy
    "scheduled_at" TIMESTAMP WITH TIME ZONE,
    "started_at" TIMESTAMP WITH TIME ZONE,
    "finished_at" TIMESTAMP WITH TIME ZONE,
    
    -- Format meczu
    "best_of" INTEGER NOT NULL DEFAULT 1,
    "current_game" INTEGER NOT NULL DEFAULT 1,
    
    -- Wyniki
    "team1_score" INTEGER NOT NULL DEFAULT 0,
    "team2_score" INTEGER NOT NULL DEFAULT 0,
    "detailed_scores" JSONB DEFAULT '[]',
    
    -- Dodatkowe informacje
    "map_pool" TEXT[],
    "map_picks" JSONB DEFAULT '{}',
    "stream_url" TEXT,
    "notes" TEXT,
    
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Ograniczenia
    CONSTRAINT "matches_round_positive" CHECK (round > 0),
    CONSTRAINT "matches_best_of_odd" CHECK (best_of % 2 = 1 AND best_of >= 1),
    CONSTRAINT "matches_current_game_range" CHECK (current_game >= 1 AND current_game <= best_of),
    CONSTRAINT "matches_scores_non_negative" CHECK (team1_score >= 0 AND team2_score >= 0),
    CONSTRAINT "matches_different_teams" CHECK (team1_id != team2_id),
    CONSTRAINT "matches_winner_is_participant" CHECK (
        winner_id IS NULL OR winner_id = team1_id OR winner_id = team2_id
    )
);

-- Tabela szczegółowych wyników meczów
CREATE TABLE "match_games" (
    "id" UUID PRIMARY KEY DEFAULT generate_uuid(),
    "match_id" UUID NOT NULL REFERENCES "matches"("id") ON DELETE CASCADE,
    "game_number" INTEGER NOT NULL,
    "map_name" TEXT,
    "team1_score" INTEGER NOT NULL DEFAULT 0,
    "team2_score" INTEGER NOT NULL DEFAULT 0,
    "winner_id" UUID REFERENCES "teams"("id"),
    "duration_minutes" INTEGER,
    "started_at" TIMESTAMP WITH TIME ZONE,
    "finished_at" TIMESTAMP WITH TIME ZONE,
    "notes" TEXT,
    
    -- Ograniczenia
    UNIQUE("match_id", "game_number"),
    CONSTRAINT "match_games_game_number_positive" CHECK (game_number > 0),
    CONSTRAINT "match_games_scores_non_negative" CHECK (team1_score >= 0 AND team2_score >= 0),
    CONSTRAINT "match_games_duration_positive" CHECK (duration_minutes IS NULL OR duration_minutes > 0)
);

-- Tabela veto map dla meczów
CREATE TABLE "match_vetos" (
    "id" UUID PRIMARY KEY DEFAULT generate_uuid(),
    "match_id" UUID NOT NULL REFERENCES "matches"("id") ON DELETE CASCADE,
    "map_name" TEXT NOT NULL,
    "action_type" TEXT NOT NULL CHECK (action_type IN ('BAN', 'PICK', 'DECIDER')),
    "team_id" UUID REFERENCES "teams"("id"),
    "side_choice" TEXT CHECK (side_choice IN ('CT', 'T', 'TERRORIST', 'COUNTER_TERRORIST')),
    "is_decider" BOOLEAN DEFAULT FALSE,
    "order_number" INTEGER NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Ograniczenia
    UNIQUE("match_id", "order_number"),
    CONSTRAINT "match_vetos_order_positive" CHECK (order_number > 0),
    CONSTRAINT "match_vetos_side_choice_logic" CHECK (
        (action_type = 'PICK' AND side_choice IS NOT NULL) OR 
        (action_type IN ('BAN', 'DECIDER') AND side_choice IS NULL)
    )
);

-- Tabela wyników map w meczach
CREATE TABLE "match_map_scores" (
    "id" UUID PRIMARY KEY DEFAULT generate_uuid(),
    "match_id" UUID NOT NULL REFERENCES "matches"("id") ON DELETE CASCADE,
    "map_name" TEXT NOT NULL,
    "map_order" INTEGER NOT NULL,
    "team1_score" INTEGER NOT NULL DEFAULT 0,
    "team2_score" INTEGER NOT NULL DEFAULT 0,
    "winner_id" UUID REFERENCES "teams"("id"),
    "team1_starting_side" TEXT CHECK (team1_starting_side IN ('CT', 'T', 'TERRORIST', 'COUNTER_TERRORIST')),
    "team2_starting_side" TEXT CHECK (team2_starting_side IN ('CT', 'T', 'TERRORIST', 'COUNTER_TERRORIST')),
    "side_swapped_at_round" INTEGER DEFAULT NULL,
    "is_decider_map" BOOLEAN DEFAULT FALSE,
    "duration_minutes" INTEGER,
    "started_at" TIMESTAMP WITH TIME ZONE,
    "finished_at" TIMESTAMP WITH TIME ZONE,
    "overtime_rounds" INTEGER DEFAULT 0,
    "notes" TEXT,
    
    -- Ograniczenia
    UNIQUE("match_id", "map_order"),
    CONSTRAINT "match_map_scores_order_positive" CHECK (map_order > 0),
    CONSTRAINT "match_map_scores_scores_non_negative" CHECK (team1_score >= 0 AND team2_score >= 0),
    CONSTRAINT "match_map_scores_overtime_non_negative" CHECK (overtime_rounds >= 0),
    CONSTRAINT "match_map_scores_different_sides" CHECK (
        (team1_starting_side IS NULL AND team2_starting_side IS NULL) OR
        (team1_starting_side IS NOT NULL AND team2_starting_side IS NOT NULL AND team1_starting_side != team2_starting_side)
    )
);

-- Tabela wyników graczy na mapach
CREATE TABLE "player_map_scores" (
    "id" UUID PRIMARY KEY DEFAULT generate_uuid(),
    "map_score_id" UUID NOT NULL REFERENCES "match_map_scores"("id") ON DELETE CASCADE,
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "team_id" UUID NOT NULL REFERENCES "teams"("id") ON DELETE CASCADE,
    "kills" INTEGER NOT NULL DEFAULT 0,
    "deaths" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "headshots" INTEGER DEFAULT 0,
    "damage_dealt" INTEGER DEFAULT 0,
    "damage_taken" INTEGER DEFAULT 0,
    "rounds_played" INTEGER NOT NULL DEFAULT 0,
    "mvp_rounds" INTEGER DEFAULT 0,
    "first_kills" INTEGER DEFAULT 0,
    "first_deaths" INTEGER DEFAULT 0,
    "clutch_wins" INTEGER DEFAULT 0,
    "rating" DECIMAL(4,2) DEFAULT 0.00,
    "adr" DECIMAL(6,2) DEFAULT 0.00, -- Average Damage per Round
    "kast" DECIMAL(5,2) DEFAULT 0.00, -- Kill, Assist, Survive, Trade percentage
    
    -- Ograniczenia
    UNIQUE("map_score_id", "user_id"),
    CONSTRAINT "player_map_scores_stats_non_negative" CHECK (
        kills >= 0 AND deaths >= 0 AND assists >= 0 AND 
        headshots >= 0 AND damage_dealt >= 0 AND damage_taken >= 0 AND
        rounds_played >= 0 AND mvp_rounds >= 0 AND 
        first_kills >= 0 AND first_deaths >= 0 AND clutch_wins >= 0
    ),
    CONSTRAINT "player_map_scores_rating_range" CHECK (rating >= 0.00 AND rating <= 5.00),
    CONSTRAINT "player_map_scores_adr_non_negative" CHECK (adr >= 0.00),
    CONSTRAINT "player_map_scores_kast_percentage" CHECK (kast >= 0.00 AND kast <= 100.00)
);

-- =====================================================
-- 8. TABELE POMOCNICZE
-- =====================================================

-- Tabela powiadomień
CREATE TABLE "notifications" (
    "id" UUID PRIMARY KEY DEFAULT generate_uuid(),
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB DEFAULT '{}',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Ograniczenia
    CONSTRAINT "notifications_title_length" CHECK (char_length(title) >= 1 AND char_length(title) <= 100)
);

-- Tabela zgłoszeń wsparcia
CREATE TABLE "support_tickets" (
    "id" UUID PRIMARY KEY DEFAULT generate_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "category" TEXT,
    
    -- Powiązania
    "creator_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
    "assignee_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
    "tournament_id" UUID REFERENCES "tournaments"("id") ON DELETE SET NULL,
    "match_id" UUID REFERENCES "matches"("id") ON DELETE SET NULL,
    "team_id" UUID REFERENCES "teams"("id") ON DELETE SET NULL,
    
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Ograniczenia
    CONSTRAINT "support_tickets_title_length" CHECK (char_length(title) >= 5 AND char_length(title) <= 200)
);

-- Tabela odpowiedzi na zgłoszenia
CREATE TABLE "support_responses" (
    "id" UUID PRIMARY KEY DEFAULT generate_uuid(),
    "ticket_id" UUID NOT NULL REFERENCES "support_tickets"("id") ON DELETE CASCADE,
    "author_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
    "message" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Ograniczenia
    CONSTRAINT "support_responses_message_length" CHECK (char_length(message) >= 1)
);

-- =====================================================
-- 9. INDEKSY DLA WYDAJNOŚCI
-- =====================================================

-- Indeksy dla tabeli users
CREATE INDEX "idx_users_supabase_user_id" ON "users"("supabase_user_id");
CREATE INDEX "idx_users_username" ON "users"("username");
CREATE INDEX "idx_users_email" ON "users"("email");
CREATE INDEX "idx_users_role" ON "users"("role");
CREATE INDEX "idx_users_is_active" ON "users"("is_active");

-- Indeksy dla tabeli teams
CREATE INDEX "idx_teams_tag" ON "teams"("tag");
CREATE INDEX "idx_teams_primary_game" ON "teams"("primary_game");
CREATE INDEX "idx_teams_created_by" ON "teams"("created_by");
CREATE INDEX "idx_teams_is_recruiting" ON "teams"("is_recruiting");

-- Indeksy dla tabeli team_members
CREATE INDEX "idx_team_members_team_id" ON "team_members"("team_id");
CREATE INDEX "idx_team_members_user_id" ON "team_members"("user_id");
CREATE INDEX "idx_team_members_role" ON "team_members"("role");

-- Indeksy dla tabeli tournaments
CREATE INDEX "idx_tournaments_game_type" ON "tournaments"("game_type");
CREATE INDEX "idx_tournaments_status" ON "tournaments"("status");
CREATE INDEX "idx_tournaments_organizer_id" ON "tournaments"("organizer_id");
CREATE INDEX "idx_tournaments_registration_dates" ON "tournaments"("registration_start", "registration_end");
CREATE INDEX "idx_tournaments_tournament_dates" ON "tournaments"("tournament_start", "tournament_end");

-- Indeksy dla tabeli tournament_teams
CREATE INDEX "idx_tournament_teams_tournament_id" ON "tournament_teams"("tournament_id");
CREATE INDEX "idx_tournament_teams_team_id" ON "tournament_teams"("team_id");
CREATE INDEX "idx_tournament_teams_status" ON "tournament_teams"("status");

-- Indeksy dla tabeli matches
CREATE INDEX "idx_matches_tournament_id" ON "matches"("tournament_id");
CREATE INDEX "idx_matches_team1_id" ON "matches"("team1_id");
CREATE INDEX "idx_matches_team2_id" ON "matches"("team2_id");
CREATE INDEX "idx_matches_status" ON "matches"("status");
CREATE INDEX "idx_matches_scheduled_at" ON "matches"("scheduled_at");

-- Indeksy dla tabeli match_vetos
CREATE INDEX "idx_match_vetos_match_id" ON "match_vetos"("match_id");
CREATE INDEX "idx_match_vetos_team_id" ON "match_vetos"("team_id");
CREATE INDEX "idx_match_vetos_order" ON "match_vetos"("order_number");
CREATE INDEX "idx_match_vetos_action_type" ON "match_vetos"("action_type");
CREATE INDEX "idx_match_vetos_is_decider" ON "match_vetos"("is_decider");
CREATE INDEX "idx_match_vetos_side_choice" ON "match_vetos"("side_choice");

-- Indeksy dla tabeli match_map_scores
CREATE INDEX "idx_match_map_scores_match_id" ON "match_map_scores"("match_id");
CREATE INDEX "idx_match_map_scores_winner_id" ON "match_map_scores"("winner_id");
CREATE INDEX "idx_match_map_scores_map_order" ON "match_map_scores"("map_order");
CREATE INDEX "idx_match_map_scores_is_decider" ON "match_map_scores"("is_decider_map");
CREATE INDEX "idx_match_map_scores_starting_sides" ON "match_map_scores"("team1_starting_side", "team2_starting_side");

-- Indeksy dla tabeli player_map_scores
CREATE INDEX "idx_player_map_scores_map_score_id" ON "player_map_scores"("map_score_id");
CREATE INDEX "idx_player_map_scores_user_id" ON "player_map_scores"("user_id");
CREATE INDEX "idx_player_map_scores_team_id" ON "player_map_scores"("team_id");
CREATE INDEX "idx_player_map_scores_rating" ON "player_map_scores"("rating");

-- Indeksy dla tabeli notifications
CREATE INDEX "idx_notifications_user_id" ON "notifications"("user_id");
CREATE INDEX "idx_notifications_is_read" ON "notifications"("is_read");
CREATE INDEX "idx_notifications_created_at" ON "notifications"("created_at");

-- Indeksy dla tabeli support_tickets
CREATE INDEX "idx_support_tickets_creator_id" ON "support_tickets"("creator_id");
CREATE INDEX "idx_support_tickets_assignee_id" ON "support_tickets"("assignee_id");
CREATE INDEX "idx_support_tickets_status" ON "support_tickets"("status");
CREATE INDEX "idx_support_tickets_priority" ON "support_tickets"("priority");

-- =====================================================
-- 10. TRIGGERY DLA AUTOMATYCZNYCH AKTUALIZACJI
-- =====================================================

-- Triggery dla updated_at
CREATE TRIGGER "update_users_updated_at" 
    BEFORE UPDATE ON "users" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER "update_user_stats_updated_at" 
    BEFORE UPDATE ON "user_stats" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER "update_user_settings_updated_at" 
    BEFORE UPDATE ON "user_settings" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER "update_teams_updated_at" 
    BEFORE UPDATE ON "teams" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER "update_team_stats_updated_at" 
    BEFORE UPDATE ON "team_stats" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER "update_tournaments_updated_at" 
    BEFORE UPDATE ON "tournaments" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER "update_matches_updated_at" 
    BEFORE UPDATE ON "matches" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER "update_support_tickets_updated_at" 
    BEFORE UPDATE ON "support_tickets" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 10.1. FUNKCJE I TRIGGERY DLA SYSTEMU VETO
-- =====================================================

-- Funkcja sprawdzająca poprawność procesu veto
CREATE OR REPLACE FUNCTION validate_veto_process(p_match_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    veto_count INTEGER;
    pick_count INTEGER;
    decider_count INTEGER;
    ban_count INTEGER;
BEGIN
    -- Policz różne typy akcji veto
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE action_type = 'PICK'),
        COUNT(*) FILTER (WHERE action_type = 'DECIDER'),
        COUNT(*) FILTER (WHERE action_type = 'BAN')
    INTO veto_count, pick_count, decider_count, ban_count
    FROM match_vetos 
    WHERE match_id = p_match_id;
    
    -- Walidacja:
    -- 1. Maksymalnie jeden decider na mecz
    -- 2. Każdy PICK musi mieć wybór strony
    -- 3. DECIDER i BAN nie mogą mieć wyboru strony
    
    IF decider_count > 1 THEN
        RETURN FALSE;
    END IF;
    
    -- Sprawdź czy wszystkie PICK mają wybór strony
    IF EXISTS (
        SELECT 1 FROM match_vetos 
        WHERE match_id = p_match_id 
        AND action_type = 'PICK' 
        AND side_choice IS NULL
    ) THEN
        RETURN FALSE;
    END IF;
    
    -- Sprawdź czy BAN i DECIDER nie mają wyboru strony
    IF EXISTS (
        SELECT 1 FROM match_vetos 
        WHERE match_id = p_match_id 
        AND action_type IN ('BAN', 'DECIDER') 
        AND side_choice IS NOT NULL
    ) THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Trigger sprawdzający poprawność veto przy każdej zmianie
CREATE OR REPLACE FUNCTION trigger_validate_veto()
RETURNS TRIGGER AS $$
BEGIN
    -- Sprawdź poprawność procesu veto dla tego meczu
    IF NOT validate_veto_process(NEW.match_id) THEN
        RAISE EXCEPTION 'Invalid veto process for match %', NEW.match_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Utwórz trigger walidacji veto
CREATE TRIGGER validate_veto_trigger
    AFTER INSERT OR UPDATE ON match_vetos
    FOR EACH ROW EXECUTE FUNCTION trigger_validate_veto();

-- Funkcja do synchronizacji map z veto
CREATE OR REPLACE FUNCTION sync_maps_from_veto(p_match_id UUID)
RETURNS VOID AS $$
DECLARE
    veto_record RECORD;
    map_order INTEGER := 1;
BEGIN
    -- Usuń istniejące rekordy map dla tego meczu
    DELETE FROM match_map_scores WHERE match_id = p_match_id;
    
    -- Dodaj mapy na podstawie veto (PICK i DECIDER)
    FOR veto_record IN 
        SELECT mv.*, t1.id as team1_id, t2.id as team2_id
        FROM match_vetos mv
        JOIN matches m ON mv.match_id = m.id
        JOIN teams t1 ON m.team1_id = t1.id
        JOIN teams t2 ON m.team2_id = t2.id
        WHERE mv.match_id = p_match_id 
        AND mv.action_type IN ('PICK', 'DECIDER')
        ORDER BY mv.order_number
    LOOP
        INSERT INTO match_map_scores (
            match_id,
            map_name,
            map_order,
            team1_starting_side,
            team2_starting_side,
            is_decider_map
        ) VALUES (
            p_match_id,
            veto_record.map_name,
            map_order,
            CASE 
                WHEN veto_record.team_id = veto_record.team1_id THEN veto_record.side_choice
                WHEN veto_record.team_id = veto_record.team2_id THEN 
                    CASE veto_record.side_choice
                        WHEN 'CT' THEN 'T'
                        WHEN 'T' THEN 'CT'
                        WHEN 'COUNTER_TERRORIST' THEN 'TERRORIST'
                        WHEN 'TERRORIST' THEN 'COUNTER_TERRORIST'
                    END
                ELSE NULL
            END,
            CASE 
                WHEN veto_record.team_id = veto_record.team2_id THEN veto_record.side_choice
                WHEN veto_record.team_id = veto_record.team1_id THEN 
                    CASE veto_record.side_choice
                        WHEN 'CT' THEN 'T'
                        WHEN 'T' THEN 'CT'
                        WHEN 'COUNTER_TERRORIST' THEN 'TERRORIST'
                        WHEN 'TERRORIST' THEN 'COUNTER_TERRORIST'
                    END
                ELSE NULL
            END,
            veto_record.action_type = 'DECIDER'
        );
        
        map_order := map_order + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Unikalne ograniczenie dla decider w meczu
CREATE UNIQUE INDEX "idx_match_vetos_unique_decider" 
ON "match_vetos"("match_id") 
WHERE "is_decider" = TRUE;

-- =====================================================
-- 11. INTEGRACJA Z SUPABASE AUTH
-- =====================================================

-- Funkcja do obsługi nowych użytkowników z auth.users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_username TEXT;
BEGIN
    -- Generuj unikalną nazwę użytkownika na podstawie email
    new_username := COALESCE(
        NEW.raw_user_meta_data->>'username',
        split_part(NEW.email, '@', 1)
    );
    
    -- Upewnij się, że username jest unikalny
    WHILE EXISTS (SELECT 1 FROM users WHERE username = new_username) LOOP
        new_username := new_username || '_' || floor(random() * 1000)::text;
    END LOOP;
    
    -- Wstaw nowego użytkownika
    INSERT INTO public.users (
        supabase_user_id,
        username,
        display_name,
        email,
        avatar_url
    ) VALUES (
        NEW.id,
        new_username,
        COALESCE(NEW.raw_user_meta_data->>'display_name', new_username),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url'
    );
    
    -- Utwórz statystyki użytkownika
    INSERT INTO public.user_stats (user_id)
    SELECT id FROM public.users WHERE supabase_user_id = NEW.id;
    
    -- Utwórz ustawienia użytkownika
    INSERT INTO public.user_settings (user_id)
    SELECT id FROM public.users WHERE supabase_user_id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funkcja do obsługi aktualizacji użytkowników
CREATE OR REPLACE FUNCTION handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.users SET
        email = NEW.email,
        avatar_url = COALESCE(NEW.raw_user_meta_data->>'avatar_url', avatar_url),
        display_name = COALESCE(NEW.raw_user_meta_data->>'display_name', display_name),
        updated_at = NOW()
    WHERE supabase_user_id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funkcja do obsługi usuwania użytkowników
CREATE OR REPLACE FUNCTION handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.users WHERE supabase_user_id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggery dla synchronizacji z auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_user_update();

CREATE TRIGGER on_auth_user_deleted
    AFTER DELETE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_user_delete();

-- Funkcja do ustawiania domyślnych wartości dla turniejów
CREATE OR REPLACE FUNCTION set_tournament_defaults()
RETURNS TRIGGER AS $$
BEGIN
    -- Ustaw domyślne wartości jeśli są puste
    IF NEW.banner_url IS NULL OR NEW.banner_url = '' THEN
        -- Domyślny banner dla tła strony szczegółów turnieju
        NEW.banner_url := '/banners/default-tournament-banner.png';
    END IF;
    
    IF NEW.logo_url IS NULL OR NEW.logo_url = '' THEN
        NEW.logo_url := '/images/organizer-avatar.webp';
    END IF;
    
    IF NEW.short_description IS NULL OR NEW.short_description = '' THEN
        NEW.short_description := 'Dołącz do ekscytującego turnieju ' || NEW.game_type || '!';
    END IF;
    
    IF NEW.rules IS NULL OR NEW.rules = '' THEN
        NEW.rules := 'Standardowe zasady turnieju. Szczegóły będą podane przez organizatora.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger dla automatycznego ustawiania domyślnych wartości
CREATE TRIGGER trigger_set_tournament_defaults
    BEFORE INSERT ON tournaments
    FOR EACH ROW EXECUTE FUNCTION set_tournament_defaults();

-- =====================================================
-- 12. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Włącz RLS dla wszystkich tabel
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_stats" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "teams" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "team_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "team_stats" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tournaments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tournament_teams" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "matches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "match_games" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "match_vetos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "match_map_scores" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "player_map_scores" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "support_tickets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "support_responses" ENABLE ROW LEVEL SECURITY;

-- Polityki RLS dla tabeli users
CREATE POLICY "Users can view all profiles" ON "users"
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON "users"
    FOR UPDATE USING (supabase_user_id = auth.uid());

-- Polityki RLS dla tabeli user_stats
CREATE POLICY "User stats are viewable by everyone" ON "user_stats"
    FOR SELECT USING (true);

CREATE POLICY "Users can update own stats" ON "user_stats"
    FOR UPDATE USING (
        user_id IN (SELECT id FROM users WHERE supabase_user_id = auth.uid())
    );

-- Polityki RLS dla tabeli user_settings
CREATE POLICY "Users can view own settings" ON "user_settings"
    FOR SELECT USING (
        user_id IN (SELECT id FROM users WHERE supabase_user_id = auth.uid())
    );

CREATE POLICY "Users can update own settings" ON "user_settings"
    FOR ALL USING (
        user_id IN (SELECT id FROM users WHERE supabase_user_id = auth.uid())
    );

-- Polityki RLS dla tabeli teams
CREATE POLICY "Teams are viewable by everyone" ON "teams"
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create teams" ON "teams"
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Team creators and captains can update teams" ON "teams"
    FOR UPDATE USING (
        created_by IN (SELECT id FROM users WHERE supabase_user_id = auth.uid()) OR
        id IN (
            SELECT team_id FROM team_members 
            WHERE user_id IN (SELECT id FROM users WHERE supabase_user_id = auth.uid())
            AND role = 'CAPTAIN'
        )
    );

-- Polityki RLS dla tabeli team_members
CREATE POLICY "Team members are viewable by everyone" ON "team_members"
    FOR SELECT USING (true);

CREATE POLICY "Team captains can manage members" ON "team_members"
    FOR ALL USING (
        team_id IN (
            SELECT team_id FROM team_members 
            WHERE user_id IN (SELECT id FROM users WHERE supabase_user_id = auth.uid())
            AND role = 'CAPTAIN'
        )
    );

-- Polityki RLS dla tabeli tournaments
CREATE POLICY "Tournaments are viewable by everyone" ON "tournaments"
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create tournaments" ON "tournaments"
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Organizers can update tournaments" ON "tournaments"
    FOR UPDATE USING (
        organizer_id IN (SELECT id FROM users WHERE supabase_user_id = auth.uid())
    );

-- Polityki RLS dla tabeli matches
CREATE POLICY "Matches are viewable by everyone" ON "matches"
    FOR SELECT USING (true);

CREATE POLICY "Tournament organizers can manage matches" ON "matches"
    FOR ALL USING (
        tournament_id IN (
            SELECT id FROM tournaments 
            WHERE organizer_id IN (SELECT id FROM users WHERE supabase_user_id = auth.uid())
        )
    );

-- Polityki RLS dla tabeli notifications
CREATE POLICY "Users can view own notifications" ON "notifications"
    FOR SELECT USING (
        user_id IN (SELECT id FROM users WHERE supabase_user_id = auth.uid())
    );

CREATE POLICY "Users can update own notifications" ON "notifications"
    FOR UPDATE USING (
        user_id IN (SELECT id FROM users WHERE supabase_user_id = auth.uid())
    );

-- Polityki RLS dla tabeli support_tickets
CREATE POLICY "Users can view own tickets" ON "support_tickets"
    FOR SELECT USING (
        creator_id IN (SELECT id FROM users WHERE supabase_user_id = auth.uid()) OR
        assignee_id IN (SELECT id FROM users WHERE supabase_user_id = auth.uid())
    );

CREATE POLICY "Users can create tickets" ON "support_tickets"
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Ticket creators can update own tickets" ON "support_tickets"
    FOR UPDATE USING (
        creator_id IN (SELECT id FROM users WHERE supabase_user_id = auth.uid())
    );

-- Polityki RLS dla tabeli match_vetos
CREATE POLICY "Match vetos are viewable by everyone" ON "match_vetos"
    FOR SELECT USING (true);

CREATE POLICY "Tournament organizers can manage match vetos" ON "match_vetos"
    FOR ALL USING (
        match_id IN (
            SELECT m.id FROM matches m
            JOIN tournaments t ON m.tournament_id = t.id
            WHERE t.organizer_id IN (SELECT id FROM users WHERE supabase_user_id = auth.uid())
        )
    );

-- Polityki RLS dla tabeli match_map_scores
CREATE POLICY "Match map scores are viewable by everyone" ON "match_map_scores"
    FOR SELECT USING (true);

CREATE POLICY "Tournament organizers can manage match map scores" ON "match_map_scores"
    FOR ALL USING (
        match_id IN (
            SELECT m.id FROM matches m
            JOIN tournaments t ON m.tournament_id = t.id
            WHERE t.organizer_id IN (SELECT id FROM users WHERE supabase_user_id = auth.uid())
        )
    );

-- Polityki RLS dla tabeli player_map_scores
CREATE POLICY "Player map scores are viewable by everyone" ON "player_map_scores"
    FOR SELECT USING (true);

CREATE POLICY "Tournament organizers can manage player map scores" ON "player_map_scores"
    FOR ALL USING (
        map_score_id IN (
            SELECT mms.id FROM match_map_scores mms
            JOIN matches m ON mms.match_id = m.id
            JOIN tournaments t ON m.tournament_id = t.id
            WHERE t.organizer_id IN (SELECT id FROM users WHERE supabase_user_id = auth.uid())
        )
    );

-- =====================================================
-- 13. DANE TESTOWE
-- =====================================================

-- Uwaga: Dane testowe będą dodane automatycznie przez triggery
-- po utworzeniu użytkowników w auth.users przez aplikację

-- =====================================================
-- 14. PODSUMOWANIE
-- =====================================================

-- Wyświetl podsumowanie utworzonych struktur
DO $$
BEGIN
    RAISE NOTICE '=== NOWY SCHEMAT BAZY DANYCH UTWORZONY POMYŚLNIE ===';
    RAISE NOTICE 'Utworzono % tabel', (
        SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    );
    RAISE NOTICE 'Utworzono % typów enum', (
        SELECT COUNT(*) FROM pg_type 
        WHERE typtype = 'e' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    );
    RAISE NOTICE 'Utworzono % funkcji', (
        SELECT COUNT(*) FROM information_schema.routines 
        WHERE routine_schema = 'public'
    );
    RAISE NOTICE 'Utworzono % triggerów', (
        SELECT COUNT(*) FROM information_schema.triggers 
        WHERE trigger_schema = 'public'
    );
    RAISE NOTICE '=== GOTOWE DO UŻYCIA ===';
END $$;