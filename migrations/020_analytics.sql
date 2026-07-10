-- Self-hosted analytics: pageviews + conversion events
-- Queried via GET /api/admin/analytics; pruned after 90 days by analytics-cleanup job.

CREATE TABLE IF NOT EXISTS page_views (
  id SERIAL PRIMARY KEY,
  path TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'en',
  referrer TEXT,
  referrer_source TEXT,
  session_id TEXT,
  user_id INTEGER,
  user_agent TEXT,
  is_mobile BOOLEAN NOT NULL DEFAULT false,
  country TEXT,
  region TEXT,
  city TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS page_views_created_idx ON page_views (created_at);
CREATE INDEX IF NOT EXISTS page_views_path_created_idx ON page_views (path, created_at);
CREATE INDEX IF NOT EXISTS page_views_session_idx ON page_views (session_id);

CREATE TABLE IF NOT EXISTS analytics_events (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  path TEXT NOT NULL,
  cta_label TEXT,
  cta_destination TEXT,
  lead_source TEXT,
  session_id TEXT,
  user_id INTEGER,
  metadata JSONB,
  revenue NUMERIC(10, 2),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS analytics_events_created_idx ON analytics_events (created_at);
CREATE INDEX IF NOT EXISTS analytics_events_type_created_idx ON analytics_events (event_type, created_at);
CREATE INDEX IF NOT EXISTS analytics_events_session_idx ON analytics_events (session_id);
