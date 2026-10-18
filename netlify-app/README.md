# GlobeScholarship AI — Netlify application

This version runs the existing GlobeScholarship product on standard Next.js and Netlify Database (PostgreSQL). It retains the Three.js/D3 globe, scholarship details, semantic search, open email/password registration, login, saved scholarships, and profile pages. An account is required before accessing the workspace or search.

Live application: https://globescholarship-access-test.netlify.app/. Public access is enabled; GlobeScholarship accounts are required for the workspace. The original Sites address forwards to this application. Archived prototype source remains in `../prototype/`.

## Development and validation

Use Node.js 22.13+ and pnpm 11.25.0.

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm validate:core
```

The validation command starts Netlify's disposable PostgreSQL-compatible local database, applies the production SQL migration, and exercises the built Next.js server through real signup/login HTTP requests and session cookies. It passed 50 integration checks covering search, access control, account isolation, saving, profile updates, logout, session revocation, and login throttling. It creates no production accounts. Production build and TypeScript checks passed. ESLint passes with two advisory warnings about deliberate full-page navigation after authentication changes.

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

### Live web discovery

"Find more on the web" opens an explicit-submit OpenAI Responses `web_search` integration. Set `OPENAI_API_KEY` as a Netlify Functions secret. Optionally set `OPENAI_SEARCH_MODEL` (default `gpt-4.1-mini`). Never use a `NEXT_PUBLIC_` key. API billing is separate from ChatGPT subscriptions. Without a key, web search reports that it is not connected; catalog search still works.

The UI discloses that only the typed query and selected destination, level, funding and optional GPA are sent to OpenAI. It does not send the account profile or session. Requests require account authentication and same-origin JSON. Atomic database counters limit requests to three per minute and ten per rolling day per account, plus 100 per rolling day site-wide. Provider calls have a 25-second timeout, one-tool-call maximum, bounded output, and disabled Responses storage. Provider error details stay server-side.

Results display clickable inline HTTPS source citations separately from catalog cards and saved scholarships. Unfinished and uncited responses are rejected. The prompt prefers official providers and unverified labels for unknown requirements; AI findings do not confirm accuracy, application status or eligibility. A hosted provider smoke test passed on 17 October 2026, returning three findings with clickable official DAAD source links.

Run `node --experimental-strip-types --test scripts/test-web-search.mjs` for provider-contract and citation-validation tests without a real key.

The catalog contains 14 curated opportunities across nine destinations, reviewed on 3 October 2026. The AI search uses a trained TF-IDF/latent semantic analysis model; it does not crawl the live web, call a generative model, determine eligibility, or predict award decisions. Each opportunity links to its official provider.

Better Auth stores scrypt password hashes and signed HttpOnly session cookies. The server enforces each account's access to its own profile and saved scholarships. Production cookies require HTTPS, write requests must match the configured origin, and authentication rate limits persist in PostgreSQL. Email verification and password-reset email delivery are not configured.

The original deployed site's account table was empty when checked during migration preparation. No credentials, sessions, profiles, or saved-user data are included in this repository. Netlify Database has been provisioned and its migration applied. Hosted login, GPA validation, save persistence and AI web discovery have been verified. Legacy Sites account data is not automatically migrated.
