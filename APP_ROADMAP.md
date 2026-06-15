# KINETIK — APP ROADMAP & BATCH BUILD PLAN

Goal: make Kinetik the **one-stop shop for circle-themed apps** (Family + Friends), with
every app at **production grade** — ready for real-life use, not a concept tile.

Companion to `KINETIK_HANDOFF.md` (shell/architecture) and `APP_BUILD_STANDARD.md`
(per-app authoring spec). Current count: **27 apps** in the folder.

---

## 1. The production-grade bar (every app must clear all 7)
1. Real data persistence (AppHost `DATA_*` bridge or backend) — no throwaway state.
2. UI built to `APP_BUILD_STANDARD.md` (DNA family, design rules).
3. Empty / loading / error states.
4. First-run onboarding (what is this, how to play/use).
5. A shareable result / score / summary card (drives circle virality).
6. Offline-tolerant (works without network, syncs after).
7. Real icon — ✅ **done for all 27 (2026-06-15)**.

---

## 2. THE BIG IDEA — batch development via shared engines

The ~15 concept stubs are **not 15 separate builds**. They collapse into **4 reusable
engines**. Build the engine once (single-file, to the standard); each app then = that
engine + a **content pack** (JSON) + a theme (name/icon/gradient). New apps in a family
become "author a pack," not "build an app." This is the batch-dev unlock.

| Engine | What it is | Apps it powers (build order in the batch) | Benchmark analog |
|--------|-----------|--------------------------------------------|------------------|
| **① Quiz/Drill** | Timed Q&A, score, streaks, hearts, levels, boss rounds, adaptive difficulty | Times Table Quest · Clock Trainer · Data Detective · Code Philosophy Kids · Ladder Rush · Agentic AI Tutorial · (Cambridge Primary assessments) | Times Tables Rock Stars, Kahoot |
| **② Coaching Deck** | Swipe cards: scenario → reflect → tip; daily card; optional voice record | Founder Wisdom · Behaviour Builder · Charisma Coach · Articulation Coach · Presenter Studio · Cook Simple | Blinkist, Speeko, Mealime |
| **③ Skill-Coach** | Lesson tree, demo (video slot), reps logging, progression | Padel Academy · Basketball Technique · Tennis Coach · Guitar Basics | Yousician, HomeCourt |
| **④ Shared-List / Tracker** | Real-time shared list/ledger, categories, check-off, balances | Grocery Buddy (upgrade) · **Chore Board** (new) · **Gifts & Occasions** (new) · **Allowance/Split** (new) · Trip packing (new) | AnyList, Cozi, Splitwise |

**Coverage:** these 4 engines produce ~20 of the apps. The rest are bespoke/mature
(harden only) or the core game shell.

### Bespoke / already-mature (harden, don't templatize)
Strata ⛰️ · World Cup 26 🏆 · Guardians of Al Shaheen 🎬 · Padel Americano 🎾 ·
Circle Chess ♟️ · Code Clash ⚡. Round-game polish layer: Emoji Party 😄 · Lucky Spin 🎡.
Poll/coordination: Event Poll 🗳️ (wire to the `@kin` agent + Calendar).

---

## 3. Build batches (sequenced for leverage)

- **Batch 0 — DONE (2026-06-15):** real icons (all 27), single-line app names, iPhone
  swipe-paging on the Apps home.
- **Batch 1 — Quiz/Drill engine** → unlocks 6 apps + Cambridge assessments. *Highest
  leverage (most apps per engine).* Deliver engine + 5 content packs.
- **Batch 2 — Coaching Deck engine** → 6 apps. Deliver engine + 6 packs (+ voice record
  for the speaking trio: Articulation, Charisma, Presenter).
- **Batch 3 — Skill-Coach engine** → 4 apps; also lifts Padel Academy to flagship UI.
- **Batch 4 — Shared-List/Tracker engine** → upgrades Grocery + builds the gap apps
  (Chore Board, Gifts & Occasions, Allowance/Split).
- **Parallel — Harden flagships** (🟢): cloud sync, share cards, leaderboards/ELO.
- **Polish content apps** (🟡): Cambridge Primary, Padel Academy (via Batches 1 & 3),
  Guardians, Emoji Party.

---

## 4. Full inventory (tier · engine · icon · next action)

Tiers: 🟢 production-ready · 🟡 strong content, polish UI · 🟠 working MVP · 🔴 concept stub.

| App | Cat | Tier | Engine | Icon | Next action | Analog |
|-----|-----|------|--------|------|-------------|--------|
| Circle Chess | Game | 🟢 | bespoke | ♟️ | Async play, ELO, puzzles | Chess.com |
| Code Clash | Game | 🟢 | bespoke | ⚡ | Daily challenge, online 1v1, share card | Wordle/Mastermind |
| Padel Americano | Sport | 🟢 | bespoke | 🎾 | Cloud sync, ratings, brackets | Playtomic |
| Strata (Zafar Basin) | Game(pro) | 🟢 | bespoke | ⛰️ | Scoring rubric + leaderboard | serious-game |
| World Cup 26 | Social(pro) | 🟢 | bespoke | 🏆 | Live fixtures, social leagues | Superbru |
| Padel Academy | Sport | 🟡 | ③ Skill-Coach | 🎓 | Rebuild UI to flagship; video + progress | Yousician |
| Cambridge Primary | Learning | 🟡 | ① Quiz | 📚 | Full curriculum, assessments, polish | Atom Learning |
| Guardians of Al Shaheen | Ent(pro) | 🟡 | bespoke | 🎬 | Decide intent, tighten pacing/UI | interactive story |
| Emoji Party | Game | 🟡 | game shell | 😄 | Timed rounds, team score, packs | Heads Up! |
| Event Poll | Productivity | 🟠 | poll | 🗳️ | Calendar/@kin integration, RSVP | Doodle |
| Grocery Buddy | Productivity | 🟠 | ④ List | 🛒 | Real-time sync, aisles, recipe→list | AnyList |
| Times Table Quest | Learning | 🔴 | ① Quiz | ✖️ | Pack on quiz engine | TT Rock Stars |
| Clock Trainer | Kids | 🔴 | ① Quiz | 🕐 | Pack on quiz engine | Khan Kids |
| Data Detective | Game | 🔴 | ① Quiz | 🕵️ | Pack on quiz engine | deduction games |
| Code Philosophy Kids | Learning | 🔴 | ① Quiz | 🧩 | Pack on quiz engine | code.org |
| Ladder Rush | Game | 🔴 | ① Quiz + board | 🪜 | Board layer + quiz pack | Snakes&Ladders+Kahoot |
| Agentic AI Tutorial | Learning | 🔴 | ① Quiz | 🤖 | Pack + diagrams | Brilliant |
| Founder Wisdom | Productivity | 🔴 | ② Deck | 🦉 | Pack on deck engine | Blinkist |
| Behaviour Builder | Productivity | 🔴 | ② Deck + tracker | 🎯 | Pack + streaks | Habitica |
| Charisma Coach | Productivity | 🔴 | ② Deck + voice | ✨ | Pack + record | Poised |
| Articulation Coach | Productivity | 🔴 | ② Deck + voice | 🗣️ | Pack + record | Orai |
| Presenter Studio | Productivity | 🔴 | ② Deck + voice | 🎤 | Pack + timing/filler | PPT Speaker Coach |
| Cook Simple | Life | 🔴 | ② Deck | 🍳 | Recipe pack + step timers → Grocery | Mealime |
| Basketball Technique | Sport | 🔴 | ③ Skill-Coach | 🏀 | Drill pack | HomeCourt |
| Tennis Coach | Sport | 🔴 | ③ Skill-Coach | 🎾 | Drill pack | SwingVision |
| Guitar Basics | Sport/Music | 🔴 | ③ Skill-Coach | 🎸 | Lesson pack + audio | Fender Play |
| Lucky Spin | Game | 🔴 | game shell | 🎡 | Prize logic, daily spin | Wheel of Fortune |

---

## 5. Superapp coverage map (one-stop circle shop)

| Domain | Covered by | Status | Gap → new app (analog) |
|--------|-----------|--------|------------------------|
| Play & games | Chess, Code Clash, Emoji Party, Strata +4 | ✅ | — |
| Sport & coaching | Padel ×2, Basketball, Tennis, Guitar | 🟡 | Fitness Challenge (Strava clubs) |
| Kids learning | Cambridge, Times Table, Clock, Code-Phil | 🟡 | — |
| Self-improvement | Wisdom, Behaviour, Charisma, Articulation, Presenter, Agentic AI | 🔴 | — |
| Life utility | Grocery, Cook, Event Poll | 🟠 | **Chore Board** (Cozi) |
| Money | — | ❌ | **Allowance / Split** (Greenlight, Splitwise) |
| Social & events | World Cup, Event Poll | 🟡 | **Gifts & Occasions** (Elfster); **Trip Planner** (Wanderlog) |
| Health | — | ❌ | Family Health/Meds (Medisafe) |
| Memories | Moments tab (shell) | ✅ | — |
| Coordination | Calendar + @kin agent (shell) | ✅ | — |

**Holes to close for true one-stop:** Money, Chores, Health, Gifts/Trips → 5 new apps,
most via the Shared-List/Tracker engine (Batch 4).

---

## 6. Open decisions / next
- Confirm engine #1 (Quiz/Drill) as the first batch build.
- Voice features (record + analysis) for the deck "speaking" trio — in-scope or later?
- Guardians of Al Shaheen: keep as a pro/Cosmo crossover demo, or productize for circles?
- Which gap apps to prioritize (Chore Board + Allowance recommended first).
