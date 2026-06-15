# KINETIK APP BUILD STANDARD — v1.0 (mandatory)

> Hand this whole file to any LLM before it builds a Kinetik app.
> An app that does not meet **§1 (single file)** and **§2 (manifest header)** will
> NOT be digested by the Kinetik Store and will be ignored.

Kinetik is a private life app for **Family + Friends circles**. Apps are tiny,
self-contained mini-apps the Store installs **per circle**. They open full-screen
inside the main shell (in an iframe) and can also run standalone.

---

## §1. One app = one self-contained HTML file (HARD REQUIREMENT)
- Exactly one file, named **`App_<Name>.html`** (PascalCase, no spaces). Examples:
  `App_PadelAmericano.html`, `App_Chess.html`, `App_CodeClash.html`.
- Everything inline: HTML + CSS + vanilla JS in the one file. **No build step, no
  frameworks, NO CDNs, no external dependencies.** (CDNs get blocked by tracking
  prevention and break offline — draw any visuals with inline SVG.)
- Must work by simply opening the file (`file://`) with no server.
- Hide visible scrollbars while keeping touch/mouse scroll working
  (`scrollbar-width:none` + `::-webkit-scrollbar{display:none}`).
- Light mode is the DEFAULT; support a basic dark mode. Pixel-polished: no squeezed
  layouts, no text overflow, no overlap. Verify mentally at 390px width.

## §2. The manifest header (HARD REQUIREMENT — this is what the Store reads)
Place this **once, inside `<head>`**, right after `<title>`. The Store fetches the
file, extracts this block, and builds the catalog entry from it. If it is missing or
invalid JSON, the app is skipped.

```html
<script type="application/kinetik-app+json">
{
  "appId": "code-clash",
  "name": "Code Clash",
  "shortName": "CodeClash",
  "icon": "⚡",
  "gradient": ["#7dd3fc", "#a78bfa"],
  "category": "games",
  "tagline": "Race to crack the code.",
  "about": "A fast head-to-head puzzle game for the circle. Quick rounds, pass-and-play, live leaderboard.",
  "audience": "all",
  "circleTypes": ["family", "friends"],
  "worksWith": ["standalone"],
  "status": "live",
  "minMembers": 2
}
</script>
```

### Field rules
| Field | Required | Rule |
|-------|----------|------|
| `appId` | ✅ | kebab-case, globally unique, stable forever (used as install key). |
| `name` | ✅ | Display name. |
| `shortName` | – | ≤12 chars; defaults to `name`. Shown under the home-grid icon. |
| `icon` | ✅ | A single emoji **or** an inline `<svg>…</svg>` string. **Embedded in the app — never an external file.** |
| `gradient` | ✅ | `[from, to]` hex pair — the icon tile + featured banner. |
| `category` | ✅ | exactly one id from **§6**. |
| `tagline` | ✅ | ≤40 chars, one line. |
| `about` | ✅ | 1–3 sentences for the product page. |
| `audience` | – | `all` \| `kids` \| `adults` (default `all`). |
| `circleTypes` | ✅ | array of `family` and/or `friends` — who may install. |
| `worksWith` | ✅ | array of `calendar` \| `moments` \| `media` \| `offline` \| `standalone`. |
| `status` | – | `live` \| `soon` (default `live`). |
| `minMembers` | – | integer; for apps needing players (default 1). |

**Do NOT include `rating` or `version`** — Kinetik does not use them.

## §3. Register the file (zero hand-editing — no apps.json)
A browser can't list a folder at runtime, so the catalog is generated at build time.
`node build_apps.mjs` scans every `App_*.html`, reads its manifest, and rewrites the
embedded `BUILTIN_APP_CATALOG` inside `index.html` (between the `KINETIK_APPS` markers).
The GitHub Action reruns it on every push that touches an `App_*.html`.

**Add an app:** drop `App_<Name>.html` → run `node build_apps.mjs` (or just push).
It appears in the Store, fully categorized. Nothing else to edit.

## §4. Embedded vs standalone
The shell loads the app in an iframe. Detect it and adapt:
```js
if (window.self !== window.top) document.body.classList.add('embedded');
```
- **Embedded:** fill the iframe (`100%`/`100dvh`), no fake phone frame, no app-level
  bottom tab bar that competes with the shell. The shell already provides the
  back/Done chrome.
- **Standalone:** may show its own framing.

## §5. AppBridge — talk to the shell via postMessage (optional but standard)
On load the shell posts an init message; listen for it:
```js
addEventListener('message', (e) => {
  const m = e.data || {};
  if (m.type === 'INIT_APP') {
    const ctx = m.payload; // {circleId, circleType, personId, role, theme,
                           //  appId, backendMode, apiUrl, people:[{id,name,color}]}
    applyTheme(ctx.theme);            // 'light' | 'dark' — honor it
    // seed players from ctx.people, etc.
  }
});
```
Messages the app may POST back to `window.parent` (all optional):
| type | purpose |
|------|---------|
| `SHOW_TOAST` `{message}` | toast in the shell |
| `CLOSE_APP` | ask the shell to close the app |
| `ADD_TO_CALENDAR` `{payload:{title,date,startTime,endTime,participantPersonIds,preparation}}` | create a calendar event in the circle |
| `DATA_LIST/DATA_CREATE/DATA_UPDATE/DATA_REMOVE` `{reqId,appId,collection,payload,id}` | persist app data in the circle's `AppRecords`; shell replies `DATA_RESULT {reqId,items}` |

If the app stores nothing in the circle (pure game), it can ignore the bridge and
just use `localStorage` keyed by a unique prefix.

### Required local data convention
- Define one `const storagePrefix = "kinetik_<appId>_"` and key **all** localStorage
  under it. Keep data structures simple and flat so a future Circle/DB sync is trivial.
- Provide a tiny helper:
  ```js
  const Bridge = {
    embedded: window.self !== window.top,
    send(type, payload){ if(this.embedded) parent.postMessage({type, payload}, "*"); }
  };
  ```
- Show clear **states**: empty · active · success · mistake · completed. Surface local
  progress (score, streak, reps, saved items, history).

## §6. Categories — exactly FIVE, set by the filename
The category comes from the **filename prefix**: `App_<Category><Name>.html`.
Allowed: **Game · Sport · Productivity · Social · Entertainment**
(ids `games` · `sports` · `productivity` · `social` · `entertainment`).
Examples: `App_GameCircleChess.html` → games · `App_SportPadel.html` → sports ·
`App_ProductivityPoll.html` → productivity. The filename prefix **overrides** the
manifest `category`, so renaming a file reclassifies it. Anything unrecognized
falls back to `productivity`.

## §7. Look & feel (so it feels native to Kinetik)
- **Light mode is the default**; support dark via the `theme` from INIT_APP (and/or a
  toggle). Use CSS variables for colors.
- Respect safe areas: `env(safe-area-inset-top/bottom)`; root height `100dvh`.
- Mobile-first, fluid up to ~560px content width; touch targets ≥44px.
- Calm, glassy, rounded (radius 16–28). Gradient accents from the app's own palette.
- No external trackers, no ads, no network calls except the shell bridge / declared CDN.

## §8. Pre-submit checklist
- [ ] Single `App_<Name>.html`, opens with no server.
- [ ] Valid manifest header in `<head>` (no rating/version).
- [ ] `appId` unique + stable; `category` from §6; `icon`, `gradient`, `tagline`, `about` set.
- [ ] Ran `node build_apps.mjs` (or pushed so the Action regenerates the catalog).
- [ ] Detects `embedded` and fills the iframe cleanly.
- [ ] Honors `theme` from INIT_APP; light default; safe-area aware.
- [ ] Works offline (or degrades gracefully); no ads/trackers.

---

## §10. Batch DNA architecture (build many apps, consistently)

Every app belongs to a reusable **DNA family**: same layout logic, component system,
interaction pattern, local-progress system, manifest structure, and visual quality —
only the *content* (lessons, drills, questions, formulas, scenarios) changes. Pick the
family first, then swap content. This is how the catalog scales fast while staying
consistent. **Build one app at a time** unless explicitly asked for a batch.

| # | DNA family | Core loop | Pattern refs |
|---|-----------|-----------|--------------|
| 1 | **Store / Shell** | browse → app detail → install/open/uninstall → launch | App Store, iOS Home, TestFlight |
| 2 | **Game** | start round → move/guess → feedback → score/streak → rematch | Chess.com, Wordle, Mastermind, Jackbox |
| 3 | **Kids Quest** | tiny lesson → question → instant feedback → streak → next | Duolingo, Khan Kids, Brilliant, ScratchJr |
| 4 | **Sports Technique** | choose skill → visual cue → drill → mark rep → streak | Nike Training, HomeCourt, SwingVision |
| 5 | **Workout Coach** | pick workout → timer rounds → work/rest → finish summary | Apple Fitness, F45, Seconds Timer |
| 6 | **Music Coach** | pick skill → visual pattern → practice rep → confidence → streak | Yousician, Simply Guitar, Fender Play |
| 7 | **Life Utility** | preset/list → add/edit/check off → save → repeat | AnyList, Bring!, Tasty, Reminders |
| 8 | **Social Circle** | create prompt → options → vote/respond → result → share | Doodle, StrawPoll, Slido, Jackbox |
| 9 | **Professional Learning** | micro lesson → scenario → quiz/decision → explain → path | Coursera, Brilliant, DataCamp |
| 10 | **Scenario Coach** | principle → realistic scenario → choose response → feedback → next | Orai, Speeko, ELSA, MasterClass |
| 11 | **Founder / Wisdom** | principle card → business scenario → decision → reflection → saved insight | Blinkist, Headway, MasterClass |
| 12 | **Engineering Calculator** | choose calc → inputs+units → result → explanation → save case | Engineering Toolbox, PetroWiki |

Engineering calculators: **label as educational/planning tools** unless the formulas
and units are professionally verified.

## §11. Premium design direction (App-Store quality)

Feel: iPhone-native, premium, calm-but-fancy, Ultrahuman-grade polish. More product
than website. Minimal but not plain. Do NOT copy brand assets — clone the *interaction
quality, hierarchy, and product feel*.

- Compact iOS-style header (icon + name + circle/status subtitle).
- Premium gradient app tiles; inline-SVG icon marks (no emoji-only where polish matters).
- Rounded panels used sparingly — not nested cards everywhere. Subtle shadows, glass,
  borders, depth. Strong, consistent spacing rhythm. Large tap targets.
- Components to reach for: status chips, metric cards, progress rings, segmented
  controls, bottom action bars, and an inline-SVG visual for *every* app.
- States are mandatory: empty · active · success · warning · completed.
- Fit everything on a 390px phone: clamp, line-clamp, overflow handling. No squeeze,
  no overflow, no overlap, no broken empty states.
- Light default + dark template. Hidden scrollbars, scrolling still works.

## §12. Per-app build process & output
1. Identify the DNA family. 2. Concise build plan. 3. Define the core loop.
4. Minimum useful 80-20 feature set. 5. Future scalability points. 6. Design UI first.
7. Implement the complete standalone HTML. 8. Include sample data so it works instantly.
9. Mentally test at 390px. 10. No overflow/squeeze/broken states. 11. End with: app
loop, storage keys, future scalability path.

Output order: build plan → DNA family → core loop → complete HTML (one block) →
scalability notes.
