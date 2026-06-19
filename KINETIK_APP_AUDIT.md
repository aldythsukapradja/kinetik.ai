# Kinetik App Audit

Last updated: 2026-06-18

## Current State

- App files: 28
- Valid Kinetik manifests: 28
- Baked Store catalog entries: 28
- Direct launch: `index.html` opens without a helper launcher
- Catalog command: `node build_app_catalog.mjs`
- Catalog check: `node build_app_catalog.mjs --check`
- Kinetik PWA identity: generated inside `index.html`
- App icons: inline SVG inside each app manifest
- External app standard: `APP_BUILD_STANDARD.md`
- Agent/Buddy system map: `KINETIK_AGENT_SYSTEM.md`

The app platform is now manifest-first. Drop a valid `App_*.html` file into the
folder, run the catalog builder, and the Store can load it.

## Product Thesis

Kinetik should feel like a private app world for family and friends. Apps are small
rituals: chores, learning, games, coaching, planning, shopping, sport, and memory.

Kinetik Buddy is the emotional center. It should become the living companion that
turns useful actions into mood, progress, quests, cosmetics, diamonds, and leaderboard
movement.

The diamond system should be a deterministic event ledger, not a loose score.
The detailed deterministic model for Buddy, diamonds, `@kin`, cross-app actions,
Moment Studio, and future LLM behavior lives in `KINETIK_AGENT_SYSTEM.md`.
The concrete economy map, reward caps, app wiring waves, and schema live in
`KINETIK_DIAMOND_ECONOMY.md`.

```text
App action
  -> KINETIK_EVENT
  -> diamond event ledger
  -> Buddy state
  -> leaderboard / quests / mood / cosmetics
```

## App Inventory

| # | File | Current name | Role | Economy posture | Next move |
|---:|---|---|---|---|---|
| 1 | `App_EntertainmentCinema.html` | Cinema | Future video/story space | Sidecar for now | Keep as Cinema; later becomes YouTube-style home |
| 2 | `App_GameChoreQuest.html` | Home Quest | Household chores and approval | Core diamond app | Make it the reference `task.completed` / `task.approved` app |
| 3 | `App_GameCircleChess.html` | Circle Chess | Chess thinking game | Low-cap practice/game rewards | Add bridge persistence and capped game events |
| 4 | `App_GameClockTrainer.html` | Clock Quest | Kids time learning | Core kids learning | Emit `practice.completed` and `mastery.unlocked` |
| 5 | `App_GameCodeClash.html` | Code Clash | Logic/code duel | Capped game rewards | Add diamond caps and persisted rounds |
| 6 | `App_GameDataDetective.html` | Data Detective | Data reasoning cases | Practice/mastery | Add progress schema |
| 7 | `App_GameEmojiParty.html` | Emoji Party | Group guessing game | Capped party rewards | Add Buddy reactions after sessions |
| 8 | `App_GameLadderRush.html` | Ladder & Snake / Choice Trail | Board-style choice/reflection ladder | Tiny Play + reflection practice | Add capped round/reflection events; clarify split from Decision Coach |
| 9 | `App_GameLuckySpin.html` | Fortune Wheel / Circle Spinner | Decision/random prompt wheel | Mostly utility | No direct spin rewards; only real follow-up tasks can enter economy |
| 10 | `App_GameStrata.html` | Strata | Specialized science app | Sidecar | Keep outside core diamonds |
| 11 | `App_ProductivityAgenticAI.html` | Agent Lab | AI-agent learning drills | Practice/mastery | Add deterministic agent-action records |
| 12 | `App_ProductivityArticulation.html` | Voice Coach | Speaking clarity practice | Practice/streak | Store rehearsal sessions |
| 13 | `App_ProductivityBehaviour.html` | Loop Coach | Habit/behavior design | Practice/streak | Feed Buddy mood/streak |
| 14 | `App_ProductivityCambridgePrimary.html` | Primary Quest | Kids curriculum practice | Core kids learning | Define objective/mastery records |
| 15 | `App_ProductivityCharisma.html` | Presence Coach | Presence and charisma scenarios | Practice/reflection | Add DATA bridge records |
| 16 | `App_ProductivityCodePhilosophyKids.html` | Code Quest Kids | Kids coding logic | Core kids learning | Add parent-visible mastery |
| 17 | `App_ProductivityCook.html` | Kitchen Buddy | Recipes and meal planning | Household utility | Standardize Cook -> Grocery handoff |
| 18 | `App_ProductivityGrocery.html` | Grocery Run | Shared grocery operations | Household utility | Emit run completion events |
| 19 | `App_ProductivityPoll.html` | Kinetik Buddy | Central companion/pet world | System center | Promote to shell-level Buddy service |
| 20 | `App_ProductivityPresenter.html` | Presenter Coach | Presentation practice | Practice/streak | Save rehearsals and readiness badges |
| 21 | `App_ProductivityTimesTableQuest.html` | Times Quest | Multiplication mastery | Core kids learning | Use as kids quest template |
| 22 | `App_ProductivityWisdom.html` | Decision Coach | Mental models and decisions | Reflection/practice | Split clearly from Choice Trail |
| 23 | `App_SocialWorldCup26.html` | World Cup Arena | Seasonal prediction app | Sidecar | Keep specialized and seasonal |
| 24 | `App_SportBasketball.html` | Basketball Coach | Basketball technique | Practice/streak | Emit practice events |
| 25 | `App_SportLearnGuitar.html` | Guitar Coach | Guitar practice | Practice/streak | Stay deterministic until audio exists |
| 26 | `App_SportLearnTennis.html` | Tennis Coach | Tennis technique | Practice/streak | Add practice-plan records |
| 27 | `App_SportPadel.html` | Padel Matchday | Padel sessions/scoring | Sport results | Emit match/calendar events |
| 28 | `App_SportPadelAcademy.html` | Padel Academy | Padel training path | Practice/mastery | Connect progress to Matchday |

## Core Apps

Build Buddy and diamonds around these first:

1. `Kinetik Buddy`
2. `Home Quest`
3. `Times Quest`
4. `Primary Quest`
5. `Code Quest Kids`
6. `Clock Quest`
7. `Kitchen Buddy`
8. `Grocery Run`
9. `Loop Coach`
10. `Padel Matchday` and `Padel Academy`

## Sidecar Apps

These are valuable, but should not drive the main diamond economy by default:

- `World Cup Arena`
- `Strata`
- `Cinema`

They can have seasonal badges, special leaderboards, or moments, but should stay
separate from everyday family/friends reward loops unless explicitly wired.

## Diamond Events

Approved event language:

| Event | Use |
|---|---|
| `task.completed` | Chores, grocery, cooking, household actions |
| `task.approved` | Adult-approved rewards |
| `practice.completed` | Coaches, drills, lessons |
| `mastery.unlocked` | Levels, crowns, objectives |
| `game.round.completed` | Casual games |
| `game.win` | Competitive wins, capped |
| `calendar.created` | Useful plan created |
| `reflection.saved` | Coaching/wisdom note saved |
| `buddy.quest.completed` | Buddy quest completion |

Anti-farming rules:

- Cap low-value repeat events per app/person/day.
- Require adult approval for child chore rewards.
- Do not let randomizers mint major rewards.
- Keep sidecar apps outside the core economy unless designed as events.

## Data Model Direction

Current prototype:

```text
App
  -> postMessage bridge
  -> shell DataAPI
  -> local cache
  -> Apps Script
  -> Google Sheets
```

Future scale:

```text
App
  -> same bridge
  -> shell AppData service
  -> Supabase tables
```

Primary app table now/future:

```js
AppRecord {
  id, circleId, appId, collection, ownerPersonId,
  payload, deleted, createdAt, updatedAt
}
```

Buddy/economy tables to add next:

```text
diamond_events
buddy_state
buddy_quests
buddy_inventory
leaderboard_snapshots
agent_actions
```

## Priority Gaps

1. Buddy has a first local shell service, but Kinetik Buddy does not yet consume it.
2. `KINETIK_EVENT` is implemented as a local POC for Home Quest; more apps need wiring.
3. Several apps need bridge persistence, not just local state.
4. Diamond caps have started in the shell, but app-internal wallets still need migration.
5. App docs need to stay synchronized with the manifest catalog.
6. External dependencies in sidecar/specialized apps need a deliberate policy before scale.

## Next Build Order

1. Make Kinetik Buddy consume shell `buddyState` and `diamondEvents`.
2. Add approval cards from `agentActions[type=approval.waiting]`.
3. Wire `Times Quest` and `Primary Quest`.
4. Wire `Kitchen Buddy` and `Grocery Run`.
5. Migrate app-internal wallets toward the shell ledger.
6. Add `buddyQuests` and `buddyInventory`.
7. Map the final schema into Apps Script sheets, then Supabase tables.
