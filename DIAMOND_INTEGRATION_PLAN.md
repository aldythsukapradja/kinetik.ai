# Diamond Economy — Priority Integration Plan (2026-06-19)

**Goal**: Full diamond economy integration for 8 core apps: Kinetik Buddy (hub), Home Quest, Times Table Quest, Circle Chess, Primary Quest, Choice Trail, Circle Spinner, Emoji Party.

**Status**: 70% complete shell infrastructure; apps 60% wired. **Critical blocker**: Diamond gift "failed to send" error in Buddy.

---

## ISSUE: Diamond Gift Failing — Root Cause Analysis

### Symptoms
- User (as Leader) taps gift button (+10, +25, +50) on leaderboard
- Toast shows: "Gift could not be sent ⚠️"
- Economy doesn't refresh

### Technical Flow
1. **Buddy app** sends: `Bridge.request("KINETIK_EVENT", {eventType: "diamond.gift", personId, amount})`
2. **Bridge.request** posts message to parent (shell) with `reqId`
3. **Shell listener** (line 4447) receives message and calls `KinEngine.handle(m)`
4. **Shell reply** should be: `{type: "KINETIK_EVENT_RESULT", reqId, result: {...}}`
5. **Buddy listener** (line 1057) receives and resolves promise with `m.result`

### Probable Causes

#### ❌ Issue #1: Shell reply timing
- **Location**: index.html line 4449
- **Code**: `reply({type:"KINETIK_EVENT_RESULT",reqId:m.reqId,result});`
- **Problem**: `result` might be `undefined` if `KinEngine.handle()` doesn't return properly
- **Check**: Is `KinEngine.applyResult()` being called?

#### ❌ Issue #2: Backend unavailable fallback
- **Location**: index.html line 2470-2478 (KinEngine.handle)
- **Code**: 
```js
if(window.EconomyAPI){
  try{
    const result = await EconomyAPI.record(raw);
    return this.applyResult(result, raw);
  } catch(e) {
    const canFallback = /Unknown POST action|Sheet missing|Failed to fetch|offline/i.test(msg);
    if(!canFallback) return {ok:false, error:msg};
  }
}
```
- **Problem**: If `EconomyAPI.record()` fails with unexpected error, it returns `{ok:false,error:msg}` which the shell then sends back
- **Check**: Is Code.gs responding to `recordKinetikEvent` action?

#### ❌ Issue #3: App not properly embedded
- **Location**: Buddy app line 1040
- **Code**: `const embedded = (()=>{try{return window.self!==window.top}catch(e){return true}})()`
- **Problem**: If Buddy is opened as standalone (not in iframe), `Bridge.request()` returns null
- **Check**: Is Buddy being opened in iframe or as new window?

#### ❌ Issue #4: reqId mismatch
- **Location**: Shell line 4432, 4449; Buddy line 1046, 1057
- **Problem**: `reqId` format might not match between send/reply
- **Shell sends**: `reqId=m.reqId` (from incoming message)
- **Buddy sends**: `reqId=APP_ID+"_"+(++this.rid)` (e.g., "kinetik-buddy_1")
- **Check**: Verify reqId format consistency

#### ❌ Issue #5: Missing circleId in Buddy request
- **Location**: Buddy line 1522-1528
- **Code**:
```js
Bridge.request("KINETIK_EVENT", {
  eventType: "diamond.gift",
  amount,
  personId,
  circleId: CTX.circleId,  // ← Is CTX.circleId populated?
  sourceRecordId,
  metadata: {...}
});
```
- **Problem**: If `CTX.circleId` is not set or is "standalone", the shell might reject it
- **Check**: Is Buddy receiving proper INIT_APP context?

---

## FIXES (Priority Order)

### 🔴 FIX #1: Enable Browser Console Logging

**Add to Buddy app** (App_ProductivityPoll.html, after line 1057):

```js
addEventListener("message", e => {
  const m = e.data || {};
  console.log("[Buddy Bridge] Received:", m.type, m);  // ← ADD THIS
  if (m.type === "INIT_APP" && m.payload) applyKinetikContext(m.payload);
  if (m.type === "KINETIK_ECONOMY_SNAPSHOT_RESULT") {
    applyEconomySnapshot(m.payload);
    if (m.reqId && Bridge.reqs[m.reqId]) {
      const f = Bridge.reqs[m.reqId];
      delete Bridge.reqs[m.reqId];
      f(m.payload);
    }
  }
  if (m.type === "KINETIK_EVENT_RESULT" && m.reqId && Bridge.reqs[m.reqId]) {
    console.log("[Buddy Bridge] Resolving request", m.reqId, "with result:", m.result);  // ← ADD THIS
    const f = Bridge.reqs[m.reqId];
    delete Bridge.reqs[m.reqId];
    f(m.result);
  }
});
```

**Add to shell** (index.html, around line 4431):

```js
addEventListener("message", e => {
  const m = e.data || {};
  console.log("[Shell Bridge] Received from app:", m.type, m.appId);  // ← ADD THIS
  const reply = p => {
    console.log("[Shell Bridge] Replying to", m.appId, "with", p.type, p.result);  // ← ADD THIS
    try {
      $("#appFrame").contentWindow.postMessage(p, "*");
    } catch (x) {}
  };
  // ... rest of handler
});
```

**Action**: Run these in browser dev tools (F12 → Console) → tap gift button → share logs

### 🟡 FIX #2: Add Null-Safety Check in Shell

**Location**: index.html line 4448, inside KINETIK_EVENT handler

**Current code**:
```js
else if(m.type==="KINETIK_EVENT"){
  KinEngine.handle(m).then(result=>{
    reply({type:"KINETIK_EVENT_RESULT",reqId:m.reqId,result});
  }).catch(err=>{
    reply({type:"KINETIK_EVENT_RESULT",reqId:m.reqId,result:{ok:false,error:String(err&&err.message||err)}});
  });
}
```

**Fixed code**:
```js
else if(m.type==="KINETIK_EVENT"){
  KinEngine.handle(m).then(result=>{
    const safeResult = result || {ok:false,error:"No response from KinEngine"};
    console.log("[Shell] KINETIK_EVENT result:", safeResult);
    reply({type:"KINETIK_EVENT_RESULT",reqId:m.reqId,result:safeResult});
  }).catch(err=>{
    const errMsg = err && err.message ? err.message : String(err);
    console.error("[Shell] KINETIK_EVENT error:", errMsg);
    reply({type:"KINETIK_EVENT_RESULT",reqId:m.reqId,result:{ok:false,error:errMsg}});
  });
}
```

### 🟡 FIX #3: Verify Buddy Receives Context

**Location**: App_ProductivityPoll.html line 1052

**Current**:
```js
if(m.type==="INIT_APP"&&m.payload)applyKinetikContext(m.payload);
```

**Enhanced** (add logging):
```js
if(m.type==="INIT_APP"&&m.payload){
  console.log("[Buddy] INIT_APP payload:", m.payload);
  applyKinetikContext(m.payload);
  console.log("[Buddy] CTX after init:", CTX);
}
```

---

## Integration Plan: 8-App Priority Ecosystem

### Core Diamond Flow

```
App emits event
  ↓
Bridge.request("KINETIK_EVENT", {eventType, appId, personId, amount, metadata})
  ↓
Shell receives → KinEngine.normalize() → KinEngine.handle()
  ↓
Shell applies rules: cap check, daily limit, anti-farming
  ↓
Shell replies with: {ok, event, diamond:{amount}, buddy:{level, diamonds}, action}
  ↓
App receives result → updates local wallet → shows toast/animation
  ↓
Shell stores to localStorage (then syncs to Code.gs background)
  ↓
Kinetik Buddy reads state → shows updated diamonds/leaderboards
```

---

## App Integration Checklist

### ✅ 1. Kinetik Buddy (Hub) — App_ProductivityPoll.html

**Current Status**: 85% complete

**Emissions**:
- ✅ `buddy.quest.completed` (12 dmd, for daily quests)
- ✅ `diamond.gift` (leader gift 10-100 dmd)

**Spending**:
- ✅ Shop (cosmetics, species, auras, rooms, orbs)
- ❌ No backend sync for purchases
- ❌ Quests not fully implemented

**To Fix**:
1. ✅ Debug gift "failed to send" error (use FIX #1-3 above)
2. ❌ Add `spendDiamond` action to Code.gs
3. ❌ Implement Buddy quest system
4. ❌ Add Buddy state sync to backend

**Files to change**:
- App_ProductivityPoll.html (fix gift logic + console logs)
- index.html (add shell reply logging)
- Code.gs (add spendDiamond + diamond_ledger sheet)

---

### ✅ 2. Home Quest — App_GameChoreQuest.html

**Current Status**: 95% complete

**Emissions**:
- ✅ `task.completed` (0 dmd, pending)
- ✅ `task.approved` (8 dmd, leader-approved)

**Mapping**:
- ✅ Kids list to circle people
- ✅ Chore ID to sourceRecordId (prevents dups)

**To Verify**:
1. ✅ Events emit correctly
2. ✅ Shell capping works (80 dmd/day for approvals)
3. ⚠️ Pending state UI (show "awaiting parent approval")

**Files to change**: None (complete)

---

### ✅ 3. Times Table Quest — App_ProductivityTimesTableQuest.html

**Current Status**: 95% complete

**Emissions**:
- ✅ `practice.completed` (3 dmd, max 12, cap 45/day)
- ✅ `mastery.unlocked` (15 dmd, max 40, cap 80/day)

**Mapping**:
- ✅ Session ID to sourceRecordId
- ✅ Metadata includes skill, score, streak, duration

**To Verify**:
1. ✅ Daily chest system
2. ⚠️ Wallet display accuracy
3. ⚠️ XP → Buddy level calculation

**Files to change**: None (complete)

---

### ✅ 4. Primary Quest — App_ProductivityCambridgePrimary.html

**Current Status**: 95% complete

**Emissions**:
- ✅ `practice.completed` (3 dmd)
- ✅ `mastery.unlocked` (15 dmd)

**Mapping**:
- ✅ Objective ID to sourceRecordId
- ✅ Subject + masteryLevel in metadata

**To Verify**:
1. ✅ Curriculum progression
2. ✅ Objective unlock rewards

**Files to change**: None (complete)

---

### ✅ 5. Circle Chess — App_GameCircleChess.html

**Current Status**: 95% complete

**Emissions**:
- ✅ `practice.completed` (3 dmd, for lessons mode)
- ✅ `mastery.unlocked` (15 dmd, for objectives/crowns)
- ✅ `game.round.completed` (2 dmd)
- ✅ `game.win` (8 dmd) **⚠️ Spec says 5, not 8**

**Mapping**:
- ✅ Match ID to sourceRecordId
- ✅ Move count in metadata

**Discrepancy**:
- Spec: `game.win` → 5 dmd, max 15/event, daily cap 35
- Actual: 8 dmd per win
- **Impact**: User can earn 40 dmd/day if they win 5 times (over spec cap of 35)

**To Fix**:
1. ⚠️ Decide: reduce to 5 dmd OR update spec to document 8 dmd boost
2. ✅ Verify capping logic handles 8 dmd correctly

**Files to change**: App_GameCircleChess.html (line ~486, reduce winDiamonds from 8 to 5)

---

### ✅ 6. Choice Trail (Ladder & Snake) — App_GameLadderRush.html

**Current Status**: 95% complete

**Emissions**:
- ✅ `game.round.completed` (2-8 dmd, scaled by correct answers)
- ✅ `game.win` (8 dmd) **⚠️ Same issue as Chess**

**Mapping**:
- ✅ Round ID + timestamp
- ✅ Correct answer count in metadata

**To Fix**:
1. ⚠️ Decide on game.win amount (5 or 8)
2. ✅ Verify round scaling is intentional (not farming)

**Files to change**: App_GameLadderRush.html (line ~491, 494)

---

### ⚠️ 7. Circle Spinner (Fortune Wheel) — App_GameLuckySpin.html

**Current Status**: 90% complete

**Emissions**:
- ✅ `game.round.completed` (2-8 dmd, scaled by player score)
- ✅ `game.win` (8 dmd) **⚠️ Same issue**

**Mapping**:
- ✅ Spinner ID + timestamp
- ✅ Score + mode in metadata

**Issues**:
1. Reward scaling not in spec (can give up to 8 dmd per round)
2. game.win is 8 (should be 5?)
3. Spec says: "Circle Spinner = randomizer, keep reward-neutral"

**To Fix**:
1. ❌ Document reward scaling design intent
2. ⚠️ Consider capping round at 5 dmd (not scaled)
3. ⚠️ Move from Play to Circle energy? (spec says Circle)

**Files to change**: App_GameLuckySpin.html (line ~545-546, review reward logic)

---

### ⚠️ 8. Emoji Party — App_GameEmojiParty.html

**Current Status**: 85% complete

**Emissions**:
- ✅ `game.round.completed` (2 dmd)
- ❌ `game.win` (NOT emitted, should be!)

**Mapping**:
- ✅ Emoji round ID + timestamp
- ✅ Score, players, winner in metadata

**Missing**:
- No reward for winner (only tiny round reward)
- Should emit `game.win` event for top scorer

**To Add**:

```js
// Line ~863 in Emoji Party, after emitting round event:
const winner = ranked[0];
if (winner && winner.name && /* player is the winner */) {
  Bridge.send('KINETIK_EVENT', {
    eventType: 'game.win',
    personId: Bridge.ctx.personId,
    sourceRecordId: sourceRecordId + '-win',
    amount: 5,
    metadata: {
      title: 'Emoji Party win',
      mode: G.mode,
      winner: winner.name,
      score: winner.score
    }
  });
}
```

**Files to change**: App_GameEmojiParty.html (add winner event)

---

## Unified Reward Map

### By App (sorted by energy)

| App | Event | Default | Max | Daily Cap | Energy |
|---|---|---|---|---|---|
| **Buddy** | buddy.quest.completed | 12 | 35 | 80 | Care |
| **Buddy** | diamond.gift | 10 | 100 | 500 | Circle |
| **Home Quest** | task.completed | 0 | 0 | 0 | Care |
| **Home Quest** | task.approved | 8 | 30 | 80 | Care |
| **Times Table** | practice.completed | 3 | 12 | 45 | Growth |
| **Times Table** | mastery.unlocked | 15 | 40 | 80 | Growth |
| **Primary Quest** | practice.completed | 3 | 12 | 45 | Growth |
| **Primary Quest** | mastery.unlocked | 15 | 40 | 80 | Growth |
| **Chess** | practice.completed | 3 | 12 | 45 | Growth |
| **Chess** | mastery.unlocked | 15 | 40 | 80 | Growth |
| **Chess** | game.round.completed | 2 | 8 | 30 | Play |
| **Chess** | game.win | 8* | 15 | 35 | Play |
| **Choice Trail** | game.round.completed | 2-8* | 8 | 30 | Play |
| **Choice Trail** | game.win | 8* | 15 | 35 | Play |
| **Spinner** | game.round.completed | 2-8* | 8 | 30 | Circle |
| **Spinner** | game.win | 8* | 15 | 35 | Circle |
| **Emoji** | game.round.completed | 2 | 8 | 30 | Play |
| **Emoji** | game.win | (missing) | 15 | 35 | Play |

*Marked with \* = discrepancy from spec (needs review)

### Spec vs. Implementation Issues

| App | Issue | Spec | Actual | Status |
|---|---|---|---|---|
| Chess | game.win amount | 5 | 8 | ⚠️ 60% over |
| Choice Trail | game.win amount | 5 | 8 | ⚠️ 60% over |
| Choice Trail | round scaling | 2 | 2-8 | ⚠️ 300% variable |
| Spinner | energy | Circle | Circle | ✅ OK |
| Spinner | round scaling | 2 | 2-8 | ⚠️ Undocumented |
| Emoji | game.win | should emit | missing | ❌ Missing |

---

## Spending Backend (Not Yet Implemented)

### Current Shop (Frontend Only)

Buddy app has a working cosmetics shop with items costing 15-150 diamonds. **These do NOT sync to backend yet.**

### Required Backend Changes (Code.gs)

#### 1. Add Sheets

```
diamonds_ledger
├── id
├── circleId
├── personId
├── transactionType (earned, spent, gifted, refunded)
├── amount
├── sourceRecordId (links to app transaction)
├── itemId (if purchase)
├── reason (metadata)
├── createdAt
└── syncedAt
```

#### 2. Add Action: spendDiamond

```js
function spendDiamond(circleId, personId, amount, itemId, reason) {
  // 1. Get current person wallet
  const wallet = getPersonDiamonds(circleId, personId);
  
  // 2. Check balance
  if (wallet.balance < amount) {
    return { ok: false, error: "Insufficient diamonds" };
  }
  
  // 3. Create ledger entry
  const ledgerId = Utilities.getUuid();
  const ledger = {
    id: ledgerId,
    circleId, personId, amount,
    transactionType: "spent",
    itemId: itemId || "",
    reason: reason || "",
    createdAt: new Date().toISOString()
  };
  
  // 4. Write to sheet + aggregate
  appendRow("diamonds_ledger", [
    ledgerId, circleId, personId, "spent", amount, 
    "", itemId, reason, new Date().toISOString(), ""
  ]);
  
  return {
    ok: true,
    ledgerId,
    newBalance: wallet.balance - amount,
    item: itemId
  };
}
```

#### 3. Add Sheet Columns

- `CircleMembers` add `diamonds_balance` (cache)
- `AgentLogs` add `transaction_type` (earned/spent/gifted)

---

## Implementation Order

### Phase 1: Fix Gift Error (This Week)

1. ✅ Add console logging (FIX #1)
2. ✅ Test gift button + share logs
3. ✅ Fix shell reply null-safety (FIX #2)
4. ✅ Verify CTX.circleId is populated (FIX #3)
5. ✅ Confirm Code.gs `recordKinetikEvent` is deployed

### Phase 2: Standardize Game Rewards (This Week)

1. ⚠️ Decide game.win amount (5 or 8 dmd)
2. ✅ Update Chess, Choice Trail, Spinner if needed
3. ✅ Add Emoji Party game.win event
4. ✅ Document reward scaling rationale

### Phase 3: Backend Spending (Next Week)

1. ❌ Add `diamonds_ledger` sheet to Code.gs
2. ❌ Implement `spendDiamond` action
3. ❌ Add purchase persistence to Buddy shop
4. ❌ Wire Buddy cosmetics to backend

### Phase 4: Complete Buddy Integration (Next Week)

1. ❌ Implement full Buddy quest system
2. ❌ Link quest rewards to event emissions
3. ❌ Add Buddy state persistence
4. ❌ Sync Buddy mood/reactions to events

---

## Success Criteria

### Phase 1 ✅
- [ ] Leader can gift diamonds without "failed to send" error
- [ ] Toast shows "Gifted 25 💎 to Sarah ✓"
- [ ] Recipient's wallet updates
- [ ] Event logged to backend

### Phase 2 ✅
- [ ] All 8 apps emit consistent, spec-compliant events
- [ ] Game rewards match agreed amounts (5 or 8 dmd for wins)
- [ ] Emoji Party includes winner reward
- [ ] No daily cap overruns possible

### Phase 3 ✅
- [ ] Buddy purchases sync to backend
- [ ] Cosmetics persist across sessions
- [ ] Diamond spend ledger auditable
- [ ] Purchase receipts stored

### Phase 4 ✅
- [ ] Buddy quests generate daily
- [ ] Quests link to app completion
- [ ] Buddy mood updates from events
- [ ] Full state sync to backend

---

## Files to Modify

| Priority | File | Change | Lines | Effort |
|---|---|---|---|---|
| 🔴 1 | App_ProductivityPoll.html | Fix gift logic + logs | 1045-1057 | 15 min |
| 🔴 1 | index.html | Add shell logs + null-safety | 4447-4453 | 15 min |
| 🔴 1 | Code.gs | Verify recordKinetikEvent deployed | varies | 5 min |
| 🟡 2 | App_GameCircleChess.html | Reduce game.win to 5 dmd | ~486 | 5 min |
| 🟡 2 | App_GameLadderRush.html | Reduce game.win to 5 dmd | ~494 | 5 min |
| 🟡 2 | App_GameLuckySpin.html | Document/adjust round scaling | ~545 | 10 min |
| 🟡 2 | App_GameEmojiParty.html | Add game.win for winner | ~863 | 10 min |
| 🟢 3 | Code.gs | Add spendDiamond + ledger | varies | 2 hrs |
| 🟢 4 | App_ProductivityPoll.html | Implement quest system | varies | 4 hrs |
| 🟢 4 | index.html | Buddy sync integration | varies | 3 hrs |

---

## Next Steps

1. **This session**: Apply FIX #1-3, test gift button, share console logs
2. **Next session**: Standardize game rewards, add Emoji win event
3. **Following**: Implement backend spending + quest system
4. **Target**: Full 8-app ecosystem live in 1 week

