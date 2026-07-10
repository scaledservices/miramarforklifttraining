-- Structured system logs: server errors, job failures, payment/email errors,
-- and client-side (browser) errors. Queried by GET /api/admin/logs.
-- Rows older than 30 days are deleted by the log-cleanup background job.

CREATE TABLE IF NOT EXISTS system_logs (
  id SERIAL PRIMARY KEY,
  level TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'server',
  message TEXT NOT NULL,
  stack TEXT,
  request_path TEXT,
  request_method TEXT,
  user_id INTEGER,
  request_body JSONB,
  metadata JSONB,
  environment TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS system_logs_created_idx ON system_logs (created_at);
CREATE INDEX IF NOT EXISTS system_logs_level_created_idx ON system_logs (level, created_at);
CREATE INDEX IF NOT EXISTS system_logs_source_created_idx ON system_logs (source, created_at);
