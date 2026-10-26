import { sql } from 'drizzle-orm';
import { database } from '../db/store';

export type Operation = 'catalog_search' | 'saved_scholarship';
export function safeLatencyMs(startedAt:number,endedAt:number = performance.now()):number {
  return Math.min(120_000,Math.max(0,Math.round(endedAt-startedAt)));
}

/** Best-effort operational telemetry. Never store user IDs, search terms, or scholarship IDs. */
export async function recordOperationalMetric(operation:Operation,startedAt:number,success:boolean):Promise<void> {
  const elapsed=safeLatencyMs(startedAt);
  try {
    await database().execute(sql`
      INSERT INTO operational_metrics(metric_day,operation,requests,failures,total_latency_ms,max_latency_ms)
      VALUES (CURRENT_DATE,${operation},1,${success?0:1},${elapsed},${elapsed})
      ON CONFLICT(metric_day,operation) DO UPDATE SET
        requests=operational_metrics.requests+1,
        failures=operational_metrics.failures+EXCLUDED.failures,
        total_latency_ms=operational_metrics.total_latency_ms+EXCLUDED.total_latency_ms,
        max_latency_ms=GREATEST(operational_metrics.max_latency_ms,EXCLUDED.max_latency_ms)
    `);
  } catch (error) {
    // Metrics collection must not break normal scholarship workflows.
    console.warn('Aggregate operational metric unavailable',error instanceof Error?error.message:'unknown');
  }
}
