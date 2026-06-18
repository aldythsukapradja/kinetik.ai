# KINETIK — Content Sources, Design Directions & Build Strategy

> Research reference for the active build batches.
> Companion to `KINETIK_APP_AUDIT.md` and `APP_BUILD_STANDARD.md`.
> Last updated: 2026-06-17

---

## BUILD RULES (applies to every app below)

- **Built from scratch** — do not copy any existing app file as a starting point.
- **Light theme by default** — `data-theme="light"` on `<html>`, system dark via `prefers-color-scheme` auto-detected on first launch.
- **Each app has a unique landing page design** — layout, hero visual, and colour palette are distinct per app. The engine (deck session, gamification, 5-tab nav) is shared code logic, not copied HTML.
- **No CDN fonts or libraries** — system font stack only, no `@import url(...)`.
- **Manifests required** per `APP_BUILD_STANDARD.md`.
- **Stubs deleted** — all 8 stub files removed 2026-06-17. Every file in this batch is a clean new build.

---

## BATCH #1 — PRODUCTIVITY (COACHING DECK ENGINE)

Engine pattern: 5-tab bottom nav (Today · Learn · Practice · Progress · Me) + daily swipeable deck session + Coaching Signature gamification + streak/XP/mastery/badges. Each app = unique landing design + unique content block.

**Flagship reference:** `App_ProductivityCharisma.html` ✅ (done 2026-06-17) — study for engine logic only, never copy HTML.

---

### 1. Behaviour Coach · `App_ProductivityBehaviour.html`

**Tagline:** Build better loops. Break the ones that hold you back.

**Landing design:**
- Hero: animated **Habit Loop ring** — a circular cue → routine → reward wheel, the active segment glows as you train
- Palette: `--ink:#1a103a` deep plum · `--acc:#7c3aed` violet · `--acc2:#06b6d4` teal · `--bg:#f8f6ff` lavender white
- Layout: Today tab opens with "Your 3 active habits" stacked card list + loop ring + streak; not a hero banner — more of a personal dashboard feel
- Vibe: Fabulous × Noom — clinical calm, behaviour-science authority, warm not cold

| Source | Author | What it contributes |
|--------|--------|---------------------|
| *Atomic Habits* | James Clear | 4 Laws (obvious / attractive / easy / satisfying); identity-based habits; habit stacking; 2-minute rule |
| *Tiny Habits* | BJ Fogg (Stanford) | B = MAP (Motivation × Ability × Prompt); anchor to existing routines; celebrate immediately |
| *The Power of Habit* | Charles Duhigg | Cue → Routine → Reward loop; golden rule of habit change; keystone habits |
| *Unwinding Anxiety* | Judson Brewer (Brown Univ.) | Reward-based learning loops; mindfulness + urge surfing; RAIN technique |
| Cognitive Behavioral Therapy | Beck, Ellis et al. | Cognitive distortions; thought records; behavioural activation; 600+ RCTs |
| *Predictably Irrational* | Dan Ariely | Behavioural economics; choice architecture; why we self-sabotage |

**Pillars:** Build habits · Break loops · Tiny anchors · Cognitive reframe · Environment design · Motivation mechanics

**Drills:** Habit stacking builder · Distortion spotter · 2-min starter · Cue-routine-reward mapper · Identity statement writer

**Scenarios:** Skipping the gym again · Late-night phone scrolling · Stress eating · Procrastination spiral · Losing your temper · Rebuilding a broken streak

**Analogs:** Fabulous · Streaks · Finch · Woebot (CBT-lite) · Noom

---

### 2. Articulation Coach · `App_ProductivityArticulation.html`

**Tagline:** Every word lands. Every pause counts.

**Landing design:**
- Hero: animated **sound waveform** — SVG bars that pulse gently in idle, ripple on interaction
- Palette: `--ink:#2d1a0e` deep espresso · `--acc:#ea580c` burnt orange · `--acc2:#f59e0b` warm amber · `--bg:#fffaf5` warm white
- Layout: Today tab leads with a "Voice Score" donut ring (vocal variety / filler-free / pace) + waveform hero + daily drill CTA; feels like a personal audio coach dashboard
- Vibe: Orai × Speeko — warm, energetic, deeply human; not techy

| Source | Author | What it contributes |
|--------|--------|---------------------|
| *Freeing the Natural Voice* | Kristin Linklater | Breath → resonance → articulation chain; body-based vocal freedom; releasing tension |
| *Set Your Voice Free* | Roger Love | 5 voice qualities: weight, resonance, range, melody, speech rate; practical drills |
| *Talk Like TED* | Carmine Gallo | 9 speaker secrets; passion / novelty / storytelling; the 18-minute rule; rule of three |
| CC Competent Communicator Program | Toastmasters International | 10-speech progression; vocal variety, language, gestures rubric |
| *Cues* | Vanessa Van Edwards | Vocal cues: volume / pace / pitch; how voice signals warmth vs competence |
| Communication Orientation model | Michael Motley (academic) | Reframing nerves: communication mindset vs performance mindset |

**Pillars:** Vocal variety (pitch/pace/volume) · Articulation precision · Filler-free speech · Storytelling flow · Pacing & pause · Resonance & breath

**Drills:** Tongue-twister precision · Filler-word rewrite · Pace mirror · Pause placement · One-sentence story structure

**Scenarios:** Job interview answer · Giving a toast · Explaining a complex idea simply · Disagreeing diplomatically · Cold introduction · Phone call anxiety

**Analogs:** Speeko · Orai · Ummo · Yoodli · GetMee

---

### 3. Presenter Coach · `App_ProductivityPresenter.html`

**Tagline:** Walk on stage. Own the room.

**Landing design:**
- Hero: **stage spotlight** — a dark oval spotlight cone fading from ink to white, with a subtle podium silhouette; the rest of the page is light
- Palette: `--ink:#0f172a` deep navy · `--acc:#2563eb` electric blue · `--acc2:#0ea5e9` sky · `--bg:#f8faff` ice white
- Layout: Today tab = "Stage Ready?" readiness card (skill checklist with progress rings) + next session CTA + spotlight hero; more structured/professional than Charisma
- Vibe: VirtualSpeech × Keynote — authoritative, corporate-sharp, confident

| Source | Author | What it contributes |
|--------|--------|---------------------|
| *Resonate* | Nancy Duarte | The Duarte sparkline: what is → what could be; hero's journey structure; contrast creates tension |
| *Presentation Zen* | Garr Reynolds | Simplicity, restraint, naturalness; one idea per slide; Zen design principles |
| *Talk Like TED* | Carmine Gallo | Storytelling, passion, visual wow; 18-minute rule; rule of three |
| *TED Talks: The Official Guide* | Chris Anderson | Through-line; idea worth spreading; connection before content; show don't tell |
| *Presence* | Amy Cuddy | Reframing anxiety as excitement; power posture; "fake it till you become it" |
| *Presenting to Win* | Jerry Weissman | P²S² method: Point, Proof, Summary, So what; executive attention spans |

**Pillars:** Story structure (Duarte sparkline) · Slide design (one-idea rule) · Delivery (voice/pause/eye) · Nerves → excitement · Opening hooks · Q&A control

**Drills:** Opening-line rewrite · Slide audit · "What could be" contrast builder · Hook generator · Bridging Q&A answers

**Scenarios:** Board pitch · Town hall opener · Client proposal · Job interview · Presenting bad news · Handling a hostile question

**Analogs:** VirtualSpeech · LikeSo · Orai · Toastmasters Timer

---

### 4. Wisdom Coach · `App_ProductivityWisdom.html`

**Tagline:** Think in models. Decide with clarity. Build on purpose.

**Landing design:**
- Hero: **mental model constellation** — dots and connecting lines forming a star-map-like lattice (like Farnam Street's latticework of mental models), subtle parallax on scroll
- Palette: `--ink:#1c1409` rich dark brown · `--acc:#d97706` deep amber · `--acc2:#92400e` burnt sienna · `--bg:#fffbf0` warm parchment
- Layout: Today tab = full-bleed "Model of the Day" card (large serif quote + model name) + constellation preview strip + journal prompt; editorial / book-like, minimal chrome
- Vibe: Farnam Street × Blinkist — timeless, intellectual, warm gold authority

| Source | Author | What it contributes |
|--------|--------|---------------------|
| *The Great Mental Models* (Vol 1–4) | Shane Parrish / Farnam Street | First principles, inversion, second-order thinking, Occam's razor, Hanlon's razor, circle of competence |
| "Elementary Worldly Wisdom" (1994 speech) | Charlie Munger | Multi-disciplinary thinking; latticework of models; avoid psychological biases |
| *Principles: Life and Work* | Ray Dalio | Radical transparency; believability-weighted decisions; Pain + Reflection = Progress |
| *The Psychology of Money* | Morgan Housel | Wealth = what you don't spend; time is the most powerful force; reasonable > rational |
| *Zero to One* | Peter Thiel & Blake Masters | Contrarian bets; secrets; last-mover advantage; distribution > product; power law |
| *The Almanack of Naval Ravikant* | Naval Ravikant (ed. Jorgenson) | Specific knowledge; leverage (code/capital/media); long-term games; compounding |

**Pillars:** Mental models (inversion, first principles) · Decision-making (pre-mortem, probabilistic) · Builder wisdom (Thiel/Naval) · Money psychology (Housel) · Life OS (Dalio)

**Drills:** Invert the problem · Pre-mortem writer · Second-order consequence map · "What would Munger do?" · Own decision journal entry

**Scenarios:** Should I quit my job? · Co-founder conflict · Pricing a product · Saying no to an opportunity · Learning something new fast · Recovering from a big mistake

**Analogs:** Headway · Blinkist · Farnam Street (Knowledge Project) · Moonshots Podcast

---

### 5. Agentic AI · `App_ProductivityAgenticAI.html`

**Tagline:** Understand the agents reshaping everything.

**Landing design:**
- Hero: **agent loop diagram** — animated nodes showing Perceive → Plan → Act → Reflect cycle with flowing arrows between them; subtle pulse on each node
- Palette: `--ink:#0a1628` deep space blue · `--acc:#06d6a0` electric teal · `--acc2:#7209b7` electric violet · `--bg:#f0faf8` mint white
- Layout: Today tab = "Mission Briefing" framing (each session = a mission, framed like a command interface) + loop diagram + daily concept card; sci-fi editorial meets accessible explainer
- Vibe: Brilliant × Wired magazine — curious, futuristic, intellectually exciting but never intimidating

| Source | Author | What it contributes |
|--------|--------|---------------------|
| *Co-Intelligence* | Ethan Mollick (2024) | AI as co-worker / coach / collaborator; practical day-to-day working-with-AI mindset |
| *The Coming Wave* | Mustafa Suleyman (2024) | The technology wave framing; why containment is hard; societal implications |
| *Human Compatible* | Stuart Russell | The alignment problem; why AI needs to be uncertain about human preferences |
| *AI Engineering* | Chip Huyen (O'Reilly 2025) | Full-stack LLM applications; agent architectures; evaluation; tool use; production realities |
| *Artificial Intelligence: A Modern Approach* | Russell & Norvig (4th ed.) | Foundational agent model: Perceive → Plan → Act; environments; rationality |
| Anthropic "Building Effective Agents" guide | Anthropic (2025) | ReAct pattern; reflection; tool use; multi-agent orchestration; when NOT to use agents |

**Pillars:**
1. **Understand Agents** — what makes something agentic vs a chatbot; the autonomy spectrum; agent components (memory / tools / planning / reflection)
2. **Work with AI** — prompting as communication; giving context; iterating; being the best human-in-the-loop
3. **Think with AI** — AI as thought partner; when to trust vs verify; augmentation not replacement
4. **Build with AI** — mental models for AI-powered products: RAG, tool use, orchestration in plain terms
5. **AI & Society** — alignment, safety, economic impact, what's coming next

**Drills:** Spot the agent (chatbot vs agent?), Prompt rewrite (vague → precise context), Design the loop (what tools would an agent need?), Evaluate the output (trust this? why?), Predict the second-order effect

**Scenarios:** Using Claude to research a topic · An AI makes a wrong decision in your pipeline · Evaluating an AI vendor pitch · Explaining AI to a sceptical colleague · Deciding whether to automate a task · AI takes your role — what next?

**Analogs:** Brilliant (concept-first interactive) · Andrej Karpathy's explainer videos · Wes Roth YouTube · Every.to AI coverage

---

## BATCH #2 — QUIZ & DRILL ENGINE

Engine template: `App_ProductivityTimesTableQuest.html` ✅ (done 2026-06-15).
Gamification stack to reuse: hearts (5) · XP · gems · streak · daily ring · shop · crown progression (0→5/node) · boss round · family league.
**Built from scratch** — do not copy TTQ's HTML. Re-implement the engine fresh per app with unique visual design.

---

### 6. Clock Trainer · `App_GameClockTrainer.html`

**Tagline:** Read any clock, anywhere, any time.

**Landing design:**
- Hero: large interactive **analog clock face** on the Today screen — actual playable clock that the user can spin; first lesson starts from the hero
- Palette: warm indigo × soft white × clock-face cream
- Vibe: clean, friendly, school-book meets iOS Clock app

| Analog app | What to borrow |
|-----------|---------------|
| "I Can Tell Time" (iOS) | Structured 50-lesson curriculum from hour-hand basics → any clock; Duolingo pacing |
| Clock Master — Learn Time Fun | 3 difficulty levels + achievements; clear progression |
| Interactive Telling Time | 5 levels (ages 3–12); reward system |
| Math Telling Time Clock Game | Grade-scoped content; MCQ + drag interface |

**Question types:**
- **Drag hands** to a shown digital time (primary — interactive SVG clock face)
- Read analog → choose correct digital
- Elapsed time word problems
- AM/PM sorting
- World clocks boss round (London / New York / Tokyo / Dubai)

**Skill path (5 nodes):** Hours only → Half-hours → Quarters (past/to) → 5-minute precision → Boss (mixed + elapsed + world clocks)

**Key uniqueness:** The interactive SVG drag-clock mechanic is unique to this app. Not a keypad — visual-motor learning. Boss round adds time zones.

**Audience:** Kids 5–10; works as family quiz in league.

---

### 7. Code Philosophy Kids · `App_ProductivityCodePhilosophyKids.html`

**Tagline:** Understand how computers think — no typing required.

**Landing design:**
- Hero: a cartoon **robot on a maze grid** — the robot blinks and waits for instructions, with a simple drag-to-sequence panel below
- Palette: bright coral × sky blue × clean white; playful, not corporate
- Vibe: Code.org × Human Resource Machine — approachable for kids, intellectually satisfying for parents

| Analog app / source | What to borrow |
|--------------------|---------------|
| Scratch (MIT — Seymour Papert) | Constructionist learning; block logic teaches concept before syntax |
| Tynker | Block-based → logical thinking → real code progression |
| Code.org CS Fundamentals | Concept-first curriculum (sequence → loop → condition) |
| Human Resource Machine | Logic trace puzzles; spot bugs; optimise — zero syntax |

**Question types:**
- Spot the logic bug (wrong step in a sequence — logic error, never syntax)
- Trace the loop: how many times does this run?
- Sequence drag-to-order: put robot instructions in the right order
- What does this variable hold after these steps?
- Boolean true/false: does this condition trigger?
- Which algorithm finishes first?

**Skill path (5 nodes):** Sequences → Loops → Conditions (if/else) → Functions → Data & Algorithms

**Key uniqueness:**
- Philosophy cards between questions: CS pioneer story in one sentence (Ada Lovelace, Alan Turing, Grace Hopper, Dijkstra, Tim Berners-Lee)
- Boss round = "The Robot" — sequence a robot through a 5-step maze
- No typing of code ever

**Audience:** Kids 8–14 + parents alongside.

---

### 8. Data Detective · `App_GameDataDetective.html`

**Tagline:** Read the data. Spot the lie. Make the call.

**Landing design:**
- Hero: a live **mini dashboard** on the Today screen — real animated Chart.js charts (bar + line + scatter) cycling slowly; a "Case File" CTA sits on top
- Palette: deep forest green × charcoal × data-viz teal; professional, analytical, confident
- Vibe: Kaggle × detective thriller × Bloomberg Terminal — data-savvy adult, not children's app

**Scope expanded:** Business Intelligence · Data Science · Business Analytics
- BI: dashboards, KPIs, chart types, data storytelling, Tableau/Power BI concepts
- Data Science: EDA, statistics (mean/median/mode/outlier), correlation vs causation, ML intuition
- Business Analytics: A/B testing, conversion funnels, cohort analysis, attribution models, SQL reasoning

| Analog app / platform | What to borrow |
|----------------------|---------------|
| DataLemur | Gamified data puzzles; streak + hints; difficulty tiers; SQL reasoning |
| Data Science & Analytics Quiz (iOS) | "Improve Session" — replay wrong answers; covers ML, stats, SQL, analysis |
| Kaggle Learn | Practical mini-dataset framing; real data context; explanations after answers |
| Khan Academy Statistics | Visual chart explanations; step-by-step stat problems; approachable language |
| Mode Analytics / Tableau Public | Real dashboard patterns to reference for question design |

**Question types (all interactive):**
- Tap the outlier on a live scatter plot (Chart.js rendered inline in the question card)
- Read a trend line → increasing / decreasing / flat / curved?
- Pick the right chart type for this data (bar vs line vs pie vs scatter vs histogram)
- Calculate mean / median / mode from a mini on-screen table
- Spot correlation ≠ causation in a scenario
- "What's wrong with this graph?" (misleading axis, cherry-picked range, missing label)
- A/B test result: which variant wins and is it significant?
- KPI reading: what does this dashboard tell the CEO?
- Boss round — "The Case": 5–6 linked questions about one mini-dataset (BI analyst framing)

**Skill path (5 nodes):**
1. Read a Chart (chart types, axes, labels, trends)
2. Spot the Lie (misleading visualisations, bad statistics)
3. Stats Fundamentals (mean/median/mode/distribution/correlation)
4. Business Analytics (A/B testing, funnels, cohorts, attribution)
5. Data Science & ML Intuition (EDA, feature importance, overfitting, model selection)

**Key uniqueness:**
- Real Chart.js charts embedded inside question cards — player taps the chart to answer
- "The Case" boss round uses one dataset across a full round (BI analyst simulation)
- Covers practical BI/BA tools framing, not just abstract stats

**Audience:** Teens + adults — business analysts, marketers, product managers, data-curious professionals.

---

## SPARK — CROSS-APP AVATAR SYSTEM

> Built after Batch #1. Lives in `index.html`. Every app feeds it gems. Wardrobe shop in profile.

### Character

The orange lightning-bolt mascot (`.mascot` CSS already in TTQ). Promoted to the **global Kinetik companion**. Mood states: Happy (streak ≥ 1) · Excited (boss win/badge) · Sleepy (idle 2 days) · Sad (streak broken).

### Where Spark appears

| Location | How |
|----------|-----|
| Home screen | Spark in profile bubble, top-right; mood reflects streak |
| Circle chat | Mini Spark next to your messages and in member list |
| App completion screens | Full celebration animation after every session, wearing current outfit |
| Profile page | Full display: outfit, level, gem balance, wardrobe entry point |
| Leaderboards | Spark icon next to XP milestones; circle members see each other's |

### Shop catalog

| Category | Items | Price range | Slot |
|----------|-------|-------------|------|
| Hats & headwear | Top hat · crown · grad cap · wizard hat · party hat · beanie · halo | 10–50 💎 | Head |
| Accessories | Shades · monocle · bow tie · scarf · backpack · badge | 8–40 💎 | Face/body |
| Outfits & capes | Hero cape · lab coat · chef set · sports jersey · suit · astronaut suit | 40–100 💎 | Body |
| Effects & auras | Star trail · thunder aura · confetti burst · rainbow glow · shadow clone | 80–160 💎 | Effect |
| Companions (mini pets) | Dragon · fox · robot · cat · alien — floats beside Spark | 120–200 💎 | Companion |
| Expressions / emotes | Dance · wave · flex · thumbs-up · sleep · facepalm | 15–60 💎 | Emote |

### Gem economy — cross-app

| App | Gem triggers | ~Max/day |
|-----|-------------|---------|
| Times Table Quest | Correct +1 · boss win +5 · crown +10 · perfect lesson +3 | 25 💎 |
| Charisma Coach | Session +3 · streak day +2 · badge +5 · insight +1 | 15 💎 |
| Any Coaching Deck app | Session +3 · streak day +2 · drill +1 | 12 💎 |
| Clock Trainer | Correct +1 · boss win +5 · crown +10 | 25 💎 |
| Data Detective | Correct +1 · case solved +6 · boss win +5 | 25 💎 |
| Code Philosophy | Correct +1 · robot maze +5 · crown +10 | 25 💎 |
| Bonuses | 7-day streak +15 · monthly milestone +30 · family league top 3 +20 | — |

**Flow:** App → `{type:"EARN_GEMS", payload:{amount:n}}` bridge → `index.html` master wallet (`kinetik_spark_v1` localStorage) → shop spend.

### Evolution

| Form | Unlocks | Visual | Free reward |
|------|---------|--------|-------------|
| Spark | Start | Default orange-pink, bolt | — |
| Glow | Lv 10 (500 XP) | Star eyes, shimmer | Shades |
| Star | Lv 25 (2 000 XP) | Gold outline, glowing bolt | Crown |
| Blaze | Lv 50 (6 000 XP) | Flame trail | Hero cape |
| Legend | Lv 100 (15 000 XP) | Rainbow aura, unique idle | Dragon companion |

### Technical integration

| Piece | Location |
|-------|----------|
| Master wallet | `index.html` localStorage `kinetik_spark_v1` |
| Gem bridge | All apps post `{type:"EARN_GEMS"}` to shell |
| Spark renderer | Shared CSS class lifted from TTQ into `index.html` |
| Wardrobe sheet | New overlay in `index.html` |
| Circle sync | `Code.gs` deferred — degrades gracefully offline |

---

## ACTIVE BUILD QUEUE

### Batch #1 — Productivity (Coaching Deck engine)

| # | App | File | Palette | Hero visual |
|---|-----|------|---------|-------------|
| 1 | **Behaviour Coach** | `App_ProductivityBehaviour.html` | Violet × teal on lavender white | Habit loop ring (animated cue→routine→reward wheel) |
| 2 | **Articulation Coach** | `App_ProductivityArticulation.html` | Burnt orange × amber on warm white | Sound waveform (animated SVG bars) |
| 3 | **Presenter Coach** | `App_ProductivityPresenter.html` | Electric blue × sky on ice white | Stage spotlight cone (dark oval on light field) |
| 4 | **Wisdom Coach** | `App_ProductivityWisdom.html` | Deep amber × sienna on parchment | Mental model constellation (star-map lattice) |
| 5 | **Agentic AI** | `App_ProductivityAgenticAI.html` | Electric teal × violet on mint white | Agent loop diagram (Perceive→Plan→Act→Reflect nodes) |
| ★ | **Spark Avatar** | `index.html` (new overlay) | — | Master wallet + wardrobe shop |

### Batch #2 — Quiz & Drill engine

| # | App | File | Key mechanic | Audience |
|---|-----|------|-------------|---------|
| 6 | **Clock Trainer** | `App_GameClockTrainer.html` | Drag-hands SVG clock | Kids 5–10 |
| 7 | **Code Philosophy Kids** | `App_ProductivityCodePhilosophyKids.html` | Robot maze boss + philosophy cards | Kids 8–14 |
| 8 | **Data Detective** | `App_GameDataDetective.html` | Chart.js embedded questions + BI/BA scope | Teens + adults |

---

## ENGINE REUSE NOTES

**Coaching Deck:** Each app is built from scratch but shares the same logical pattern — 5-tab nav, daily session deck, coaching signature, gamification. The pattern is in your head; the HTML is new each time. Expect ~3–5h per app for content + unique landing design.

**Quiz/Drill:** Same logical pattern as TTQ — hearts, crowns, XP, boss, league — but fresh HTML. Clock Trainer adds SVG drag-clock (~+1 day). Data Detective adds Chart.js questions (~+1–2 days). Code Philosophy is closest to TTQ in complexity.

**Do not touch:** `App_ProductivityCook.html` · `App_ProductivityCharisma.html` · `App_ProductivityTimesTableQuest.html`
