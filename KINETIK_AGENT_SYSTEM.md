# Kinetik Deterministic Agent System

Last updated: 2026-06-18

Read this document whenever the work mentions agent, Buddy, diamonds, `@kin`,
cross-app actions, app events, app recommendations, Moment Studio, or future LLM
behavior.

For concrete reward amounts, app-to-energy mapping, anti-farming rules, wiring
waves, leaderboards, and schema, also read `KINETIK_DIAMOND_ECONOMY.md`.

## 1. Core Idea

Kinetik should have one living agent identity across the whole product.

The agent is not a separate chatbot inside every app. It is one shared system that
appears through many surfaces:

- Buddy in the Buddy world
- `@kin` in chat
- Ask orb in the shell
- preview cards in Calendar
- small reactions inside apps
- suggestions in Store
- story tools inside Moments

The first version is deterministic. It should feel intelligent because the rules are
well-designed, not because an LLM is guessing.

```text
App action
  -> KINETIK_EVENT
  -> Kin Engine rule
  -> preview or direct low-risk update
  -> saved data
  -> Buddy reaction
  -> diamonds / quests / boards / next suggestion
```

## 2. Names And Roles

| Name | Meaning |
|---|---|
| Kinetik Buddy | The emotional character/avatar. Mood, level, diamonds, quests, cosmetics, memory. |
| Kin Engine | The deterministic rules engine. It classifies events, checks permissions, creates preview cards, applies caps, and writes records. |
| `@kin` | The chat/Ask interface. People talk to this surface. |
| Kinetik Event | The shared language apps use to tell the shell what happened. |
| Diamond Ledger | The reward history. This is the truth, not loose counters inside apps. |
| Agent Action | A proposed or completed action from the agent, such as scheduling, approving, recommending, or styling a moment. |

The product can call the visible character **Kinetik Buddy** or **Kiki** later. The
architecture should still call the deterministic layer **Kin Engine**.

## 3. Non-Negotiable Agent Rules

1. The agent may suggest.
2. The agent may prepare.
3. The agent may summarize.
4. The agent may reward low-risk actions within caps.
5. The agent must ask before important writes.
6. The agent must never silently change calendar, people, permissions, or major rewards.
7. The agent must explain why a reward or action happened.
8. Apps emit events; the shell decides rewards.
9. Parent/adult approvals stay explicit.
10. LLMs later become a language layer, not the authority layer.

## 4. Five Category Spine

The five app categories are not just Store labels. They are the spine of the agent.

| Category | Energy | What it represents | Agent role |
|---|---|---|---|
| Games | Play Energy | Games, rounds, wins, party loops | Score, cap rewards, suggest rematches, update boards |
| Sports | Move Energy | Practice, matches, drills, results | Save sessions, suggest drills, schedule practice, update sport boards |
| Productivity | Care/Growth Energy | Chores, learning, grocery, cooking, habits, coaching | Track effort, queue approvals, reward consistency, suggest next action |
| Social | Circle Energy | Chat, plans, votes, events, group decisions | Coordinate people, ask availability, run votes, resolve clashes |
| Entertainment | Story Energy | Moments, Cinema, photo themes, recaps | Turn memories into stories, posters, cards, badges, highlight reels |

Every new app must answer:

```text
What category is it?
What energy does it create?
What event does it emit?
What can Kin Engine do with that event?
What can Buddy say or change afterward?
```

## 5. Main Surfaces

| Surface | Agent behavior |
|---|---|
| Today | Show what needs attention now; suggest the next useful action. |
| Calendar | Find slots, propose plans, resolve clashes, create events after confirmation. |
| Moments | Suggest memory cards, posters, recaps, and themed transformations. |
| Apps | Receive app events; recommend next app/action; launch relevant app. |
| Me | Explain roles, approvals, circle health, and permission limits. |
| Chat | `@kin` coordinates plans, asks for missing details, renders group preview cards. |
| Buddy World | Emotional dashboard: mood, diamonds, quests, app map, boards, closet, circle status. |
| Store | Recommend apps based on circle gaps, age, energy balance, and recent activity. |

## 6. Event Schema

Apps should emit `KINETIK_EVENT`. The app provides the event. The shell enriches it
with circle, person, permissions, caps, and writes.

```js
{
  type: "KINETIK_EVENT",
  payload: {
    eventType: "practice.completed",
    appId: "times-table-quest",
    personId: "person_123",
    sourceRecordId: "attempt_123",
    amount: 3,
    metadata: {
      skill: "7x8",
      streak: 4,
      accuracy: 0.9
    }
  }
}
```

The shell should store a normalized event:

```js
KinetikEvent {
  id,
  circleId,
  personId,
  targetPersonId,
  appId,
  category,
  energy,
  eventType,
  amount,
  sourceRecordId,
  metadata,
  requiresApproval,
  approvedBy,
  status,          // proposed | approved | rejected | applied | capped
  createdAt
}
```

## 7. Approved Event Types

| Event | Meaning | Default handling |
|---|---|---|
| `task.completed` | Useful household/circle task finished | May need approval; small Care Energy |
| `task.approved` | Adult approved a task | Award diamonds; update helper board |
| `practice.completed` | Drill, lesson, rehearsal, or sport rep finished | Award capped practice diamonds |
| `mastery.unlocked` | Skill level/objective completed | Award larger capped reward |
| `game.round.completed` | Casual round finished | Small capped Play Energy |
| `game.win` | Competitive win | Capped reward; update board |
| `calendar.created` | Useful plan created | Small Circle Energy |
| `reflection.saved` | Coaching/wisdom note saved | Small Growth Energy |
| `moment.created` | Memory posted | Story Energy; no diamonds by default |
| `moment.styled` | Moment transformed into card/poster/theme | Story Energy; optional badge |
| `buddy.quest.completed` | Buddy quest completed | Quest reward |
| `app.installed` | Circle installed an app | Buddy may introduce the app |
| `app.opened` | App launched | Contextual suggestions only |

## 8. Deterministic Capabilities

These are the first capabilities. Each one should be a rule, not an LLM guess.

| Capability | Deterministic behavior |
|---|---|
| `suggest_next` | Pick the next useful app/action from recent gaps, streaks, age, and category balance. |
| `summarize_progress` | Summarize saved app records and events. |
| `create_calendar_event` | Turn a confirmed plan into a calendar event. |
| `find_free_slot` | Search Calendar for availability. |
| `resolve_clash` | Suggest who can cover or move a conflicting event. |
| `queue_parent_review` | Create an approval card for a child reward. |
| `award_diamonds` | Apply reward rules and caps. |
| `buddy_react` | Update Buddy mood/message/energy from an event. |
| `recommend_app` | Suggest an app from missing category coverage or recent context. |
| `create_grocery_items` | Turn recipe ingredients into Grocery Run records. |
| `save_score` | Save game or sport result. |
| `save_practice` | Save drill/rehearsal/practice session. |
| `style_moment` | Apply a deterministic Moment Studio template. |
| `create_story_card` | Create a shareable card/poster from a moment or achievement. |

## 8A. POC Action Spine

The current proof-of-concept spine lives in `index.html` as `KinSpine`.

It is intentionally simple: one reusable layer that sits between surfaces such as
Ask/Chat and product systems such as Apps, Calendar, Moments, and Buddy.

```text
User asks Kin
  -> KinSpine matches a known lane
  -> read shell context
  -> render a preview/action card
  -> user taps a button
  -> write only through the owning system
  -> emit a KINETIK_EVENT when needed
  -> KinEngine/Buddy reacts
```

First POC lanes:

| Lane | Reads | Prepares | Writes |
|---|---|---|---|
| Learning suggestion | circle people, app catalog, Buddy state | next learning app/card | none |
| Learning schedule | Calendar availability, learner profile, app catalog | 20-minute learning preview | Calendar event after tap |
| Moment photos | Moments memory lines/stories | latest photo grid, album/story starters | none |
| App handoff | app catalog, energy balance | suggested app card | opens selected app |

Rules:

- Learning and app suggestions are read-only until the user opens an app.
- Calendar writes are always preview-first and confirmation-gated.
- Moment photo extraction means "surface existing Moment media for reuse"; it does
  not copy, upload, delete, or transform media by itself.
- Future Chat and app surfaces should call the same spine/action registry rather
  than creating separate agent logic.

## 9. Preview Card Pattern

Important actions use preview cards.

```text
Intent detected
  -> build preview card
  -> show who/what/when/reward
  -> user confirms
  -> write data
  -> emit event
  -> Buddy reacts
```

Preview card types:

| Card | Use |
|---|---|
| Plan card | Calendar proposal, event creation, RSVP. |
| Approval card | Child chore/reward approval. |
| Reward card | Diamond award explanation. |
| Practice card | Suggested drill/session. |
| Moment card | Proposed themed memory/poster. |
| App card | Recommended app install/open. |
| Clash card | Conflict or handoff proposal. |

## 10. Calendar Interactions

Calendar is the time layer.

Deterministic flows:

```text
@kin plan dinner Friday
  -> parse plan intent
  -> find free slot
  -> preview event card
  -> confirm
  -> create calendar event
  -> emit calendar.created
  -> Buddy gives Circle Energy
```

```text
@kin who is free this weekend?
  -> read availability
  -> render digest
  -> no write
```

```text
@kin can someone take padel?
  -> find conflicting/responsible event
  -> rank possible cover people
  -> preview handoff
  -> tagged person or Leader confirms
  -> update event participants
```

Rules:

- Read-only summaries do not need confirmation.
- New events need confirmation.
- Handoffs need tagged person or Leader confirmation.
- Calendar writes emit `calendar.created` or future `calendar.updated`.

## 11. Chat Interactions

Chat is the group coordination layer.

Examples:

```text
@kin plan family dinner this weekend
@kin who is free for padel?
@kin remind us to buy milk
@kin vote movie night
@kin summarize this week's chores
```

Deterministic chat behavior:

1. Detect `@kin`.
2. Match known intent.
3. Ask one clarifying question if needed.
4. Render preview card.
5. Wait for the right person to confirm.
6. Save action and post result.

The agent should not answer like a general chatbot first. It should try known
Kinetik actions first.

## 12. App Interactions

Apps are action worlds. They emit events and optionally save records.

```text
Mini app
  -> DATA_CREATE app record
  -> KINETIK_EVENT
  -> Kin Engine classifies
  -> Buddy reacts
```

Current priority apps:

| App | Main events | Agent interaction |
|---|---|---|
| Kinetik Buddy | `buddy.quest.completed` | Shows mood, quests, boards, closet, circle state |
| Home Quest | `task.completed`, `task.approved` | Queue approval, award diamonds, update helper board |
| Times Quest | `practice.completed`, `mastery.unlocked` | Suggest next facts, reward streaks, update learning board |
| Primary Quest | `practice.completed`, `mastery.unlocked` | Track objectives, parent progress, reward mastery |
| Code Quest Kids | `practice.completed`, `mastery.unlocked` | Track logic path, reward boss rounds |
| Clock Quest | `practice.completed`, `mastery.unlocked` | Suggest next time skill |
| Grocery Run | `task.completed` | Reward shopping/run help, connect to Kitchen Buddy |
| Kitchen Buddy | `task.completed`, `calendar.created` | Send ingredients to Grocery, schedule meals |
| Loop Coach | `practice.completed`, `reflection.saved` | Feed streaks and Buddy mood |
| Padel Matchday | `game.round.completed`, `game.win`, `calendar.created` | Save match results, update sport boards |
| Padel Academy | `practice.completed`, `mastery.unlocked` | Suggest drills from Matchday results |
| Moments | `moment.created`, `moment.styled` | Create story cards, posters, recaps |

## 13. Category Interaction Map

### Games - Play Energy

| Event | Agent response |
|---|---|
| `game.round.completed` | Save score, update board, small capped diamonds |
| `game.win` | Update leaderboard, capped reward |
| repeated low-value rounds | Cap reward; still allow play |

Examples: Circle Chess, Code Clash, Emoji Party, Circle Spinner, Choice Trail.

### Sports - Move Energy

| Event | Agent response |
|---|---|
| `practice.completed` | Update streak, suggest next drill |
| `game.round.completed` | Save result |
| `game.win` | Update sport board |
| `calendar.created` | Give small Circle Energy for useful scheduling |

Examples: Padel Matchday, Padel Academy, Tennis Coach, Basketball Coach.

### Productivity - Care/Growth Energy

| Event | Agent response |
|---|---|
| `task.completed` | Queue approval if needed; update Care Energy |
| `task.approved` | Award diamonds |
| `practice.completed` | Track streak |
| `mastery.unlocked` | Award milestone |
| `reflection.saved` | Update Growth Energy |

Examples: Home Quest, Grocery Run, Kitchen Buddy, Times Quest, Loop Coach, Presenter Coach.

### Social - Circle Energy

| Event | Agent response |
|---|---|
| `calendar.created` | Update circle coordination |
| vote/poll completed | Summarize result |
| chat intent confirmed | Save action |

Examples: Chat, Calendar, World Cup Arena, future polls.

### Entertainment - Story Energy

| Event | Agent response |
|---|---|
| `moment.created` | Buddy reacts emotionally; no diamonds by default |
| `moment.styled` | Save styled card/poster |
| cinema/story completed | Badge or sidecar reward |

Examples: Moments, Moment Studio, Cinema.

## 14. Moment Studio

Moment Studio is the Entertainment/Story Energy agent surface.

Start deterministic:

- achievement cards
- matchday posters
- birthday cards
- grocery helper badges
- learning streak cards
- family dinner recap cards
- World Cup fan cards
- Cinema-style story posters

Later add AI image generation, but keep it safe and original:

- do not copy named artists or brands,
- avoid public/sharing assumptions,
- keep family/circle privacy clear,
- always preview before saving,
- save generated output as a Moment record or media asset.

Moment flow:

```text
Photo or achievement
  -> choose theme
  -> preview card
  -> save to Moments
  -> emit moment.styled
  -> Buddy gains Story Energy
```

## 15. Buddy World

Buddy World is the visible home of the system.

Recommended tabs:

| Tab | Meaning |
|---|---|
| Buddy | Avatar, mood, energy, level, daily greeting |
| Map | App world cards grouped by category/energy |
| Boards | Diamonds, helper board, learning board, play board, sport board |
| Closet | Cosmetics, rooms, trophies, earned items |
| Circle | Member energy, approvals, quests, circle health |

The Map should show every app through the five-category spine. Example:

```text
Games -> Play Energy
Sports -> Move Energy
Productivity -> Care/Growth Energy
Social -> Circle Energy
Entertainment -> Story Energy
```

## 16. Reward And Approval Rules

Canonical economy mapping now lives in `KINETIK_DIAMOND_ECONOMY.md`. This section
is the short behavioral summary for the agent system.

Baseline rules:

- Adult approvals gate child chores and high-value rewards.
- Practice rewards are capped per app/person/day.
- Game rewards are small and capped.
- Calendar rewards are small because scheduling can be spammed.
- Moment rewards are mostly emotional/story energy, not diamond-heavy.
- Sidecar apps do not mint core diamonds unless explicitly configured.

Example caps:

| Event | Suggested cap |
|---|---|
| `practice.completed` | 3 to 5 rewarded events per app/person/day |
| `game.round.completed` | 5 rewarded rounds per app/person/day |
| `game.win` | 3 wins per app/person/day |
| `calendar.created` | 2 rewarded events per person/day |
| `task.approved` | approval-based, no automatic farming |

## 17. Data Model

Current local/AppScript model:

```text
AppRecords
KinetikEvents / DiamondEvents
BuddyState
BuddyQuests
BuddyInventory
AgentActions
LeaderboardSnapshots
```

Future Supabase tables:

```sql
app_records
kinetik_events
diamond_events
buddy_state
buddy_quests
buddy_inventory
agent_actions
leaderboard_snapshots
```

`kinetik_events` can be the broad event log. `diamond_events` can be either a
filtered reward ledger or a view derived from Kinetik events.

## 18. LLM Later

The LLM should enter only after the deterministic contract is stable.

LLM can:

- parse messy language into known intents,
- write warmer Buddy reactions,
- summarize activity,
- explain choices,
- suggest next actions,
- generate Moment Studio prompts.

LLM must not:

- bypass permissions,
- directly award uncapped diamonds,
- silently write calendar events,
- silently change members/roles,
- invent unsupported app actions.

The future model:

```text
LLM = language and creativity
Kin Engine = permissions and actions
Buddy = emotion and continuity
Database = memory and truth
```

## 19. Build Phases

### Phase 1 - HTML deterministic prototype

- `KINETIK_EVENT` in shell - started
- local event ledger - started
- Buddy state local - started
- Home Quest wired first - started
- preview cards for important actions

### Phase 2 - Apps Script persistence

- add sheets for events, buddy state, quests, inventory, agent actions
- sync Buddy state across devices
- persist chat agent cards

### Phase 3 - Supabase

- Postgres tables
- Realtime events
- RLS per circle
- Storage for Moments and generated media

### Phase 4 - Cheap LLM layer

- intent parsing
- summaries
- Buddy messages
- Moment Studio prompt assistance

### Phase 5 - Rich generation

- AI image themes
- recap videos
- voice interactions
- stronger planning assistant

## 20. POC To Full Deterministic Ladder

### POC 0.1 - First live event loop

Status: started.

Implemented first:

- Home Quest emits `KINETIK_EVENT`.
- Shell receives the event in AppHost.
- `KinEngine` applies a deterministic rule.
- Shell stores local `diamondEvents`, `agentActions`, and `buddyState`.
- Buddy shows a visible pulse such as Care energy gained.
- Duplicate source records are ignored.
- Daily caps are enforced per person and event type.

Current proof path:

```text
Home Quest chore awarded
  -> task.approved
  -> KinEngine
  -> diamondEvents[]
  -> buddyState[circleId]
  -> Buddy pulse
```

### POC 0.2 - Make Buddy read the shell state

- Kinetik Buddy app receives shell Buddy state in `INIT_APP`.
- Kinetik Buddy displays shell diamonds, mood, level, and energy.
- App-internal simulation wallet remains separate until migration.

### POC 0.3 - Approval preview cards

- Child flow emits `task.completed`.
- Shell creates `agentActions[type=approval.waiting]`.
- Adult sees an approval preview card in Today or Buddy.
- Approval emits `task.approved`.

### POC 0.4 - Cross-app suggestions

- Kitchen Buddy emits grocery intent.
- Shell creates a deterministic suggestion card.
- User taps to open Grocery Run with prepared items.

### POC 0.5 - Calendar action registry

- `@kin` chat actions and app actions use the same action registry.
- Calendar writes require preview and confirmation.
- Read-only summaries can happen immediately.

### Full deterministic v1

- All apps emit only approved event types.
- The shell is the only reward authority.
- Buddy, boards, quests, and shop all read from the shell ledger.
- Apps stop maintaining competing diamond totals.
- Apps Script stores event ledgers and agent actions.
- Supabase later replaces Apps Script with the same records and rules.

## 21. Implementation Checklist

Before implementing agent work:

- [ ] Read this document.
- [ ] Confirm the category/energy of the app or surface.
- [ ] Identify the event type.
- [ ] Decide whether the action is read-only, low-risk, or confirmation-required.
- [ ] Decide whether adult/Leader approval is required.
- [ ] Define the preview card if needed.
- [ ] Define the data record written.
- [ ] Define the Buddy reaction.
- [ ] Define reward caps.
- [ ] Add tests or manual checks for duplicate/farming behavior.

## 22. Golden Path

The first full loop should be:

```text
Home Quest chore completed
  -> task.completed
  -> approval card for adult
  -> adult approves
  -> task.approved
  -> diamond event
  -> Buddy gains Care Energy
  -> helper board updates
  -> Buddy suggests next circle quest
```

Once this loop feels right, reuse the same pattern everywhere.
