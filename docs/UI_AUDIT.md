# Faz'aa — UI Audit: WCAG 2.1 AA contrast + responsive review

Scope: the components and tokens touched by the UI-completion plan —
`alert.tsx`, `badge.tsx`, `breadcrumb.tsx`, `pagination.tsx`, the mobile
touch-target floor on `button.tsx` / `input.tsx` / `select.tsx`, and the two
pages verified end to end (`/dashboard`, `/dashboard/events/[eventId]`).

Method: static review — no browser was run. Contrast ratios were computed with
the WCAG relative-luminance formula over the token values in
`src/app/styles/design-tokens.css`; alpha-tinted fills (`bg-growth/15` etc.)
were first alpha-composited over their surface (`--white` light / `#1e293b` card
dark) before measuring, because that is the color a user actually perceives.

---

## 1. WCAG 2.1 AA contrast audit — new/changed pairings

Threshold: **4.5:1** for normal text, 3:1 for UI graphics / focus indicators
(SC 1.4.3, 1.4.11).

| Element | Foreground | Background | Ratio | Result |
|---|---|---|---|---|
| Badge `default` | white `#fff` | crimson `#9e2a2b` | 7.45:1 | PASS |
| Badge `volunteer` | white `#fff` | dead-sea `#1e6b7e` | 6.07:1 | PASS |
| Badge `verified` | white `#fff` | dead-sea `#1e6b7e` | 6.07:1 | PASS |
| Badge `organizer` | slate-dark `#1f2937` | gold `#e0a96d` | 7.04:1 | PASS |
| Badge `event` / `completed` | white `#fff` | growth `#2a6f97` | 5.50:1 | PASS |
| Badge `pending` / `secondary` | gray-dark `#374151` | gray-light `#f3f4f6` | 9.37:1 | PASS |
| Alert `destructive` | crimson `#9e2a2b` | card white | 7.45:1 | PASS |
| Alert `success` (light) | slate-dark `#1f2937` | growth/15 on white | 11.91:1 | PASS *(fixed — was 4.46:1)* |
| Alert `success` (dark) | gray-light `#f3f4f6` | growth/15 on slate | 11.57:1 | PASS *(fixed — was 2.32:1)* |
| Alert `warning` (light) | slate-dark `#1f2937` | gold/20 on white | 12.83:1 | PASS |
| Alert `warning` (dark) | gold `#e0a96d` | gold/15 on slate | 5.26:1 | PASS |
| Alert `info` (light) | slate-dark `#1f2937` | dead-sea/10 on white | 12.73:1 | PASS |
| Alert `info` (dark) | gray-light `#f3f4f6` | dead-sea/15 on slate | 11.82:1 | PASS *(fixed — was 2.14:1)* |
| Breadcrumb link | dead-sea `#1e6b7e` | background white | 6.07:1 | PASS |
| Breadcrumb link `:hover` | crimson `#9e2a2b` | background white | 7.45:1 | PASS |
| Breadcrumb current page | gray-dark `#374151` | background white | 10.31:1 | PASS |
| Pagination active | white `#fff` | crimson `#9e2a2b` | 7.45:1 | PASS |
| Pagination link | dead-sea `#1e6b7e` | background white | 6.07:1 | PASS |
| Pagination disabled | gray-medium @50% | white | 1.66:1 | **Exempt** — inactive control (SC 1.4.3 exclusion) |
| Focus ring (all inputs/buttons) | dead-sea `#1e6b7e` | white | 6.07:1 | PASS (1.4.11) |

Note on the documented token figures: `design-tokens.css` records dead-sea and
growth as "5.6:1". Measured they are **6.07:1** and **5.50:1** respectively —
both still pass, but the comment in the token file overstates growth slightly.
Documented, not changed (changing a token value ripples across every consumer).

### Findings & remediation applied

The three failures above were all the same root cause: **an alert variant used
its own hue for text on a tinted fill of that same hue**. As the fill darkens
(in dark mode) the text and background converge, which is why the dark variants
collapsed to ~2.2:1. Fixed by adopting the pattern the `warning` variant already
used — tinted fill + `text-slate-dark` (light) / `text-gray-light` (dark), with
the hue carried by the fill and border instead of the text. Icons stay
`text-current`, so they inherit those same high-contrast text colors rather than
re-introducing the low-contrast hue as an icon color.

---

## 2. Pre-existing findings (out of plan scope — documented for later)

These were not introduced by this plan and are left untouched per the
"hand-rolled stays as-is" scoping decision. All are trivially migratable to the
new primitives:

| Location | Pairing | Ratio | Fix when ready |
|---|---|---|---|
| `dashboard/page.tsx:35` — `COMPLETED` badge | growth text on growth/15 | 4.46:1 FAIL | `<Badge variant="completed">` (5.50:1) |
| `features/events/components/badges.tsx:9` — `ONGOING` | amber-700 on amber-500/15 | 4.47:1 FAIL | `<Badge variant="pending">` or new amber variant |
| `VerificationStatus.tsx:11`, `SignupButton.tsx:95` | amber-700 on amber-500/15 | 4.47:1 FAIL | migrate to `Alert variant="warning"` |
| `TaskCard.tsx:109` — icon | amber-600 on white | 3.19:1 (graphics) | recolor to a passing token |

The 4 hand-rolled amber alerts the plan called out all fail by the same
~4.47:1 margin in **light** mode (their dark-mode `amber-400` variants pass at
8.76:1). The new `warning` alert variant was built precisely for this migration.

---

## 3. Responsive static review — 4 breakpoints

Breakpoints are the Tailwind v4 defaults actually used in this codebase:
**mobile <640px**, **sm 640–767px**, **md 768–1023px**, **lg ≥1024px**.

| Component | <640 (mobile) | sm | md | lg | Verdict |
|---|---|---|---|---|---|
| Button | 44px height, full-width-safe wrapping | 36px density restored | — | — | OK |
| Input / Select trigger | 44px height, 16px text (no iOS focus-zoom) | 36px, 14px text | — | — | OK |
| Pagination | 44px targets, `flex-wrap` wraps to 2nd row | same | same | same | OK |
| Breadcrumb | wraps, current item truncates (`min-w-0`) | wraps | one line typical | one line | OK |
| Alert | full-width, icon column only when icon present | same | same | same | OK |
| Badge | `w-fit` pills, no wrap inside pill | same | same | same | OK |
| Dashboard stats | 1 column | 3 columns | — | — | OK |
| Dashboard event cards | 1 column | 2 columns | — | 3 columns | OK |
| Event tracker header | title + actions wrap (`flex-wrap`) | wrap | side by side | side by side | OK |
| Event tracker totals | 1 column | 3 columns | — | — | OK |
| App shell | sidebar hidden, right-side drawer (`max-w-[85vw]`) | drawer | 280px sidebar | sidebar | OK |

No horizontal overflow paths found: every text boundary in the touched
components is `min-w-0` + `truncate`, every grid is mobile-first single-column,
and the two multi-control rows (tracker header, pagination) wrap rather than
clip. The breadcrumb replacing the dashboard back link keeps that page's
above-the-fold height effectively unchanged on mobile (it wraps to at most two
lines for a long event title).

### Touch-target audit (44px guideline)

**Meets on mobile:** Button (default/lg/sm sizes), Input, Select trigger, and
**all** Pagination controls (44px on every breakpoint — pagination is the most
touch-critical control, so it does not get the desktop density reduction).

**Below 44px on mobile (flagged, unchanged — dense/secondary contexts):** Button
`icon` (36px), `icon-sm` (32px), `xs` / `icon-xs` (24px); the header menu and
drawer-close buttons (~32px); the avatar popover trigger (~36px). None of these
is a primary mobile action in the verified flows (the mobile drawer links are
full-width `py-2` rows, which do meet the target). If any icon button becomes a
primary mobile control it should gain `min-h-11 min-w-11`.

---

## 4. Verification status

All checks run against a live, correctly provisioned Faz'aa database (local
PostgreSQL `fazaa` on `localhost:5432`, seeded via `prisma db seed`).

- `npm run lint` — clean (0 errors, 0 warnings).
- `npm run build` — **passes fully**: compiles, typechecks, and prerenders all
  13 routes, including the DB-backed marketing page. No route fails.
- Authenticated dev renders (`next dev`) — **both verified pages render
  200**, signed in as the seeded organizer `organizer@fazaa.sa`:
  - `/dashboard` → 200 (198 KB HTML); organizer event/task/assignment sections
    render, dashboard links resolve to real event UUIDs.
  - `/dashboard/events/[eventId]` → 200 for a seeded event. The wired
    `Breadcrumb` is present in the response as `<nav aria-label="مسار التنقل">`
    with `aria-current="page"` on the trailing "Dashboard / <Event title>" item
    (replacing the former plain "← Dashboard" link).
- Compiled CSS verified: every brand token (`--crimson`, `--dead-sea`, `--gold`,
  `--growth` and their `-foreground` pairs, `--gray-light/-medium/-dark`) is
  emitted, and every utility the new components rely on is generated —
  `bg-dead-sea`, `bg-gold`, `bg-growth`, `bg-crimson`, `text-*-foreground`,
  `text-gray-dark`, `text-caption`, `min-h-11`, and the `.badge-volunteer` /
  `.badge-organizer` utilities. The alert alpha utilities (`bg-growth/15`,
  `bg-gold/20`, `bg-dead-sea/10` and their borders) compile to a solid-token
  fallback plus a `color-mix(in oklab, …)` enhancement behind `@supports`.
- New alert `success` / `warning` / `info` variants are defined and AA-clean but
  have **no consumers yet** — the hand-rolled amber alerts migrate to them later
  per the plan.
- `Pagination` is standalone with no consumer yet, per the plan.
- Dark mode required no work — the theme layer is token-driven and the new
  variants resolve through it; the only dark-specific change was the alert text
  colors fixed in §1. `viewport.themeColor` emits both `prefers-color-scheme`
  variants so mobile chrome matches the page in either mode.
