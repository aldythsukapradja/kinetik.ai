# Kinetik App Audit

Last updated: 2026-06-18

## Current State

- App files: 28
- Valid Kinetik manifests: 28
- Baked appstore catalog entries: 28
- Direct launch: `index.html` opens without a helper launcher
- Catalog refresh command: `npm run build` or `node build_app_catalog.mjs`
- Catalog freshness check: `npm run check` or `node build_app_catalog.mjs --check`
- Chore Quest is included in the generated appstore catalog as `App_GameChoreQuest.html`
- Center app: `App_ProductivityPoll.html` is now manifest-named `Kinetik Buddy`
- Full housekeeping table: `KINETIK_APP_HOUSEKEEPING.md`

The shell can now launch directly from `index.html` using the baked
`BUILTIN_APP_CATALOG`. When served over http(s), it can still live-read manifests
from app files as an enhancement.

## Product Thesis

Kinetik should feel like a private family/friends operating system where apps are
mini rituals, not disconnected utilities. `Kinetik Buddy` should be the emotional
center: a living circle companion that reacts to effort, consistency, help,
learning, play, and shared moments.

The diamond system should not be a loose score. It should be a deterministic event
ledger. Every app emits small, predictable progress events. The shell records them.
Buddy turns them into mood, growth, cosmetics, streaks, quests, and leaderboard
changes.

## Diamond System

Core rule:

```text
App action -> deterministic event -> diamond ledger -> Buddy state -> leaderboard
```

Recommended diamond event types:

| Event | Meaning | Typical value |
|---|---|---:|
| `task.completed` | A useful task was finished | 5 |
| `task.approved` | A parent/adult approved a task | 5 |
| `practice.completed` | A drill, lesson, or round was completed | 3 |
| `practice.streak` | A streak threshold was reached | 5 to 20 |
| `game.round.completed` | A casual game round ended | 1 to 5 |
| `game.win` | Competitive win | 3 |
| `helped.circle` | Someone helped the circle | 5 |
| `calendar.created` | A plan was created | 2 |
| `shopping.completed` | Grocery/cooking run completed | 5 |
| `quest.completed` | Buddy quest completed | 10 to 50 |

Anti-spam rules:

- Cap repeat low-value events per app per day.
- Require parent/adult approval for chore rewards.
- Keep specialized apps like World Cup and Strata outside the main diamond economy
  unless explicitly connected as side quests.
- Never let randomizers like Lucky Spin mint large rewards by themselves.

## Deterministic Agent Model

For the current HTML/AppScript era, keep agentic behavior simulated and auditable.
No cheap LLM is needed for the core loop yet.

```text
User opens app
  -> shell sends INIT_APP context
  -> app runs local interaction
  -> app posts KINETIK_EVENT / DATA_CREATE / ADD_TO_CALENDAR
  -> shell writes local/AppScript state
  -> Buddy consumes ledger
  -> Buddy updates mood, diamonds, quests, leaderboard
  -> optional agent suggests next action from rules
```

Agent capabilities should be explicit per app:

| Capability | Deterministic behavior |
|---|---|
| `suggest_next` | Pick next drill/task from progress gaps |
| `summarize_progress` | Summarize local stats and streaks |
| `create_calendar_event` | Convert app intent into calendar payload |
| `create_grocery_items` | Convert recipe ingredients into grocery records |
| `award_diamonds` | Emit capped diamond events |
| `buddy_react` | Send emotion/update event to Buddy |
| `parent_review` | Queue approval before reward |

## Minimal Data Schema

Use this mental model now, then map it almost directly into Supabase later.

```text
users
circles
circle_members
apps
circle_apps
app_records
diamond_events
buddy_state
buddy_quests
agent_actions
calendar_events
```

Core records:

```js
AppManifest {
  appId, name, shortName, file, category, tagline, about,
  icon, gradient, audience, circleTypes, worksWith, status, minMembers
}

DiamondEvent {
  id, circleId, personId, appId, eventType, amount,
  sourceRecordId, metadata, createdAt, approvedBy
}

BuddyState {
  circleId, level, xp, diamonds, mood, hunger, energy,
  cosmeticItems, activeQuestIds, lastInteractionAt
}

AppRecord {
  id, circleId, appId, collection, ownerPersonId,
  payload, createdAt, updatedAt, deletedAt
}

AgentAction {
  id, circleId, appId, personId, capability,
  input, output, status, createdAt
}
```

## App Inventory

The rename column is a suggested product/display rename. I did not rename files.

| # | File | Current manifest name | Feature summary | Main gap | Suggested name |
|---:|---|---|---|---|---|
| 1 | `App_EntertainmentCinema.html` | Guardians of Al Shaheen | Cinematic RMO Cosmo briefing/story app. | External CDNs, no bridge, not yet tied to Buddy. | Cosmo Cinema |
| 2 | `App_GameChoreQuest.html` | Chore Quest | Family chore missions, approval, bonus rewards, diamonds. | Should become the reference implementation for diamond events. | Home Quest |
| 3 | `App_GameCircleChess.html` | MindCastle Chess | Chess/tactics style thinking game. | External fonts/PeerJS, no AppBridge, no diamond events. | Circle Chess |
| 4 | `App_GameClockTrainer.html` | Clock Trainer | Kids clock reading and elapsed-time trainer. | Uses data bridge but lacks full INIT_APP theme/context handling. | Clock Quest |
| 5 | `App_GameCodeClash.html` | Code Clash | Logic/code-breaking duel with hints and leaderboard. | App id can be simplified later; needs diamond event contract. | Code Clash |
| 6 | `App_GameDataDetective.html` | Data Detective | Data/BI/statistics quiz and case game. | Needs clearer learning-progress schema and INIT_APP handling. | Data Detective |
| 7 | `App_GameEmojiParty.html` | Emoji Party | Multiple-choice emoji party guessing game. | Needs Buddy reactions and score events. | Emoji Party |
| 8 | `App_GameLadderRush.html` | Wisdom Trail | Progression ladder for judgment/reflection challenges. | External fonts/PeerJS, no bridge. Overlaps Wisdom Coach. | Choice Trail |
| 9 | `App_GameLuckySpin.html` | Lucky Spin | Spinner/randomizer for decisions, dares, chores, prizes. | External fonts/PeerJS, no bridge. Reward minting must be capped. | Circle Spinner |
| 10 | `App_GameStrata.html` | Strata | Specialized stratigraphy/geoscience puzzle. | Specialized app, Apps Script/fetch, external Three.js, should stay sidecar. | Strata: Zafar Basin |
| 11 | `App_ProductivityAgenticAI.html` | Agentic AI | Agentic AI concept coach and mission drills. | Needs deterministic agent-action schema. | Agent Lab |
| 12 | `App_ProductivityArticulation.html` | Articulation Coach | Voice clarity, pacing, pauses, speaking drills. | No real audio; progress should still emit practice events. | Voice Coach |
| 13 | `App_ProductivityBehaviour.html` | Behaviour Coach | Habit loops, prompts, behavior design practice. | Should feed Buddy streak and routine events. | Loop Coach |
| 14 | `App_ProductivityCambridgePrimary.html` | Cambridge Primary | Curriculum learning tracker for primary subjects. | Needs objective/mastery schema and parent review. | Primary Quest |
| 15 | `App_ProductivityCharisma.html` | Charisma Coach | Presence, warmth, power, charisma scenario trainer. | Has bridge signals but no DATA bridge yet. | Presence Coach |
| 16 | `App_ProductivityCodePhilosophyKids.html` | Code Philosophy Kids | Kids coding logic and CS pioneer cards. | Needs full INIT_APP context and parent-visible mastery. | Code Quest Kids |
| 17 | `App_ProductivityCook.html` | Cook Simple | Recipes, cook mode, meal planning, grocery/calendar handoff. | Cross-app intents need standardized records. | Kitchen Buddy |
| 18 | `App_ProductivityGrocery.html` | Grocery Buddy | Shared grocery runs, favorites, standings. | Needs shared list schema and Buddy reward hooks. | Grocery Run |
| 19 | `App_ProductivityPoll.html` | Kinetik Buddy | Central Tamagotchi-style circle companion. | Must become system avatar with AppBridge, ledger, quests, shop, mood. | Kinetik Buddy or Kiki |
| 20 | `App_ProductivityPresenter.html` | Presenter Coach | Presentation structure, delivery, nerves, Q&A practice. | Needs timer/rehearsal records and practice events. | Presenter Coach |
| 21 | `App_ProductivityTimesTableQuest.html` | Times Table Quest | Multiplication drills with hearts, XP, streaks, boss rounds. | Needs parent progress schema and Buddy rewards. | Times Quest |
| 22 | `App_ProductivityWisdom.html` | Wisdom Coach | Mental models, decision scenarios, reflection drills. | Overlaps Wisdom Trail; split coach vs game clearly. | Decision Coach |
| 23 | `App_SocialWorldCup26.html` | World Cup 26 | World Cup forecast/prediction arena. | Specialized app, Apps Script/fetch, external assets, sidecar economy. | World Cup Arena |
| 24 | `App_SportBasketball.html` | Basketball Technique | Basketball technique drills and self-checks. | No sensor/video; emit deterministic practice completions. | Basketball Coach |
| 25 | `App_SportLearnGuitar.html` | Guitar Basics | Chord/rhythm practice with self-checks. | No audio listening; deterministic only. | Guitar Coach |
| 26 | `App_SportLearnTennis.html` | Tennis Coach | Tennis technique, serve rhythm, footwork, volleys. | No sensor/video; deterministic practice events. | Tennis Coach |
| 27 | `App_SportPadel.html` | Padel Americano | Americano/Mexicano organizer, scoring, leaderboard, export. | Manifest says calendar but app lacks bridge; should emit results. | Padel Matchday |
| 28 | `App_SportPadelAcademy.html` | Padel Academy | Padel technique/tactics/training path. | Needs connection to Padel Matchday results. | Padel Academy |

## Priority Gaps

1. `Kinetik Buddy` is conceptually central, but technically still isolated.
   It needs AppBridge support, BuddyState, DiamondEvent consumption, quest state,
   and a small cosmetics/shop loop.
2. Several apps emit bridge/data messages, but there is no common event contract
   for diamonds. Add `KINETIK_EVENT` or `BUDDY_EVENT` as the standard message.
3. External dependencies remain in Cinema, Circle Chess, Wisdom Trail, Lucky Spin,
   Strata, World Cup, and Buddy. These violate the single-file/offline standard.
4. World Cup and Strata should be marked as specialized sidecar apps in product
   strategy. They can have their own leaderboards without contaminating the core
   family/friends diamond economy.
5. Padel Americano is valuable but not yet connected to the shell bridge, despite
   being the kind of app that should emit calendar/result events.
6. Naming is inconsistent: some apps are "Coach", some "Quest", some branded
   names. Adopt naming families:
   - Kids learning: `Quest`
   - Adult practice: `Coach`
   - Household utility: `Buddy` or `Run`
   - Group games: short playful names
   - Specialized apps: subtitle format, for example `Strata: Zafar Basin`

## Next Housekeeping Steps

1. Add a shared AppBridge snippet to every app.
2. Add deterministic event types and diamond caps to the build standard.
3. Convert `Kinetik Buddy` from standalone pet app into shell-level embedded buddy.
4. Remove or inline CDN dependencies.
5. Make sure `App_GameChoreQuest.html` is committed with the repo when you ship.
6. Decide whether product renames are display-only or physical filename renames.
7. Extend the manifest validator when the Buddy/diamond event contract is finalized.
