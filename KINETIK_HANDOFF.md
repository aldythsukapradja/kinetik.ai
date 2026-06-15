# KINETIK — BUILD HANDOFF (context reset)

Single source of truth to resume work in a fresh session. Detailed change history lives
in `build.md` (sections §72.0–§72.35); the app-author spec lives in `APP_BUILD_STANDARD.md`.

> **▶ NEXT STEP IS A LEAN-OUT + DOC MERGE — see §11 (strategy locked 2026-06-15, not yet
> executed).** Do that before the React/Supabase port.

---

## 1. What Kinetik is
A private life app for **Family + Friends circles**. Tagline: *Plans. People. Play.*
Five tabs + a docked Ask orb. Single-file HTML prototype now; migrates to React/TS +
Firebase later. Owner/primary user: **Aldyth Sukapradja** (Qatar, fri-sat weekend).

Tabs: **Today** (non-scrolling triage) · **Calendar** (Board + full-screen Month) ·
**Moments** (center, Instagram-style) · **Apps** (iPhone grid + Store) · **Me** (circles,
people, settings, logout). **Ask** = orb in the nav cradle → full-screen assistant.
Per-circle **Chat** opens full-screen from each circle card in Me.

## 2. Files in the folder
| File | Role |
|------|------|
| `index.html` | The whole shell (~2.3k lines): UI, state, CalendarEngine, MomentsService, Chat, AppRegistry, App Store. |
| `Code.gs` | Google Apps Script backend (Sheets + Drive). Generic CRUD + Moments media + comments + chat + calendar. |
| `App_*.html` | Standalone mini-apps (one file each, manifest in `<head>`). Currently: GameCircleChess, GameCodeClash, GameEmojiParty, GameHaha*, GameNewApp*, ProductivityPoll, SportPadel. (*GameHaha/GameNewApp are copies with duplicate appId/name — need fixing.) |
| `APP_BUILD_STANDARD.md` | The mandatory spec/prompt for any LLM building a Kinetik app (manifest, DNA families, design rules). |
| `Serve_Kinetik.bat` | Double-click → rewrites the `SEED_FILES` line inside `index.html` from the `App_*.html` files in the folder, then local server on :5500 (needed so the Store can read app manifests + icons; file:// blocks that). |
| `build.md` | Full chronological build log (§72.x). |
| `APP_ROADMAP.md` | **App roadmap + batch build plan** — production-grade bar, the 4 reusable engines (Quiz/Deck/Skill-Coach/Shared-List) that batch-produce ~20 apps, full 27-app inventory (tier·engine·icon·analog), superapp coverage map + gap apps. |
| `PWA_SW.js`, `manifest_*.webmanifest`, `icon_*.svg` | PWA assets. |

## 3. Architecture (maps 1:1 to future React/TS modules)
- **State**: `S` (session/tab state), `DB` (localStorage cache `kinetik_live_cache_v1`),
  `Session`, `LastUser`. Live backend = Google Sheets via `LIVE_API_URL` (Apps Script).
- **DataAPI** + `SyncEngine` (optimistic writes → background sync to Sheets).
- **MomentsService** — separate blocking pipeline (uploads via fetch, not optimistic).
- **CalendarEngine** (`Cal`) — routines (weekly) + events (one-off, now multi-day),
  exceptions, conflict detection, week/month.
- **PermissionEngine** (`Perm`) — roles: owner(Leader) / coleader / member / viewer.
- **AppRegistry** — runtime autoloader (directory listing → SEED_FILES fallback → live
  manifest read → fallbackApp). Catalog `id` is filename-based.
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
  Entertainment), live manifest reads when served, file:// fallback.

## 6. Known limitations / gotchas
- **file:// can't read sibling files** (CORS null origin) → Store can't read manifests/
  icons; falls back to SEED_FILES/BUILTIN with filename-derived data. **Use
  Serve_Kinetik.bat** for real metadata + true loading. (Three.js "tracking prevention"
  console lines are harmless.)
- **A browser cannot list a folder** when index.html is present, so `SEED_FILES` in
  index.html is the maintained filename list (add one line per new app). This matches
  the KinetikStoreViewer pattern.
- **Every app needs a UNIQUE `appId`** AND unique filename. Copies (GameHaha,
  GameNewApp) currently reuse appIds → duplicate names in the Store until fixed.
- Catalog `id` is filename-based, so renaming a file resets its install state.
- The preview screenshot tool intermittently times out — DOM/eval verification used instead.

## 7. DETAILED TO-DO (what's left)

### A. Immediate cleanup (user, no code)
- [ ] Redeploy `Code.gs` + run `ensureSetup` (activates chat, comments, titles,
      duration, time fix). **This is the biggest unblocker.** Now ALSO creates the new
      **`Reactions` sheet** + activates `setReaction`/`listReactions` so Moment reactions
      persist to the DB and sync across members (until then they work locally only).
      Still to add for full @kin persistence: a `Messages` `kind/payload` column (§10).
- [x] **Done (2026-06-14):** `App_GameHaha`/`App_GameNewApp` phantoms removed from
      `SEED_FILES`; discovery is now self-healing — on a served folder any listed file
      that 404s is skipped (no ghost entry, no console spam).
- [x] **Done (2026-06-15) — drop-in apps auto-discover, single-file.** Root `index.html`
      shadows the directory listing, so the app list lives in the **`SEED_FILES`** const
      *inside index.html* (no separate `apps.json` — that file was removed). The loader
      tries a live directory listing, else uses `SEED_FILES`. `Serve_Kinetik.bat` rewrites
      that one `SEED_FILES` line from the folder's `App_*.html` on every launch, so a
      dropped-in app appears after relaunch — nothing to hand-maintain. Verified all 27
      apps load with real manifest names + emoji icons (no monogram placeholders).
      **To pick up apps added since the server started, just re-run `Serve_Kinetik.bat`.**
- [ ] Reinstall the PWA on iPhone (remove from home screen + re-add) to clear the
      cached pre-100dvh nav.
- [ ] Optional: open via `Serve_Kinetik.bat` for real app icons/metadata.

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
- [x] **Apps/Store UX pass — DONE (2026-06-15).** (1) **iPhone-style home grid**: the Apps
      tab paginates into horizontal swipe pages with dots, sized to the available height —
      only paginates on overflow (verified 3 pages on a short viewport, dots track swipe).
      (2) **No more blink**: removed the per-render GSAP stagger on the app grid (it
      re-fired on every tab visit/EventBus). (3) **App-Store GET/OPEN pill**: fixed iOS
      blue `#0a84ff` (was the circle accent — Aldyth's is rose `#F43F5E`, hence the "red
      open"). (4) **Lettermark logos**: apps whose icon is 1-3 initials (CT, DD, LR…) now
      render as a polished white monogram (`iconInner()` + `.mono`) instead of plain text;
      emoji/SVG icons unchanged. (5) **"Remove from circle"** is now a bordered pill with a
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
- [ ] iOS PNG home-screen icons (current icons are SVG).

### D. App ecosystem roadmap (build per APP_BUILD_STANDARD.md, one HTML each)
DNA families (see the standard): Game, Sport, Kids Quest, Workout, Music, Life Utility,
Social, Professional Learning, Scenario Coach, Founder/Wisdom, Engineering Calculator.
Candidate next apps: Ladder Rush, Lucky Spin (games) · Times Table Quest, Code
Philosophy Kids (kids) · Behaviour Builder, Charisma Coach (self-improvement) · Grocery
Buddy, Cook Simple (life) · Padel/Tennis/Basketball Coach (sport). Categories in the
Store are limited to **Game · Sport · Productivity · Social · Entertainment**.

## 8. How to run / verify
- **Best:** double-click `Serve_Kinetik.bat` → open http://localhost:5500/index.html.
- Demo login: username `aldyth`, PIN `1234` (other members: kinara/baginda/keyla).
- Backend is live Google Sheets at `LIVE_API_URL` (already wired). Calendar/Moments/
  Chat hit it directly; redeploy needed for the newest actions (see §4).
- Verify in a served context (not file://) so the autoloader reads manifests.

## 9. Conventions (do not break)
- `circleId` / `circleType` / `personId` — never `familyId` / `memberId`.
- App files: `App_<Category><Name>.html`; manifest in `<head>`; emoji/inline-SVG icon;
  no CDNs; unique appId. Category from filename prefix (overrides manifest).
- Light theme default; fri-sat weekend default; circle-scoped privacy everywhere.

## 10. @kin Agent ↔ Calendar (NEW — 2026-06-14)
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
- **Chat suggestion pills (2026-06-15)** — `#chatSuggest` strip above the composer
  (`Chat.renderSuggest`/`suggest`, `Chat.SUGGEST` per circle type). Tap a pill → sends
  `@kin <prompt>`. Composer placeholder also hints "try @kin to coordinate".
- Verified (DOM/eval): all 3 intents, clarify chips, full commit loop (event created with
  correct fields, then removed in test), Chat `@kin` thread rendering, RSVP card states,
  suggestion pills end-to-end, mention highlighting. No console errors.
- Next: persist agent cards (Messages `kind/payload` redeploy), RESCHEDULE/CANCEL actions,
  and a real "waiting → accepted" notification when the tagged member confirms.

## 11. LEAN-OUT & REACT/SUPABASE MIGRATION STRATEGY (locked 2026-06-15 — NOT yet executed)
Goal: a lean project structure (effectively single `index.html` + 27 self-contained
`App_*.html` + backend), one master doc, ready to port to **React + Supabase**.
Decisions locked: **drop the PWA layer**; **archive `build.md`**. App icons + app manifests
are ALREADY inline in each app — only legacy PWA files + bloated docs are the cruft.

### 11a. File cleanup — ✅ DONE 2026-06-15 (files moved to `Legacy/`, refs cleaned)
- [x] **Moved to `Legacy/`** (recoverable; permanently delete later if desired): the 6 PWA
      assets `icon_padel.svg`, `manifest_padel.webmanifest`, `icon_poll.svg`,
      `manifest_poll.webmanifest`, `icon_kinetik.svg`, `manifest_kinetik.webmanifest`,
      plus `PWA_SW.js` and the stale `README_BUILD_STANDARD.md`.
- [x] **PWA layer removed from the shell:** `index.html` favicon `<link>`s → a single
      inline data-URI; the PWA registration block (manifest inject + `serviceWorker.register`)
      deleted. Re-added by Vite-PWA in the React build.
- [x] **Stripped dead links** from `App_ProductivityPoll.html` (the `manifest_poll`/`icon_poll`
      `<link>`s AND its own `serviceWorker.register("PWA_SW.js")` at ~line 181).
- [x] Verified: 27 apps load, no console errors, no 404s for any moved file.
- Keep: `index.html`, all `App_*.html`, `Code.gs` (until Supabase), `Serve_Kinetik.bat`.
- Note: `Legacy/` no longer contains `App_CodeClash.html` (was already removed earlier).

### 11b. Doc merge → one `KINETIK.md`
- [ ] Create **`KINETIK.md`** = single source of truth. Sections: 1 Vision/scope ·
      2 Architecture (each JS module → its React component/hook) · 3 **Data model**
      (entities + Sheets→Supabase table map, lifted from `Code.gs` HEADERS) · 4 Feature
      spec (5 tabs + Ask + Chat + @kin) · 5 App platform (manifest contract + the 4
      engines + 27-app inventory) · 6 What works / limits · 7 Migration plan.
- [ ] Absorb `KINETIK_HANDOFF.md` + `APP_ROADMAP.md` + `APP_BUILD_STANDARD.md` into it,
      then delete those three.
- [ ] **Archive `build.md` → `ARCHIVE_build.md`** (rename, keep untouched for history);
      distill only timeless standards (e.g. §38 chat UX) into `KINETIK.md`.
- [ ] Result: 5 markdown docs → **1** (`KINETIK.md`) + 1 archive.

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
