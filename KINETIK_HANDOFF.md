# KINETIK — BUILD HANDOFF (context reset)

Single source of truth to resume work in a fresh session. The app-author spec lives in
`APP_BUILD_STANDARD.md`; the current product/app inventory lives in `KINETIK_APP_AUDIT.md`;
the deterministic Buddy/agent system lives in `KINETIK_AGENT_SYSTEM.md`; the real
diamond economy map lives in `KINETIK_DIAMOND_ECONOMY.md`.
Business, brand, launch, and investor narrative now live in
`KINETIK_BUSINESS_STRATEGY.md`, `KINETIK_BRAND_LAUNCH_PLAYBOOK.md`, and
`KINETIK_PITCH_DECK_SOURCE.md`.

> **▶ NEXT STEP:** implement `KINETIK_AGENT_SYSTEM.md` in the shell: shared
> `KINETIK_EVENT`, diamond ledger, Buddy state, preview cards, and `@kin` actions.

---

## 1. What Kinetik is
A private life app for **Family + Friends circles**. Tagline: *Plans. People. Play.*
Five tabs + a docked Ask orb. Single-file HTML prototype now; migrates to React/TS +
Supabase later. Owner/primary user: **Aldyth Sukapradja** (Qatar, fri-sat weekend).

Tabs: **Today** (non-scrolling triage) · **Calendar** (Board + full-screen Month) ·
**Moments** (center, Instagram-style) · **Apps** (iPhone grid + Store) · **Me** (circles,
people, settings, logout). **Ask** = orb in the nav cradle → full-screen assistant.
Per-circle **Chat** opens full-screen from each circle card in Me.

## 2. Files in the folder
| File | Role |
|------|------|
| `index.html` | The whole shell (~2.3k lines): UI, state, CalendarEngine, MomentsService, Chat, AppRegistry, App Store. |
| `Code.gs` | Google Apps Script backend (Sheets + Drive). Generic CRUD + Moments media + comments + chat + calendar. |
| `App_*.html` | Standalone mini-apps (one file each, manifest in `<head>`). Every `App_*.html` with a valid manifest is picked up by `build_app_catalog.mjs`, including `App_GameChoreQuest.html`. |
| `APP_BUILD_STANDARD.md` | The mandatory external app standard: filename, manifest, inline SVG icon, bridge, data flow, Buddy events, and port-back checklist. |
| `KINETIK_AGENT_SYSTEM.md` | Deterministic Buddy/agent source of truth: category spine, event contract, action map, diamond rules, Moment Studio, and Supabase scale path. |
| `KINETIK_DIAMOND_ECONOMY.md` | Real diamond economy: event types, reward caps, anti-farming rules, app-to-energy map, leaderboards, schema, and wiring waves. |
| `KINETIK_BUSINESS_STRATEGY.md` | Category thesis: Family Companion OS, market map, wedge, moat, monetization, risks, health/wellbeing guardrails. |
| `KINETIK_BRAND_LAUNCH_PLAYBOOK.md` | Brand architecture, voice, visual direction, website structure, launch film, and social strategy. |
| `KINETIK_PITCH_DECK_SOURCE.md` | Pitch-deck source: slide outline, investor FAQ, demo script, metrics, strategic soundbites. |
| `build_app_catalog.mjs` | Validates all app manifests and refreshes the baked Store catalog inside `index.html`. No local server required. |
| `package.json` | Provides `npm run build`, `npm run catalog`, and `npm run check`. Use `npm.cmd` on Windows PowerShell if script execution blocks `npm`. |
| `.github/workflows/kinetik-catalog.yml` | CI check that fails when manifests are invalid or `index.html` catalog is stale. |
| `KINETIK_APP_AUDIT.md` | Current app inventory, features, gaps, rename suggestions, and Buddy/diamond strategy. |

## 3. Architecture (maps 1:1 to future React/TS modules)
- **State**: `S` (session/tab state), `DB` (localStorage cache `kinetik_live_cache_v1`),
  `Session`, `LastUser`. Live backend = Google Sheets via `LIVE_API_URL` (Apps Script).
- **DataAPI** + `SyncEngine` (optimistic writes → background sync to Sheets).
- **MomentsService** — separate blocking pipeline (uploads via fetch, not optimistic).
- **CalendarEngine** (`Cal`) — routines (weekly) + events (one-off, now multi-day),
  exceptions, conflict detection, week/month.
- **PermissionEngine** (`Perm`) — roles: owner(Leader) / coleader / member / viewer.
- **AppRegistry** — direct launch uses the baked catalog; served http(s) can live-read
  manifests as an enhancement. Catalog `id` is filename-based.
- **Store** — Apple App Store clone (search, category chips, featured hero, category
  rows, product page). **AppHost** — iframe bridge (INIT_APP + DATA_*/ADD_TO_CALENDAR).
- Theme (light default + per-circle accent), Motion (GSAP, guarded), Scene (Three.js
  starfield, guarded), EventBus.

## 4. Backend — Google Apps Script (`Code.gs`)
Sheets: Users, People, Circles, CircleMembers, Relationships, Calendar_Routines,
Calendar_Events, Calendar_Exceptions, AppCatalog, CircleApps, AppRecords, AgentLogs,
Settings, AuditLog, **MediaAssets, MemoryLines, MomentStories, Comments, Messages**.
Drive: `Kinetik_Media/circles/{circleId}/{memory-lines,moment-stories}`.
Actions: generic CRUD + uploadMedia, createMemoryLine, listMemoryLines, editMemoryLine,
deleteMemoryLine, createMomentStory, listMomentStories, editMomentStory,
deleteMomentStory, listComments, createComment, listMessages, createMessage,
ensureSetup, healthCheck.

### ⚠️ REDEPLOY REQUIRED (several backend additions are NOT live yet)
The frontend is ahead of the deployed `Code.gs`. To activate **chat, comments, the
MemoryLines `title` column, schedule `durationMin`/`endDate`, the time-display fix
(fmtCell), and the date-column normalization**, the user must:
1. Paste the current `Code.gs` into the Apps Script project.
2. Run **`ensureSetup`** once (creates the new sheets/columns + Drive folders; also
   triggers the Drive auth grant if not already given).
3. **Deploy → Manage deployments → edit (✏️) → Version: New version → Deploy** (URL
   unchanged). No code change needed in index.html — same `LIVE_API_URL`.

## 5. Current state — what works (verified in preview)
- Login (last-user card + manual entry), splash animation, all 5 tabs.
- WhatsApp glass nav, cradle Ask orb, full-screen Ask. iOS PWA nav fixed (100dvh).
- Calendar: Board (per-person columns, inline +), full-screen Month (avatars on days),
  start+duration picker (min/hr/day/week/month, multi-day events), edit/delete.
- Moments: real photo upload → Drive + Sheets, feed, permanent highlight stories +
  viewer, edit/delete (author or Leader). Memory Line = title+caption+comments.
- Circle Chat: per-circle, members-only, WhatsApp UI, ~4s polling.
- Me: circle cards, role-aware invite, manage member, circle edit/delete, gradient logout.
- Apps: iPhone grid (manual GET install) + **Apple App Store clone** (manifest-grounded).
- App autoloader: filename-based categories (Game/Sport/Productivity/Social/
  Entertainment), baked catalog for file://, live manifest reads when served.

## 6. Known limitations / gotchas
- **file:// can't read sibling files** (CORS null origin), so real metadata is baked
  into `index.html`. After adding/renaming an app, run `npm run build` or
  `node build_app_catalog.mjs`.
- **A browser cannot list a folder** when index.html is present, so `SEED_FILES` and
  `BUILTIN_APP_CATALOG` are generated into `index.html`.
- **Every app needs a UNIQUE `appId`** AND unique filename. `build_app_catalog.mjs`
  now fails on duplicate app IDs.
- Catalog `id` is filename-based, so renaming a file resets its install state.
- The preview screenshot tool intermittently times out — DOM/eval verification used instead.

## 7. DETAILED TO-DO (what's left)

### A. Immediate cleanup (user, no code)
- [ ] Redeploy `Code.gs` + run `ensureSetup` (activates chat, comments, titles,
      duration, time fix). **This is the biggest unblocker.** Now ALSO creates the new
      **`Reactions` sheet** + activates `setReaction`/`listReactions` so Moment reactions
      persist to the DB and sync across members (until then they work locally only).
      Still to add for full @kin persistence: a `Messages` `kind/payload` column (§10).
- [x] **Done (2026-06-14):** old phantom app entries removed from the generated catalog.
- [x] **Done (2026-06-18) — launcher removed.** `index.html` now contains a baked
      manifest catalog generated by `node build_app_catalog.mjs`, so it can be opened
      directly. Served http(s) still live-reads manifests
      as an optional enhancement.
- [x] **Done (2026-06-18) — first deterministic agent POC.** Home Quest emits
      `KINETIK_EVENT`; shell `KinEngine` writes local `diamondEvents`,
      `agentActions`, and `buddyState`, then shows a Buddy pulse. Next: make
      Kinetik Buddy consume that shell state.
- [x] **Done (2026-06-18) — reusable POC action spine.** `index.html` now has
      `KinSpine` behind the Ask orb: Learning, Schedule, Photos, and Apps lanes.
      It suggests learning, previews learning Calendar events, pulls existing
      Moment photos into cards, and opens suggested apps. Calendar writes still
      require a user tap.
- [ ] Reinstall the PWA on iPhone (remove from home screen + re-add) to clear the
      cached pre-100dvh nav.
- [ ] When app files change, run `npm run build` or `node build_app_catalog.mjs` to
      refresh icons/metadata.

### B. Pending build tasks (frontend)
- [ ] **#17 Inline comments** — move comments from the bottom-sheet popup to INLINE
      below each Memory Line card (Instagram-style: latest ~2 + "View all N" expand +
      per-card composer). Backend listComments/createComment already exist; UI only.
- [x] **#18 Multi-photo — DONE (2026-06-15).** Memory Line is a swipeable carousel
      (`mediaBlock()` scroll-snap + dots + `n/total`) AND the create flow now multi-picks
      (`Create.items[]`, `addFiles`, thumbnail strip with remove + "Add", up to 8). Sends
      `mediaIds[]`; backend `createMemoryLine`/`listMemoryLines` already store/return all
      media (no redeploy needed). `#filePick` is `multiple` for memory-lines, single for
      moments. Remaining: Moment = multi-FRAME highlight (MomentStories += `mediaIdsJson`;
      viewer steps frames) — `createMomentStory` already receives `mediaIds`, needs the
      viewer + a Code.gs column. Video still image-only in the picker (`accept="image/*"`).

### C. Polish / deferred
- [x] **Apps/Store UX pass — DONE (2026-06-15, icon refresh 2026-06-18).** (1) **iPhone-style home grid**: the Apps
      tab paginates into horizontal swipe pages with dots, sized to the available height —
      only paginates on overflow (verified 3 pages on a short viewport, dots track swipe).
      (2) **No more blink**: removed the per-render GSAP stagger on the app grid (it
      re-fired on every tab visit/EventBus). (3) **App-Store GET/OPEN pill**: fixed iOS
      blue `#0a84ff` (was the circle accent — Aldyth's is rose `#F43F5E`, hence the "red
      open"). (4) **Two-layer app icons**: every app manifest owns a symbolic SVG mark
      for Store/detail surfaces and a `homeIcon` emoji for the Apps tab; the Kinetik
      Store tile still uses the premium Kinetik icon from `index.html`. (5) **"Remove from circle"** is now a bordered pill with a
      minus glyph. All glyph sites (grid, store cards, list rows, featured hero, detail)
      route through `iconInner()`.
- [ ] Video upload (old P6) — code paths exist; picker is image-only. Re-enable after
      images proven on a real phone.
- [x] **Likes/reactions DONE (2026-06-14, DB-backed 2026-06-15)** — `Reactions` module
      (localStorage `kinetik_reactions_v1` for instant/offline): tap heart to ❤️, picker
      for ❤️😂😮😍👏🔥, per-emoji count summary, survives reload. Now also **persists to the
      DB**: `set()` optimistically writes then calls `MomentsService.setReaction`;
      `loadMoments` fetches `listReactions` and `Reactions.mergeServer` merges everyone's
      reactions in. Backend = new `Reactions` sheet + `setReaction`/`listReactions` in
      `Code.gs` (one row per user/post). **Activates on the next redeploy** (calls fail
      gracefully until then — local still works).
- [ ] Sheets two-way sync on boot (currently writes optimistically; reads on load).
- [x] PWA/home-screen identity generated inside `index.html` from inline SVG, with PNG data icons produced at runtime.

### D. App ecosystem roadmap (build per APP_BUILD_STANDARD.md, one HTML each)
Every external app should be portable back into Kinetik: one `App_*.html`, embedded
manifest, inline SVG icon, Bridge support, simple JSON app records, and declared
Buddy/diamond events. Current core tracks: Buddy, Home Quest, Times Quest, Primary
Quest, Kitchen Buddy, Grocery Run, Loop Coach, Padel Matchday, and the coaching apps.
Sidecars: Cinema, Strata, World Cup Arena. Categories in the Store are limited to
**Game · Sport · Productivity · Social · Entertainment**.

## 8. How to run / verify
- **Best:** open `index.html` directly.
- Demo login: username `aldyth`, PIN `1234` (other members: kinara/baginda/keyla).
- Backend is live Google Sheets at `LIVE_API_URL` (already wired). Calendar/Moments/
  Chat hit it directly; redeploy needed for the newest actions (see §4).
- After adding/renaming apps, run `npm run build` / `node build_app_catalog.mjs` so
  direct launch has the latest manifest catalog.
- For a non-writing check, run `npm run check` / `node build_app_catalog.mjs --check`.

## 9. Conventions (do not break)
- `circleId` / `circleType` / `personId` — never `familyId` / `memberId`.
- App files: `App_<Category><Name>.html`; manifest in `<head>`; inline SVG icon;
  no text/lettermark icons; no extra app manifest/icon files; unique appId.
  Category comes from filename prefix (overrides manifest).
- Light theme default; fri-sat weekend default; circle-scoped privacy everywhere.

## 10. @kin Agent ↔ Calendar (NEW — 2026-06-14)
The full scalable agent model now lives in `KINETIK_AGENT_SYSTEM.md`. This section
records the current implemented calendar/chat slice.

Human-in-the-loop scheduling agent. One brain, two surfaces: the **Ask orb** (1:1) and
**circle Chat** (type `@kin …` in a thread). Deterministic — intent maps to ONE fixed
action, each renders a specific card, and **nothing is written without a tap**.

- **`Agent`** (after `parseTime`) — `plan(text,{circleId,asker})` → `{bubbles,card}|null`.
  Handles three intents: **availability** ("who's free this weekend") → read-only digest
  card; **clash/handoff** ("can someone take X") → ranks others by least overlap, proposes
  a reassign; **set-up a plan** ("set up a family dinner this weekend") → finds the first
  free slot, proposes an event (asks day/time via a clarify card if missing).
- **`Cal.availability(cid,date,personIds)`** / `allFree` / `firstFreeSlot` — the data
  source for every card (built on the existing conflict logic). `.avstrip` = the green/red
  per-person mini-strip inside cards.
- **Commit gate** `Agent.canCommit` = circle Leader/co-leader **OR** the event's
  responsible person (locked decision). Commit uses `DataAPI.create("events",…)` /
  `DataAPI.update` (reassign) → `EventBus.emit("calendar:eventCreated")`.
- **Cards are registered** in `Agent.cards{}` and re-rendered by id, so the Accept button
  still works after Chat's 4s poll re-paint. In Chat they live in `Chat.agent[cid]`
  (merged into `paint()` by timestamp) — **local-only until the Messages `kind/payload`
  column is added in the next `Code.gs` redeploy**; they don't survive reload yet.
- **@person RSVP pings (2026-06-15)** — every proposal card now addresses a tagged person
  (`@Name` mention pill): reassign → the cover person, event → the asker. `renderProposal`
  shows "Pinged @X — it's your call / they or a Leader can confirm"; if the viewer is the
  tagged person OR a Leader they get a live **Accept**, otherwise a disabled **"Waiting on
  @X"**. `mentionize()` also highlights `@kin` and `@member` in chat text.
- **Chat suggestion pills (2026-06-18 update)** — `#chatSuggest` is now a two-row
  command bar above the composer: option pills (`Free`, `Plan`, `Cover`, `Today`)
  switch the prompt set, and prompt pills prepare `@kin <prompt>` in the composer for
  the user to review/send. Composer placeholder also hints "try @kin to coordinate".
- Verified (DOM/eval): all 3 intents, clarify chips, full commit loop (event created with
  correct fields, then removed in test), Chat `@kin` thread rendering, RSVP card states,
  suggestion pills end-to-end, mention highlighting. No console errors.
- Next: persist agent cards (Messages `kind/payload` redeploy), RESCHEDULE/CANCEL actions,
  and a real "waiting → accepted" notification when the tagged member confirms.

## 11. LEAN STRUCTURE & REACT/SUPABASE MIGRATION STRATEGY
Goal: a lean project structure (`index.html` + self-contained `App_*.html` +
backend adapter), ready to port to **React + Supabase**.

### 11a. Current lean structure
- [x] Launcher file removed; `index.html` can open directly.
- [x] App manifests live inside each `App_*.html`.
- [x] `build_app_catalog.mjs` validates and bakes the catalog from app manifests.
- [x] `package.json` exposes `npm run build` and `npm run check`.
- [x] GitHub workflow checks catalog freshness.
- Keep: `index.html`, all `App_*.html`, `Code.gs` (until Supabase),
  `build_app_catalog.mjs`, `package.json`, `.github/workflows/kinetik-catalog.yml`,
  `KINETIK_APP_AUDIT.md`.

### 11b. Doc merge → one `KINETIK.md`
- [ ] Create **`KINETIK.md`** = single source of truth. Sections: 1 Vision/scope ·
      2 Architecture (each JS module → its React component/hook) · 3 **Data model**
      (entities + Sheets→Supabase table map, lifted from `Code.gs` HEADERS) · 4 Feature
      spec (5 tabs + Ask + Chat + @kin) · 5 App platform (manifest contract + reusable
      engines + current app inventory) · 6 What works / limits · 7 Migration plan.
- [ ] Absorb `KINETIK_HANDOFF.md`, `KINETIK_AGENT_SYSTEM.md`,
      `KINETIK_APP_AUDIT.md`, `KINETIK_CONTENT_SOURCES.md`, and
      `APP_BUILD_STANDARD.md` into it when ready.
- [ ] Result: one canonical `KINETIK.md` plus app source files.

### 11c. React + Supabase migration map (the end goal this enables)
| Prototype | → React/Supabase |
|-----------|------------------|
| `DB.d` localStorage + Google Sheets | Supabase **Postgres** (1:1 from `Code.gs` HEADERS: users, people, circles, circle_members, routines, events, exceptions, app_catalog, circle_apps, app_records, media_assets, memory_lines, moment_stories, comments, messages, reactions) |
| `SyncEngine` optimistic + 4s polling | Supabase client + **Realtime** subscriptions (chat, reactions, agent cards persist live) |
| `MomentsService` → Google Drive | Supabase **Storage** |
| PIN demo login (`Session`) | Supabase **Auth** + RLS per `circleId` |
| `@kin Agent` deterministic engine | TS service, same action registry; LLM optional later |
| `App_*.html` (4 engines + content packs) | 4 React engine components + packs in DB, OR keep as sandboxed iframe micro-apps via the existing AppHost `postMessage` bridge |
| Shell modules (Cal, Perm, AppRegistry, Store, Theme) | TS modules / React hooks |

> Execution order: 11a (delete files) → verify app still loads → 11b (merge docs) →
> then start the React/Supabase scaffold using `KINETIK.md` §3 + §7 as the spec.
