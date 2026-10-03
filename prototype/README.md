# GlobeScholarship AI

A working scholarship workspace based on GlobeScholarship Access.

Live prototype: https://globescholarship-ai.richmondntow303.chatgpt.site

## Product

- Interactive Three.js globe with a D3 orthographic canvas fallback for devices without WebGL. Country clicks, dragging, rotation pause, zoom, and an accessible destination picker.
- Natural-language search powered by a trained compact TF-IDF / latent semantic analysis model, plus explicit country, degree, and funding intent. Match explanations describe relevance, not confirmed eligibility.
- Fourteen curated opportunities across nine study destinations. Official source links, funding, study levels, benefits, eligibility requirements, and reviewed deadlines.
- Open email/password registration, dedicated signup and login pages, durable per-user saved scholarships, and an editable study profile. An account is required before accessing the globe or search.

## Prototype boundaries

The catalog was reviewed on 3 October 2026. This prototype searches its curated catalog; it does not crawl the live web, use a generative LLM, predict award probabilities, or determine eligibility. Provider information and application deadlines can change. Each opportunity links to the official provider.

The JavaScript frontend direction from GlobeScholarship Access is preserved. Hosted API handlers use the Sites-supported JavaScript Worker runtime rather than FastAPI. D1 provides SQLite-compatible durable storage. Better Auth handles email/password authentication, scrypt password hashes, signed HttpOnly session cookies, database-backed login rate limiting, and server-side session checks. Visitor-supplied identity headers are ignored. Plaintext passwords and API keys are not stored by this app.

## Development

Use the package manager in `packageManager` and the checked-in pnpm lockfile. `pnpm dev` serves the app, `pnpm exec tsc --noEmit` checks types, and `pnpm build` creates the Worker.

For D1, generate migrations with `pnpm db:generate`, build the Worker, and apply the checked-in migration to the local Wrangler database as described in the Sites starter documentation. Production migrations are applied by Sites deployment.

To reproduce model training: Python 3 with scikit-learn, then `python scripts/train-search.py`. The exported model is committed and does not require Python at runtime.

## Verification

`python scripts/run-validation.py` launches the built Worker and verifies natural-language intent, country aliases, unsupported-country handling, invalid queries, anonymous request rejection, cross-origin write rejection, per-user save isolation, idempotency, save/unsave persistence, and profile persistence. The script creates synthetic test accounts only in the local Worker and uses real session cookies. It does not create production accounts.

Browser QA covers the login/signup entry pages, anonymous redirect, account navigation, password visibility controls, and desktop layout. Earlier browser QA covered globe selection, scholarship search, and opportunity details. The current local Worker passes 45 integration checks using actual signup/login requests and cookie sessions, including logout, revoked/tampered sessions, save/profile persistence, and per-account isolation. Browser credential entry and actual production signup are not exercised by these local checks.

## Privacy

The site is publicly accessible with the owner’s approval. Anyone can reach signup/login and create an account without owner approval. Accessing the scholarship workspace, searching, saving scholarships, and editing a profile require an active GlobeScholarship account session. Saved scholarships and profiles are scoped to the authenticated user on the server. No user database, credentials, or session tokens are included in the source.

## Account setup

Runtime authentication requires a random `BETTER_AUTH_SECRET` (at least 32 characters) configured as a hosting secret. Never commit its value. For local development only, create an ignored `.dev.vars` with `BETTER_AUTH_SECRET` and `BETTER_AUTH_ALLOW_LOCAL=true`; this permits the local preview origins and HTTP cookies. Never enable the local flag in production. The `.dev.vars.example` lists the required keys.

After building, apply each pending checked-in SQL migration in order with:

```sh
pnpm exec wrangler d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/<pending-migration>.sql
python scripts/run-validation.py
pnpm start
```

Email verification and password reset email delivery are not configured in this prototype. Email is a login identifier, not proof of ownership. Users choose their own name and password and can sign up immediately. The API exposes only signup, login, logout, and session lookup. Existing platform-authenticated saved/profile rows are retained but are not automatically linked to new email accounts.

The requested custom hostname `globescholarship-ai.richmondntow303.site` is registered with the host and is pending DNS verification. The current live URL remains the one listed above until verification completes.
