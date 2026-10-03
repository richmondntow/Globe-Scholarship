import { env } from 'cloudflare:workers';
export function database() { if (!env.DB) throw new Error('Scholarship storage unavailable'); return env.DB; }
