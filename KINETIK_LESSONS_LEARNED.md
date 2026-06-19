# Kinetik Prototype — Lessons Learned

**Written**: 2026-06-19  
**Purpose**: Distil everything the HTML prototype taught us before the React + Supabase rebuild.  
**Scope**: Architecture, diamond economy, app scalability contract, social layer, Buddy/agent, design system, infrastructure.  
**Audience**: Anyone building Kinetik v2 — including future LLMs, contractors, or co-founders.

---

## 0. The One-Line Summary

> The prototype proved the idea works. It also proved that a living family OS cannot be built on `localStorage`, polling, Google Apps Script, and a 2,300-line HTML file. Every limit we hit has a clear fix. Now we rebuild properly.

---

## 1. Architecture

### What we built
One massive `index.html` shell (~2,300 lines) containing all state, UI, routing, calendar, moments, chat, app registry, store, agent, and economy. Apps were separate single-file HTML pages loaded in iframes via `postMessage`.

### What broke
- **Physical file limit**: 2,300 lines is already unmanageable. Adding features meant scrolling through a monolith.
- **No separation of concerns**: State logic, UI render, and side effects were interleaved. Impossible to test.
- **`localStorage` as the database**: Hit `QuotaExceededError` in production. When `DB.save()` threw, it silently crashed the entire economy — gifts failed, diamonds were not recorded, no error surfaced to the user.
- **`file://` protocol**: Browser blocks cross-frame `postMessage` between `file://` origins in some contexts. Apps must be served over HTTP from day one.
- **Frontend always ahead of backend**: The shell added features (chat, economy, reactions) that Code.gs hadn't deployed yet. This caused cascading "Unknown POST action" errors that were hard to diagnose.

### Lessons for v2
1. **Shell = React app with a proper module structure.** State in Zustand (or Jotai). Each domain (calendar, moments, economy, buddy) is its own module/store, not one blob.
2. **Apps are React routes**, not iframes. `/app/chess`, `/app/home-quest`. The bridge becomes a React context + custom hook (`useKinetik()`). Faster, no postMessage timeout bugs.
3. **Supabase is the single source of truth.** localStorage is a cache only — never the authority.
4. **Backend and frontend must deploy together.** Use Supabase migrations + Vercel preview deploys. Never let the frontend reference an API action that isn't live.
5. **Serve from day one.** No `file://`. Vercel preview URL from the first commit.

### Mental model to keep
```
Shell = the OS
  → owns: identity, circles, calendar, moments, chat, economy, navigation, Buddy
Apps = native apps
  → own: game logic, practice UX, session tracking
  → borrow: economy, circle context, person identity from shell
```
This boundary was right in the prototype. In v2 it becomes enforced by code (the `useKinetik()` hook is the only gateway from an app to the shell).

---

## 2. Diamond Economy

### What we built
- `KINETIK_EVENT` postMessage contract: apps propose events, shell decides rewards.
- `KinEngine` in the shell: 12 event types, daily caps, anti-farming, sourceRecordId deduplication.
- `EconomyAPI` calling Code.gs for server-side validation.
- Local fallback (`localHandle`) when backend is unavailable.

### What broke
- **`DB.save()` had zero error handling.** When localStorage hit quota, `localHandle()` threw, which propagated through the shell's `.catch()` and returned `{ok:false}` to the Buddy app — showing "Gift could not be sent ⚠️" with no explanation. Root cause: a 1-line save function with no try/catch.
- **`canFallback` guard was too strict.** Any backend error that didn't match a narrow regex (`/Unknown POST action|Failed to fetch|offline/i`) killed the gift instead of falling through to local mode.
- **2,200ms Bridge timeout.** Apps Script takes 3–5 seconds. The promise expired before the shell replied, returning `null` — which the Buddy app interpreted as failure.
- **Spending not persisted.** The cosmetics shop in Buddy worked locally but purchases were never written to the backend. Refresh = lost purchases.
- **Apps built their own gem counters.** Several apps had a local `gems` or `points` variable that was authoritative within the app but invisible to the shell. Retrofitting them to `KINETIK_EVENT` was expensive.
- **Code.gs deployed version lagged the file.** The file had `recordKinetikEvent` but the live URL did not. Users saw "Unknown POST action" for days.
- **No spend ledger.** Earning was logged (`DiamondEvents` sheet). Spending was not. There was no atomic purchase transaction, no receipt, no rollback on failure.

### What worked
- The 12 approved event types are correct and sufficient.
- The 6 energy types (Care/Growth/Play/Move/Circle/Story) map perfectly to product categories.
- `sourceRecordId` idempotency prevents duplicate rewards — validated in production.
- `diamond.gift` leader-only mechanism with amount presets (+10/+25/+50) was the right UX.
- The daily cap table is the right shape (default, max per event, daily cap per person).
- Buddy mood tied to the last event type was emotionally effective.
- `buddy_xp = diamonds * 4; level = floor(xp / 120) + 1` is a good baseline.

### Lessons for v2

#### Economy authority must be server-side first
```
App emits event
  → Supabase Edge Function validates (event type, cap, person, circle, sourceRecordId)
  → Writes to diamond_events table
  → Updates buddy_state table
  → Returns {ok, diamond, buddy} to client
  → Client applies optimistic update if offline
```
Never trust the client for economy decisions. The server is always the authority.

#### Every new app must declare its economy contract BEFORE any UI is built
```
New app checklist (non-negotiable):
  □ category (games/sports/productivity/social/entertainment)
  □ energy (Care/Growth/Play/Move/Circle/Story)
  □ event types it will emit (from the approved 12)
  □ proposed reward amounts (default/max/daily cap)
  □ sourceRecordId strategy (how to prevent farming for this specific app)
```
If an app can't fill this out, it's not ready to build.

#### Earning and spending are separate ledgers
```sql
-- earning
diamond_events (id, circle_id, person_id, app_id, event_type, amount, source_record_id, created_at)

-- spending  
diamond_spend (id, circle_id, person_id, item_id, item_type, amount, receipt_id, created_at)

-- wallet (derived, never authoritative on its own)
wallet = SUM(diamond_events.amount) - SUM(diamond_spend.amount)
```
Never store a `diamonds` integer as mutable state. Always derive from the ledgers.

#### Resilience rules
- If Supabase is unavailable → optimistic local award, queue for sync, never show "failed"
- If duplicate `sourceRecordId` → silently return the original award (idempotent)
- If daily cap reached → return `{capped: true}` with a human reason, Buddy reacts appropriately
- Spending must be atomic: deduct + record item in one transaction or neither

---

## 3. App Scalability Contract

### The biggest lesson
Apps built WITHOUT an economy contract first required full rewrites to integrate later. Apps that had the contract first (Home Quest, Circle Chess, Times Table Quest) worked cleanly. The contract must be a prerequisite, not an afterthought.

### The v2 App Contract (non-negotiable for any new app)

Every app in Kinetik v2 must answer these questions before a single line of UI is written:

```typescript
// Every app declares this manifest at registration time
interface KinetikAppManifest {
  appId: string;             // kebab-case, stable forever
  name: string;
  shortName: string;         // ≤14 chars for home grid
  category: AppCategory;     // games | sports | productivity | social | entertainment
  energy: EnergyType;        // Care | Growth | Play | Move | Circle | Story
  icon: string;              // inline SVG
  homeIcon: string;          // single emoji
  gradient: [string, string]; // two hex colors
  
  // Economy contract
  emits: EventType[];        // which of the 12 approved events this app can emit
  rewardPolicy: {
    [eventType: string]: {
      default: number;
      max: number;
      dailyCap: number;
      farmingNote: string;   // explain why this can't be farmed
    }
  };
  
  // Integration
  worksWith: ('calendar' | 'moments' | 'media' | 'buddy' | 'offline')[];
  minMembers: number;
  audience: 'all' | 'kids' | 'adults';
}
```

### The v2 Integration Hook (replaces postMessage bridge)

```typescript
// Apps call this hook, never touch the economy directly
function useKinetik() {
  return {
    // Identity
    circle: CircleContext,
    person: PersonContext,
    
    // Economy — the ONLY way to emit events
    emit(event: KinetikEvent): Promise<KinetikEventResult>,
    
    // Data — scoped to this app + this circle
    data: {
      list(collection: string): Promise<AppRecord[]>,
      create(collection: string, payload: object): Promise<AppRecord>,
      update(id: string, payload: object): Promise<AppRecord>,
    },
    
    // Navigation
    openApp(appId: string): void,
    addToCalendar(event: CalendarEvent): void,
    
    // Buddy
    buddy: BuddyState,
  };
}
```

An app that bypasses `useKinetik()` and writes to the DB directly fails review.

### App categories and what each can emit

| Category | Energy | Allowed Events |
|---|---|---|
| Games | Play | `game.round.completed`, `game.win` |
| Games (with learning) | Play + Growth | + `practice.completed`, `mastery.unlocked` |
| Sports | Move | `practice.completed`, `mastery.unlocked`, `game.win` |
| Productivity (chores) | Care | `task.completed`, `task.approved` |
| Productivity (learning) | Growth | `practice.completed`, `mastery.unlocked` |
| Productivity (coaching) | Growth | `practice.completed`, `reflection.saved` |
| Social | Circle | `calendar.created`, `buddy.quest.completed` |
| Entertainment | Story | `moment.created`, `moment.styled` |

Apps cannot emit events outside their category's allowed list without a spec change.

### Anti-farming rules that must be server-side

| Risk | Server rule |
|---|---|
| Same round replayed | `sourceRecordId` checked before any insert |
| Easy rounds farmed | daily cap per `(person_id, event_type, app_id, date)` |
| Spinner/randomizer farmed | Spinner app is permanently `reward-neutral` — no diamonds from spins |
| Calendar spam | `calendar.created` has the lowest daily cap (15 dmd/day) |
| Child self-approval | `task.completed` status is always `pending_approval` for non-leaders |
| Sidecar inflation | Cinema, Strata, World Cup: badges only, never core diamonds |

---

## 4. Social & Circle Layer

### What we built
- Circle graph: people, roles (owner/coleader/member/viewer), per-circle accent
- WhatsApp-style chat with ~4s polling
- Per-circle leaderboard in Buddy app
- Leader diamond gift (+10/+25/+50 presets)
- Moments: photo upload → Drive → Sheets feed

### What broke
- **~4s polling chat** is functional but feels laggy and burns backend quota. Every member has a tab open that fires a request every 4 seconds.
- **No real-time leaderboard.** When a member earns diamonds, other members don't see it until they refresh or the economy snapshot is triggered.
- **Gift not visible to recipient in real time.** Leader gifts a diamond, recipient doesn't know until they reload Buddy.
- **Moments on Google Drive** was brittle. Sharing permissions had to be set manually per file. Drive URLs expired or changed. Image loading was slow.
- **No cross-member presence.** No way to know who else is online or active right now.

### What worked
- The circle permission model (owner/coleader/member/viewer) was exactly right.
- Per-circle accents (rose for Aldyth's family, etc.) created emotional ownership.
- The leaderboard concept drove real engagement intent.
- The chat pattern (WhatsApp-style glass) was immediately intuitive.
- `diamond.gift` from a leader felt meaningful and human.

### Lessons for v2
1. **Supabase Realtime for everything social.** Chat, leaderboard updates, gift notifications, Buddy reactions — all via Realtime subscriptions, not polling.
2. **Media in Supabase Storage**, not Google Drive. Signed URLs, CDN-backed, proper access control.
3. **Circle is the security boundary.** Every row in every table has `circle_id`. Row-Level Security (RLS) in Supabase enforces this without app-layer checks.
4. **Presence via Supabase Realtime Presence.** "3 members online" is a first-class feature.
5. **Push notifications for social events.** Diamond gifted, chore approved, Buddy leveled up — these must arrive even when the app is closed.

---

## 5. Buddy & Agent System

### What we built
- `KinEngine`: deterministic rules engine in the shell (client-side)
- `KinSpine`: proof-of-concept action lanes (learning, schedule, photos, apps)
- Buddy pulse: toast-style notification when diamonds are awarded
- Buddy World app: pet avatar, cosmetics shop, leaderboard, leader gift

### What worked
- **Deterministic before LLM** was the right call. The rules-based approach was fast, predictable, and safe for families. No hallucinations.
- **Preview-before-write** (KinSpine action cards): the user always taps to confirm before any write happens. This is the right pattern for a family tool.
- **Buddy pulse** (the notification toast when energy is gained): emotionally resonant, cheap to implement, high impact.
- **Five category spine**: Games→Play, Sports→Move, Productivity→Care/Growth, Social→Circle, Entertainment→Story. This mapping is correct.
- **Per-person energy tracking** (`byPerson` in BuddyState): enables leaderboards without a separate query.

### What broke
- **Buddy state lived only in localStorage.** After clearing cache or switching device, all Buddy progress was gone.
- **KinEngine duplicated in both frontend and backend.** `ECONOMY_RULES` appeared in both `index.html` and `Code.gs`. When one changed, the other didn't. The server is the authority — the client should fetch rules, not hardcode them.
- **Quests were never implemented.** The `buddy.quest.completed` event existed but no quest generation system. The daily quest loop (generate → notify → complete → reward) was the missing emotional heartbeat.
- **Buddy cosmetics not persisted.** The shop let you buy and equip, but on reload everything reset. No backend transaction.
- **Buddy mood was only updated on diamond events.** It should also update on circle activity, calendar events, chore approvals, and time of day.

### Lessons for v2

#### Buddy must live in Supabase
```sql
buddy_state (
  circle_id,
  diamonds,        -- derived from ledger but cached here for display
  xp,
  level,
  mood,
  energy_json,     -- { Care: 0, Growth: 0, Play: 0, Move: 0, Circle: 0, Story: 0 }
  by_person_json,  -- { person_id: diamond_count }
  updated_at
)

buddy_cosmetics (
  person_id, circle_id,
  species, hat, aura, room, orb,  -- equipped
  owned_json,                      -- purchased item ids
  updated_at
)

buddy_quests (
  id, circle_id, person_id,
  type, title, target_event_type, target_count,
  reward_diamonds,
  progress, completed, expires_at, created_at
)
```

#### Quest generation is the emotional heartbeat
```
Daily cron (midnight per circle timezone)
  → generate 1-3 quests per active person
  → based on: recent gaps, energy balance, streaks, age, circle activity
  → push notification: "Buddy has a quest for you 🐣"

Quest completion
  → app emits the target event_type
  → server checks progress against open quests
  → if completed: award quest diamonds + trigger Buddy reaction
  → push notification to the person
```

#### Agent architecture
```
Deterministic layer (v1, now)
  → KinEngine rules → reward caps → preview cards → confirmed writes

LLM layer (v2, later)
  → @kin in chat → intent parsing → same preview card pattern → same write path
  → LLM is a language layer, never the authority layer
  → LLM outputs are always validated against the deterministic rules before write
```

---

## 6. Design System

### What worked
- **CSS custom properties (`--acc`, `--bg0`, etc.)** with `data-theme` switching worked very well. Per-circle accent (`--acc` set by circle color) created emotional ownership per circle with zero extra logic.
- **Glass morphism** (`backdrop-filter: blur(22px)`) on nav + cards was the right visual language — soft, layered, approachable.
- **Gradient backgrounds** (radial-gradient composition per theme) made the app feel alive without needing animated backgrounds.
- **6 font weights (400/500/600/700/800) from Inter** were sufficient. No need for a second typeface except Buddy (Fredoka for playful).
- **GSAP motion** was a premium touch. Page transitions, card entrances, and the Buddy pulse felt native-quality. Worth keeping.
- **8px radius system** (`--radius-xs:10px` through `--radius-xl:36px`) was consistent and easy to apply.
- **`100dvh` for mobile** (with JS override for iOS): critical fix, must be baked in from day one in v2.
- **WhatsApp-style nav cradle** with the Ask orb in center: unique and recognisable. Keep it.

### What broke
- **No design tokens file.** Colors, radii, and shadows were scattered across CSS and inline styles. In v2 these must be a single source (CSS variables in a `tokens.css` file, mirrored as a Tailwind/Figma theme).
- **Dark mode was an afterthought** in most apps. Some apps had partial dark mode, some had none. v2 must enforce dark mode from the first component.
- **Responsive breakpoints were ad hoc.** Some layouts broke at iPad width. v2 needs a clear breakpoint system (mobile-first, 375/768/1024).
- **App icon inconsistency.** Some apps had SVG icons that looked very different in scale/weight. Need a unified SVG icon system (consistent stroke width, viewBox, visual weight).
- **Buddy character** (the pet avatar) was charming but the SVG was hand-coded inline. v2 needs a proper Buddy component with modular layers (body, hat, aura, expression, room).

### Design tokens for v2
```css
/* Energy palette — the emotional core of the product */
--energy-care:   #f97316;   /* orange  — household, chores */
--energy-growth: #22c55e;   /* green   — learning, coaching */
--energy-play:   #a855f7;   /* purple  — games, fun */
--energy-move:   #3b82f6;   /* blue    — sport, physical */
--energy-circle: #ec4899;   /* pink    — social, planning */
--energy-story:  #eab308;   /* gold    — moments, memory */

/* Diamond */
--diamond: #26c6ff;
--diamond-deep: #0a8fd6;

/* Radius system */
--r-xs: 10px;  --r-sm: 14px;  --r-md: 20px;
--r-lg: 28px;  --r-xl: 36px;  --r-full: 999px;

/* Motion */
--ease-spring: cubic-bezier(.32,.72,.28,1);
--dur-fast: .15s;  --dur-base: .25s;  --dur-slow: .4s;
```

---

## 7. Infrastructure

### What broke
- **Google Apps Script** is slow (3–5s per request), has no real-time, has a deploy friction that caused the frontend to regularly outpace the backend.
- **No auth.** Demo passwords only. No sessions, no JWT, no RLS. Any URL was accessible to anyone.
- **No migrations.** Schema changes required manually editing sheets and running `ensureSetup()`.
- **No environments.** No dev/staging/prod split. Changes went directly to the live sheet.
- **No CI beyond catalog check.** The GitHub Action only verified the app catalog was baked. Nothing tested the API or economy logic.

### Supabase architecture for v2

```
Supabase project (one per environment: dev / staging / prod)
  → Auth:        email magic link + optional Apple/Google OAuth
  → Database:    Postgres with RLS policies per table
  → Storage:     Media bucket (moments, avatars) with signed URLs
  → Realtime:    broadcast channels per circle_id
  → Edge Functions: economy validation, quest generation, push notifications
  → Cron:        daily quest generation, weekly leaderboard snapshot

Vercel
  → Next.js 15 app (app router)
  → Preview deployments per PR
  → Environment variables for Supabase keys
```

### Key Supabase tables (top level)

```sql
-- Identity
users, people, circles, circle_members, relationships

-- Calendar
calendar_routines, calendar_events, calendar_exceptions

-- Moments
media_assets, memory_lines, moment_stories, comments, reactions

-- Chat
messages (with circle_id + realtime subscription)

-- Economy (ledger model — no mutable counters)
kinetik_events     -- all proposed events (approved, pending, capped, rejected)
diamond_events     -- awarded diamonds (immutable log)
diamond_spend      -- spent diamonds (immutable log)
buddy_state        -- derived cache per circle (refreshed by Edge Function)
buddy_cosmetics    -- what each person owns and has equipped
buddy_quests       -- daily/weekly quest assignments

-- Apps
app_registry       -- replaces baked catalog (admin-managed)
circle_apps        -- installed apps per circle
app_records        -- per-app data (game scores, practice logs, task lists)
```

---

## 8. What to Preserve Exactly

These things worked. Do not redesign them.

| Thing | Why it worked |
|---|---|
| 5-tab navigation (Today / Calendar / Moments / Apps / Me) + Ask orb | Immediately intuitive. Users know where everything is within 2 minutes. |
| Circle as the social unit (not "family") | Generalises to friends, teams, classmates. |
| 4-role permission model (owner/coleader/member/viewer) | Right level of granularity. Not too complex, not too flat. |
| `KINETIK_EVENT` contract (apps propose, server decides) | The right authority boundary. |
| 12 approved event types | Sufficient for all current and planned apps. |
| 6 energy types (Care/Growth/Play/Move/Circle/Story) | Map 1:1 to product categories and Buddy mood. |
| `sourceRecordId` idempotency | Prevents farming without complex rate limiting. |
| Preview-before-write for all agent actions | Builds trust. Never surprise the user with a write. |
| Per-circle accent color | Emotional ownership per circle, free to implement. |
| Glass morphism + gradient background | The Kinetik visual identity. |
| Buddy pulse notification on diamond award | The emotional heartbeat of the economy. |
| App manifest standard (appId, category, energy, icon, gradient) | Makes every new app self-describing. |

---

## 9. What to Rebuild Completely

| Thing | Why | v2 approach |
|---|---|---|
| Single-file shell | Unmaintainable, unscalable | Next.js app router, module per domain |
| `localStorage` as DB | Quota, no sync, no multi-device | Supabase as authority, localStorage as cache |
| `postMessage` bridge | Timeout bugs, cross-origin fragility | React context + `useKinetik()` hook |
| Google Apps Script | Slow, no real-time, deploy friction | Supabase Edge Functions + Postgres |
| Client-side economy authority | Can be tampered, quota crashes | Supabase Edge Function validates all events |
| 4-second polling chat | Burns quota, laggy | Supabase Realtime subscriptions |
| Google Drive media | Permissions brittle, slow | Supabase Storage with signed URLs |
| Demo password auth | No real security | Supabase Auth (magic link + OAuth) |
| Baked catalog in HTML | Must run build script, no CMS | App registry table in Supabase |
| Mutable diamond counter | Loses history, can't audit | Immutable ledger (earn table + spend table) |
| Spending not persisted | Shop resets on refresh | Atomic Supabase transaction for purchase |
| Buddy state in localStorage | Resets on device change | `buddy_state` + `buddy_cosmetics` in Supabase |

---

## 10. The v2 Build Order

The prototype taught us the exact sequence to build in. Get the foundation right before adding apps.

```
Wave 0 — Foundation (build once, never redo)
  □ Supabase project setup + auth (magic link)
  □ Core schema + RLS policies
  □ Next.js shell: 5 tabs + nav + Ask orb
  □ Circle creation + invitation
  □ Design tokens + Buddy component system

Wave 1 — Economy (the heart)
  □ Diamond economy Edge Function (recordKinetikEvent with full validation)
  □ Buddy state service (quest generation, level, mood, energy)
  □ Buddy World app (wallet, leaderboard, cosmetics shop, leader gift)
  □ Buddy quest system (daily generation + completion detection)
  □ useKinetik() hook (the integration gateway for all apps)

Wave 2 — Core apps (prove the economy)
  □ Home Quest (task.completed + task.approved, parental approval)
  □ Times Table Quest (practice.completed + mastery.unlocked)
  □ Primary Quest (curriculum, objectives)
  □ Circle Chess (game.round.completed + game.win + lessons)
  □ Choice Trail (game.round.completed + reflection.saved)

Wave 3 — Social layer
  □ Supabase Realtime chat (per circle)
  □ Moments (media upload to Supabase Storage, feed, stories)
  □ Calendar (routines + events + Kin scheduling)
  □ Reactions, comments, presence

Wave 4 — Agent layer
  □ @kin in chat (deterministic intent parsing)
  □ KinSpine lanes (learning, schedule, grocery, moments)
  □ Push notifications (diamond gift, quest ready, chore approved)

Wave 5 — App ecosystem
  □ App registry in Supabase (admin CMS for apps)
  □ App Store in shell
  □ Remaining 20+ apps ported with useKinetik()
```

---

## 11. Non-Negotiables for Every Contributor

These rules apply to every PR, every file, every feature:

1. **No app mints diamonds directly.** All economy goes through `useKinetik().emit()` → Edge Function.
2. **Every new app fills the contract** (category, energy, event types, reward policy, farming note) before any UI is written.
3. **Circle ID on every row.** No exceptions. RLS enforces it.
4. **Preview before write** for all agent/Buddy actions.
5. **Optimistic UI on top of server authority.** Never block UX on a network call, but never trust the client for economy decisions.
6. **Dark mode from the first component.** No retrofitting.
7. **`100dvh` is wrong on iOS.** Use `100svh` or the JS `window.innerHeight` override from day one.
8. **Spending is atomic.** Deduct diamonds + record item in a single Supabase transaction. No partial states.
9. **`sourceRecordId` is mandatory** for every `emit()` call. No `sourceRecordId` = no award.
10. **App registry lives in Supabase**, not baked into the shell. Adding an app is a database insert, not a code deploy.

---

## 12. Open Questions for the PRD

These were not resolved by the prototype and need decisions before v2:

| Question | Options | Notes |
|---|---|---|
| Authentication | Magic link only / + Apple OAuth / + Google OAuth | Magic link is simplest. OAuth needed for family members who don't manage email |
| Child account model | Sub-account under parent / separate account with parental link | Critical for parental approval flow. Decision affects the whole identity model |
| Diamond spending beyond cosmetics | Real-world rewards / app unlocks / circle fund | Cosmetics alone won't sustain long-term engagement |
| LLM in @kin | GPT-4o / Claude Haiku / none until Wave 4 | Deterministic first is right. LLM is a language layer later |
| Offline mode | Full offline with sync / online-only with graceful degradation | Supabase offline support is limited. May need a sync strategy |
| Buddy character IP | Current SVG pet / illustrated character / 3D / licensed | The character will be Kinetik's mascot. Worth investing in design here |
| App monetization | All free / premium apps / diamond pack purchases / subscription | This decision shapes the app registry and spending model |
| Platform | Web + PWA only / + native iOS / + native Android | PWA is sufficient for v1. Native later if retention data supports it |

---

*This document is the bridge between what we built and what we're building. Update it as v2 decisions are made.*
