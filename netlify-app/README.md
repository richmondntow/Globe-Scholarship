# GlobeScholarship AI — Netlify application

This version runs the existing GlobeScholarship product on standard Next.js and Netlify Database (PostgreSQL). It retains the Three.js/D3 globe, scholarship details, semantic search, open email/password registration, login, saved scholarships, and profile pages. An account is required before accessing the workspace or search.

Deployment status: prepared and locally validated; a Netlify production deployment and URL have not yet been verified. The original public prototype remains in `../prototype/`.

## Development and validation

Use Node.js 22.13+ and pnpm 11.25.0.

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm validate:core
```

The validation command starts Netlify's disposable PostgreSQL-compatible local database, applies the production SQL migration, and exercises the built Next.js server through real signup/login HTTP requests and session cookies. It passed 45 integration checks covering search, access control, account isolation, saving, profile updates, logout, session revocation, and login throttling. It creates no production accounts. Production build and TypeScript checks passed. ESLint passes with two advisory warnings about deliberate full-page navigation after authentication changes.

For regular development, `netlify dev` supplies the local database. Alternatively, configure an ignored `.env.local` with `NETLIFY_DB_URL`, a random `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL=http://localhost:5173`, and `BETTER_AUTH_ALLOW_LOCAL=true`, then run `pnpm dev`. Apply the SQL migration to that local database first. Never enable local HTTP authentication in production.

## Netlify deployment

Import `richmondntow/Globe-Scholarship` from GitHub on the Netlify Free plan. The repository-root `netlify.toml` configures:

- Base directory: `netlify-app`
- Build command: `pnpm build`
- Publish directory: `.next`
- Node.js: 22

Netlify's maintained Next.js adapter supplies the server-rendered pages and API functions. The installed `@netlify/database` package enables native database provisioning. Netlify applies `netlify/database/migrations/0001_accounts_and_saved.sql` before publishing.

Before publishing, set `BETTER_AUTH_SECRET` to at least 32 cryptographically random characters in Netlify's environment-variable settings with the Functions scope. Set `BETTER_AUTH_URL` to the exact HTTPS production origin with the Functions scope; the Netlify-supplied `URL` is a fallback. Netlify supplies `NETLIFY_DB_URL`. Keep all credential values out of GitHub, build output, and client-visible `NEXT_PUBLIC_` variables.

Choose an available project name for a free `*.netlify.app` address. A custom domain or DNS purchase is not required. Hosting, compute, database, and traffic remain subject to the Free plan's usage limits; no paid upgrade is configured in this source.

## Product and account boundaries

The catalog contains 14 curated opportunities across nine destinations, reviewed on 3 October 2026. The AI search uses a trained TF-IDF/latent semantic analysis model; it does not crawl the live web, call a generative model, determine eligibility, or predict award decisions. Each opportunity links to its official provider.

Better Auth stores scrypt password hashes and signed HttpOnly session cookies. The server enforces each account's access to its own profile and saved scholarships. Production cookies require HTTPS, write requests must match the configured origin, and authentication rate limits persist in PostgreSQL. Email verification and password-reset email delivery are not configured.

The original deployed site's account table was empty when checked during migration preparation. No credentials, sessions, profiles, or saved-user data are included in this repository. The new production database still needs to be provisioned and checked before switching the live link. Browser verification of the migrated globe and hosted signup/save flow remains a deployment check; the cloud browser could not reach the local preview.
