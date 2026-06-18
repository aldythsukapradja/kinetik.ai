# KINETIK APP BUILD STANDARD - v1.1

> Hand this file to any external builder or LLM before it creates a Kinetik app.
> The goal is simple: build anywhere, then drop the finished HTML file back into
> Kinetik with almost no porting work.

Kinetik is a private app world for family and friends circles. Apps are small,
self-contained experiences that install per circle, open inside the Kinetik shell,
and can also run by themselves during external development.

For Buddy, diamonds, `@kin`, Moment Studio, cross-app actions, and future LLM
behavior, read `KINETIK_AGENT_SYSTEM.md` before changing app behavior.

## 1. The Non-Negotiables

- One app is one HTML file.
- File name must be `App_<Category><Name>.html`.
- The app manifest lives inside that HTML file.
- The app icon lives inside that manifest as inline SVG.
- No extra app manifest files, icon files, app JSON files, or server launcher files.
- The app must open standalone from the file itself.
- The app must also behave cleanly when embedded in the Kinetik iframe.
- The shell owns the PWA/home-screen identity. Individual apps do not add their own
  PWA manifests unless the app is an approved specialized sidecar.

## 2. File Naming

Use this exact pattern:

```text
App_<Category><Name>.html
```

Allowed category prefixes:

| Prefix | Store category |
|---|---|
| `App_Game...` | Games |
| `App_Sport...` | Sports |
| `App_Productivity...` | Productivity |
| `App_Social...` | Social |
| `App_Entertainment...` | Entertainment |

Examples:

```text
App_GameCircleChess.html
App_ProductivityGrocery.html
App_SportPadelAcademy.html
App_EntertainmentCinema.html
```

The filename category wins over the manifest category. Renaming the file can change
where the app appears in the Store.

## 3. Manifest Header

Place this once in `<head>`, right after `<title>`.

```html
<script type="application/kinetik-app+json">
{
  "appId": "code-clash",
  "name": "Code Clash",
  "shortName": "Clash",
  "icon": "<svg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg' aria-hidden='true' fill='none' stroke='white' stroke-width='4.6' stroke-linecap='round' stroke-linejoin='round'><path d='M25 18L13 32l12 14M39 18l12 14-12 14'/><path d='M35 14l-8 36'/></svg>",
  "gradient": ["#ec4899", "#8b5cf6"],
  "category": "games",
  "tagline": "Crack the hidden code.",
  "about": "A quick logic duel for the circle. Guess, learn from feedback, and climb the local leaderboard.",
  "audience": "all",
  "circleTypes": ["family", "friends"],
  "worksWith": ["offline", "standalone"],
  "status": "live",
  "minMembers": 1
}
</script>
```

Field rules:

| Field | Rule |
|---|---|
| `appId` | Required. Kebab-case. Stable forever. Used for installs and app data. |
| `name` | Required. Human display name. |
| `shortName` | Recommended. 14 characters or fewer for the Apps grid. |
| `icon` | Required. Inline SVG only. No emoji, no letters, no external image. |
| `gradient` | Required. Two hex colors for the app tile and Store surfaces. |
| `category` | Required. `games`, `sports`, `productivity`, `social`, or `entertainment`. |
| `tagline` | Required. Short, human, one line. |
| `about` | Required. One to three sentences for the Store page. |
| `audience` | `all`, `kids`, or `adults`. Default should be `all`. |
| `circleTypes` | `family`, `friends`, or both. |
| `worksWith` | Any of `calendar`, `moments`, `media`, `offline`, `standalone`. |
| `status` | `live` or `soon`. |
| `minMembers` | Number. Use `1` unless the app truly needs multiple players. |

Do not include `rating`, `version`, `manifestUrl`, `iconUrl`, or external asset paths.

## 4. Icon Standard

Kinetik app icons are foreground marks placed on shell-painted gradient tiles.

Rules:

- Use inline SVG in the manifest.
- Use a transparent SVG background for app icons.
- Use simple symbolic shapes, not text initials.
- Use white as the main stroke/fill so the mark works on the tile gradient.
- Keep the viewBox `0 0 64 64`.
- Do not include external images, base64 PNGs, or icon font references.

The Kinetik shell owns the premium PWA icon and loading icon. App files only own
their own Store/app-grid mark.

## 5. Standalone And Embedded Modes

Every app must run in two modes:

```js
const embedded = window.self !== window.top;
if (embedded) document.body.classList.add("embedded");
```

Standalone mode:

- Useful for building externally.
- Can show a simple app header.
- Can use local sample data.

Embedded mode:

- Fill the iframe.
- No fake phone frame.
- No competing global tab bar.
- Respect the Kinetik theme and safe areas.
- Let the shell provide the back/done chrome.

## 6. Kinetik Bridge

When the app opens in Kinetik, the shell sends context:

```js
addEventListener("message", (event) => {
  const message = event.data || {};
  if (message.type !== "INIT_APP") return;
  const ctx = message.payload;
  // ctx includes:
  // userId, userName, username
  // personId, personName
  // circleId, circleName, circleType
  // role, roleLabel, permission
  // isLeader, isCoLeader, isAdult, isKid, age
  // theme, appId, backendMode, apiUrl
  // people: [{id, name, color, birthYear}]
});
```

Use this helper in every app:

```js
const Bridge = {
  embedded: window.self !== window.top,
  pending: {},
  seq: 0,
  send(type, payload = {}) {
    if (!this.embedded) return;
    window.parent.postMessage({ type, ...payload }, "*");
  },
  request(type, payload = {}) {
    if (!this.embedded) return Promise.resolve({ items: [] });
    const reqId = "req_" + (++this.seq);
    return new Promise(resolve => {
      this.pending[reqId] = resolve;
      window.parent.postMessage({ type, reqId, ...payload }, "*");
    });
  }
};

addEventListener("message", (event) => {
  const message = event.data || {};
  if (message.type === "DATA_RESULT" && Bridge.pending[message.reqId]) {
    Bridge.pending[message.reqId](message);
    delete Bridge.pending[message.reqId];
  }
});
```

Supported messages:

| Message | Purpose |
|---|---|
| `SHOW_TOAST` | Show a shell toast. |
| `CLOSE_APP` | Ask the shell to close the app. |
| `ADD_TO_CALENDAR` | Create a circle calendar event. |
| `DATA_LIST` | Load this app's records from the shell. |
| `DATA_CREATE` | Save a new app record. |
| `DATA_UPDATE` | Update an existing app record. |
| `DATA_REMOVE` | Soft-remove an app record. |
| `KINETIK_EVENT` | Emit a Buddy/diamond/progress event. The shell has a local KinEngine POC; build against this contract now. |

## 7. Data Storage Flow Today

Current backend: Kinetik shell -> Google Apps Script -> Google Sheets.

Apps should not call Google Sheets directly. They talk to the shell.

```text
App interaction
  -> Bridge DATA_CREATE / DATA_UPDATE / DATA_REMOVE
  -> shell DataAPI
  -> local cache in DB.d
  -> SyncEngine queue
  -> Apps Script generic CRUD
  -> Google Sheet row
```

On load:

```text
Google Sheets
  -> Apps Script list
  -> shell DB.load()
  -> DB.d.appRecords
  -> app asks DATA_LIST
  -> shell returns DATA_RESULT
```

Current generic app record shape:

```js
AppRecord {
  id,
  circleId,
  appId,
  collection,
  ownerPersonId,
  payload,
  deleted,
  createdAt,
  updatedAt
}
```

In Google Sheets, `payload` becomes `payloadJson`. Keep payloads plain JSON:

```js
{
  title: "Serve practice",
  status: "done",
  score: 8,
  streak: 3,
  date: "2026-06-18"
}
```

Do not store functions, DOM, blobs, cyclic objects, or huge base64 files in payload.
Media belongs in the shell media flow, not inside app payload JSON.

## 8. Data Storage Flow Later

Future backend: Kinetik shell -> Supabase.

The same app bridge should survive. The app should not care whether the shell writes
to Google Sheets or Supabase.

```text
App
  -> Bridge DATA_*
  -> shell AppData service
  -> Supabase app_records table
```

Expected Supabase table:

```sql
app_records (
  id uuid primary key,
  circle_id uuid,
  app_id text,
  collection text,
  owner_person_id uuid,
  payload jsonb,
  deleted_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
```

Build apps so this future move is boring.

## 9. Collection Naming

Each app can use multiple collections. Keep them short and stable:

```text
sessions
scores
quests
items
lists
attempts
settings
```

Examples:

```js
Bridge.request("DATA_LIST", {
  appId: "times-table-quest",
  collection: "attempts",
  scope: "person"
});

Bridge.request("DATA_CREATE", {
  appId: "times-table-quest",
  collection: "attempts",
  ownerPersonId: true,
  payload: { fact: "7x8", correct: true, ms: 2400 }
});
```

Use `scope: "person"` for personal progress. Use circle-wide records only for shared
objects like grocery lists, match results, or circle leaderboards.

## 10. Buddy And Diamonds

Apps do not directly mutate Buddy. Apps emit events. The complete deterministic
agent map lives in `KINETIK_AGENT_SYSTEM.md`; this section is the app-author
contract.

```js
Bridge.send("KINETIK_EVENT", {
  payload: {
    eventType: "practice.completed",
    appId: "times-table-quest",
    personId: ctx.personId,
    amount: 3,
    sourceRecordId: attempt.id,
    metadata: { skill: "7x8", streak: 4 }
  }
});
```

Approved event types:

| Event | Use |
|---|---|
| `task.completed` | Household task, grocery run, cooking step. |
| `task.approved` | Adult-approved task reward. |
| `practice.completed` | Drill, lesson, rehearsal, sport rep. |
| `mastery.unlocked` | Skill level, crown, objective completion. |
| `game.round.completed` | Casual game round finished. |
| `game.win` | Competitive win, capped. |
| `calendar.created` | Useful plan created. |
| `reflection.saved` | Coaching/wisdom note saved. |
| `buddy.quest.completed` | Buddy quest completed. |

Rules:

- Chores and child rewards need adult approval.
- Randomizers should not mint large rewards.
- Specialized sidecars like World Cup, Strata, and Cinema should not drive the main
  diamond economy unless explicitly designed as seasonal side quests.
- The shell will cap repeat rewards by app, person, and day.

## 11. Cross-App Intents

If an app wants another app to do something, do not hardwire file names. Emit an intent:

```js
Bridge.send("KINETIK_EVENT", {
  payload: {
    eventType: "calendar.created",
    appId: "kitchen-buddy",
    metadata: {
      intent: "send_to_grocery",
      ingredients: ["eggs", "milk", "rice"]
    }
  }
});
```

For now the shell can interpret these deterministically. Later Supabase/agents can use
the same records. Any new intent family should also be added to
`KINETIK_AGENT_SYSTEM.md`.

## 12. UI Quality Bar

Every external app should feel like it belongs inside Kinetik.

- Mobile first at 390px.
- Light mode default.
- Dark mode support via `INIT_APP.theme`.
- Safe-area aware.
- Hidden scrollbars, scrolling still works.
- Clear states: empty, active, success, mistake, completed.
- No layout squeeze, overlap, clipped buttons, or unreadable labels.
- Use icons for tools where possible.
- No visible technical instructions inside the app.
- No ads, trackers, analytics, or surprise network calls.

## 13. DNA Families

Pick one before building:

| Family | Core loop |
|---|---|
| Game | Start round -> action -> feedback -> score -> rematch. |
| Kids Quest | Tiny lesson -> question -> feedback -> streak -> next. |
| Sport Coach | Choose skill -> cue -> drill -> mark rep -> progress. |
| Life Utility | List/preset -> add/edit/check -> save -> repeat. |
| Social Circle | Prompt -> respond/vote -> result -> share. |
| Scenario Coach | Principle -> scenario -> choice -> feedback -> reflection. |
| Learning Lab | Micro lesson -> case -> quiz -> explanation -> mastery. |

## 14. External Build Handoff

When an app is built outside Kinetik, the builder must deliver:

1. One complete `App_<Category><Name>.html`.
2. Manifest block in the head.
3. Inline SVG icon in the manifest.
4. Standalone sample data.
5. Embedded-mode bridge handling.
6. Storage collections used.
7. Buddy/diamond events emitted.
8. Any network dependency disclosed.
9. A short test note: mobile width, standalone, embedded, empty state, saved state.

## 15. Port-Back Checklist

To bring an external app back into Kinetik:

1. Put the file in the repo root.
2. Confirm the filename starts with `App_`.
3. Run:

```bash
node build_app_catalog.mjs
node build_app_catalog.mjs --check
```

On Windows PowerShell, if `npm` is blocked by execution policy, use:

```powershell
npm.cmd run build
npm.cmd run check
```

4. Open Kinetik.
5. Check Store card, GET, OPEN, Remove.
6. Launch the app.
7. Confirm `INIT_APP` context arrives.
8. Confirm `DATA_*` records save and reload.
9. Confirm any `KINETIK_EVENT` creates a shell Buddy pulse and local ledger entry.

## 16. Pre-Submit Checklist

- [ ] One HTML file only.
- [ ] Correct `App_<Category><Name>.html` filename.
- [ ] Manifest is valid JSON.
- [ ] Icon is inline SVG, no text/initials.
- [ ] No external manifest/icon files.
- [ ] Opens standalone.
- [ ] Works embedded.
- [ ] Uses Bridge for shared/circle data.
- [ ] Uses localStorage only for temporary standalone state.
- [ ] Emits Buddy/diamond events only through `KINETIK_EVENT`.
- [ ] Has empty, active, success, mistake, and completed states.
- [ ] Looks good at 390px.
- [ ] Catalog build/check passes.
