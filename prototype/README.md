# GlobeScholarship AI

A working scholarship workspace based on GlobeScholarship Access.

Live prototype: https://globescholarship-ai.richmondntow303.chatgpt.site

## Product

- Interactive Three.js globe with a D3 orthographic canvas fallback for devices without WebGL. Country clicks, dragging, rotation pause, zoom, and an accessible destination picker.
- Natural-language search powered by a trained compact TF-IDF / latent semantic analysis model, plus explicit country, degree, and funding intent. Match explanations describe relevance, not confirmed eligibility.
- Fourteen curated opportunities across nine study destinations. Official source links, funding, study levels, benefits, eligibility requirements, and reviewed deadlines.
- ChatGPT platform authentication, durable per-user saved scholarships, and an editable study profile.

## Prototype boundaries

The catalog was reviewed on 3 October 2026. This prototype searches its curated catalog; it does not crawl the live web, use a generative LLM, predict award probabilities, or determine eligibility. Provider information and application deadlines can change. Each opportunity links to the official provider.

The JavaScript frontend direction from GlobeScholarship Access is preserved. Hosted API handlers use the Sites-supported JavaScript Worker runtime rather than FastAPI. D1 provides SQLite-compatible durable storage; server-side identity comes from the platform’s authenticated-user headers. Passwords and API keys are not stored by this app.

## Development

Use the package manager in `packageManager` and the checked-in pnpm lockfile. `pnpm dev` serves the app, `pnpm exec tsc --noEmit` checks types, and `pnpm build` creates the Worker.

For D1, generate migrations with `pnpm db:generate`. After building, initialize the local database using the checked-in SQL migration:

```sh
pnpm install
pnpm build
pnpm exec wrangler d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_flimsy_dexter_bennett.sql
python scripts/run-validation.py
pnpm start
```

The production database is managed by Sites; local test data is separate. `pnpm dev` uses the starter's development identity helper. Production identity requires the Sites authentication gateway, which verifies sessions and strips visitor-supplied identity headers. Do not expose a standalone Worker with this header-based authentication without a trusted authentication gateway.

The GitHub copy omits the original deployment project ID from `.openai/hosting.json`. It retains the `DB` binding for local development. GitHub commits do not automatically redeploy the current live site.

To reproduce model training: Python 3 with scikit-learn, then `python scripts/train-search.py`. The exported model is committed and does not require Python at runtime.

## Verification

`python scripts/run-validation.py` launches the built Worker and verifies natural-language intent, country aliases, unsupported-country handling, invalid queries, anonymous request rejection, cross-origin write rejection, per-user save isolation, idempotency, save/unsave persistence, and profile persistence. The script uses synthetic identities only in the local Worker. Production identity headers are supplied and enforced by the hosting platform.

Browser QA covers globe country selection and rotation controls, country filtering, scholarship details, search, and sign-in prompts. The user’s actual hosted ChatGPT login session is not exercised by these local integration checks.

## Privacy

The site is publicly accessible with the owner’s approval. Visitors can explore the globe and search the scholarship catalog without signing in. Saving scholarships and editing a profile require ChatGPT sign-in. Saved scholarships and profiles are scoped to the authenticated user on the server. No user database, credentials, or session tokens are included in the source.
