# Kinetik v2 — Full Screen Concept

**Date**: 2026-06-19  
**Status**: Concept only — no build yet  
**Purpose**: Screen-by-screen product spec for the React + Supabase rebuild  

---

## How to read this document

Each screen entry follows this format:
- **What the user sees** — visual layout description
- **What the user can do** — interactions and affordances
- **Economy / data** — what gets read or written
- **Connects to** — navigation destinations

Screens are organized in user-journey order.

---

## Part 1 — Launch Flow

---

### S-01 · Splash Screen

**Route**: `/` (initial load only, <1.5s)

**What the user sees**:  
Full bleed gradient background (deep navy → midnight blue). The Kinetik wordmark fades in at center with the Buddy character emerging from below — a small glowing orb that becomes the pet avatar. Tagline below: *"Your family, together."* No buttons, no choices. Auto-advances.

**Behavior**:  
- Check Supabase session → if valid, skip to **S-11 Today**
- If no session → advance to **S-02 Welcome**
- Duration: 1.2s, then cross-fade

**Technical note**: The session check happens silently during the animation. The user never sees a loading spinner.

---

### S-02 · Welcome

**Route**: `/welcome`

**What the user sees**:  
Three cards that slide in sequentially (staggered 80ms each):
1. "Built for families, friend groups, and classrooms"
2. "One shared world — calendar, games, moments"
3. "Earn diamonds together through your real life"

Below the cards: two buttons — **"Get started"** (primary) and **"Sign in"** (secondary/link style).

**What the user can do**:
- Swipe cards left/right (cosmetic, not required)
- Tap "Get started" → **S-03 Auth (new user)**
- Tap "Sign in" → **S-03 Auth (returning)**

---

### S-03 · Magic Link Auth

**Route**: `/auth`

**What the user sees**:  
Centered card. Kinetik logo small at top. Single email field with label "Your email". Primary button: "Send my link". Below: "We never use passwords. A link arrives in your inbox."

**What the user can do**:
- Type email and submit → **S-04 Link Sent**
- If returning user with known email (stored in `localStorage`), the field is pre-filled

**What happens**:  
Supabase `signInWithOtp({ email })` is called. No password. No OAuth in v1 (can add later).

**Edge cases**:
- Invalid email format → inline validation, button stays disabled
- Supabase error → "Something went wrong. Try again." (no technical detail shown)

---

### S-04 · Magic Link Sent

**Route**: `/auth/check-email`

**What the user sees**:  
Large envelope illustration (SVG, same style as Buddy). Text: "Check your inbox — we sent a link to **{email}**." Below: "Link expires in 10 minutes." Small link: "Resend" (disabled for 60s after first send, countdown shown).

**What the user can do**:
- Tap the link in their email → lands on `/auth/callback` → Supabase exchanges token → session created → **S-11 Today** (or onboarding if first time)
- Tap "Resend" after cooldown → re-triggers OTP

---

### S-05 · Create Your Circle

**Route**: `/onboarding/circle` (first-time only, after auth)

**What the user sees**:  
Progress indicator (3 steps). Step 1 of 3.  
"What's your circle called?" — text field (e.g., "The Sukapradja Family").  
Below: "What kind of circle?" — four option chips:
- 🏠 Family
- 👥 Friends  
- 🎓 Classroom
- 🏆 Team

**What the user can do**:
- Type a name (required, 2–40 chars)
- Select a circle type (required)
- Tap "Continue" → **S-06 Circle Color**

**Data written**: nothing yet — held in local state until S-07

---

### S-06 · Circle Color

**Route**: `/onboarding/circle/color`

**What the user sees**:  
Step 2 of 3. "Pick your circle's color — it follows you everywhere."  
8 color swatches in a 4×2 grid (rose, orange, amber, lime, emerald, sky, violet, pink). Selected swatch shows a checkmark ring. Preview below: a mini card showing the circle name with the chosen accent applied.

**What the user can do**:
- Tap any swatch to select
- Tap "Continue" → **S-07 Invite**

**Design note**: The accent color becomes `--acc` in the shell. Everything in the app (nav highlights, Buddy glow, diamond counter) takes on this color for this circle. It's the circle's "skin."

---

### S-07 · Invite Members

**Route**: `/onboarding/circle/invite`

**What the user sees**:  
Step 3 of 3. "Who's in your circle?" Two options:
1. **Share link**: a generated invite URL with a copy button and a QR code below (collapsed by default, "Show QR code" toggle)
2. **Add by email**: text field + "Add" button, builds a list of chips below

Below: list of pending invitees. Each chip shows the email and a role selector (Member / Co-leader / Viewer).

Primary button: "Create my circle →"  
Secondary link: "Skip for now, I'll invite later"

**What happens on "Create"**:
1. Create `circles` row (Supabase)
2. Create `circle_members` row for self (role: owner)
3. Send invite emails via Supabase Edge Function for each added email
4. Generate short-lived invite link stored in `circle_invites` table

→ Advances to **S-08 Meet Buddy**

---

### S-08 · Meet Buddy

**Route**: `/onboarding/buddy`

**What the user sees**:  
Full-bleed screen. Buddy character animates in from the bottom — bounces gently. Speech bubble: "Hi! I'm Buddy, your circle companion. I track your circle's energy and keep score of all the great things you do together."

Below bubble: "Every time you learn something, play a game, or tick off a chore — I notice. And I celebrate with diamonds."

Progress dots (3/3). Primary button: "Let's go →"

**What the user can do**: Tap "Let's go" → **S-11 Today** (first time, no history)

---

### S-09 · Accepting an Invite

**Route**: `/invite/{token}` (non-member landing)

**What the user sees**:  
The circle's accent color fills the background. Circle name at top. "**{inviter}** is inviting you to join **{circle name}**." Below: a preview of current members (avatars or initials, max 5). Primary button: "Join circle". If not logged in: "Sign in to join".

**What happens on "Join"**:
- If not authed → **S-03 Auth** with `returnTo=/invite/{token}`
- If authed → create `circle_members` row → **S-11 Today** in that circle's context

---

## Part 2 — Shell

The shell is the persistent container. It renders the 5-tab nav at the bottom, the Kin orb in the center, and the top header. All mini apps render as routes within the shell, not in iframes.

---

### S-10 · Shell Chrome (persistent)

**Always visible** (except onboarding and auth flows)

**Bottom nav** (5 tabs + center orb):
```
[Today]   [Calendar]   [ KIN ]   [Moments]   [Me]
                        (orb)
```

The Kin orb floats slightly above the nav bar, larger than the tabs. It pulses gently in the circle's accent color.

**Top header** (per-screen, not always shown):
- Left: current section title OR back button (if in sub-screen)
- Right: circle switcher (avatar stack if multi-circle) + notification bell

**Circle context bar** (shown on Today and sub-apps):
- Small circle accent chip at top of content area: "{circle name} · {accent}" 
- Tapping opens Circle Switcher modal (**S-35**)

---

## Part 3 — Today Tab

---

### S-11 · Today (Home Dashboard)

**Route**: `/today`

**What the user sees** (scrollable, top to bottom):

**1. Buddy Pulse Bar** (fixed at top of content, below header)  
Horizontal strip in the circle's accent: Buddy avatar (small) + mood emoji + "Level {n} · {xp}/{next_level} XP · {diamonds} 💎". Tapping → **S-31 Buddy World**.

**2. Good Morning Card**  
Time-aware greeting: "Good morning, {first name} 🌤️" or "Good evening". Below: one-line summary generated from today's data: "You have 3 tasks due and a chess game with Mia at 4pm."

**3. Today's Quests** (horizontal scroll)  
Buddy quest cards. Each shows: quest icon (energy color) + short title + progress ring + reward badge ("10 💎 on complete"). Tap → opens the relevant mini app or task.

**4. Circle Energy** (today's contribution)  
6 small energy pills in a row: Care / Growth / Play / Move / Circle / Story. Each shows today's diamond contribution and a fill bar. Tap → **S-32 Energy Detail**.

**5. Today's Routine** (from Calendar)  
Timeline-style cards for today's scheduled routines and events. Each card shows: time, emoji, title, assigned person(s). Overdue items pulse red. Tap → **S-22 Calendar Event Detail**.

**6. Circle Activity Feed** (real-time)  
Recent economy events from circle members: "Mia completed ×8 multiplication tables — +15 💎", "Dad gifted Mia +25 💎 🎁", "Noah won Circle Chess — +8 💎". Updates via Supabase Realtime subscription.

**Connects to**: Buddy World (S-31), Calendar (S-20), any mini app

---

### S-12 · Notification Tray

**Triggered by**: bell icon in header OR swipe down

**What the user sees**:  
Bottom sheet (half-screen). Grouped by type:
- "Buddy" — quest completions, level-ups, mood changes
- "Circle" — gifts received, approvals, member activity
- "Tasks" — chore approvals needed (leaders only), overdue tasks
- "Calendar" — upcoming events, routine reminders

Each notification: icon + text + time ago + optional CTA button ("View", "Approve", "Dismiss").

**Real-time**: Supabase Realtime subscription for `circle_id` channel. Notification badge on bell icon updates live.

---

## Part 4 — Calendar Tab

---

### S-20 · Calendar

**Route**: `/calendar`

**What the user sees**:  
Week strip at top (Mon–Sun, current week highlighted). Below: timeline for selected day — each hour row with events and routines overlaid as cards. Cards use energy colors (green for Growth, orange for Care, etc.).

Bottom FAB (+): quick-add event.

**Tabs within Calendar**: Day / Week / Routines

**What the user can do**:
- Swipe week strip left/right to navigate weeks
- Tap a day → see that day's timeline
- Tap an event card → **S-22 Event Detail**
- Tap + → **S-23 Add Event**
- Switch to "Routines" tab → **S-21 Routines**

---

### S-21 · Routines

**Route**: `/calendar/routines`

**What the user sees**:  
List of recurring routines grouped by day pattern (Weekdays / Weekend / Daily). Each routine card: time, emoji, title, assigned member(s), energy type color chip. "Active" toggle per routine.

FAB: "Add routine"

**Connecting to Kin**: @kin can suggest routines based on pattern. Preview card shown before write.

---

### S-22 · Event / Routine Detail

**Route**: `/calendar/events/{id}`

**What the user sees**:  
Full card: title, time, description, assigned person(s), energy type. If a mini app is linked: "Open in {app}" button. If economy reward is configured: diamond badge showing potential reward.

Leaders see Edit / Delete options.

---

### S-23 · Add / Edit Event

**Route**: `/calendar/events/new` or `/calendar/events/{id}/edit`

**Fields**: Title, Date, Time (or "All day"), Repeat pattern, Assign to (circle member picker), Energy type, Link to app, Note.

Save button → writes to `calendar_events` table.

---

## Part 5 — Moments Tab

---

### S-40 · Moments Feed

**Route**: `/moments`

**What the user sees**:  
Vertical scroll feed of circle moments. Each moment card:
- Full-width image or video thumbnail (from Supabase Storage)
- Caption, emoji reaction strip, author name + time
- Comment count

Tab bar at top: "All" / "Photos" / "Stories" / "Milestones"

FAB (+): Capture new moment

**Real-time**: New moments from circle members appear via Supabase Realtime.

---

### S-41 · Capture Moment

**Route**: `/moments/new`

**What the user sees**:  
Full-screen camera view (native camera picker on mobile). After photo/video selected: preview + caption field + mood selector (emoji strip) + tag members chip input. "Share to circle" button.

**On share**:
1. Upload file to Supabase Storage (`/circles/{circle_id}/moments/`)
2. Create `media_assets` row
3. Create `memory_lines` row
4. Emit `moment.created` KINETIK_EVENT → Buddy awards diamonds

---

### S-42 · Moment Detail

**Route**: `/moments/{id}`

**What the user sees**:  
Full-screen image/video. Below: caption, author, time. Reaction strip (tap to react: ❤️ 😂 🎉 🔥 ✨). Comments section. "Add to Story" button (leaders/creator only).

---

### S-43 · Story Builder

**Route**: `/moments/stories/new`

**What the user sees**:  
Grid of moment thumbnails (select multiple). Tap to select/deselect. Selected items get a numbered badge (order matters). Title field + cover photo selector. "Create Story" button.

Stories are ordered slide shows shown full-screen, Instagram-style.

---

## Part 6 — Apps Tab

---

### S-50 · App Grid

**Route**: `/apps`

**What the user sees**:  
"Your apps" header with circle count of installed apps.

Grid (2 columns on mobile, 3 on tablet): each app card shows the home icon emoji, app name (short), energy color strip, and a small "active today" indicator if someone in the circle used it today.

Below grid: "App Store" link → **S-51 App Store**

**What the user can do**:
- Tap any app → opens the mini app at its route
- Long press → "Remove from circle" option (leaders only)

---

### S-51 · App Store

**Route**: `/apps/store`

**What the user sees**:  
Searchable, filterable list of all available apps. Category filter chips at top: All / Games / Learning / Chores / Social / Entertainment.

Each app in list: icon + name + short description + energy type badge + "Install" button (or "Installed" state).

**Install flow**: Tap "Install" → creates `circle_apps` row → app appears in **S-50 App Grid**.

---

## Part 7 — Me Tab

---

### S-60 · My Profile

**Route**: `/me`

**What the user sees**:  
Avatar (initials or photo) + name + circle role badge. Below: personal stats for this circle — total diamonds earned, current level, energy breakdown donut chart.

Below stats:
- "My Circles" section (list of all circles this person belongs to, tap to switch)
- "Settings" link
- "Sign out" link

---

### S-61 · Circle Settings

**Route**: `/me/circles/{id}/settings`

**Leaders only**.

**Sections**:
- Circle name + color (editable)
- Members list with role editor
- Invite new member
- Economy settings (toggle economy features on/off, review daily caps)
- Danger zone: "Archive circle"

---

### S-62 · Member Profile

**Route**: `/me/members/{person_id}`

**What the user sees**:  
Member's avatar + name + role. Their diamond total and level for this circle. Their energy breakdown. Recent activity in this circle (last 5 events). 

Leaders see: "Gift diamonds" button → **S-36 Gift Modal**.

---

## Part 8 — Kin Agent

---

### S-70 · Ask Kin (Orb Tap)

**Triggered by**: tapping the center orb in the nav

**What the user sees**:  
The orb expands from the nav into a bottom sheet that covers ~70% of the screen. The sheet has a soft blurred background (glass). Inside: chat history (same as WhatsApp style), text input pinned at bottom, and a row of suggestion chips above the input.

Suggestion chips change based on context:
- Morning: "What's on today?" / "Set a reminder" / "What did we do yesterday?"
- After a game: "Log this as a win" / "Add to Calendar"
- Evening: "What did I earn today?" / "Goodnight summary"

**What the user can do**:
- Type a message to @kin
- Tap a suggestion chip (pre-fills the input)
- Swipe down to close

**Kin always responds with**:
1. A short text reply (1–3 sentences)
2. Optionally: an **Action Card** (preview before write)
3. Or: a **Clarification** (if intent is ambiguous)

---

### S-71 · Action Preview Card

**Appears inside the Ask Kin sheet** (above the input)

**What the user sees**:  
A distinct card (slightly elevated, rounded corners, energy color strip on left) showing:
- Action icon (calendar, diamond, task, moment, etc.)
- Title: "Add to Calendar" / "Mark task complete" / "Record workout"
- Summary: what Kin is about to do in plain language
- Key details: time, person, amount, etc.
- Two buttons: **"Confirm ✓"** and **"Cancel ✗"**

**Principle**: Kin NEVER writes without a confirmed preview card. No exceptions.

**On confirm**: Supabase write is made. Response: "Done! Here's what I saved ✓" + receipt card.

**Connects to**: Any Supabase table (calendar_events, diamond_events, app_records, etc.)

---

### S-72 · Kin Chat History

**Route**: `/kin` (optional standalone — same content as the sheet but full page)

**What the user sees**:  
Full chat history with Kin for this circle. Messages from all members visible (shared Kin context). My messages right-aligned, Kin responses left-aligned. Action cards shown inline at the point in history where they were confirmed.

**Purpose**: Lets the whole circle see what Kin has been doing and what's been confirmed.

---

## Part 9 — Economy Hub (Buddy World)

---

### S-30 · Buddy World (App_BuddyWorld)

**Route**: `/apps/buddy-world`

**What the user sees**:  
The most important mini app. 4 sub-tabs:

```
[World]  [Wallet]  [Leaderboard]  [Shop]
```

---

### S-31 · Buddy World — World

**Default sub-tab**

**What the user sees**:  

**Center**: Buddy character — full size, animated based on current mood. Mood is derived from the last 3 economy events (Play event → playful expression, Care event → warm expression, etc.).

**Below Buddy**:
- Level badge: "Level {n} Buddy"
- XP bar: "⚡ {xp} / {next_level_xp}"  
- Diamond counter: "💎 {total} diamonds"

**Circle energy rings** (6 rings orbiting Buddy, one per energy type):
- Ring thickness = proportion of that energy in the last 7 days
- Ring color = energy color
- Tap a ring → **S-32 Energy Detail**

**Mood history** (small timeline, last 5 events):
- Each event shown as an icon + short label + time ago

**Buddy speech bubble** (rotates every 30s, context-aware):
- "Noah hasn't moved in 2 days — maybe a walk? 🚶"
- "Mia just crushed her times tables! 🔥"
- "You're 3 diamonds away from Level 4!"

---

### S-32 · Energy Detail

**Route**: `/apps/buddy-world/energy/{type}` (modal or sub-screen)

**What the user sees**:  
Energy type header (color + name). This week's total diamonds for this energy. Bar chart (last 7 days). Top earner in circle for this energy this week. "Top events" list (3 events that contributed most). Related apps ("Earn more {energy} with:") → app chips.

---

### S-33 · Wallet

**Sub-tab in Buddy World**

**What the user sees**:  
Diamond balance header: "💎 {amount} total earned · 💸 {amount} spent · 💰 {balance} available"

Transaction list (newest first):
- Earned: green row — "+15 💎 Times Table win · 2h ago"
- Gifted received: blue row — "+25 💎 Gift from Dad · Yesterday"
- Gifted sent: amber row — "−25 💎 Gift to Mia · Yesterday"
- Spent: red row — "−50 💎 Golden hat for Buddy · 3 days ago"

Filter chips: All / Earned / Gifts / Spent

**Data source**: `diamond_events` table + `diamond_spend` table, derived to ledger view.

---

### S-34 · Leaderboard

**Sub-tab in Buddy World**

**What the user sees**:  

**Period selector**: This week / This month / All time

**Podium** (top 3 in giant cards):
- #1 card largest, gold accent
- #2 silver
- #3 bronze
- Each shows: avatar, name, diamond total for period, level badge

**Full list** below podium: every circle member ranked, showing their avatar, name, diamond count, and energy type breakdown bar.

**My rank** is pinned at the bottom if not in the visible area (sticky row).

**Real-time**: Updates via Supabase Realtime when any member earns diamonds.

---

### S-35 · Cosmetics Shop

**Sub-tab in Buddy World**

**What the user sees**:  

Buddy preview at top (shows current equipped items live as you hover/tap).

Category tabs: **Character** / **Hat** / **Aura** / **Room** / **Orb**

Grid of items per category:
- Item thumbnail + name + price (💎) + "Owned" / "Equip" / "Buy" state
- Locked items show a padlock with unlock requirement ("Level 5 required")
- Equipped item has a checkmark overlay

**Purchase flow**:
1. Tap item → item card expands with preview
2. "Buy for 50 💎" button
3. Confirm sheet: "Spend 50 💎 on Golden Hat? You have 120 💎 remaining after this."
4. Confirm → Supabase atomic transaction (deduct from `diamond_events` ledger + create `diamond_spend` row + update `buddy_cosmetics` row)
5. Buddy animates putting on the hat

---

### S-36 · Gift Diamonds (Leader only)

**Triggered from**: S-62 Member Profile → "Gift diamonds"

**What the user sees**:  
Bottom sheet. Recipient avatar + name at top.

Preset amount buttons: **+10 💎** · **+25 💎** · **+50 💎** · **Custom**

"Custom" expands a number input (min 1, max 100 per transaction).

Optional message field: "Add a note (optional)" — shown to recipient in notification.

Primary button: "Gift 💎"

**On gift**:
1. Edge Function call: `recordKinetikEvent` with `eventType: "diamond.gift"`, leader check enforced server-side
2. Optimistic UI: button shows spinner
3. On success: confetti burst + toast "Gifted 25 💎 to Mia 🎁"
4. Mia receives push notification: "Dad gifted you 25 💎! Check your wallet 💎"
5. Leaderboard updates in real-time for all members

---

## Part 10 — Mini Apps

Each mini app is a React route within the shell. It uses `useKinetik()` hook as the only gateway to economy, identity, and data.

---

### S-80 · Home Quest (Chores)

**Route**: `/apps/home-quest`

**Energy**: Care 🟠  
**Economy events**: `task.completed` (pending) → `task.approved` (diamonds awarded on approval)

**Screen A — Task Board**  
Kanban-style: Todo / In Progress / Done. Filter by: All members / Me only. FAB: "Add task" (leaders) or "Suggest task" (members).

Each task card: emoji + title + assigned member avatar + due indicator + diamond badge showing potential reward.

**Screen B — Task Detail**  
Full task: title, description, assigned to, due date. Status timeline (created → submitted → approved/rejected).

"Mark as done" button (assigned member) → task moves to "Pending approval" state. No photo required — the confirmation from a leader or co-leader IS the proof. Members cannot self-approve.

**Screen C — Pending Approval** (leaders + co-leaders only)  
List of tasks submitted. Swipe right: "Confirm done ✓ — award diamonds" (triggers `task.approved` event → diamonds awarded). Swipe left: "Send back — needs redo" (with optional note sent to assignee). Each card shows: task title, assignee avatar, time submitted, diamond amount to be awarded.

**Screen D — Add Task**  
Title, description (optional), assign to (member picker), due date, energy type (auto-set to Care but overridable), diamond reward (default 15, leaders/co-leaders can adjust 5–25). No photo toggle — approval flow is always the same.

**Streak display**: "Mia has done chores 7 days in a row 🔥" shown on task board header.

---

### S-81 · Math Quest (Full Mathematics Curriculum)

**Route**: `/apps/math-quest`

**Energy**: Growth 🟢  
**Economy events**: `practice.completed`, `mastery.unlocked`

**Design principle**: A single app covering the complete mathematics journey from counting to introductory algebra. Adaptive — each person's level is tracked independently. The whole circle can be at completely different stages within the same app.

---

**10 Domains (progressive — unlock sequentially per person)**

| # | Domain | Topics |
|---|---|---|
| 1 | Number Foundations | Counting, place value (ones→millions), comparing, rounding, odd/even |
| 2 | Addition & Subtraction | Mental strategies, column method, missing numbers, word problems |
| 3 | Multiplication & Division | Arrays, repeated addition, short/long multiplication, short/long division |
| 4 | Times Tables | 1×–12× mastery system (25 levels per table, speed + accuracy tracked) |
| 5 | Fractions | Unit fractions, equivalence, comparing, adding, subtracting, mixed numbers |
| 6 | Decimals | Tenths/hundredths/thousandths, place value, add/subtract/multiply decimals |
| 7 | Percentages | Percent of a whole, fraction↔decimal↔percent conversion, % increase/decrease |
| 8 | Ratio & Proportion | Ratio notation, scaling, unitary method, proportional relationships |
| 9 | Geometry & Measurement | 2D/3D shapes, area, perimeter, volume, angles, coordinates, conversions |
| 10 | Algebra | Patterns, sequences, function machines, variables, equations, linear graphs |

Each domain has 5 levels (Foundation → Bronze → Silver → Gold → Mastery).

---

**Screen A — My Math Map**  
10 domain hexagons arranged in a connected path (like a map). Each hexagon shows: domain icon + name + current level ring + star count. Locked domains are greyed with a "Complete {prev}" label. Tap any unlocked domain → **Screen B**.

"Circle Progress" toggle: switch between My view and Circle view (see all members' positions on the map).

**Screen B — Domain Hub**  
Domain header (name + level + XP bar). Three mode cards:
1. **Practice** — core learning mode, question by question
2. **Speed Challenge** — timed (60s), volume of correct answers
3. **Boss Battle** — 20 mixed questions across the whole domain, must pass 16/20 to advance level

Below: topic breakdown within this domain showing which sub-topics have been practiced vs. not started.

**Screen C — Practice Session**  
Question displayed with appropriate visual aid:
- Number/calculation → clean numeral display
- Fractions → visual fraction bar or pie
- Geometry → rendered shape with measurements
- Algebra → equation with input field

4 answer options (multiple choice at lower levels) or open numeric input (Silver+). Timer optional (off by default). Correct → XP tick + next. Wrong → show correct method briefly → next.

After 20 questions: emit `practice.completed` with `{domain, level, correct, total, xp}`.

**Screen D — Speed Challenge**  
60-second countdown. Questions appear one by one (same domain). Numeric keyboard input. Score = correct per minute. Personal best shown. Circle best shown as a ghost target.

On beat personal best: emit `mastery.unlocked` with `{domain, type:'speed_record'}`.

**Screen E — Boss Battle**  
20 questions, mixed difficulty within the domain. Pass (≥16/20) → level advances, confetti, Buddy celebration, emit `mastery.unlocked` with `{domain, newLevel}`. Fail → "Almost! Try again" with weak-topic hints.

**Screen F — Times Tables (Domain 4 special)**  
Grid of 1×–12× tables. Each cell shows accuracy % and a mastery ring. Tap a table → dedicated flash-card drill for that table. Mastering all 12 tables at Gold level → special "Times Master" badge + `mastery.unlocked` with type `'times_master'`.

**Screen G — Mastery Certificate**  
When any domain reaches Mastery level: full-screen celebration. Certificate: "{Name} has mastered {Domain}! 🏆". Shareable to Moments. Buddy does a special animation.

---

### S-82 · Primary Quest (Cambridge Curriculum)

**Route**: `/apps/primary-quest`

**Energy**: Growth 🟢  
**Economy events**: `practice.completed`, `mastery.unlocked`

**Design principle**: Follows the Cambridge Primary curriculum framework (Stages 1–6, age 5–11) and Cambridge Lower Secondary (Stages 7–9, age 11–14). Each child's stage is set on first use and can be adjusted by a leader. Content is gamified — no textbook walls of text.

---

**Cambridge Subjects Covered**

| Subject | Stages | Key Topics |
|---|---|---|
| Mathematics | 1–9 | (covered by Math Quest — cross-linked, not duplicated) |
| English | 1–9 | Reading comprehension, writing, grammar, vocabulary, speaking & listening |
| Science | 1–9 | Biology (life/health/ecosystems), Chemistry (materials/states), Physics (forces/electricity/light/sound) |
| Computing | 1–9 | Algorithms, programming concepts, digital literacy, data, internet safety |
| Geography | 1–6 | Maps, weather, habitats, human vs. physical geography, resources |
| History | 1–6 | Timelines, civilisations (Egypt, Rome, etc.), local history, change over time |
| Global Perspectives | 5–9 | Research skills, collaboration, global issues, argument and reasoning |
| Art & Design | 1–6 | Techniques (drawing, painting, printing, sculpture), artists study |

---

**Screen A — My Stage & Subjects**  
Stage selector at top (set by leader or child with leader approval). 8 subject cards in a 2×4 grid. Each card: subject icon (colored by energy), current unit title, progress ring, last played time.

"Explore all" button → shows all units available for this stage across all subjects.

**Screen B — Subject Hub**  
Subject header with stage badge. Units listed in curriculum order (locked until previous unit complete). Each unit card: title, topic count, estimated time, reward preview ("up to 25 💎").

**Screen C — Unit Overview**  
Unit title + brief intro. Lesson list (5–8 lessons per unit). Each lesson has a type badge:
- 📖 **Read** — illustrated scrollable content (age-appropriate language)
- 🎮 **Play** — mini-game style interaction
- ❓ **Quiz** — multiple choice, 5–10 questions
- 🔬 **Explore** — drag-and-drop or visual experiment
- 🎨 **Create** — open-ended (drawing, typing a paragraph, arranging)

Progress bar: "2/6 lessons complete". Diamond preview for completing the unit.

**Screen D — Lesson: Read**  
Illustrated rich text in age-appropriate language. Key vocabulary highlighted — tap for definition. "I've read this" button at bottom. Reading time estimated and shown. Auto-advances after estimated time if not tapped (optional).

**Screen E — Lesson: Quiz**  
Question + 4 choices. After each answer: correct/wrong with a one-line explanation. Tally shown throughout. At end: score badge. Pass (≥70%) → `practice.completed`. Pass with 100% → `mastery.unlocked`. Retry allowed but only first-pass score counts for mastery.

**Screen F — Lesson: Play**  
Subject-specific mini-interactions:
- Science: drag particles into states of matter, label a diagram, order a food chain
- Geography: pin locations on a map, sort human vs. physical geography cards
- History: arrange events on a timeline, match civilisation to artefact
- English: arrange words into a sentence, spot the grammar error, fill-in-the-blank

Completing a play lesson: `practice.completed` with `{subject, unit, lessonType:'play'}`.

**Screen G — Lesson: Create**  
Open-ended task with a prompt ("Draw and label the water cycle", "Write 3 sentences about Romans"). Child submits (text typed or photo of drawing). Leader reviews and marks "Great work!" → additional `practice.completed` event. No wrong answer — it's expression, not assessment.

**Screen H — Unit Complete**  
Confetti screen. Unit badge awarded. Buddy reaction. Share to Moments. Diamond total shown. Auto-unlocks next unit. `mastery.unlocked` emitted for units completed with ≥80% quiz average.

**Screen I — Achievement Wall**  
All unit badges, subject level badges, and stage completion certificates. Filterable by subject. Each badge shareable to Moments.

---

### S-83 · Circle Chess

**Route**: `/apps/circle-chess`

**Energy**: Play + Growth 🟣  
**Economy events**: `practice.completed`, `mastery.unlocked`, `game.round.completed`, `game.win`

**Screen A — Chess Lobby**  
Three mode cards:
1. **vs CPU** — select difficulty (Beginner/Intermediate/Advanced). Practice mode, no wait time.
2. **vs Circle Member** — shows online circle members. Tap a member → sends challenge.
3. **Daily Puzzle** — one puzzle per day, global. Solve it → `practice.completed` (3 💎).

**Screen B — Challenge Sent/Received**  
"Waiting for Noah to accept..." spinner. Recipient sees: "Dad challenged you to chess! Accept or decline." Accept → both enter **Screen C**.

**Screen C — Game Board**  
Full-screen chess board. Pieces styled with circle accent color for your pieces. Timer per player (optional, set in lobby). Move history in a collapsible panel. Resign button (confirmation required).

On checkmate or draw: **Screen D**.

**Screen D — Game Result**  
Winner announced with Buddy reaction. Diamond earned badge. Move replay option (fast-forward through game). "Rematch?" button. "Share to Moments" button.

Economy events on result:
- `game.round.completed` for both players (participation reward)
- `game.win` for winner only (win reward)
- If puzzle solved: `practice.completed`
- If first win against this difficulty: `mastery.unlocked`

**Screen E — Lesson Library**  
Chess lessons organized by skill (openings, tactics, endgames). Each lesson is an interactive board with guided moves. Complete a lesson → `practice.completed`.

---

### S-84 · Choice Trail (Knowledge Game)

**Route**: `/apps/choice-trail`

**Energy**: Growth + Play 🟢  
**Economy events**: `game.round.completed`, `reflection.saved`

**Screen A — Topic Selection**  
Topic chips: Science / History / Geography / Sports / Pop Culture / Nature / Custom (leader can add topics). Or: "Surprise me" random.

Below: "Play solo" or "Circle challenge" (multiplayer, same device, pass-and-play or online).

**Screen B — Question**  
Question text at top. 4 answer cards arranged in a 2×2 grid. Timer bar counting down (15–30s configurable). No visible "correct" indicator until answered.

On answer: cards animate — correct goes green, selected wrong goes red. Brief explanation shown below. "Next question" button.

**Screen C — Round Summary** (after 10 questions)  
Score card: X/10 correct. Performance bar chart (which categories you did well). Diamond earned. Emoji reaction from Buddy based on score.

Emit `game.round.completed` with score. If score ≥ 8/10: emit `reflection.saved` as a bonus.

**Screen D — Duel Mode** (2-player same screen)  
Split screen: Player 1 (top half) vs Player 2 (bottom half). Each sees the question and taps their answer simultaneously. Faster correct answer scores more. After 10 questions: podium.

---

### S-85 · Circle Spinner (Party Mode)

**Route**: `/apps/circle-spinner`

**Energy**: Circle 🩷  
**Economy events**: `game.win` (spin winner, every spin), `game.round.completed` (session participation)

**Design principle**: Every spin has a winner — whoever the wheel lands on earns diamonds for that spin. Additional diamonds come from following through on the activity the spinner assigns (e.g., opening the linked mini app and completing a round).

**Screen A — Spinner Setup** (leader)  
"Tonight's activities" builder. Leader drags activity cards onto the wheel segments (max 8 segments):
- App links (opens that mini app — winner earns in that app too)
- Custom activities ("Sing a song", "Tell a joke")
- Diamond bonus segments ("Lucky spin — 20 💎")
- Dare cards (winner earns base spin reward, completes the dare for bonus)

Leader also sets the base spin reward (default 5 💎, max 15 💎 per spin).

"Start session" → **Screen B** (shared view on a single device, cast to TV ideally)

**Screen B — Spin**  
Full-screen wheel with circle member names / activities as segments. Giant "Spin" button. The wheel spins with physics — slows, bounces slightly, lands. Winning segment pops and glows.

**On landing**: `game.win` event emitted immediately for the person the wheel landed on. Diamond toast appears for that person. If segment is a mini app: "Open {app} now →" button; completing a round there earns additional diamonds. If custom activity: shown full-screen for everyone to read. If Lucky Spin segment: bonus amount added on top of base.

**Screen C — Spinner History** (session log)  
This session's spin results listed in order. "End session" button. Session summary card.

---

### S-86 · Emoji Party (Group Game)

**Route**: `/apps/emoji-party`

**Energy**: Play 🟣  
**Economy events**: `game.round.completed`, `game.win`

**Screen A — Party Lobby**  
Mode selector:
- **Story Mode**: describe the emoji sequence as a story
- **Guess Mode**: guess what the emoji represents
- **Speed Mode**: fastest correct answer wins the point

Player count selector (2–6). Each player enters their name/selects their avatar (circle member profiles auto-fill if available).

"Start party!" → **Screen B**

**Screen B — Round**  
Emoji sequence displayed large: "🍎✈️🇫🇷🥐" — "What's the story?"  
Free text input (Story Mode) or multiple choice (Guess Mode). Timer shows. Submit answer.

After all players submit (or timer runs out): reveal best answer. Players vote for their favorite (Story Mode). Points awarded.

**Screen C — Scoreboard** (between rounds)  
Live scoreboard with all players. Round winner highlighted with star burst animation. "Next round" countdown (3s auto-advance or manual).

**Screen D — Winner Screen** (after final round)  
Confetti. Winner podium. Diamond awards:
- Winner: `game.win` event (5 💎)
- All participants: `game.round.completed` (2–4 💎 based on rounds played)

"Play again" or "Share results to Moments".

---

## Part 11 — Notifications

---

### S-90 · Push Notification Templates

These appear as OS-level push notifications when the app is closed.

| Trigger | Template | Action on tap |
|---|---|---|
| Diamond gifted received | "Dad gifted you 25 💎! Open Buddy to see your wallet 💎" | Opens S-33 Wallet |
| Buddy leveled up | "{Circle name}'s Buddy reached Level 5! 🎉" | Opens S-31 Buddy World |
| Quest ready | "Buddy has a quest for you today — check it out! 🐣" | Opens S-11 Today |
| Chore submitted (leader) | "Mia submitted 'Clean room' — approve to award diamonds" | Opens S-80 Pending Approval |
| Chore approved (member) | "Dad approved your chore! +15 💎 earned 🎉" | Opens S-31 Buddy World |
| Circle event soon | "Chess match with Noah starts in 30 min" | Opens S-83 Game Board |
| Circle member joined | "Mia just joined your circle! Say hi 👋" | Opens S-62 Member Profile |
| Daily cap reached | "You've hit today's limit for game diamonds — try again tomorrow!" | Opens S-11 Today |

**Implementation**: Supabase Realtime → Supabase Edge Function → Web Push API (via VAPID) or Expo (if native).

---

## Part 12 — Settings

---

### S-95 · App Settings

**Route**: `/settings`

**Sections**:

**Account**
- Name (editable)
- Email (shown, not editable — tied to auth)
- Avatar (upload or initials)
- Sign out

**Circles**
- My circles list (see all, join new, create new)
- Default circle selector (which circle is shown on launch)

**Notifications**
- Push notifications toggle (per type)
- Quiet hours (start/end time)
- Quest reminders toggle + time

**Economy**
- View my diamond history (link to S-33 Wallet)
- View circle economy rules (read-only list of event types + rewards)

**Accessibility**
- Reduce motion toggle
- Large text toggle
- High contrast toggle

**About**
- App version
- Terms of service
- Privacy policy
- Contact

---

## Part 13 — Cross-Cutting Patterns

These patterns appear throughout the app and must be consistent.

---

### P-01 · Economy Toast

Triggered on any successful diamond award.

**What the user sees**: A small card slides in from the top (not blocking content). Shows: Buddy avatar (small) + "💎 +{amount}" + event label. After 2.5s, slides back up. Tapping opens Buddy World.

If it's a level-up: toast is larger, Buddy has a star burst, "Buddy leveled up! 🎉" shown.

---

### P-02 · Optimistic UI

All economy events use optimistic updates:
1. Event emitted → local state immediately updated (diamond counter incremented, toast shown)
2. Edge Function call made in background
3. If success: local state confirmed (no visible change if optimistic was correct)
4. If fail (e.g., already capped): toast updated: "Today's cap reached — diamonds already counted!" (NOT an error — a friendly limit message)
5. If offline: queued in IndexedDB, synced when back online

The user NEVER sees a spinner after tapping "Done" in a game or task.

---

### P-03 · Empty States

Every list has a designed empty state (not a blank screen).

Examples:
- Today feed, no activity: Buddy looking curious. "It's quiet today. Tap + to start something."
- App Store, search no results: Buddy shrugging. "Nothing found. Try a different word."
- Leaderboard, only 1 member: "Invite someone to the circle to see the leaderboard light up."

---

### P-04 · Energy Color System

| Energy | Color | Hex | Use case |
|---|---|---|---|
| Care | Orange | `#f97316` | Chores, housework, helping |
| Growth | Green | `#22c55e` | Learning, education, coaching |
| Play | Purple | `#a855f7` | Games, fun, creativity |
| Move | Blue | `#3b82f6` | Sport, physical, outdoor |
| Circle | Pink | `#ec4899` | Social, planning, connection |
| Story | Gold | `#eab308` | Moments, memories, milestones |

These colors are non-negotiable. Every app, event, and Buddy mood maps to one of these.

---

### P-05 · Role-Based UI

| Feature | Viewer | Member | Co-leader | Owner |
|---|---|---|---|---|
| View any screen | ✓ | ✓ | ✓ | ✓ |
| Earn diamonds | — | ✓ | ✓ | ✓ |
| Create tasks | — | Suggest only | ✓ | ✓ |
| Approve tasks | — | — | ✓ | ✓ |
| Gift diamonds | — | — | ✓ | ✓ |
| Add circle members | — | — | ✓ | ✓ |
| Delete events | — | Own only | ✓ | ✓ |
| Economy settings | — | — | — | ✓ |
| Delete circle | — | — | — | ✓ |

Role checks happen at the Supabase RLS layer — never trust the client alone.

---

### P-06 · Loading States

- **Skeleton screens** (not spinners) for all data-dependent lists
- **Immediate local paint** for anything in the offline cache
- **No blocking modals** — if data is loading, show skeleton in-place
- The only full-screen spinner allowed: initial session check on S-01 Splash (hidden behind the animation)

---

## Screen Inventory (Summary)

| ID | Screen | Route | Priority |
|---|---|---|---|
| S-01 | Splash | `/` | P0 |
| S-02 | Welcome | `/welcome` | P0 |
| S-03 | Auth | `/auth` | P0 |
| S-04 | Link Sent | `/auth/check-email` | P0 |
| S-05 | Create Circle | `/onboarding/circle` | P0 |
| S-06 | Circle Color | `/onboarding/circle/color` | P0 |
| S-07 | Invite Members | `/onboarding/circle/invite` | P0 |
| S-08 | Meet Buddy | `/onboarding/buddy` | P0 |
| S-09 | Accept Invite | `/invite/{token}` | P0 |
| S-10 | Shell Chrome | persistent | P0 |
| S-11 | Today | `/today` | P0 |
| S-12 | Notifications | sheet | P0 |
| S-20 | Calendar | `/calendar` | P1 |
| S-21 | Routines | `/calendar/routines` | P1 |
| S-22 | Event Detail | `/calendar/events/{id}` | P1 |
| S-23 | Add Event | `/calendar/events/new` | P1 |
| S-30 | Buddy World | `/apps/buddy-world` | P0 |
| S-31 | Buddy — World | `/apps/buddy-world/world` | P0 |
| S-32 | Energy Detail | `/apps/buddy-world/energy/{type}` | P1 |
| S-33 | Wallet | `/apps/buddy-world/wallet` | P0 |
| S-34 | Leaderboard | `/apps/buddy-world/leaderboard` | P0 |
| S-35 | Shop | `/apps/buddy-world/shop` | P1 |
| S-36 | Gift Modal | sheet | P0 |
| S-40 | Moments Feed | `/moments` | P1 |
| S-41 | Capture Moment | `/moments/new` | P1 |
| S-42 | Moment Detail | `/moments/{id}` | P1 |
| S-43 | Story Builder | `/moments/stories/new` | P2 |
| S-50 | App Grid | `/apps` | P0 |
| S-51 | App Store | `/apps/store` | P1 |
| S-60 | My Profile | `/me` | P0 |
| S-61 | Circle Settings | `/me/circles/{id}/settings` | P0 |
| S-62 | Member Profile | `/me/members/{id}` | P1 |
| S-70 | Ask Kin | sheet | P0 |
| S-71 | Action Preview | in-sheet card | P0 |
| S-72 | Kin History | `/kin` | P2 |
| S-80 | Home Quest | `/apps/home-quest` | P0 |
| S-81 | Times Quest | `/apps/times-quest` | P0 |
| S-82 | Primary Quest | `/apps/primary-quest` | P1 |
| S-83 | Circle Chess | `/apps/circle-chess` | P1 |
| S-84 | Choice Trail | `/apps/choice-trail` | P1 |
| S-85 | Circle Spinner | `/apps/circle-spinner` | P2 |
| S-86 | Emoji Party | `/apps/emoji-party` | P2 |
| S-90 | Push Templates | n/a | P0 |
| S-95 | Settings | `/settings` | P1 |

**Priority guide**: P0 = Wave 1 MVP · P1 = Wave 2 · P2 = Wave 3+

---

*Next step: For each P0 screen, design wireframes in Figma or code a Storybook component. The screen IDs above can be used as Figma frame names and Storybook story IDs.*
