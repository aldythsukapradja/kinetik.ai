# Kinetik App Housekeeping Matrix

Last updated: 2026-06-18

## Maturity Scale

| Level | Meaning | Ship posture |
|---|---|---|
| M1 | Manifested standalone app, but isolated from Kinetik shell systems | Keep only if strategically useful |
| M2 | Good standalone app with partial shell signals or strong internal value | Clean bridge/metadata next |
| M3 | Bridge-aware app with local progress and AppRecords-style data path | Ready for diamond-event wiring |
| M4 | Diamond/Buddy-ready app with clear rewards and circle utility | Promote as core Kinetik app |
| M5 | Scale-ready: Supabase schema, event ledger, Buddy hooks, tests | Future target |

Diamond shorthand:

| Event | Use |
|---|---|
| `task.completed` | Chores, grocery, cooking, household actions |
| `task.approved` | Parent/adult-approved rewards |
| `practice.completed` | Coaches, drills, lessons |
| `mastery.unlocked` | Crowns, levels, curriculum/objectives |
| `game.round.completed` | Casual games |
| `game.win` | Competitive wins, capped |
| `calendar.created` | Useful plan/schedule created |
| `reflection.saved` | Wisdom/coaching note saved |
| `buddy.quest.completed` | Buddy quest completion |

## Full App List

| # | File | Manifest name | Category | Audience | Works with | Analog | Feature loop | Diamond role | Maturity | Housekeeping move |
|---:|---|---|---|---|---|---|---|---|---|---|
| 1 | `App_EntertainmentCinema.html` | Guardians of Al Shaheen | entertainment | all | standalone | Apple TV interactive briefing, Three.js cinematic microsite | Cinematic RMO Cosmo story/briefing experience | Optional side reward only: `game.round.completed` or seasonal badge | M1 | Decide if this belongs to Kinetik core or RMO side world; remove CDNs/bridge if kept |
| 2 | `App_GameChoreQuest.html` | Chore Quest | games | kids | offline, standalone | Habitica, Finch, family chore chart | Kids complete home missions; adults approve or bonus reward | Core: `task.completed`, `task.approved`, `buddy.quest.completed`; reference diamond app | M4 | Commit/track file; make this the canonical diamond event implementation |
| 3 | `App_GameCircleChess.html` | MindCastle Chess | games | all | standalone | ChessKid, Chess.com puzzles | Tactical chess/pattern thinking game | Low-cap `practice.completed`, `game.win`, streak | M1 | Remove external fonts/PeerJS; add AppBridge and local score event |
| 4 | `App_GameClockTrainer.html` | Clock Trainer | games | kids | offline, standalone | I Can Tell Time, Khan Kids | Analog clock reading, elapsed time, skill path | `practice.completed`, `mastery.unlocked`, streak | M2 | Add full `INIT_APP` handling; wire Buddy reward events |
| 5 | `App_GameCodeClash.html` | Code Clash | games | all | offline, standalone | Mastermind, Wordle, pass-and-play logic duel | Guess hidden color/code, hints, leaderboard | `game.round.completed`, `game.win`, small streak rewards | M3 | Standardize appId later; add diamond caps |
| 6 | `App_GameDataDetective.html` | Data Detective | games | adults | offline, standalone | DataCamp, Kaggle Learn, DataLemur | BI/statistics/analytics case questions | `practice.completed`, `mastery.unlocked`, case-solved bonus | M2 | Add `INIT_APP`; define mastery schema |
| 7 | `App_GameEmojiParty.html` | Emoji Party | games | all | offline, standalone | Jackbox, Heads Up, Gartic-style party guessing | Multiple-choice emoji guessing party game | `game.round.completed`, party streak, low rewards | M3 | Add Buddy reaction after round/session |
| 8 | `App_GameLadderRush.html` | Wisdom Trail | games | all | standalone | Duolingo path, Choice of Games, Headway challenge | Judgment/reflection progression trail | `reflection.saved`, `practice.completed`, streak | M1 | Remove external fonts/PeerJS; clarify split from Wisdom Coach |
| 9 | `App_GameLuckySpin.html` | Lucky Spin | games | all | standalone | Tiny Decisions, Spin the Wheel, Jackbox prompt tool | Spinner for decisions, dares, chores, prizes | Mostly no minting; only `game.round.completed` capped or Buddy prompt | M1 | Prevent reward abuse; add bridge or make pure utility |
| 10 | `App_GameStrata.html` | Strata | games | all | standalone | Rockd, geology puzzle, scientific simulator | Stratigraphy/geoscience puzzle in Zafar Basin | Specialized sidecar; no core diamonds except seasonal badge | M2 sidecar | Keep outside Buddy economy; remove/contain Apps Script and CDN dependency later |
| 11 | `App_ProductivityAgenticAI.html` | Agentic AI | productivity | adults | offline, standalone | Brilliant, Anthropic agent guide, Replit/Cursor onboarding | Mission briefings and practical AI-agent drills | `practice.completed`, `mastery.unlocked`, `reflection.saved` | M3 | Rename to Agent Lab; add deterministic agent-action records |
| 12 | `App_ProductivityArticulation.html` | Articulation Coach | productivity | adults | offline, standalone | Orai, Speeko, Yoodli | Speaking clarity, pacing, pause, articulation drills | `practice.completed`, streak, drill badge | M3 | Add rehearsal/session records; no microphone claims until implemented |
| 13 | `App_ProductivityBehaviour.html` | Behaviour Coach | productivity | adults | offline, standalone | Fabulous, Noom, Finch | Habit loops, prompts, behavior design practice | `practice.completed`, streak, `reflection.saved` | M3 | Feed Buddy mood/streak; consider rename Loop Coach |
| 14 | `App_ProductivityCambridgePrimary.html` | Cambridge Primary | productivity | kids | offline, standalone | Khan Academy Kids, IXL, Quizlet | Curriculum objectives, mastery, mistakes, parent content | `practice.completed`, `mastery.unlocked`, parent-reviewed rewards | M3 | Define objective/mastery table before Supabase |
| 15 | `App_ProductivityCharisma.html` | Charisma Coach | productivity | adults | offline, standalone | MasterClass, Orai, Vanessa Van Edwards content | Presence/warmth/power scenario trainer | `practice.completed`, `reflection.saved`, streak | M2 | Add DATA bridge persistence; rename Presence Coach if simplifying |
| 16 | `App_ProductivityCodePhilosophyKids.html` | Code Philosophy Kids | productivity | kids | offline, standalone | Scratch, Code.org, Human Resource Machine | Logic sequencing, loops, conditions, robot-maze reasoning | `practice.completed`, `mastery.unlocked`, boss-round reward | M2 | Add `INIT_APP`; make parent progress visible |
| 17 | `App_ProductivityCook.html` | Cook Simple | productivity | all | offline, standalone, calendar | Tasty, Mealime, AnyList | Recipes, cook mode, meal planning, grocery/calendar handoff | `task.completed`, `calendar.created`, family meal quest | M4 | Standardize cross-app intents with Grocery and Poll/Buddy |
| 18 | `App_ProductivityGrocery.html` | Grocery Buddy | productivity | all | offline, standalone | AnyList, Bring!, Apple Reminders | Shared grocery lists, runs, favorites, standings | `task.completed`, shopping run completed, helper bonus | M3 | Connect to Cook Simple; emit shopping completion events |
| 19 | `App_ProductivityPoll.html` | Kinetik Buddy | productivity | all | standalone, offline | Tamagotchi, Finch, Pou, Habitica | Central pet/avatar for diamonds, quests, leaderboard, app progress | Source of truth for Buddy state; consumes all diamond events | M1 critical | Make shell-level Buddy service; add AppBridge/data/event ledger; remove CDN |
| 20 | `App_ProductivityPresenter.html` | Presenter Coach | productivity | adults | offline, standalone | VirtualSpeech, Toastmasters Timer, Keynote coach | Structure, slides, delivery, nerves, Q&A practice | `practice.completed`, rehearsal streak, readiness badge | M3 | Add timer/rehearsal records and Buddy event output |
| 21 | `App_ProductivityTimesTableQuest.html` | Times Table Quest | productivity | kids | offline, standalone | Duolingo, Khan Kids, Prodigy | Multiplication hearts, XP, crowns, weak-fact adaptation | `practice.completed`, `mastery.unlocked`, boss reward | M3 | Use as kids quest template; connect reward output |
| 22 | `App_ProductivityWisdom.html` | Wisdom Coach | productivity | adults | offline, standalone | Farnam Street, Headway, Blinkist | Mental models, decisions, scenarios, private notes | `reflection.saved`, `practice.completed`, streak | M3 | Clarify relationship with Wisdom Trail |
| 23 | `App_SocialWorldCup26.html` | World Cup 26 | social | all | standalone | ESPN bracket challenge, fantasy prediction league | World Cup forecast arena, predictions, leaderboard | Specialized sidecar; seasonal badges only | M2 sidecar | Keep out of core economy; isolate Apps Script/fetch/CDNs |
| 24 | `App_SportBasketball.html` | Basketball Technique | sports | all | offline, standalone | HomeCourt, Nike Training Club | Technique cues, drills, reps, self-checks | `practice.completed`, streak, skill badge | M3 | Add deterministic practice events and optional calendar plan |
| 25 | `App_SportLearnGuitar.html` | Guitar Basics | sports | all | offline, standalone | Yousician, Simply Guitar | Chord maps, rhythm reps, self-checks | `practice.completed`, streak, mastery badge | M3 | Rename Guitar Coach; keep deterministic until audio exists |
| 26 | `App_SportLearnTennis.html` | Tennis Coach | sports | all | offline, standalone | SwingVision, Nike Training | Contact point, serve rhythm, footwork, match cues | `practice.completed`, streak, skill badge | M3 | Add practice-plan records and optional calendar |
| 27 | `App_SportPadel.html` | Padel Americano | sports | all | calendar | Americano tournament manager, LeagueLobster | Padel Americano/Mexicano players, courts, scoring, leaderboard | `game.round.completed`, `game.win`, `calendar.created`, match result | M2 | Add actual AppBridge despite calendar manifest; rename Padel Matchday |
| 28 | `App_SportPadelAcademy.html` | Padel Academy | sports | all | offline, standalone | Nike Training, MasterClass, SwingVision for padel | Training path for technique, tactics, movement, match IQ | `practice.completed`, `mastery.unlocked`, streak | M3 | Connect Academy progress to Padel Matchday results |

## Housekeeping Clusters

### Promote To Core

These should become the first Buddy/diamond apps:

1. `App_ProductivityPoll.html` -> Kinetik Buddy service, not just standalone pet.
2. `App_GameChoreQuest.html` -> canonical chores/approval/diamond loop.
3. `App_ProductivityCook.html` + `App_ProductivityGrocery.html` -> family utility loop.
4. `App_ProductivityTimesTableQuest.html`, `App_GameClockTrainer.html`, `App_ProductivityCodePhilosophyKids.html`, `App_ProductivityCambridgePrimary.html` -> kids learning loop.
5. `App_SportPadel.html` + `App_SportPadelAcademy.html` -> sport loop.

### Keep As Sidecar

These are valuable, but should not drive the core economy by default:

- `App_SocialWorldCup26.html`
- `App_GameStrata.html`
- `App_EntertainmentCinema.html`

### Clean First

Apps with external dependencies or weak shell integration:

- `App_EntertainmentCinema.html`: external fonts, Three.js, GSAP, no bridge.
- `App_GameCircleChess.html`: external fonts, PeerJS, no bridge.
- `App_GameLadderRush.html`: external fonts, PeerJS, no bridge.
- `App_GameLuckySpin.html`: external fonts, PeerJS, no bridge.
- `App_GameStrata.html`: external fonts, Three.js, Apps Script/fetch.
- `App_SocialWorldCup26.html`: GSAP, Three.js, remote flags, Apps Script/fetch.
- `App_ProductivityPoll.html`: GSAP and no bridge despite being the center app.

## Recommended Rename Families

| Pattern | Use for | Examples |
|---|---|---|
| `Quest` | Kids learning / gamified mastery | Clock Quest, Times Quest, Code Quest Kids, Primary Quest |
| `Coach` | Adult practice / personal improvement | Voice Coach, Presenter Coach, Tennis Coach |
| `Buddy` | Emotional/shared household utility | Kinetik Buddy, Kitchen Buddy |
| `Run` | Repeatable household operations | Grocery Run |
| `Matchday` | Sports event/session operations | Padel Matchday |
| `Arena` | Seasonal/social competition | World Cup Arena |

## Immediate Housekeeping Order

1. Commit/track `App_GameChoreQuest.html`.
2. Define one shell event: `KINETIK_EVENT`.
3. Add Buddy ledger schema to shell local state: `diamondEvents`, `buddyState`, `buddyQuests`.
4. Wire Chore Quest -> `KINETIK_EVENT` first.
5. Wire Cook/Grocery next.
6. Wire kids learning apps.
7. Move World Cup and Strata into "specialized sidecar" mental bucket.
8. Remove or inline all CDN dependencies before Vercel/static scale.
9. Decide which suggested renames are display-only vs file renames.

