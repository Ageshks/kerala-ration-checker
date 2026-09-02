# Kerala Ration Availability Checker 🛒

A production-quality MVP that lets users **search Kerala ration stores** and **check live
commodity availability** using *publicly available data* from the official
**Kerala AePDS / ePOS portal** and the **Supplyco Kerala** website.

No separate backend. No database (initial version). Everything runs inside a single
**Next.js** app — server-side functions do the fetching/scraping, with caching, rate
limiting and honest error handling.

## Architecture

```
User Browser
    │
    ▼
Next.js Application (Server Components / Server Actions / Route Handlers)
    │
    ▼
Web Scraper Services  (/services/scrapers/*)
    │
    ▼
Official public sources:
    ├─ epos.kerala.gov.in   (public AJAX endpoints → HTML fragments → Cheerio)
    ├─ supplycokerala.com   (public JSON API  /api/outlets)
    └─ api.postalpincode.in (public pincode → location API)
    │
    ▼
Parse latest data → cached (30 min – 24 h) → returned to user
```

> ⚠️ **The browser never scrapes external websites.** All data extraction happens
> server-side. Scraper modules are never bundled into client code.

## Features

| Feature | How it works |
|---|---|
| Search by **Pincode** | Resolved to district/taluk via India Post API, then matched to ration shops in that AFSO region |
| Search by **ARD number** | Direct store lookup via `FPS_Status_Details.jsp` public endpoint |
| Search by **District → Taluk/Region** | AFSO office list per district (`afso_fps_details.action`) then shops (`fps_aso_details.action`) |
| Store details | ARD, owner/dealer, district, office, license, cards, coordinates, Google Maps link, masked phone |
| Availability | Monthly stock register parsed into 🟢 Available / 🟡 Limited / 🔴 Out of Stock with quantities |
| Supplyco stores | 1651-outlet catalogue from the official JSON API, cached 24 h |
| Bilingual | English + Malayalam toggle (localStorage), large touch-friendly UI |
| Caching | In-memory TTL cache + in-flight dedupe (no DB) |
| Rate limiting | Per-host politeness limits, request timeouts, bounded retries |

## Tech stack

- **Next.js 15** (App Router, Server Components, Server Actions, Route Handlers)
- **TypeScript**
- **Tailwind CSS v4** + shadcn/ui-style components (`class-variance-authority`,
  `clsx`, `tailwind-merge`) under `components/ui/`
- **Cheerio** for static HTML parsing
- **Native Fetch** (Node 18+) with `AbortController` timeouts — no axios needed

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run start      # serve the production build
```

## Project structure

```
app/
  page.tsx                          # Home (hero, search, region drill-down)
  search/page.tsx                   # Search results (server component)
  store/[ard]/page.tsx              # Store details
  store/[ard]/availability/page.tsx # Availability details + refresh action
  about/page.tsx                    # About & disclaimer
  api/regions/route.ts              # Server proxy for office lists (browser-safe)
  actions/availability.ts           # Server Action: force-refresh stock
components/
  ui/                               # shadcn-style primitives
  shared/                           # header/footer/search/status/panels
services/
  cache.ts                          # In-memory TTL cache + dedupe
  http.ts                           # Timeout, UA, retries, per-host rate limit
  errors.ts                         # Normalized ScrapeError model
  data/districts.ts                 # 14 districts + fallback office lists
  scrapers/
    types.ts                        # Shared types
    rationShopParser.ts             # Office/shop/ARD identity HTML parsers
    stockParser.ts                  # Stock register table parser
    eposScraper.ts                  # ePOS portal data access (cached)
    supplycoScraper.ts              # Supplyco outlet catalogue (cached)
  search.ts                         # Orchestrator for all lookup paths
lib/
  constants.ts                      # TTLs, thresholds, helplines, sources
  availability.ts                   # status classification logic
  i18n.ts                           # English / Malayalam dictionary
  utils.ts                          # cn(), normalize(), levenshtein()
```

## Caching policy

| Data | TTL |
|---|---|
| Ration store details (ARD → details) | 24 hours |
| Stock information | 30 minutes |
| Search results | 1 hour |
| Supplyco outlet catalogue | 24 hours |
| Office / shop lists | 24 hours |
| Pincode resolution | 1 hour |

The memory cache is server-side per process and de-duplicates concurrent requests.
To scale horizontally, replace `services/cache.ts` with Redis/Upstash — no scraper
code changes needed.

## Error handling

If an official website is unavailable or times out, users see:

> “Unable to retrieve the latest ration availability information at the moment.
> Please try again later.”

Invalid pincodes/ARD numbers, layout changes (parser failures), missing stock data
and rate-limit hits all produce distinct, honest messages — never fabricated "live" data.

## Security & responsible scraping

- All external requests originate from the Next.js server only
- User-Agent header, 15 s timeouts, one bounded retry
- Per-host polite rate limits (e.g. ePOS: max 25 req/min)
- Caching first — no repeated scraping of the same data per user request
- `robots.txt` respected (Supplyco disallows crawling → we make one request per 24 h
  to its public JSON API and cache the catalogue)
- Security headers (nosniff, frame-deny, referrer-policy) in `next.config.ts`

## Deploying (GitHub + Vercel)

GitHub Pages only serves static files, so it cannot run the server-side scrapers.
Deploy to **Vercel** (the makers of Next.js) — the free Hobby tier runs this app as-is.

1. Push this project to a GitHub repository:

   ```bash
   git init -b main
   git add .
   git commit -m "Kerala Ration Availability Checker"
   git remote add origin git@github.com:<your-username>/<your-repo>.git
   git push -u origin main
   ```

2. On [vercel.com](https://vercel.com): **Add New → Project → Import** the GitHub repo.
3. Accept the defaults (framework auto-detected: Next.js) — **no environment variables
   are required** — and click Deploy.
4. Every future push to `main` auto-deploys; pull requests get preview URLs.

Deployment notes:

- All scraping pages/routes export `maxDuration = 60` (the Vercel Hobby cap) because a
  cold first search walks every AFSO office with polite pacing.
- The in-memory cache is per serverless instance: warm instances answer in milliseconds,
  cold ones re-scrape once and re-cache. For shared caching across instances, swap
  `services/cache.ts` for Upstash Redis — no scraper code changes needed.
- Geocoding uses the public OpenStreetMap Nominatim API (server-side only, cached 30
  days, rate-limited to their 1 req/s policy).

## Disclaimer

Ration availability information is collected from publicly available official sources.
Actual stock availability may change. Users are advised to contact the respective ration
shop or authorities before visiting. This is not a government website.