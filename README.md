# GlobeScholarship Access

[**Open the live website**](https://globescholarship-access-test.netlify.app/)

Explore scholarship opportunities with an interactive 3D globe, natural-language catalog search, and AI-powered web discovery with clickable source citations.

The website is publicly accessible. Create a GlobeScholarship account to use the workspace, search, save scholarships, and manage your profile. No Netlify account or invitation is required.

The [original website address](https://globescholarship-ai.richmondntow303.chatgpt.site/) forwards visitors to the Netlify application.

## Features

- **Explore the globe:** select destinations through the Three.js/D3 globe or accessible country selector.
- **Search the catalog:** semantic search over 14 curated scholarship opportunities across nine destinations.
- **Discover scholarships on the web:** OpenAI Responses web search returns up to three findings with clickable source citations, funding information, application deadlines and GPA requirements when supported by sources.
- **GPA information:** enter a GPA on a 4.0 scale; invalid values are rejected. Catalog numerical GPA requirements are unverified, so GPA does not filter catalog results or confirm eligibility.
- **Refine results:** destination, study level, funding, and deadline status controls.
- **Keep a collection:** account-specific saved scholarships and study profiles stored in PostgreSQL.

AI findings can contain errors. Confirm current deadlines, funding, and eligibility on official provider websites before applying. Web findings are displayed separately from saved catalog scholarships.

## Run locally

Use Node.js 22.13+ and pnpm 11.25.0.

```sh
git clone https://github.com/richmondntow/Globe-Scholarship.git
cd Globe-Scholarship/netlify-app
pnpm install --frozen-lockfile
pnpm build
pnpm validate:core
pnpm dev
```

For development, use `netlify dev` or configure the local database and authentication environment described in [the application README](netlify-app/README.md). `pnpm dev` requires that configuration. The integration validation command supplies its own disposable local database.

## Netlify deployment

| Setting | Value |
| --- | --- |
| Repository | `richmondntow/Globe-Scholarship` |
| Production branch | `main` |
| Base directory | `netlify-app` |
| Build command | `pnpm build` |
| Publish directory | `.next` |
| Node version | `22` |
| Next.js adapter | `@netlify/plugin-nextjs`, declared in `netlify.toml` |

Configure `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and `OPENAI_API_KEY` in Netlify. Netlify provisions `NETLIFY_DB_URL` and applies the SQL migration. `OPENAI_SEARCH_MODEL` optionally overrides the default `gpt-4.1-mini`. API usage requires a funded OpenAI API account and is billed separately from ChatGPT.

Keys stay on the server: never commit credentials or put them in `NEXT_PUBLIC_` variables. Web discovery sends only the submitted search and selected study filters, with a disclosure in the UI. Authentication, same-origin checks, persistent rate limits and request timeouts protect the endpoint. See [setup and operational details](netlify-app/README.md).

## Validation

- Production build and TypeScript checks passed.
- **50 local integration checks** passed for real account registration/login, authorization, search, isolation, save/profile persistence, logout, and unavailable-provider behavior.
- **Four mocked provider/citation tests** passed, including unsafe URL rejection, incomplete evidence, and provider error handling.
- Hosted checks passed for login, GPA validation, saved-scholarship persistence, and a live AI web search returning three findings with clickable DAAD source links on 17 October 2026.

## Repository layout

| Folder | Contents |
| --- | --- |
| `netlify-app/` | Maintained Next.js application, PostgreSQL migrations, tests and setup guide |
| `prototype/` | Archived original Sites/Cloudflare prototype source for reference |
| `backend/` | Original FastAPI concept |
| `frontend/` | Original HTML/CSS/JavaScript frontend |
| `docs/original-concept.md` | Original project concept |

Legacy Sites accounts and saved data are not automatically migrated to Netlify. The new application uses its own accounts and database. Legacy source and storage have been retained; migration does not delete them.
