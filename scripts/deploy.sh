#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# One-shot provision + deploy for the community site (all Cloudflare free tier).
#
# What it does (idempotent — safe to re-run):
#   1. Verifies you're authenticated to Cloudflare
#   2. Creates the D1 database, R2 bucket (+ public dev URL), and KV namespace
#   3. Writes their IDs into wrangler.jsonc
#   4. Generates ADMIN_PASSWORD / SESSION_SECRET / CRON_SECRET and stores them as secrets
#   5. Applies database migrations to the remote D1
#   6. Builds with OpenNext and deploys, then prints your live URL
#
# Prereqs: Node 20+, and ONE of:
#   - `npx wrangler login` already run, OR
#   - CLOUDFLARE_API_TOKEN (+ CLOUDFLARE_ACCOUNT_ID) exported in your shell
#
# Instagram + Resend are OPTIONAL for a first deploy — the site runs without them.
# Set them later with `npx wrangler secret put <NAME>` (see README).
# ---------------------------------------------------------------------------
set -uo pipefail
cd "$(dirname "$0")/.."

WR="npx --yes wrangler@4"
CFG="wrangler.jsonc"
say() { printf "\n\033[1;36m==> %s\033[0m\n" "$1"; }
warn() { printf "\033[1;33m ! %s\033[0m\n" "$1"; }

# --- 0. Auth check ---------------------------------------------------------
say "Checking Cloudflare authentication"
if ! $WR whoami >/dev/null 2>&1; then
  warn "Not authenticated. Run 'npx wrangler login' OR export CLOUDFLARE_API_TOKEN, then re-run."
  exit 1
fi
$WR whoami | grep -i "account" || true

# --- 1. D1 database --------------------------------------------------------
say "Creating D1 database 'community_db' (ok if it already exists)"
D1_OUT=$($WR d1 create community_db 2>&1 || true)
echo "$D1_OUT"
D1_ID=$(printf '%s' "$D1_OUT" | grep -oE '"?database_id"?[[:space:]]*[:=][[:space:]]*"?[0-9a-f-]{36}"?' | grep -oE '[0-9a-f-]{36}' | head -1)
if [ -z "${D1_ID:-}" ]; then
  # Already existed — look it up from the list.
  D1_ID=$($WR d1 list --json 2>/dev/null | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const a=JSON.parse(s);const m=a.find(x=>x.name==="community_db");if(m)process.stdout.write(m.uuid||m.database_id||"")}catch{}})')
fi
[ -n "${D1_ID:-}" ] && say "D1 id: $D1_ID" || { warn "Could not determine D1 id — set it manually in $CFG"; }

# --- 2. R2 bucket + public URL --------------------------------------------
say "Creating R2 bucket 'community-media' (ok if it already exists)"
$WR r2 bucket create community-media 2>&1 | grep -vi "already" || true
say "Enabling the public dev URL for the bucket (Instagram needs a public image URL)"
R2_OUT=$($WR r2 bucket dev-url enable community-media 2>&1 <<< "y" || true)
echo "$R2_OUT"
R2_URL=$(printf '%s' "$R2_OUT" | grep -oE 'https://pub-[0-9a-z]+\.r2\.dev' | head -1)
[ -n "${R2_URL:-}" ] && say "R2 public URL: $R2_URL" || warn "Could not read R2 public URL — enable it in the dashboard and set R2_PUBLIC_BASE_URL in $CFG"

# --- 3. KV namespace -------------------------------------------------------
say "Creating KV namespace 'IG_TOKENS' (ok if it already exists)"
KV_OUT=$($WR kv namespace create IG_TOKENS 2>&1 || true)
echo "$KV_OUT"
KV_ID=$(printf '%s' "$KV_OUT" | grep -oE '"?id"?[[:space:]]*[:=][[:space:]]*"?[0-9a-f]{32}"?' | grep -oE '[0-9a-f]{32}' | head -1)
if [ -z "${KV_ID:-}" ]; then
  KV_ID=$($WR kv namespace list 2>/dev/null | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const a=JSON.parse(s);const m=a.find(x=>/(^|[-_])IG_TOKENS$/.test(x.title));if(m)process.stdout.write(m.id||"")}catch{}})')
fi
[ -n "${KV_ID:-}" ] && say "KV id: $KV_ID" || warn "Could not determine KV id — set it manually in $CFG"

# --- 4. Patch wrangler.jsonc ----------------------------------------------
say "Writing resource IDs into $CFG"
node - "$CFG" "${D1_ID:-}" "${R2_URL:-}" "${KV_ID:-}" <<'NODE'
const fs = require("fs");
const [file, d1, r2, kv] = process.argv.slice(2);
let t = fs.readFileSync(file, "utf8");
if (d1) t = t.replace("REPLACE_WITH_D1_DATABASE_ID", d1);
if (kv) t = t.replace("REPLACE_WITH_KV_NAMESPACE_ID", kv);
if (r2) t = t.replace(/https:\/\/REPLACE_WITH_YOUR_R2_PUBLIC_BUCKET\.r2\.dev/, r2);
fs.writeFileSync(file, t);
console.log("  patched:", [d1 && "D1", kv && "KV", r2 && "R2"].filter(Boolean).join(", ") || "nothing");
NODE

# --- 5. Secrets ------------------------------------------------------------
say "Generating and storing admin secrets"
gen() { node -e 'process.stdout.write(require("crypto").randomBytes(24).toString("base64url"))'; }
ADMIN_PASSWORD=$(gen); SESSION_SECRET=$(gen); CRON_SECRET=$(gen)
printf '%s' "$ADMIN_PASSWORD" | $WR secret put ADMIN_PASSWORD >/dev/null 2>&1 && echo "  set ADMIN_PASSWORD"
printf '%s' "$SESSION_SECRET" | $WR secret put SESSION_SECRET >/dev/null 2>&1 && echo "  set SESSION_SECRET"
printf '%s' "$CRON_SECRET"    | $WR secret put CRON_SECRET    >/dev/null 2>&1 && echo "  set CRON_SECRET"

# --- 6. Migrations ---------------------------------------------------------
say "Applying database migrations to remote D1"
$WR d1 migrations apply community_db --remote

# --- 7. Deploy -------------------------------------------------------------
say "Building and deploying (OpenNext → Cloudflare Workers)"
npm run deploy

say "Done!"
echo "-----------------------------------------------------------------------"
echo " Your admin password (save this — it won't be shown again):"
echo "     $ADMIN_PASSWORD"
echo " Sign in at  <your-worker-url>/admin"
echo ""
echo " Instagram + email are optional and OFF until you set their secrets:"
echo "     npx wrangler secret put RESEND_API_KEY EMAIL_FROM"
echo "     npx wrangler secret put IG_USER_ID IG_APP_ID IG_APP_SECRET IG_SEED_LONG_LIVED_TOKEN"
echo " Then deploy the reminder/token cron worker:  cd cron-worker && npx wrangler deploy"
echo "-----------------------------------------------------------------------"
