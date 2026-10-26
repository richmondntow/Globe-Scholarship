-- Aggregate operational counters: no user identifiers, queries, or scholarship details.
CREATE TABLE IF NOT EXISTS operational_metrics (
  metric_day DATE NOT NULL,
  operation TEXT NOT NULL,
  requests INTEGER NOT NULL DEFAULT 0,
  failures INTEGER NOT NULL DEFAULT 0,
  total_latency_ms BIGINT NOT NULL DEFAULT 0,
  max_latency_ms INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (metric_day, operation),
  CONSTRAINT operational_metrics_nonnegative CHECK (
    requests >= 0 AND failures >= 0 AND total_latency_ms >= 0 AND max_latency_ms >= 0
  )
);
