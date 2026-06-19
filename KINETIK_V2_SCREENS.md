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

---

## Part 14 — Wife's Apps (Care + Lifestyle)

---

### S-89 · Grocery Run

**Route**: `/apps/grocery-run`

**Energy**: Care 🟠  
**Economy events**: `task.completed` (list finished, confirmed by anyone in circle), `task.approved` (leader/co-leader confirms the shop is done)

**Design principle**: A shared, living shopping list for the whole circle. Anyone can add items. Kin can auto-populate from meal plans (Kitchen Buddy integration). The person who does the shop confirms done → economy event fires.

**Screen A — The List**  
Categorised shopping list (auto-grouped by: Produce / Meat & Fish / Dairy / Bakery / Pantry / Frozen / Household / Other). Each item: checkbox + name + quantity + who added it (avatar chip). Checked items are struck through and drift to the bottom.

FAB: "+ Add item". Top right: "Share list" (generates a readable link, useful for printing or showing to store staff).

Category count shown: "🥩 Meat & Fish · 3 items".

**Screen B — Add Item**  
Quick-add: text field with autocomplete (from past purchases + common items). Quantity + unit selector (each / kg / g / L / pack). Category auto-detected from item name (overridable). "Add to list" button.

Bulk add: paste a list of items (comma or newline separated) — Kin parses and categorises.

**Screen C — Shop Mode**  
Full-screen, large text. One category at a time. Big checkboxes. Progress bar at top: "12/20 items done". Designed for use in the supermarket — minimal chrome.

When last item checked: "All done! Mark shop complete?" → confirm → `task.completed` event → leader/co-leader gets notification to approve → `task.approved` → diamonds awarded.

**Screen D — Past Lists**  
History of completed shops. Tap any past list → "Reorder all" button (re-adds all items to current list). Useful for weekly recurring shops.

**Screen E — Smart Suggestions (Kin-powered)**  
"You usually buy these on Fridays" — suggested items based on patterns. "Kitchen Buddy says you're low on pasta" — cross-app data from fridge tracker. One-tap add to list.

**Kin integration**: "@kin add milk, eggs and bread to the grocery list" → preview card → confirm → items added.

---

### S-90 · Kitchen Buddy

**Route**: `/apps/kitchen-buddy`

**Energy**: Care 🟠 (cooking) + Growth 🟢 (trying new recipes)  
**Economy events**: `task.completed` (meal cooked), `practice.completed` (new recipe tried for first time), `mastery.unlocked` (cuisine mastered — 10 recipes from same cuisine)

**Screen A — Today's Kitchen**  
What's for today: meal plan cards for breakfast / lunch / dinner / snack. Each card shows the recipe name, estimated time, and a "Let's cook!" button. If no plan: "Ask Kin to plan today's meals" shortcut.

Fridge status: "🍳 5 items expiring soon" warning chip → taps into Screen D.

**Screen B — Recipe Library**  
Searchable, filterable recipe collection. Filters: cuisine (Italian/Asian/Middle Eastern/etc.), time (<30m / <1h / any), difficulty, dietary (vegan/gluten-free/halal/etc.).

Each recipe card: photo (or emoji placeholder), name, time, difficulty stars, energy tags.

FAB: "Add recipe" (manual entry or import from URL via Kin).

**Screen C — Recipe Detail**  
Recipe header (photo, name, prep/cook time, servings — adjustable slider). Two tabs: **Ingredients** | **Method**.

Ingredients: checklist view. "Add to Grocery Run" button (adds missing ingredients to the shopping list with one tap, cross-app). Serving adjuster recalculates all quantities.

Method: step-by-step numbered instructions. "Start cooking" mode → full screen, one step at a time, tap "Next step" to advance. Built-in timer per step if the recipe specifies one.

**Screen D — Fridge Tracker**  
Simple inventory: items currently in the fridge/pantry + approximate quantity + expiry date. Add items manually or via the Grocery Run (auto-added on shop complete). Items going off highlighted in amber/red.

"What can I cook?" button → Kin suggests 3 recipes using soon-to-expire items.

**Screen E — Meal Planner**  
Week view (Mon–Sun). Drag recipes onto meal slots (breakfast/lunch/dinner). "Generate shopping list" → creates a new Grocery Run list from all planned recipes' missing ingredients.

**Screen F — My Cookbook**  
Recipes the family has cooked, rated by circle members (1–5 hearts). Family favourites (most-cooked). "Try again" shortcut on each.

**Kin integration**: "@kin plan this week's dinners" → Kin suggests 7 dinners based on pantry items + preferences + recent history → preview card per day → confirm → meal plan populated.

---

### S-91 · Padel Matchday

**Route**: `/apps/padel-matchday`

**Energy**: Move 🔵  
**Economy events**: `game.win` (match won), `practice.completed` (training session logged), `mastery.unlocked` (personal best: most games won in a week, first competitive win, etc.)

**Design principle**: Full padel companion for tracking matches, stats, and improvement. Works for recreational family play AND competitive play. Doubles-aware (padel is always 2v2).

**Screen A — My Padel Hub**  
Stats header: Win/Loss record this month · Total matches · Current streak · Court hours. Quick action buttons: "Log a match" / "Log training" / "Find partner" (invite circle member).

Recent matches timeline below.

**Screen B — Log a Match**  
Date + venue (text or map location). My partner selector (circle member or manual name). Opponent names (2 text fields). Set scores (up to 3 sets, standard padel scoring: 6-4, 7-5, 7-6, super tiebreak). "We won / We lost" toggle. Optional notes.

Submit → `game.win` emitted if won. Winner's partner also gets a `game.win` event.

**Screen C — Match Detail**  
Set-by-set score breakdown. Map link to venue. Players (4 names). Notes. "Share to Moments" button. Rematch button (pre-fills same opponent names).

**Screen D — Training Log**  
Log a practice session: date + duration + focus area chips (Serve / Volley / Smash / Movement / Strategy / Fitness). Optional notes on what improved. Submit → `practice.completed`.

Progress view: training hours over time chart. Focus area balance pie chart.

**Screen E — My Stats**  
Win rate over time (line chart). Matches per month (bar chart). Best winning streak. Favourite partners (most wins with). Worst matchup (for fun). Time of day distribution.

**Screen F — Circuit / Season Tracker** (optional setup)  
Set up a mini league within the circle. Round-robin table. Track rankings. Season winner gets leader gift + Buddy moment.

---

## Part 15 — Superapp Experiences

---

### S-92 · Coach Hub (Life + Sport + Professional Coaching)

**Route**: `/apps/coach-hub`

**Energy**: Growth 🟢 (primarily) + Move 🔵 (sport coaching)  
**Economy events**: `practice.completed` (session logged, reflection saved), `mastery.unlocked` (goal achieved, milestone reached), `reflection.saved` (deep reflection submitted)

**Design principle**: A single unified coaching app with three distinct "coaches" — each has a different persona, tone, and toolset. Powered by Kin's agent layer. All three coaches share the same conversation history and goal tracking so they can cross-reference ("Your life coach noted you're stressed at work — your sport coach wants to know if that's affecting your training").

---

**Three Coaching Tracks**

**Track 1: Life Coach**  
Goal: clarity, balance, habits, emotional wellbeing, life decisions.

- **Screen A1 — Life Snapshot**: Daily check-in (1–2 min). Mood slider (1–10). Energy level. One thing going well. One thing weighing on you. Kin responds with a personalised observation, not generic advice.
- **Screen B1 — My Goals**: Active goals with progress tracking. Each goal: title, why it matters, current action step, target date, progress ring. "Add goal" → Kin helps define it using SMART framework (via conversation + preview card).
- **Screen C1 — Habits**: Daily habit tracker. Habit cards with streak count. Check-in is one tap per habit. Weekly review shows patterns.
- **Screen D1 — Reflection Journal**: Prompted journal. Kin offers a daily reflection question (customised to recent check-in data). Free-text response. Private to the person (not visible to circle). `reflection.saved` event on submit.
- **Screen E1 — Decision Coach**: Structured tool for big decisions. Kin walks through: define the decision → list options → identify values at stake → stress-test each option → choose. Uses the Socratic method (questions, not answers). Preview card for any output written to calendar/goals.

**Track 2: Sport Coach (Padel + Physical)**  
Goal: performance, training discipline, physical goals.

- **Screen A2 — Training Dashboard**: This week's training plan vs. actual. KPIs: sessions/week, hours, focus areas. Buddy energy ring for Move.
- **Screen B2 — Session Planner**: Kin suggests a training session based on recent logs and goals. Session cards: warmup / drills / main set / cool-down. Each drill has sets/reps/duration. "Start session" → live timer per drill.
- **Screen C2 — Performance Trends**: Charts: session frequency, training load, focus area balance, win rate (Padel cross-link). Kin commentary: "You've had 3 strong training weeks — consider a lighter week next."
- **Screen D2 — Video Analysis** (future): Upload a clip → Kin annotates key moments. For v1: text-based self-assessment form with body position, technique notes.

**Track 3: Professional Coach**  
Goal: career, communication, presentations, professional growth.

- **Screen A3 — Work Snapshot**: Weekly work check-in. What went well? What's blocking you? One thing you want to improve this week. Kin responds with one actionable suggestion.
- **Screen B3 — Presentation Prep**: Structured tool. Kin guides: who is the audience? → what's the one key message? → structure (hook / body / close) → slide-by-slide notes mode → practice questions ("What would a skeptical audience member ask?"). Output: structured outline saved to app.
- **Screen C3 — Communication Drills**: Flash-card style practice for: clear communication, difficult conversations, feedback giving, active listening. Kin poses a scenario, user responds in free text, Kin evaluates and suggests improvement.
- **Screen D3 — Career Goals**: Long-range goal tracking. 90-day goals broken into weekly actions. Linked to Life Coach goals.

**Track Selector** (top of Coach Hub):  
Three tab cards at the top of the app — tap to switch track. Kin remembers context across all three and can surface connections.

---

### S-93 · Health Advisor

**Route**: `/apps/health-advisor`

**Energy**: Move 🔵 + Growth 🟢  
**Economy events**: `practice.completed` (wellness session completed), `reflection.saved` (health journal entry)

**⚠️ Legal position**: This app is a **personal wellness companion**, not a medical tool. Every screen shows: "This is not medical advice. Always consult a qualified healthcare professional for medical decisions." The app does NOT diagnose, prescribe, or treat. It helps users track, reflect, and prepare for real appointments.

**What it does**:
- Tracks symptoms, mood, energy, sleep, and physical sensations over time
- Provides psychoeducational content (stress management, sleep hygiene, nutrition basics)
- Guides reflection (journaling, pattern recognition in self-reported data)
- Prepares users for healthcare appointments (generates a symptom summary they can share with their doctor)
- Mental wellness: mindfulness exercises, breathing techniques, stress response tools
- Physical wellness: hydration tracking, sleep logging, movement logging

**What it explicitly does NOT do**:
- Diagnose any condition
- Recommend any medication
- Suggest that professional care is unnecessary
- Provide clinical psychological therapy

---

**Screen A — Wellness Dashboard**  
Weekly overview: mood trend (small line chart), sleep average, hydration days, movement days. "How are you today?" quick check-in card (3 taps: mood, energy, sleep quality). Buddy energy contribution shown for Move.

**Screen B — Daily Check-In**  
Mood (emoji scale 1–10). Physical energy (1–10). Sleep quality (poor/ok/good) + hours. One physical note (optional: "headache, lower back tension"). One emotional note (optional). Submit → tracked in `health_logs` table, private to person.

**Screen C — Body Journal**  
Symptom tracker. Add a symptom: location (body map tap or text), type, severity (1–10), when it started. Symptoms shown on a timeline. "Prepare for appointment" button → generates a plain-language summary of recent symptoms for the person to share with their doctor.

**Screen D — Mind Space**  
Mental wellness tools:
- **Breathing exercises**: 4-7-8 breathing, box breathing (animated visual guide)
- **Mindfulness**: 3–10 minute guided reflection prompts (text, not audio in v1)
- **Mood journal**: prompted reflection (Kin selects a question based on recent mood data). `reflection.saved` on submit.
- **Stress toolkit**: cognitive reframing prompts, grounding exercises (5-4-3-2-1 sensory)

**Screen E — Wellness Library**  
Curated psychoeducational content (text articles):
- Sleep hygiene basics
- Stress and the body
- Nutrition and energy
- Movement and mood
- Building resilience

Each article: 3–5 min read. `practice.completed` on finish.

**Screen F — Appointment Prep**  
"I have a doctor's appointment" → Kin compiles the last 30 days of check-ins into a structured summary: mood trend, sleep average, reported symptoms (with dates and severity), key notes. Summary is human-readable, copy-and-paste ready. This is the output a person hands to their real doctor.

**Privacy**: All health data is visible ONLY to the individual. Not visible to circle members or leaders. RLS enforces this at the row level (`person_id` match only, no circle join).

---

## Part 16 — Media & Memory Apps

---

### S-94 · Kinetik Cinema

**Route**: `/apps/kinetik-cinema`

**Energy**: Story 🟡  
**Economy events**: `moment.created` (video created and shared to circle), `moment.styled` (video styled with template)

**Design principle**: Kinetik Cinema reads from the circle's Moments library and curates them into short, beautifully formatted cinematic HTML videos — rendered in-browser, exportable as real video files. No editing skill required. Kin is the director.

**Format options**:
- 10s (social story — Instagram / WhatsApp)
- 30s (TikTok / Reels)
- 60s (max — family cinema cut)

All outputs include Kinetik branding (optional watermark toggle for premium).

---

**Screen A — Cinema Home**  
Grid of past created videos ("Your films"). Each: thumbnail of first frame, title, duration badge, created date. Play button (plays in-app). Download button. Share button.

"Create new film" big CTA → **Screen B**.

**Screen B — Film Wizard — Step 1: Choose your moments**  
Grid of the circle's Moments library. Tap to select (multi-select, max 20). Selected moments get a numbered badge (order matters). Auto-detect: if the user selects more than the format allows, Kin trims to the best ones.

Or: "Let Kin choose" → Kin selects the most visually varied, emotionally resonant moments from the past month (based on reaction count, caption sentiment, recency). Preview the selection before confirming.

**Screen C — Film Wizard — Step 2: Pick a style**  
Template cards (each shown as a 3-second looping preview):
- **Cinematic** — slow pan, Ken Burns effect, dramatic titles, orchestral-style music
- **Energetic** — fast cuts, beat-synced transitions, bold text pop-ins
- **Soft** — soft dissolves, gentle music, handwritten-style captions
- **Minimal** — clean white titles, slow fade, ambient music
- **Family Album** — scrapbook aesthetic, paper texture, polaroid frames

**Screen D — Film Wizard — Step 3: Customise**  
Title card text (appears at the start). End card text. Music selection (5 pre-cleared tracks per style). Caption style (auto-generate captions from Moment captions, or manual). Duration selector (10s / 30s / 60s). Kinetik watermark toggle.

"Preview" button → plays rendered preview in-app.

**Screen E — Render & Export**  
"Create film" button. Progress bar (rendered client-side using Canvas API / OffscreenCanvas + requestAnimationFrame, or server-side via an Edge Function for complex templates).

On complete:
- Play in-app (full screen)
- Download as MP4 (720p or 1080p option)
- Share to Moments feed (posts as a Moment with `[Cinema]` tag)
- Share link (direct video URL from Supabase Storage)

Emit `moment.created` on share to circle + `moment.styled` on any template applied.

**Technical note**: v1 renders using HTML Canvas (client-side). Complex animations may require a server-side render worker. Start client-side, move to server as needed.

---

### S-95 · Family Album

**Route**: `/apps/family-album`

**Energy**: Story 🟡  
**Economy events**: `moment.created` (album published to circle)

**Design principle**: A curated, beautiful photo album — like a printed family album but digital. Two sources: Moments library (auto-pull) or manual upload. Kin helps arrange and title pages. Output: a browsable in-app album AND an exportable PDF.

**Screen A — My Albums**  
Shelf view (like a bookshelf — album spines with titles and dates). Tap an album to open it. "Create new album" FAB.

**Screen B — Album Wizard — Choose Photos**  
Three source options:
1. **From Moments** — pull from circle's Moments library (filtered by date range or member)
2. **Upload photos** — direct upload (multi-select from device gallery)
3. **Mix both** — combine Moments and uploads

After selection: Kin auto-arranges into a suggested layout (chronological, then grouped by event/location if metadata available).

**Screen C — Album Editor**  
Page-by-page view. Each page shows a layout template (1 photo / 2 photos / 3-photo grid / featured + small). Drag photos between slots. Tap any photo slot to swap. Add caption per photo. Add page title. Add decorative element chips (📍 location tag / 📅 date / 👨‍👩‍👧 member tags).

Templates: Classic White / Dark Cinema / Polaroid / Scrapbook / Minimal.

**Screen D — Album Preview**  
Full-screen page-turner view (swipe left/right between pages). Shows what the final album looks like. "Edit" to go back. "Publish" to share to circle.

**Screen E — Published Album**  
Visible to all circle members. Each member can react per page (❤️ / 😂 / 😭 / 🔥) and add comments per page. "Download as PDF" button generates a print-ready PDF version (Supabase Edge Function renders it).

---

## Part 17 — Agent Mapping

---

### The Agent Architecture

Kin (the agent) has one identity but contextual intelligence. It knows:
1. **Who you are** — name, role, age, circle membership
2. **What you're doing now** — current route, recent app usage
3. **Your circle's state** — calendar events, recent Moments, economy balances, active quests
4. **Your history** — past conversations, confirmed actions, patterns over time

Kin has two modes:
- **Reactive** (user-initiated): user taps the orb or types "@kin"
- **Proactive** (context-triggered): Kin surfaces suggestions without being asked

All Kin writes are gated by an **Action Preview Card** (S-71). No exceptions. Kin never writes silently.

---

### Universal Kin Capabilities (available from any screen)

| Command phrase | Action | Preview card |
|---|---|---|
| "What's on today?" | Reads today's calendar + active quests | Summary card (read-only) |
| "Add {thing} to calendar" | Creates calendar event | Event preview card |
| "Remind me to {thing} at {time}" | Creates notification | Reminder preview card |
| "Who earned the most diamonds this week?" | Reads leaderboard | Text reply |
| "Gift {name} {amount} diamonds" | Triggers diamond.gift | Gift preview card (leader only) |
| "What did {name} do today?" | Reads person's economy events | Activity summary card |
| "What should we do tonight?" | Cross-references calendar + circle energy + apps | Suggestion card |
| "Start a {app name} session" | Navigates to app | Direct navigation (no preview needed) |
| "Log a {memory/moment}" | Opens camera → Capture Moment | |
| "Plan this week" | Reads existing + suggests routine | Week plan preview card |

---

### Per-App Agent Profile

Each app declares its agent profile at registration time. This is what Kin knows about each app.

---

#### Home Quest — Agent Profile

```
monitors:
  - overdue tasks (triggers proactive alert)
  - tasks pending approval (notifies leaders)
  - task streaks (triggers encouragement)

proactive triggers:
  - "Mia hasn't had any tasks in 3 days — add a chore?"
  - "There are 2 tasks pending your approval"
  - "Noah just completed his 7th day chore streak! 🔥"
  - Every morning at 8am: "Today's tasks: [list]"

commands:
  - "Add a chore for {person}" → create task preview card
  - "What tasks are due today?" → text summary reply
  - "Approve {person}'s {task}" → approval preview card (leader only)
  - "Assign {task} to the whole circle" → create task for all members

readable:
  - all tasks in this circle (by member, by status, by due date)
  - completion rates per member
  - pending approvals
  - streak data per member
```

---

#### Math Quest — Agent Profile

```
monitors:
  - daily practice streak per person
  - domains with no recent practice (>5 days)
  - level-up moments (triggers celebration)

proactive triggers:
  - "Mia hasn't practiced maths in 3 days — her Fractions level might drop"
  - "Noah is 2 questions away from a level-up in Algebra!"
  - Every day at 4pm (school day): "Time for 10 minutes of maths 🧮"
  - After a mastery unlock: "Mia just mastered Fractions! 🏆 Consider increasing her challenge level"

commands:
  - "Start a maths session for {person}" → navigates to their Math Quest hub
  - "How is {person} doing in maths?" → summary: domains, levels, recent scores
  - "Set {person}'s starting level to {domain}" → preview card (leader only)
  - "What maths should we focus on this week?" → recommendation based on gap analysis

readable:
  - all domain mastery levels per person
  - recent quiz scores (last 10 sessions)
  - weakest sub-topics per person
  - time-on-task per week
```

---

#### Primary Quest — Agent Profile

```
monitors:
  - unit completions (triggers celebration + next unit suggestion)
  - subject gaps (person is strong in English, weak in Science)
  - stage progression (recommend stage up)

proactive triggers:
  - "Mia hasn't done any English this week — she's mid-unit"
  - "Noah completed his Geography unit! Shall I unlock the next one?"
  - Weekly: "This week's Primary Quest summary: [units completed, badges earned]"
  - "Mia has completed all Stage 3 units! Consider moving her to Stage 4"

commands:
  - "What is {person} studying in Primary Quest?" → current units per subject
  - "Assign {subject} unit {n} to {person}" → preview card (leader only)
  - "Create a quiz for {topic}" → not in v1, future
  - "What subjects is {person} behind on?" → gap analysis report

readable:
  - current stage per person
  - all unit completion status per subject
  - quiz scores
  - last active subject + date
```

---

#### Grocery Run — Agent Profile

```
monitors:
  - low-stock signals from Kitchen Buddy
  - upcoming meal plan (ingredients needed)
  - list completion (shop done → prompt approval)

proactive triggers:
  - "Kitchen Buddy says you're out of 3 ingredients for tonight's dinner"
  - "Your weekly shop usually happens on Fridays — shall I prepare the list?"
  - "The grocery list has 12 items — {person} is near a shop, want to assign it?"
  - After shop confirmed: notify leader to approve

commands:
  - "Add {items} to the grocery list" → bulk add preview card
  - "What's on the grocery list?" → text list reply
  - "Clear the completed items" → preview card
  - "Who did the last shop?" → text reply from task history
  - "Generate a shopping list from this week's meal plan" → Kitchen Buddy cross-link → preview card

readable:
  - current list (all items, checked/unchecked)
  - past shop history
  - pending approval status
```

---

#### Kitchen Buddy — Agent Profile

```
monitors:
  - expiring fridge items (triggers waste-prevention alert)
  - meal plan gaps (no dinner planned for Thursday)
  - cooking streaks

proactive triggers:
  - "🥩 3 items expire tomorrow — here are 2 recipes that use them"
  - "No dinner planned for Thursday — want me to suggest something?"
  - "You've cooked 5 new recipes this month! Buddy is impressed 🍳"
  - On shop complete (from Grocery Run): "Your new ingredients are in — here's what you can cook tonight"

commands:
  - "What can I cook with {ingredients}?" → recipe suggestion with preview
  - "Plan this week's dinners" → 7-dinner plan preview card (each dinner a confirmable item)
  - "Add {recipe} to meal plan for {day}" → preview card
  - "What's in the fridge?" → text reply from inventory
  - "Import recipe from {URL}" → web fetch → preview card with parsed recipe
  - "Add ingredients for {recipe} to grocery list" → cross-app preview card

readable:
  - fridge/pantry inventory
  - meal plan for the week
  - recipe library (titles, cuisine, last cooked)
  - cooking history and frequency
```

---

#### Padel Matchday — Agent Profile

```
monitors:
  - win/loss trends (encourage after losing streak)
  - training frequency (flag if no training in 5 days)
  - upcoming matches (calendar cross-link)

proactive triggers:
  - "You've lost 3 in a row — Coach Hub has a tactics session for you 🎾"
  - "No padel training logged this week — want to schedule a session?"
  - "Your match against {opponent} is tomorrow at {time}" (calendar cross-link)
  - After a win: "Great win! That's your {n}th win this month 🏆"

commands:
  - "Log a padel win/loss" → match log preview card
  - "Log a training session" → training log preview card
  - "What's my win rate this month?" → text reply
  - "Schedule a padel match for {date}" → calendar event preview card
  - "Who's my best doubles partner?" → stats reply from match history

readable:
  - all match results (date, score, opponent, partner)
  - training sessions (date, duration, focus)
  - win/loss/draw counts
  - best partner stats
  - training frequency over time
```

---

#### Coach Hub — Agent Profile

```
monitors:
  - check-in gaps (no daily check-in in 2+ days)
  - goal progress (deadline approaching)
  - presentation prep events (calendar cross-link)
  - stress signals in life check-ins (low mood + low energy + "blocking" theme)

proactive triggers:
  - "You haven't checked in today — 60 seconds to log how you're doing?"
  - "Your goal '{goal}' has a deadline in 5 days — here's today's action step"
  - "You have a presentation on {date} — want to do a prep session with Coach Hub?"
  - "Your last 3 life check-ins show consistent stress — your sport coach has a recovery session ready"
  - "You haven't reflected in a week — Kin has a question for you"

commands:
  - "Start a life coaching session" → navigates to life coach check-in
  - "Help me make a decision about {topic}" → decision coach flow
  - "Prep me for my presentation on {date}" → presentation prep wizard
  - "What are my active goals?" → text reply
  - "Log a training session" → sport coaching session log (cross-links Padel)
  - "I need a mindfulness moment" → navigates to Health Advisor mind space
  - "How am I doing vs. my goals?" → progress summary across all tracks

readable:
  - all life check-ins (mood, energy, notes — private)
  - all active goals + progress
  - reflection journal entries (private)
  - training session history
  - presentation prep documents
  - calendar events (for context — upcoming presentations, matches)
```

---

#### Health Advisor — Agent Profile

```
monitors:
  - daily check-in completion (proactive nudge if missed)
  - mood/energy downward trends (gentle alert)
  - appointment prep requests
  - symptom patterns (cross-reference over time)

proactive triggers:
  - (Morning) "Good morning — how are you feeling today? Quick 30-second check-in"
  - (After 3 missed check-ins) "Haven't heard from you in a few days — everything ok?"
  - (Downward mood trend detected) "I've noticed lower energy this week. The Mind Space has a 5-minute reset if you need it"
  - "You have a doctor's appointment in your calendar — shall I prepare your symptom summary?"

IMPORTANT — Kin boundaries for Health Advisor:
  - Kin NEVER says: "You might have X condition", "This sounds like Y disorder", "You should take Z"
  - Kin ALWAYS says: "I noticed you mentioned {symptom} a few times — worth mentioning to your doctor?"
  - Kin routes ALL medical questions to: "That's a great question for your doctor — I can help you write it down for your next appointment"
  - Kin can suggest: mindfulness, breathing, sleep hygiene, hydration, movement — never clinical interventions

commands:
  - "Log how I'm feeling" → check-in flow
  - "I have a headache" → logs as symptom, reminds user to mention to doctor
  - "Prepare for my appointment" → generates symptom summary
  - "I need to calm down" → navigates to breathing exercise
  - "How has my mood been this week?" → trend summary (private, never shown to circle)

readable (PRIVATE — person only):
  - all daily check-ins
  - symptom log
  - mood trend
  - mind space sessions completed

NOT readable by:
  - other circle members
  - leaders/co-leaders
  - Kin when responding to circle-level queries
```

---

#### Kinetik Cinema — Agent Profile

```
monitors:
  - significant Moments milestones (birthday, 100th moment, first family trip)
  - end of month / end of year (suggests a recap film)
  - special calendar events (birthday party, school play, holiday)

proactive triggers:
  - "It's the end of the month — want me to create a 30-second film of your best moments?"
  - "Mia's birthday was this week — here are the best photos. Want a birthday film?"
  - "You just hit 100 Moments in this circle — Kin wants to make something special 🎬"
  - "School year is ending — a 60-second end-of-year film is ready for your approval"

commands:
  - "Make a film from last month's moments" → film wizard with pre-selected moments
  - "Create a birthday film for {name}" → Kin selects moments featuring that person
  - "Make a {10s/30s/60s} TikTok of our holiday" → pre-selects by date range
  - "Film all moments from {date range}" → manual date range selection
  - "What films have we made?" → text list reply

readable:
  - all Moments in circle (photos, captions, dates, reactions)
  - calendar events (for context tagging)
  - circle members (for person-specific filters)
```

---

#### Family Album — Agent Profile

```
monitors:
  - significant date clusters in Moments (many photos on one day → likely an event)
  - end of year / seasonal milestones
  - album completion rates

proactive triggers:
  - "You took 47 photos on {date} — that looks like a special day. Want to create an album?"
  - "December is ending — want a 2026 family album?"
  - "Mia's first year of school just finished — a school year album?"

commands:
  - "Create a family album from {month/year}" → album wizard pre-filtered by date
  - "Make an album for {person}'s birthday" → Kin selects moments featuring that person
  - "Add all our holiday photos to an album" → date range selection
  - "What albums have we made?" → shelf view shortcut

readable:
  - all Moments + uploaded photos
  - calendar events (for event context)
  - circle members (for person filters)
```

---

### Agent Capability Matrix

| Capability | Home Quest | Math Quest | Primary Quest | Grocery Run | Kitchen Buddy | Padel | Coach Hub | Health Advisor | Cinema | Family Album |
|---|---|---|---|---|---|---|---|---|---|---|
| **Read app data** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 🔒 private | ✓ | ✓ |
| **Create records** | ✓ | — | — | ✓ | ✓ | ✓ | ✓ | ✓ | — | — |
| **Modify records** | ✓ | ✓(level) | ✓(stage) | ✓ | ✓ | ✓ | ✓ | ✓ | — | — |
| **Trigger economy** | ✓ approval | ✓ indirect | ✓ indirect | ✓ approval | ✓ task | ✓ direct | ✓ indirect | ✓ indirect | ✓ direct | ✓ direct |
| **Proactive nudges** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (gentle) | ✓ | ✓ |
| **Cross-app context** | Calendar | Buddy/xp | Buddy/xp | Kitchen Buddy | Grocery Run | Calendar/Coach | Calendar/Health/Padel | Coach Hub | Moments | Moments |
| **Circle-visible** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ private | ✓ | ✓ |
| **Preview card required** | always | always | always | always | always | always | always | always | always | always |

**🔒 private** = data visible only to the individual person, not to Kin's circle-context queries.

---

### How to Add a New App to the Agent System

When any new app is added to Kinetik, it must register an agent profile in the `app_registry` table:

```typescript
interface AppAgentProfile {
  appId: string;

  // What Kin passively watches
  monitors: {
    signal: string;           // e.g. "no practice in 3 days"
    proactiveMessage: string; // what Kin says
    channel: 'person' | 'circle' | 'leader'; // who gets notified
  }[];

  // What Kin can do on command
  commands: {
    phrases: string[];        // natural language variations
    action: string;           // internal action identifier
    requiresLeader: boolean;
    outputType: 'preview_card' | 'navigate' | 'text_reply';
    previewTemplate: string;  // what the preview card says
  }[];

  // What data Kin can read
  readable: {
    collection: string;       // Supabase table or view
    scope: 'person' | 'circle';
    private: boolean;         // if true, never exposed to circle queries
  }[];

  // Economy awareness
  economyEvents: string[];    // event types this app can emit
  crossLinks: string[];       // other appIds this app shares context with
}
```

Any app that registers this profile gets full Kin integration automatically. No custom Kin code per app. The agent reads the profiles and routes accordingly.

---

*Next step: For each P0 screen, design wireframes in Figma or code a Storybook component. The screen IDs above can be used as Figma frame names and Storybook story IDs.*
