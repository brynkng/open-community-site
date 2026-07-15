# Community Site

A small, all–free-tier site for a community group that runs **multiple branded programs**:

- **Programs** — branded event series (e.g. *Nomadic Bike Philly*, *Saturday Dinner*, *Community Trips*), each with its own logo, accent color, and tagline. The homepage renders one section per program, and new programs can be added from the admin with no code.
- **Saturday dinner** — public page with RSVP + live headcount
- **Sunday rides** — postable ride pages (route, pace, cover image) with RSVP + headcount
- **Trips** — one-off trip pages that gather interest (headcount) and run a Doodle-style "best time" poll to pick the date
- **Newsletter** — email signup + a simple "send to subscribers" tool
- **Instagram** — one-click publish of a ride's or trip's cover image + caption to your IG
- **Organizer dashboard** — password-protected admin to manage all of the above
- **Reminders** — automatic email the day before each event

Everything runs on free tiers you already use: **Cloudflare** (Pages/Workers + D1 + R2 + KV + Cron) and **Resend** for email. No monthly cost.

---

## Stack

| Concern            | Tech                                             |
| ------------------ | ------------------------------------------------ |
| Framework          | Next.js 15 (App Router) + React 19               |
| Hosting            | Cloudflare Workers via `@opennextjs/cloudflare`  |
| Database           | Cloudflare D1 (SQLite) + Drizzle ORM             |
| Image hosting      | Cloudflare R2 (public bucket — needed by the IG API) |
| Token storage      | Cloudflare KV (rotating IG token)                |
| Scheduled jobs     | Cloudflare Cron Trigger (companion worker in `cron-worker/`) |
| Email              | Resend (REST API)                                |
| Auth               | Single organizer password → signed cookie (jose) |

---

## Local development

```bash
npm install
cp .env.example .dev.vars      # fill in values (wrangler reads .dev.vars locally)
npm run db:migrate:local       # create tables in the local D1
npm run dev                    # http://localhost:3000
```

`next dev` is wired to Cloudflare bindings via `initOpenNextCloudflareForDev()`, so D1/R2/KV work locally.

---

## Deploy to a live URL in ~10 minutes

**Fastest path — one script.** Authenticate to Cloudflare once, then run the provisioning script. It creates the database, image bucket, and token store, wires their IDs into `wrangler.jsonc`, generates your admin password and other secrets, runs the migrations, and deploys — printing your live `*.workers.dev` URL and admin password at the end.

```bash
npm install
npx wrangler login          # or export CLOUDFLARE_API_TOKEN
./scripts/deploy.sh
```

Instagram and email are **optional for the first deploy** — the site is fully usable without them (RSVPs, rides, trips, headcounts all work; only sending email and posting to Instagram are off until you add those secrets). Add them later with `npx wrangler secret put …` (see below), then `cd cron-worker && npx wrangler deploy` for the reminder/token jobs.

Prefer a custom domain? After the first deploy, add a route in the Cloudflare dashboard (Workers → your worker → Settings → Domains & Routes) or a `routes` entry in `wrangler.jsonc`.

If you'd rather do it by hand, the manual steps are below.

---

## One-time Cloudflare setup (manual)

```bash
# 1. Database
wrangler d1 create community_db
#   → paste the printed database_id into wrangler.jsonc (d1_databases[0].database_id)

# 2. Image bucket (make it public so Instagram can fetch images)
wrangler r2 bucket create community-media
#   In the dashboard: R2 → community-media → Settings → enable the r2.dev public URL
#   (or attach a custom domain). Put that URL in wrangler.jsonc → vars.R2_PUBLIC_BASE_URL

# 3. KV for the Instagram token
wrangler kv namespace create IG_TOKENS
#   → paste the id into wrangler.jsonc (kv_namespaces[0].id)

# 4. Apply migrations to the remote DB
npm run db:migrate:remote
```

### Secrets (production)

Set each secret from `.env.example` (never commit real values):

```bash
wrangler secret put ADMIN_PASSWORD
wrangler secret put SESSION_SECRET
wrangler secret put RESEND_API_KEY
wrangler secret put EMAIL_FROM
wrangler secret put IG_USER_ID
wrangler secret put IG_APP_ID
wrangler secret put IG_APP_SECRET
wrangler secret put IG_SEED_LONG_LIVED_TOKEN
wrangler secret put CRON_SECRET
```

### Deploy

```bash
npm run deploy        # builds with OpenNext and deploys to Cloudflare
```

---

## Instagram publishing setup (free, no App Review)

You publish to **your own** account, so the Meta app can stay in *development mode* — Meta only requires App Review to post on behalf of *other people's* accounts.

1. Convert the group's Instagram to a **Business** or **Creator** account and link it to a **Facebook Page**.
2. At [developers.facebook.com](https://developers.facebook.com) create an app → add the **Instagram** product + **Facebook Login**.
3. Add yourself/the IG account as an **admin or tester** of the app (this is what lets you skip App Review).
4. Grant the app the `instagram_content_publish`, `pages_show_list`, and `pages_read_engagement` permissions and generate a **long-lived user access token** (~60 days).
5. Find your **Instagram user ID** (numeric) and put the token, app id/secret, and user id into the secrets above (`IG_SEED_LONG_LIVED_TOKEN`, `IG_APP_ID`, `IG_APP_SECRET`, `IG_USER_ID`).

How it works in the app: when you click **Post to Instagram** on a ride, the app takes the ride's R2-hosted cover image (a public URL) and the caption, creates an IG media container, then publishes it. The daily cron extends the token so it never lapses. Limit is 25 posts / 24h — plenty.

> A ride needs a **cover image** to be postable (Instagram requires an image). The "Post to Instagram" button is disabled until one is uploaded.

---

## Scheduled jobs (token refresh + reminders)

Cloudflare Cron Triggers call a `scheduled()` handler, which the main OpenNext worker doesn't expose — so scheduling lives in the tiny companion worker in `cron-worker/`. It just pings the app's protected cron routes.

```bash
cd cron-worker
#   edit wrangler.jsonc → set SITE_URL to your deployed site URL
wrangler secret put CRON_SECRET     # must equal the main app's CRON_SECRET
wrangler deploy
```

The two routes it calls (also callable manually for testing):

- `GET /api/cron/refresh-ig-token?key=CRON_SECRET` — extends the IG token
- `GET /api/cron/ride-reminders?key=CRON_SECRET` — emails tomorrow's RSVPers

---

## Using it

- Public: `/` (home), `/dinner`, `/rides`, `/rides/<slug>`, `/trips`, `/trips/<slug>`
- Organizer: `/admin` → sign in with `ADMIN_PASSWORD`. From there: add dinners, post rides (with image), create trips (with a date poll), send a newsletter, publish to Instagram, cancel/restore, and see live headcounts.

### Programs (branded event series)

A **program** is a branded container for events. It has a `kind` (`ride`, `dinner`, or `trip`) that decides which event behavior it uses, plus its own logo, accent color, and tagline. Every dinner, ride, and trip belongs to a program.

Because the behavior is driven by `kind`, you can add **new branded programs of an existing kind** with zero code — e.g. a second ride group in another neighborhood, or a monthly supper club — from **Admin → Manage programs**. Each new program shows up as its own section on the homepage and its own item in the nav, and its events are filterable at `/rides?program=<slug>` (and the equivalent for dinners/trips).

The starter migration seeds three programs: **Nomadic Bike Philly** (ride), **Saturday Dinner** (dinner), and **Community Trips** (trip), and backfills any existing events onto them. Program logos can be a bundled asset under `public/brands/` (the Nomadic Bike Philly logo ships there) or uploaded to R2 from the admin.

### How the trip poll works

Create a trip and add a few candidate dates (poll options). On the public trip page, visitors say they're interested and check every date that works for them (approval-style voting, like Doodle/When2meet). The page shows a live tally with the leading date starred. When you've decided, set the **final date** on the trip's admin page — that closes the poll, shows the trip as confirmed, and automatically emails everyone who expressed interest. The notification is sent once per date (re-saving the same date won't resend; changing the date notifies again).

---

## What's stubbed for later (your v2 wishlist)

These are intentionally **not** built yet, but the schema and structure leave room:

- Double opt-in / branded unsubscribe flow for the newsletter
- Auto-posting dinners to Instagram (rides and trips have buttons; the IG lib is generic)
- Syncing the UI into a Claude Design design system

---

## Project layout

```
src/
  app/
    page.tsx                 home
    page.tsx                 home — one branded section per program
    dinner/                  dinner + RSVP (accepts ?program=slug)
    rides/                   ride list + [slug] detail + RSVP (accepts ?program=slug)
    trips/                   trip list + [slug] detail (interest + poll) (accepts ?program=slug)
    admin/                   login, dashboard, programs, new dinner/ride/trip, manage trip, newsletter
    api/cron/                token refresh + reminders
    actions.ts               public server actions (RSVP, subscribe)
  db/                        Drizzle schema + D1 client
  lib/                       instagram, email, auth, session, cron, programs, utils
  components/                forms + RideCard, TripCard, ProgramHeader/Badge/Select
public/brands/               bundled program logos (Nomadic Bike Philly ships here)
cron-worker/                 companion Cron Trigger worker
migrations/                  D1 SQL migrations
```
