# Kinetik App Housekeeping Matrix

Last updated: 2026-06-18

Read `KINETIK_AGENT_SYSTEM.md` before changing Buddy, diamonds, `@kin`,
Moment Studio, or cross-app behavior. This matrix says what to clean up; the
agent system doc says how the emotional/product logic should work.

## Maturity Scale

| Level | Meaning | Ship posture |
|---|---|---|
| M1 | Manifested app, visually present, mostly isolated | Keep only if strategically useful |
| M2 | Solid standalone loop, limited shell/data awareness | Add bridge and records next |
| M3 | Bridge-aware, can persist progress in AppRecords | Ready for Buddy/diamond event wiring |
| M4 | Buddy/diamond-ready with clear circle utility | Promote as core Kinetik app |
| M5 | Supabase-ready schema, event ledger, tests | Future scale target |

## App Matrix

| # | File | Name | Group | Maturity | Housekeeping move |
|---:|---|---|---|---|---|
| 1 | `App_EntertainmentCinema.html` | Cinema | Sidecar | M1 | Keep as future video/story space; do not wire core diamonds yet |
| 2 | `App_GameChoreQuest.html` | Home Quest | Core | M4 | Use as first diamond event reference app |
| 3 | `App_GameCircleChess.html` | Circle Chess | Core game | M2 | Add AppBridge records and capped game events |
| 4 | `App_GameClockTrainer.html` | Clock Quest | Core kids learning | M2 | Emit practice/mastery events |
| 5 | `App_GameCodeClash.html` | Code Clash | Core game | M3 | Add persisted rounds and caps |
| 6 | `App_GameDataDetective.html` | Data Detective | Learning | M2 | Define case/progress schema |
| 7 | `App_GameEmojiParty.html` | Emoji Party | Core game | M3 | Add Buddy reactions after sessions |
| 8 | `App_GameLadderRush.html` | Choice Trail | Reflection game | M2 | Clarify split from Decision Coach |
| 9 | `App_GameLuckySpin.html` | Circle Spinner | Utility | M1 | Keep mostly reward-neutral |
| 10 | `App_GameStrata.html` | Strata | Sidecar | M2 | Keep outside core economy |
| 11 | `App_ProductivityAgenticAI.html` | Agent Lab | Learning | M3 | Add deterministic agent-action records |
| 12 | `App_ProductivityArticulation.html` | Voice Coach | Coach | M3 | Persist rehearsal/practice sessions |
| 13 | `App_ProductivityBehaviour.html` | Loop Coach | Core habit | M3 | Feed Buddy mood and streaks |
| 14 | `App_ProductivityCambridgePrimary.html` | Primary Quest | Core kids learning | M3 | Define objective/mastery records |
| 15 | `App_ProductivityCharisma.html` | Presence Coach | Coach | M2 | Add DATA bridge records |
| 16 | `App_ProductivityCodePhilosophyKids.html` | Code Quest Kids | Core kids learning | M2 | Add parent-visible mastery |
| 17 | `App_ProductivityCook.html` | Kitchen Buddy | Core household | M4 | Standardize Cook -> Grocery handoff |
| 18 | `App_ProductivityGrocery.html` | Grocery Run | Core household | M3 | Emit shopping completion events |
| 19 | `App_ProductivityPoll.html` | Kinetik Buddy | System center | M1 critical | Promote to shell-level Buddy service |
| 20 | `App_ProductivityPresenter.html` | Presenter Coach | Coach | M3 | Persist rehearsals and readiness badges |
| 21 | `App_ProductivityTimesTableQuest.html` | Times Quest | Core kids learning | M3 | Use as kids quest template |
| 22 | `App_ProductivityWisdom.html` | Decision Coach | Coach | M3 | Split clearly from Choice Trail |
| 23 | `App_SocialWorldCup26.html` | World Cup Arena | Sidecar | M2 | Keep seasonal and specialized |
| 24 | `App_SportBasketball.html` | Basketball Coach | Sport | M3 | Emit practice events |
| 25 | `App_SportLearnGuitar.html` | Guitar Coach | Coach | M3 | Keep deterministic until audio exists |
| 26 | `App_SportLearnTennis.html` | Tennis Coach | Sport | M3 | Persist practice plans |
| 27 | `App_SportPadel.html` | Padel Matchday | Sport/core | M2 | Emit match result and calendar events |
| 28 | `App_SportPadelAcademy.html` | Padel Academy | Sport/core | M3 | Connect Academy progress to Matchday |

## Core Economy Apps

Start here:

1. `Kinetik Buddy`
2. `Home Quest`
3. `Times Quest`
4. `Primary Quest`
5. `Code Quest Kids`
6. `Clock Quest`
7. `Kitchen Buddy`
8. `Grocery Run`
9. `Loop Coach`
10. `Padel Matchday`

## Sidecar Apps

Keep these useful but separate:

- `Cinema`
- `Strata`
- `World Cup Arena`

They can have badges, moments, seasonal rankings, or their own leaderboards. They
should not mint everyday diamonds until deliberately designed.

## Standard Diamond Events

| Event | Use |
|---|---|
| `task.completed` | Chores, grocery, cooking, household actions |
| `task.approved` | Adult-approved rewards |
| `practice.completed` | Coaches, drills, lessons |
| `mastery.unlocked` | Crowns, levels, curriculum/objectives |
| `game.round.completed` | Casual games |
| `game.win` | Competitive wins, capped |
| `calendar.created` | Useful plan/schedule created |
| `reflection.saved` | Wisdom/coaching note saved |
| `buddy.quest.completed` | Buddy quest completion |

## Cleanup Order

1. Keep current manifest/icon/splash work as the baseline.
2. Use `APP_BUILD_STANDARD.md` for all new external apps.
3. Keep shell-level `KINETIK_EVENT` as the event contract.
4. Extend local Buddy/economy state in the shell:
   - `diamondEvents`
   - `buddyState`
   - `agentActions`
   - `buddyQuests`
   - `buddyInventory`
5. Make Kinetik Buddy read the shell state.
6. Add approval cards for Home Quest pending tasks.
7. Wire kids learning apps next.
8. Wire household utility apps next.
9. Wire sport practice/result apps.
10. Keep sidecars separate.
11. Add Apps Script sheets only after the local event model feels right.
12. Map the same tables to Supabase later.

## Naming Families

| Pattern | Use | Examples |
|---|---|---|
| `Quest` | Kids learning and mastery | Times Quest, Primary Quest |
| `Coach` | Adult practice or skill improvement | Voice Coach, Presenter Coach |
| `Buddy` | Emotional or household utility | Kinetik Buddy, Kitchen Buddy |
| `Run` | Repeatable operations | Grocery Run |
| `Matchday` | Sports events/sessions | Padel Matchday |
| `Arena` | Seasonal competition | World Cup Arena |

## External Dependency Policy

Core apps should be single-file/offline-first. Specialized sidecars may temporarily
use external libraries, but each dependency must be deliberate and documented before
scale.

Before React/Supabase:

- remove accidental CDNs from core apps,
- keep external services out of core storage,
- route all app data through the bridge,
- keep app payloads JSON-shaped and portable.
