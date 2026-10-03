# GlobeScholarship AI

[Open the public prototype](https://globescholarship-ai.richmondntow303.chatgpt.site)

The working interactive product is in [`prototype/`](prototype/). Explore the globe, search scholarship opportunities, read funding and eligibility details, and create an email/password account to access the platform, save scholarships, or update your profile. Registration is open to everyone without owner approval.

## Repository layout

| Folder | Contents |
| --- | --- |
| `prototype/` | Current deployed application: React/TypeScript, Three.js and D3 globe, search model, Worker API, and D1 storage |
| `backend/` | Original GlobeScholarship Access FastAPI concept |
| `frontend/` | Original HTML/CSS/JavaScript frontend |
| `docs/original-concept.md` | Original project documentation |

## Run the current prototype

Node.js 22.13+ and the pinned pnpm version are required.

```sh
git clone https://github.com/richmondntow/Globe-Scholarship.git
cd Globe-Scholarship/prototype
pnpm install
pnpm dev
```

See [the prototype README](prototype/README.md) for the production build, local database initialization, integration checks, authentication requirements, and deployment notes.

The prototype searches a curated catalog reviewed on 3 October 2026. Its AI search uses a compact trained TF-IDF / latent semantic analysis model; it does not perform live web crawling or determine eligibility. Each opportunity links to its official provider.

## Validation

Type checking and the production build passed. The local Worker passed 45 integration checks for search intent, filters, anonymous request rejection, per-account save isolation, idempotent saving, save/unsave persistence, and profile persistence. Browser checks covered globe selection, search, opportunity details, and sign-in prompts. Local checks use real signup/login requests and session cookies, including revoked sessions and login rate limiting. Production registration was not exercised by local tests.

The source contains no application credentials or user databases. Profiles and saved scholarships stay private to each signed-in account even though the website is public.
