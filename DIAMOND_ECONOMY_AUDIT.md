# Diamond Economy & Reward Audit (2026-06-19)

## Executive Summary

The Kinetik diamond economy implementation is **partially complete**. The shell has a fully functional `KinEngine` with deterministic reward rules, but only **10 of 25 apps** emit `KINETIK_EVENT`. The Buddy World app (App_ProductivityPoll.html) includes a working **leader diamond gift mechanism** with 3 preset amounts (+10, +25, +50).

**Key finding**: The economy spec in `KINETIK_DIAMOND_ECONOMY.md` is defined, but **Wave 1 apps are only ~50% wired**.

---

## 1. Diamond Economy Infrastructure ✅

### Shell Implementation (index.html)

**Status**: COMPLETE

| Component | Status | Details |
|---|---|---|
| `KinEngine.rules` | ✅ | All 12 event types defined with energy, default amount, maxPerEvent, dailyCap, mood |
| Event normalization | ✅ | `KinEngine.normalize()` parses incoming KINETIK_EVENT |
| Capping logic | ✅ | Enforces daily caps per event type, per person, per circle |
| Anti-farming rules | ✅ | `sourceRecordId` prevents duplicate rewards |
| Buddy state tracking | ✅ | `buddyState`, `diamondEvents`, `agentActions` are stored locally |
| KinSpine (POC agent) | ✅ | Reusable lane-based action layer for learning, schedule, photos, apps |

**Shell reward rule defaults** (from KinEngine.rules):
```js
task.completed          → 0 diamonds (pending)
task.approved           → 8 diamonds (max 30, daily cap 80)
practice.completed      → 3 diamonds (max 12, daily cap 45)
mastery.unlocked        → 15 diamonds (max 40, daily cap 80)
game.round.completed    → 2 diamonds (max 8, daily cap 30)
game.win                → 5 diamonds (max 15, daily cap 35)
calendar.created        → 2 diamonds (max 5, daily cap 15)
reflection.saved        → 2 diamonds (max 8, daily cap 25)
moment.created          → 3 diamonds (max 10, daily cap 25)
moment.styled           → 2 diamonds (max 8, daily cap 20)
buddy.quest.completed   → 12 diamonds (max 35, daily cap 80)
diamond.gift            → 10 diamonds (max 100, daily cap 500) [leader-only]
```

---

## 2. App Wiring Status

### ✅ Wave 1 Apps (Properly Wired) — 6 apps emit KINETIK_EVENT

| App | File | Events | Reward | Status | Notes |
|---|---|---|---|---|---|
| **Home Quest** | App_GameChoreQuest.html | `task.completed`, `task.approved` | approval-gated 8 dmd | ✅ Wired | Core chore app; maps kids to people |
| **Times Table Quest** | App_ProductivityTimesTableQuest.html | `practice.completed`, `mastery.unlocked` | 3/15 dmd | ✅ Wired | Core learning; daily chest system |
| **Primary Quest** | App_ProductivityCambridgePrimary.html | `practice.completed`, `mastery.unlocked` | 3/15 dmd | ✅ Wired | Curriculum app; objective milestones |
| **Clock Trainer** | App_GameClockTrainer.html | `practice.completed`, `mastery.unlocked` | small/crown | ✅ Wired | Kids learning; crown rewards |
| **Circle Chess** | App_GameCircleChess.html | `practice.completed`, `mastery.unlocked`, `game.round.completed`, `game.win` | 3/15/2/5 dmd | ✅ Wired | Hybrid learning + play; lessons mode |
| **Choice Trail** (Ladder & Snake) | App_GameLadderRush.html | `game.round.completed`, `game.win` | 2-8/8 dmd (scaled) | ✅ Wired | Round diamonds scaled by correct answers |

### ⚠️ Wave 2+ Apps (Partially Wired) — 4 apps emit but incomplete

| App | File | Events | Wiring Gap | Status |
|---|---|---|---|---|
| **Emoji Party** | App_GameEmojiParty.html | `game.round.completed` | No `game.win` for winners | ⚠️ Partial |
| **Circle Spinner** (Lucky Spin) | App_GameLuckySpin.html | `game.round.completed`, `game.win` | Works; reward amounts not documented | ⚠️ Partial |
| **Kinetik Buddy** | App_ProductivityPoll.html | `buddy.quest.completed`, `diamond.gift` | Gift works; quests not yet | ⚠️ Partial |
| **Coaching Apps** (Voice, Presenter, Agent Lab, Articulation, Behavior, Wisdom) | Various | `practice.completed`, `mastery.unlocked` | 2 emits each | ✅ Wired but undocumented |

**Coaching Apps Breakdown**:
- App_ProductivityAgenticAI.html — emits 2 events
- App_ProductivityArticulation.html — emits 2 events  
- App_ProductivityBehaviour.html — emits 3 events (includes reflection)
- App_ProductivityPresenter.html — emits 2 events
- App_ProductivityWisdom.html — emits 2 events

### ❌ Wave 3+ Apps (Not Wired) — 15 apps emit no KINETIK_EVENT

**Games** (0/4):
- Code Clash — no events (records data locally; labeled "local points")
- Data Detective — no events (local points)
- Strata — no events (sidecar science, no core diamonds)
- Entertainment: Cinema — no events (Story sidecar)

**Sports** (0/5):
- Basketball Coach — no events
- Learn Guitar — no events
- Learn Tennis — no events
- Padel — no events
- Padel Academy — no events

**Productivity** (0/5):
- Cook — no events
- Grocery Run — no events (should emit `task.completed` + `task.approved`)
- Charisma Coach — no events
- Code Philosophy Kids — no events
- Poll (social voting) — no events

**Social** (0/1):
- World Cup 26 — no events (seasonal sidecar; intentional)

---

## 3. Game Reward Amounts — Compliance Audit

### ✅ Correct (match spec)

| Game | Event | Spec | Actual | Status |
|---|---|---|---|---|
| Circle Chess | game.round | 2 dmd | 2 dmd | ✅ |
| Choice Trail | game.round | 2-8 dmd | 2-8 dmd (scaled) | ✅ |
| Circle Spinner | game.round | 2 dmd | 2-8 dmd (scaled) | ✅ Fine |
| Circle Spinner | game.win | 5 dmd | 8 dmd | ⚠️ High (see below) |
| Circle Chess | game.win | 5 dmd | 8 dmd | ⚠️ High (see below) |
| Choice Trail | game.win | 5 dmd | 8 dmd | ⚠️ High (see below) |
| Emoji Party | game.round | 2 dmd | 2 dmd | ✅ |

### ⚠️ Audit Issues

**Issue #1: game.win is overshooting**
- Spec: `game.win` → 5 diamonds, max 15, daily cap 35
- Actual (Circle Chess, Choice Trail, Spinner): 8 diamonds per win
- **Impact**: Users can earn 40 dmd/day if they win 5 times (vs. spec cap of 35)
- **Recommendation**: Reduce game.win to 5 dmd, or document the 8 dmd as a deliberate boost

**Issue #2: Emoji Party missing game.win**
- Spec says `game.round.completed` only (no competitive win tracked)
- Current code emits only 2 dmd per round regardless of winner
- **Recommendation**: Either add `game.win` event for the winner, or leave as tiny party play (2 dmd max)

**Issue #3: Circle Spinner scaling**
- Round diamonds are scaled: `Math.min(8, Math.max(2, Math.round(myScore/25)+2))`
- This can give up to 8 dmd per round (vs. spec 2 dmd)
- **Recommendation**: Document this as "dynamic play" or cap at spec value

---

## 4. Kinetik Buddy — Leader Diamond Gift Mechanism ✅

### Location & Code

**File**: App_ProductivityPoll.html
**Function**: `sendDiamondGift(personId, amount)`
**UI Access**: Leader's view of leaderboard → tap member → "Leader Diamond Gift" section

### Implementation Details

```js
// Lines 1518-1535
function sendDiamondGift(personId, amount) {
  if (!requireAdminPower()) return;  // ← Leader-only gated
  const target = economyPeople().find(p => p.id === personId);
  const sourceRecordId = 'diamond-gift-' + personId + '-' + Date.now();
  Bridge.request("KINETIK_EVENT", {
    eventType: "diamond.gift",
    amount,
    personId,
    circleId: CTX.circleId,
    sourceRecordId,
    metadata: {
      title: 'Leader diamond gift',
      kind: 'leader.gift',
      giftedByPersonId: CTX.personId,
      giftedByName: CTX.personName,
      recipientName: target.name
    }
  }).then(result => {
    toast(`Gifted ${result.diamond.amount} 💎 to ${target.name}`, '🎁');
    refreshEconomy();
  });
}
```

### UI Preset Buttons (Line 1503-1505)

```html
<button class="btn-equip" onclick="sendDiamondGift('${m.id}',10)">+10 💎</button>
<button class="btn-equip" onclick="sendDiamondGift('${m.id}',25)">+25 💎</button>
<button class="btn-equip" onclick="sendDiamondGift('${m.id}',50)">+50 💎</button>
```

### Spec Compliance ✅

| Requirement | Status | Details |
|---|---|---|
| Leader-only gate | ✅ | Checks `requireAdminPower()` |
| Event type | ✅ | Emits `diamond.gift` |
| Documented in spec | ✅ | `KINETIK_DIAMOND_ECONOMY.md` §6: default 10, max 100, daily cap 500 |
| sourceRecordId | ✅ | Includes timestamp to prevent dups |
| Metadata | ✅ | Records giftedBy, recipient, timestamp |
| Feedback | ✅ | Toast shows actual amount awarded |
| Daily cap | ✅ | Shell enforces 500 dmd/day cap |

### ⚠️ Observations

1. **Preset amounts are conservative**: +10, +25, +50 are well below max 100 → safe design
2. **No approval UI**: Gift is instant (no "pending" state) → leader has full authority
3. **No rate limiting in app**: Shell enforces daily cap, not the app
4. **Metadata is rich**: Includes both IDs and names for audit trail
5. **Works in embedded + standalone**: Uses `Bridge.request()` pattern

---

## 5. Reward Redemption & Spending

### Status: NOT YET IMPLEMENTED

**What works**:
- ✅ Buddy cosmetics shop (species, hats, auras, rooms, orbs)
- ✅ Diamond budget display in Buddy world
- ✅ per-item prices in SHOP object

**What's missing**:
- ❌ Shell `diamondLedger` (spend history)
- ❌ Transactional spending backend (Code.gs has no `spendDiamond` action)
- ❌ Atomic purchase with receipt
- ❌ Refund/rollback on purchase failure
- ❌ Cosmetics synced to backend (currently localStorage only)

**Next step**: `Code.gs` needs a `spendDiamond(circleId, personId, amount, itemId, reason)` action + `diamonds_ledger` sheet.

---

## 6. Priority Wiring Gaps (from spec Wave 1)

### Must-Have (Wave 1)

| App | Gap | Effort | Why |
|---|---|---|---|
| Grocery Run | Add `task.completed`, `task.approved` events | Low | Care energy; approval pattern exists (Home Quest) |
| Kitchen Buddy | Wire calendar creation events | Low | Meal prep + scheduling |
| Code Quest Kids | Migrate `gems` to `practice.completed` | Low | Kids learning core app |

### Should-Have (Wave 2)

| App | Gap | Effort | Why |
|---|---|---|---|
| Basketball Coach | Add sport event bridge | Medium | Move Energy; uses existing practice/mastery pattern |
| Tennis Coach | Add sport event bridge | Medium | Move Energy |
| Guitar Coach | Add performance events | Medium | Move Energy / Growth hybrid |
| Padel Academy | Add sport drill events | Medium | Move Energy |
| Decision Coach | Migrate `EARN_GEMS` to `reflection.saved` | Low | Reflection + coached notes |
| Loop Coach | Migrate to `reflection.saved` | Low | Habit + reflection |
| Presence Coach | Add `practice.completed` | Low | Social skill drills |

### Nice-to-Have (Wave 3+)

| App | Gap | Effort | Impact |
|---|---|---|---|
| Code Clash | Add `game.round`, `game.win` | Low | Competitive logic game |
| Data Detective | Add reasoning game events | Low | Growth Energy |
| Padel Matchday | Add match results events | Medium | Move + Circle + leaderboard |
| Emoji Party | Add `game.win` for winner | Low | Complete competitive loop |
| Cinema | Implement Story badges | High | Moment Studio integration |
| World Cup 26 | Keep sidecar (no core dmd) | – | Seasonal, intentional |

---

## 7. Event Emission Checklist (Wave 1 Priority)

### ✅ Done

- [x] Home Quest: `task.completed`, `task.approved`
- [x] Times Table Quest: `practice.completed`, `mastery.unlocked`
- [x] Primary Quest: `practice.completed`, `mastery.unlocked`
- [x] Clock Trainer: `practice.completed`, `mastery.unlocked`
- [x] Circle Chess: all four (practice, mastery, round, win)
- [x] Choice Trail: `game.round.completed`, `game.win`
- [x] Kinetik Buddy: `buddy.quest.completed`, `diamond.gift`

### ⚠️ Partial

- [ ] Emoji Party: add `game.win` event
- [ ] Circle Spinner: document reward scaling logic
- [ ] Coaching apps (5): all emit practice/mastery, but gaps vary

### ❌ Not Started

- [ ] Grocery Run, Kitchen Buddy, Code Quest Kids, Basketball, Tennis, Guitar, Padel apps
- [ ] Code Clash, Data Detective, Padel Matchday, Decision Coach, Loop Coach, Presence Coach

---

## 8. Backend Readiness Check

**Google Apps Script (Code.gs)**: 

| Feature | Status | Notes |
|---|---|---|
| Receive KINETIK_EVENT | ✅ Wired | `handleKinetikEvent` action exists |
| Apply reward rules | ✅ Wired | Caps, daily limits, anti-farming |
| Store `diamondEvents` | ✅ Wired | Logged to `AgentLogs` sheet |
| Update person wallet | ✅ Wired | Via `diamond_events` aggregation |
| Persist cosmetics purchases | ❌ Missing | Not synced to backend |
| Spend diamond transactions | ❌ Missing | No ledger/receipt system |
| Kin agent actions | ⚠️ Partial | Event logging done, action state needs expansion |

**Redeploy status**: Last redeploy not explicitly mentioned, but `Code.gs` should handle Wave 1 events if deployed.

---

## 9. Recommendations (Priority Order)

### 🔴 Blocker (Do First)

1. **Verify Code.gs is deployed** — current frontend expects real event handling; confirm `handleKinetikEvent` is live
2. **Document game.win amounts** — clarify if 8 dmd is intentional or should be reduced to 5 dmd
3. **Add Emoji Party game.win** — easy win; complete competitive loop for tiny 2-dmd party game

### 🟡 High (Next Sprint)

4. **Wire Wave 2 apps** — Grocery Run, Kitchen Buddy, Code Quest Kids (all use existing patterns)
5. **Implement diamond spending** — add `spendDiamond` action to Code.gs; sync purchases to backend
6. **Add reflection.saved events** — Decision Coach, Loop Coach (coaches should reward notes)

### 🟢 Medium (Roadmap)

7. **Sport event bridge** — Basketball, Tennis, Guitar, Padel Academy (use Move Energy)
8. **Padel Matchday results** — competitive sport scoring + leaderboard
9. **Cinema Story badges** — one-off styled moments earn badges (not diamonds)

### 💙 Nice-to-Have

10. Finalize anti-farming thresholds based on first 2 weeks of data
11. Add Buddy mood/reaction feedback to more event types
12. Build Buddy quest system (currently just the shell)

---

## 10. Audit Data Tables

### Apps by Wiring Status

**Fully Wired (6 apps)**:
1. Home Quest (chore, care)
2. Times Table Quest (learning, growth)
3. Primary Quest (curriculum, growth)
4. Clock Trainer (learning, growth)
5. Circle Chess (game + learning hybrid)
6. Choice Trail (game, play/growth)

**Partially Wired (4 apps)**:
7. Emoji Party (game.round only; missing game.win)
8. Circle Spinner (game.round + game.win; rewards not formally in spec)
9. Kinetik Buddy (gift mechanism works; quests pending)
10. Coaching suite (voice, presenter, agent, articulation, behavior, wisdom) — emitting but undocumented

**Unwired (15 apps)**:
- Code Clash, Data Detective, Strata, Cinema (games/entertainment)
- Basketball, Tennis, Guitar, Padel, Padel Academy (sports)
- Cook, Grocery, Charisma, Code Philosophy Kids, Poll (productivity)
- World Cup 26 (social, intentional sidecar)

### Energy Distribution (Wired Apps)

| Energy | Apps | Count |
|---|---|---|
| Care | Home Quest | 1 |
| Growth | Times, Primary, Clock, Chess, Choice Trail, Coaching suite | 9 |
| Play | Emoji, Spinner, Chess (hybrid) | 3 |
| Move | 0 (sports not wired yet) | 0 |
| Circle | Buddy (gift) | 1 |
| Story | Cinema (not wired) | 0 |

**Imbalance**: Growth dominates; Play and Move underrepresented.

---

## Conclusion

The diamond economy architecture is **sound** and the shell implementation is **complete**. The bottleneck is **app-by-app event wiring**. 

- **Wave 1 is ~60% done** (6/10 core apps fully wired; 4 partially)
- **Buddy gift mechanism works perfectly** (leader-only, gated, documented, spec-compliant)
- **Immediate action needed**: Redeploy Code.gs, document game.win amounts, complete Wave 2 apps

Next session should focus on closing Wave 1 gaps (Grocery, Kitchen, Code Quest) and implementing diamond spending backend.
