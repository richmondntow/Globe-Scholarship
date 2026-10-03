import { NetlifyDB } from '@netlify/database-dev';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { mkdirSync, openSync, closeSync } from 'node:fs';

// The same PostgreSQL wire protocol, driver, migrations, and API routes run here
// as on Netlify. Synthetic accounts exist only in this disposable local database.
const db = new NetlifyDB({ logger: () => {} });
let server;
mkdirSync('.netlify', { recursive: true });
const log = openSync('.netlify/core-validation-server.log', 'w');
try {
  const connectionString = await db.start();
  await db.applyMigrations('./netlify/database/migrations');
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '0.0.0.0', '--port', '5173'], {
    env: { ...process.env, NETLIFY_DB_URL: connectionString, BETTER_AUTH_SECRET: randomBytes(48).toString('base64url'),
      BETTER_AUTH_ALLOW_LOCAL: 'true', BETTER_AUTH_URL: 'http://127.0.0.1:5173', NEXT_TELEMETRY_DISABLED: '1' },
    stdio: ['ignore', log, log],
  });
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null) throw new Error('Validation server exited; see .netlify/core-validation-server.log.');
    try { ready = (await fetch('http://127.0.0.1:5173/login')).ok; } catch {}
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  if (!ready) throw new Error('Validation server did not start.');
  const checks = spawn('python', ['scripts/validate-core.py'], { stdio: 'inherit', env: { ...process.env, VALIDATE_BASE_URL: 'http://127.0.0.1:5173' } });
  const [code] = await once(checks, 'exit');
  if (code !== 0) process.exitCode = code ?? 1;
} finally {
  if (server && server.exitCode === null) { server.kill('SIGTERM'); await once(server, 'exit'); }
  closeSync(log);
  await db.stop();
}
