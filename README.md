# Card Roster

Static site + serverless functions, ready for Vercel. No framework required —
Vercel auto-detects `/public` as static output and `/api/*.js` as serverless functions.

## What's here

```
public/index.html        the app — scanning, cropping, bg removal, tracker tab
public/login.html         login / signup page
public/account.html       change email, change password, delete account
lib/auth.js               password hashing + JWT session helpers
api/auth/signup.js        create account
api/auth/login.js         sign in
api/auth/logout.js        clear session
api/auth/me.js            check current session (frontend uses this to gate access)
api/account/update-email.js     change email (requires current password)
api/account/update-password.js  change password (requires current password)
api/account/update-profile.js   change name, username, avatar, light/dark theme
api/account/delete.js           delete account + all cards (requires current password)
api/analyze-card.js       calls Claude server-side to read a card photo (requires session)
api/cards/index.js        GET (list) / POST (create or update) a card — scoped to the user
api/cards/[id].js         DELETE a card — scoped to the user
schema.sql                 run once to create the users + cards tables
```

## 1. Push to GitHub

```bash
cd axl-tracker
git init
git add .
git commit -m "Card Roster"
git remote add origin https://github.com/CameronTorresN/axl-wc26-tracker.git
git push -u origin main
```

## 2. Import into Vercel

- vercel.com → Add New → Project → import the repo
- Framework preset: **Other** (no build step needed)

## 3. Add a Postgres database (via Neon, through the Marketplace)

Vercel's native Postgres product was discontinued — it's now provisioned
through the **Marketplace** instead, backed by Neon:

- In the project: **Storage** tab → **Marketplace Database Providers**
  → **Neon** (or another Postgres provider) → **Install** / **Add Integration**
- Follow the prompts to create a database and connect it to this project
- This automatically sets `POSTGRES_URL` and friends as env vars — nothing to copy by hand

(If you don't see "Neon" listed, search the Vercel Marketplace directly for
"Postgres" — there are a few providers, any of them work fine here as long as
they inject a standard `POSTGRES_URL`.)

## 4. Run the schema once

Storage tab → your database → **Query** tab → paste the contents of `schema.sql` → Run.

## 5. Add environment variables

Project → **Settings** → **Environment Variables**:

- `ANTHROPIC_API_KEY` — from console.anthropic.com/settings/keys
- `JWT_SECRET` — any long random string, e.g. generate with `openssl rand -base64 32`

Redeploy so the functions pick them up.

## 6. Deploy

Push to `main` (or click **Redeploy**). Vercel gives you a `*.vercel.app` URL.
Visiting it goes straight to `login.html` if you're not signed in — create an
account there, then you land on your (empty) collection.

Add your own domain under **Settings → Domains** whenever you're ready
(e.g. `axl.camtorres.com`).

---

## How the login works

- Email + password, hashed with bcrypt, stored in the `users` table
- On login/signup, a signed JWT is set as an httpOnly cookie (`axl_session`,
  30-day expiry) — never readable from JS, only sent automatically by the browser
- Every `/api/cards*` and `/api/analyze-card` call checks that cookie server-side
  and 401s without it — `index.html` redirects to `login.html` on a 401
- Each card is stored with a `user_id`, so everyone's collection is private to
  their own account. No sharing between users (yet)

## Known limitations — what's *not* built yet

- **Database is Neon via the Vercel Marketplace, not "Vercel Postgres."**
  Vercel discontinued native Postgres in early 2025 — everything here uses
  `@neondatabase/serverless` and a `POSTGRES_URL` env var, which works the
  same way regardless of which Marketplace Postgres provider you pick.

- **If you already deployed an earlier version**, rerun `schema.sql` — it now
  includes `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` lines for `name`,
  `username`, `avatar`, and `theme` on the `users` table, safe to run again.
- **Theme preference is per-account** (stored in the database, toggled from
  the profile page) but only applies to `index.html`/`login.html`/`account.html`
  — there's no system "match OS theme" detection.
- **No password reset / email verification.** If you forget your password
  there's no "forgot password" email flow — you'd need to update it directly
  in the database. OAuth (Google/Apple sign-in) is also not included.
- **Account page requires your current password for every security-sensitive
  change** (email, password, delete) — profile fields (name, username, avatar,
  theme) don't, since they're cosmetic.
- **Card images live in the database as base64 text.** Works fine at small
  scale. If your collection grows large, move images to **Vercel Blob**
  storage instead and store just the URL in Postgres.
- **The "meta" (completion target) number is per-browser** (localStorage), not
  synced to the account — easy to move into the database later if you want it
  to follow you across devices.
- **Background removal is a flood-fill color filter, not real segmentation.**
  Works best after cropping tightly first.

## Cost to run

- Vercel: free tier covers this comfortably (static hosting + serverless functions + small Postgres db)
- Anthropic API: pay-per-call, roughly a fraction of a cent per card scan at Sonnet pricing — check current rates at anthropic.com/pricing
