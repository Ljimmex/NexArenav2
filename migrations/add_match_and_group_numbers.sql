-- Migration: Add match_number and group_number fields to matches table
-- This migration ensures that existing databases have the match_number and group_number fields
-- and creates appropriate indexes for performance

-- Add match_number column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'matches' AND column_name = 'match_number') THEN
        ALTER TABLE "matches" ADD COLUMN "match_number" INTEGER;
    END IF;
END $$;

-- Add group_number column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'matches' AND column_name = 'group_number') THEN
        ALTER TABLE "matches" ADD COLUMN "group_number" INTEGER;
    END IF;
END $$;

-- Add comments to the columns
COMMENT ON COLUMN "matches"."match_number" IS 'Sequential match number within tournament/stage/group';
COMMENT ON COLUMN "matches"."group_number" IS 'Group number for group stage matches';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_matches_tournament_stage_match_number" 
ON "matches" ("tournament_id", "stage", "match_number");

CREATE INDEX IF NOT EXISTS "idx_matches_tournament_group_number" 
ON "matches" ("tournament_id", "group_number") 
WHERE "group_number" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_matches_stage_group_match_number" 
ON "matches" ("stage", "group_number", "match_number") 
WHERE "stage" = 'GROUP' AND "group_number" IS NOT NULL;

-- Update existing matches to have match numbers
-- This will assign sequential match numbers to existing matches based on creation order
DO $$
DECLARE
    tournament_rec RECORD;
    stage_rec RECORD;
    group_rec RECORD;
    match_rec RECORD;
    counter INTEGER;
BEGIN
    -- For each tournament
    FOR tournament_rec IN 
        SELECT DISTINCT tournament_id FROM matches WHERE match_number IS NULL
    LOOP
        -- For each stage in the tournament
        FOR stage_rec IN 
            SELECT DISTINCT stage FROM matches 
            WHERE tournament_id = tournament_rec.tournament_id AND match_number IS NULL
        LOOP
            IF stage_rec.stage = 'GROUP' THEN
                -- For group stage, handle each group separately
                FOR group_rec IN 
                    SELECT DISTINCT group_number FROM matches 
                    WHERE tournament_id = tournament_rec.tournament_id 
                    AND stage = stage_rec.stage 
                    AND match_number IS NULL
                    AND group_number IS NOT NULL
                LOOP
                    counter := 1;
                    FOR match_rec IN 
                        SELECT id FROM matches 
                        WHERE tournament_id = tournament_rec.tournament_id 
                        AND stage = stage_rec.stage 
                        AND group_number = group_rec.group_number
                        AND match_number IS NULL
                        ORDER BY created_at, id
                    LOOP
                        UPDATE matches 
                        SET match_number = counter 
                        WHERE id = match_rec.id;
                        counter := counter + 1;
                    END LOOP;
                END LOOP;
                
                -- Handle group stage matches without group_number
                counter := 1;
                FOR match_rec IN 
                    SELECT id FROM matches 
                    WHERE tournament_id = tournament_rec.tournament_id 
                    AND stage = stage_rec.stage 
                    AND group_number IS NULL
                    AND match_number IS NULL
                    ORDER BY created_at, id
                LOOP
                    -- Assign group number and match number
                    UPDATE matches 
                    SET group_number = ((counter - 1) / 6) + 1,  -- Assuming 6 matches per group
                        match_number = ((counter - 1) % 6) + 1
                    WHERE id = match_rec.id;
                    counter := counter + 1;
                END LOOP;
            ELSE
                -- For non-group stages, assign sequential match numbers
                counter := 1;
                FOR match_rec IN 
                    SELECT id FROM matches 
                    WHERE tournament_id = tournament_rec.tournament_id 
                    AND stage = stage_rec.stage 
                    AND match_number IS NULL
                    ORDER BY round, created_at, id
                LOOP
                    UPDATE matches 
                    SET match_number = counter 
                    WHERE id = match_rec.id;
                    counter := counter + 1;
                END LOOP;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- Add constraints to ensure positive values
ALTER TABLE "matches" ADD CONSTRAINT "matches_match_number_positive" 
CHECK (match_number IS NULL OR match_number > 0);

ALTER TABLE "matches" ADD CONSTRAINT "matches_group_number_positive" 
CHECK (group_number IS NULL OR group_number > 0);

-- Add unique constraint for match numbers within tournament/stage/group
CREATE UNIQUE INDEX IF NOT EXISTS "idx_matches_unique_match_number_tournament_stage" 
ON "matches" ("tournament_id", "stage", "match_number") 
WHERE "stage" != 'GROUP' AND "match_number" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "idx_matches_unique_match_number_tournament_group" 
ON "matches" ("tournament_id", "group_number", "match_number") 
WHERE "stage" = 'GROUP' AND "group_number" IS NOT NULL AND "match_number" IS NOT NULL;