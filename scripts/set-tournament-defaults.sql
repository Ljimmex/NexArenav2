-- =====================================================
-- SKRYPT USTAWIANIA DOMYŚLNYCH WARTOŚCI DLA TURNIEJÓW
-- =====================================================
-- Ten skrypt ustawia domyślne wartości dla pól w tabeli tournaments
-- aby nowe turnieje miały podstawowe zasoby graficzne zamiast być puste

-- =====================================================
-- 1. AKTUALIZACJA SCHEMATU - DODANIE DOMYŚLNYCH WARTOŚCI
-- =====================================================

-- Dodanie domyślnych wartości do kolumn w tabeli tournaments
ALTER TABLE "tournaments" 
ALTER COLUMN "banner_url" SET DEFAULT '/banners/default-tournament-banner.png';

ALTER TABLE "tournaments" 
ALTER COLUMN "logo_url" SET DEFAULT '/images/organizer-avatar.webp';

-- =====================================================
-- 2. AKTUALIZACJA ISTNIEJĄCYCH REKORDÓW
-- =====================================================

-- Aktualizacja istniejących turniejów, które mają puste banner_url
UPDATE "tournaments" 
SET "banner_url" = '/banners/default-tournament-banner.png'
WHERE "banner_url" IS NULL OR "banner_url" = '';

-- Aktualizacja istniejących turniejów, które mają puste logo_url
UPDATE "tournaments" 
SET "logo_url" = '/images/organizer-avatar.webp'
WHERE "logo_url" IS NULL OR "logo_url" = '';

-- Aktualizacja turniejów Valorant na specjalny banner
UPDATE "tournaments" 
SET "banner_url" = '/banners/tournament-card.png'
WHERE "game_type" = 'VALORANT' AND ("banner_url" IS NULL OR "banner_url" = '' OR "banner_url" = '/banners/default-tournament-banner.png');

-- =====================================================
-- 3. DODANIE DOMYŚLNYCH WARTOŚCI DLA INNYCH PÓL
-- =====================================================

-- Ustawienie domyślnego opisu dla turniejów bez opisu
UPDATE "tournaments" 
SET "short_description" = 'Exciting esports tournament - join now and compete for glory!'
WHERE "short_description" IS NULL OR "short_description" = '';

-- Ustawienie domyślnych reguł dla turniejów bez reguł
UPDATE "tournaments" 
SET "rules" = 'Standard tournament rules apply. Fair play is expected from all participants. Cheating will result in immediate disqualification.'
WHERE "rules" IS NULL OR "rules" = '';

-- =====================================================
-- 4. FUNKCJA DO AUTOMATYCZNEGO USTAWIANIA DOMYŚLNYCH WARTOŚCI
-- =====================================================

-- Funkcja trigger do automatycznego ustawiania domyślnych wartości przy tworzeniu nowego turnieju
CREATE OR REPLACE FUNCTION set_tournament_defaults()
RETURNS TRIGGER AS $$
BEGIN
    -- Ustawienie domyślnego bannera jeśli nie został podany
    IF NEW.banner_url IS NULL OR NEW.banner_url = '' THEN
        IF NEW.game_type = 'VALORANT' THEN
            NEW.banner_url := '/banners/tournament-card.png';
        ELSE
            NEW.banner_url := '/banners/default-tournament-banner.png';
        END IF;
    END IF;
    
    -- Ustawienie domyślnego logo jeśli nie zostało podane
    IF NEW.logo_url IS NULL OR NEW.logo_url = '' THEN
        NEW.logo_url := '/images/organizer-avatar.webp';
    END IF;
    
    -- Ustawienie domyślnego krótkiego opisu jeśli nie został podany
    IF NEW.short_description IS NULL OR NEW.short_description = '' THEN
        NEW.short_description := 'Exciting esports tournament - join now and compete for glory!';
    END IF;
    
    -- Ustawienie domyślnych reguł jeśli nie zostały podane
    IF NEW.rules IS NULL OR NEW.rules = '' THEN
        NEW.rules := 'Standard tournament rules apply. Fair play is expected from all participants. Cheating will result in immediate disqualification.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Utworzenie triggera
DROP TRIGGER IF EXISTS trigger_set_tournament_defaults ON "tournaments";
CREATE TRIGGER trigger_set_tournament_defaults
    BEFORE INSERT ON "tournaments"
    FOR EACH ROW
    EXECUTE FUNCTION set_tournament_defaults();

-- =====================================================
-- 5. WERYFIKACJA ZMIAN
-- =====================================================

-- Sprawdzenie czy domyślne wartości zostały ustawione
SELECT 
    COUNT(*) as total_tournaments,
    COUNT(CASE WHEN banner_url IS NOT NULL AND banner_url != '' THEN 1 END) as tournaments_with_banner,
    COUNT(CASE WHEN logo_url IS NOT NULL AND logo_url != '' THEN 1 END) as tournaments_with_logo,
    COUNT(CASE WHEN short_description IS NOT NULL AND short_description != '' THEN 1 END) as tournaments_with_description,
    COUNT(CASE WHEN rules IS NOT NULL AND rules != '' THEN 1 END) as tournaments_with_rules
FROM "tournaments";

-- Wyświetlenie przykładowych turniejów z nowymi wartościami
SELECT 
    id,
    title,
    game_type,
    banner_url,
    logo_url,
    short_description,
    created_at
FROM "tournaments"
ORDER BY created_at DESC
LIMIT 5;

COMMIT;