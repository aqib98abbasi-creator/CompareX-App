-- ============================================================================
-- CompareX Supabase Schema — Initial Migration
-- Run in the Supabase Dashboard → SQL Editor to set up tables.
-- ============================================================================

-- 1. Components table — stores the full hardware catalog
CREATE TABLE IF NOT EXISTS components (
  id             TEXT PRIMARY KEY,
  type           TEXT NOT NULL,              -- 'CPU', 'GPU', 'RAM', 'SSD', etc.
  name           TEXT NOT NULL,
  brand          TEXT NOT NULL,
  specs          JSONB NOT NULL DEFAULT '{}',
  benchmarks     JSONB NOT NULL DEFAULT '{}',
  performance_score INTEGER NOT NULL DEFAULT 0,
  price          NUMERIC(10, 2) NOT NULL DEFAULT 0,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_components_type ON components (type);
CREATE INDEX IF NOT EXISTS idx_components_brand ON components (brand);
CREATE INDEX IF NOT EXISTS idx_components_score ON components (performance_score DESC);

-- 2. User comparisons — saves user's recent comparisons & bottleneck checks
CREATE TABLE IF NOT EXISTS user_comparisons (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  component_ids   TEXT[] NOT NULL DEFAULT '{}',
  comparison_type TEXT NOT NULL DEFAULT 'comparison',  -- 'comparison' | 'bottleneck'
  metadata        JSONB NOT NULL DEFAULT '{}',          -- resolution, useCase, result, etc.
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_comparisons_user ON user_comparisons (user_id, created_at DESC);

-- 3. Price history — tracks component price changes over time
CREATE TABLE IF NOT EXISTS price_history (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id   TEXT NOT NULL REFERENCES components(id) ON DELETE CASCADE,
  price          NUMERIC(10, 2) NOT NULL,
  date           DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE INDEX IF NOT EXISTS idx_price_history_component ON price_history (component_id, date DESC);

-- Unique constraint: one price per component per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_price_history_unique
  ON price_history (component_id, date);

-- 4. Push notification tokens — stores device tokens for push notifications
CREATE TABLE IF NOT EXISTS push_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE,
  platform   TEXT NOT NULL DEFAULT 'unknown',   -- 'ios', 'android', 'web'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens (user_id);

-- 5. Price alerts — which components a user is watching for price drops
CREATE TABLE IF NOT EXISTS price_alerts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  component_id   TEXT NOT NULL REFERENCES components(id) ON DELETE CASCADE,
  threshold_pct  INTEGER NOT NULL DEFAULT 10,  -- notify when price drops by this %
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, component_id)
);

-- ============================================================================
-- Row-Level Security (RLS)
-- ============================================================================

ALTER TABLE components ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

-- Components: anyone can read, only service role can write
CREATE POLICY "Components are publicly readable"
  ON components FOR SELECT
  USING (true);

CREATE POLICY "Service role can write components"
  ON components FOR ALL
  USING (auth.role() = 'service_role');

-- User comparisons: users can only see/manage their own
CREATE POLICY "Users can manage their own comparisons"
  ON user_comparisons FOR ALL
  USING (auth.uid() = user_id);

-- Price history: publicly readable
CREATE POLICY "Price history is publicly readable"
  ON price_history FOR SELECT
  USING (true);

CREATE POLICY "Service role can write price history"
  ON price_history FOR ALL
  USING (auth.role() = 'service_role');

-- Push tokens: users can manage their own
CREATE POLICY "Users can manage their own tokens"
  ON push_tokens FOR ALL
  USING (auth.uid() = user_id);

-- Price alerts: users can manage their own
CREATE POLICY "Users can manage their own alerts"
  ON price_alerts FOR ALL
  USING (auth.uid() = user_id);
