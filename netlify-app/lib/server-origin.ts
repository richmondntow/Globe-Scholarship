export function localDevelopment() {
  return process.env.BETTER_AUTH_ALLOW_LOCAL === 'true' && process.env.NETLIFY !== 'true';
}
export function siteOrigin() {
  const configured = process.env.BETTER_AUTH_URL || process.env.URL;
  if (!configured) throw new Error('Site origin is unavailable.');
  const origin = new URL(configured);
  if (!localDevelopment() && origin.protocol !== 'https:') throw new Error('The site requires HTTPS.');
  return origin.origin;
}
export function trustedOrigins() {
  return [siteOrigin(), ...(localDevelopment() ? ['http://terminal.local:4173','http://127.0.0.1:5173','http://localhost:5173'] : [])];
}
export function validOrigin(request: Request) {
  const origin = request.headers.get('origin');
  return origin !== null && trustedOrigins().includes(origin);
}
