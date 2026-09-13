# Faza — فزعة

A community volunteering platform. Volunteers browse events and say **"I'm ready"** (instant
claim) or **apply** (organizer approval); organizers post events, break them into tasks with slot
capacities, track sign-ups live, export rosters, and earn a verification badge after an admin
reviews their NGO license or ID.

## Features

- **Auth & roles** — Auth.js v5 (Credentials + bcrypt, JWT sessions); VOLUNTEER / ORGANIZER / ADMIN
- **Events & tasks** — draft → publish lifecycle, per-task capacity, publish gated on verification
- **Sign-ups** — instant claim or apply-for-approval; `SELECT … FOR UPDATE` row locks make
  concurrent claims overbook-proof; live slot counts (2s polling + focus refresh) with optimistic
  UI, toasts and "someone beat you to it" handling
- **Organizer dashboard** — per-event tracker: fill rates, pending-approval inbox, rosters with
  contact details, publish/cancel, **CSV & Excel roster export** (papaparse / SheetJS)
- **Verification** — document upload (JPEG/PNG/PDF ≤ 10 MB, UploadThing in production, local-disk
  fallback in dev), admin review queue, blue checkmark badge on profiles & event cards
- **Dark mode** — class-based theme with no-flash boot script, persisted + system preference
  fallback, dark-correct dropdowns/popovers

## Stack

- **Next.js 15** (App Router, Server Actions, Turbopack) + **React 19**
- **Auth.js v5** (`next-auth@beta`) · **Prisma 5** · **PostgreSQL (Supabase)**
- **Tailwind CSS v4** + **shadcn/ui** (new-york, emerald brand) · **zod** (shared client/server)
- **papaparse** + **xlsx-js-style** (roster exports) · **sonner** (toasts) · **uploadthing** (docs)

## Project layout

```
src/
├─ app/                    # routing only
│  ├─ (marketing)/         # public landing → featured events
│  ├─ (auth)/login|register/
│  ├─ (app)/               # authenticated shell (top nav)
│  │  ├─ events/           # browse · new · [eventId]
│  │  ├─ dashboard/        # role-aware · events/[eventId] tracker · verification (admin)
│  │  ├─ verify/           # organizer document upload
│  │  └─ profile/
│  └─ api/                 # auth handlers · realtime task snapshots · file downloads
├─ features/               # business logic, colocated per domain
│  ├─ auth/ events/ tasks/ dashboard/ realtime/ verification/ export/ theme/
├─ components/ui/          # shadcn primitives — don't hand-edit (except theme tweaks)
├─ server/                 # db.ts (Prisma singleton) · auth.ts · auth.config.ts · errors.ts
├─ lib/                    # utils.ts · format.ts
├─ middleware.ts           # edge auth gate (UX only — actions re-check roles)
└─ types/next-auth.d.ts
```

Conventions: every `actions.ts` starts with `"use server"`, zod-validates its input (schemas live
in the same feature folder and are shared client/server), and re-checks the session role before
touching data — middleware is a UX gate, never the real authorization. Prisma types never cross
into client components; actions return plain mapped objects.

## Capacity model (the important part)

A task's capacity lives in the **signup rows**, not in a counter column. Filled slots are
`COUNT(TaskAssignment WHERE status = 'CONFIRMED')`. The claim action serializes concurrent claims
with `SELECT … FOR UPDATE` on the task row inside a transaction, then counts and inserts — so two
volunteers clicking at the same millisecond can never overbook a task. Approval-mode tasks
re-check capacity at approval time, not at apply time.

## Getting started

1. **Install** — `npm install`
2. **Database** — create a Supabase project (or any Postgres) and fill `.env`:

   ```
   # runtime — transaction pooler (PgBouncer): pgbouncer=true is required
   DATABASE_URL="postgresql://…@…pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=5"
   # migrations — session pooler (or direct connection)
   DIRECT_DATABASE_URL="postgresql://…@…pooler.supabase.com:5432/postgres"
   # Auth.js v5 secret (this is the v5 name; v4 called it NEXTAUTH_SECRET)
   # generate with: openssl rand -base64 32
   AUTH_SECRET="…"
   # optional — verification uploads use UploadThing when set, local .uploads/ when not
   UPLOADTHING_TOKEN="…"
   ```

   `directUrl` in `prisma/schema.prisma` routes CLI/migrations through `DIRECT_DATABASE_URL`
   (session mode keeps prepared statements working), while the client uses the pooled
   `DATABASE_URL`. `.env` and `.env.local` are both gitignored.

3. **Migrate & seed**

   ```bash
   npx prisma migrate dev     # apply migrations
   npx prisma db seed         # demo admin, organizer, volunteers, events + sign-ups
   ```

4. **Run** — `npm run dev` → http://localhost:3000

### Demo accounts (after seeding)

| Email                 | Password      | Role      |
| --------------------- | ------------- | --------- |
| `admin@fazaa.sa`      | `password123` | ADMIN     |
| `organizer@fazaa.sa`  | `password123` | ORGANIZER |
| `volunteer@fazaa.sa`  | `password123` | VOLUNTEER |
| `sara@fazaa.sa`       | `password123` | VOLUNTEER |

## Scripts

- `npm run dev` — dev server (Turbopack)
- `npm run build` / `npm start` — production build/serve
- `npm run lint` — ESLint
- `npx prisma studio` — browse the database

## Notes for production

- On serverless hosts (e.g. Vercel), keep the runtime `DATABASE_URL` on the transaction pooler
  with `?pgbouncer=true&connection_limit=1`.
- Rotate `AUTH_SECRET` (the committed dev value is rotated already, but treat it as a secret).
- **UploadThing documents**: when `UPLOADTHING_TOKEN` is set, verification files go to UT's CDN —
  configure the upload route to private/signed access, since ID documents are sensitive. The local
  fallback serves files through an auth-checked route (owner or admin only).
- Security headers (`X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`) are set
  in `next.config.ts`.
- The migration enables **RLS on every table with no policies**: the app reaches Postgres only
  through Prisma as the table owner, so Supabase's Data API surface stays locked down.
- Live slot counts use 2-second polling — swap in Supabase Realtime channels when scaling beyond
  a few hundred concurrent viewers.
- **Attended / Hours Worked** in exports are derived (status + task window); add attendance
  tracking to make them first-class.
- Display timezone is fixed to `Asia/Riyadh` for SSR consistency (`src/lib/format.ts`).
- Roadmap candidates: event-level RSVP, notifications (email/WhatsApp), volunteer hours & badges,
  Arabic RTL UI, Supabase Realtime channels.
