import { getConnectionString } from '@netlify/database';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

let connection: ReturnType<typeof postgres> | undefined;
let db: ReturnType<typeof createDatabase> | undefined;
function createDatabase() {
  // Netlify supplies a private connection string at runtime. No database credentials
  // reach the client bundle or source repository. Small pools suit serverless functions.
  connection = postgres(getConnectionString(), { max: 2, idle_timeout: 20, connect_timeout: 10 });
  return drizzle(connection, { schema });
}
export function database() { return db ??= createDatabase(); }
