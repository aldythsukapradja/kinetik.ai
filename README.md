# Kinetik.ai Workspace

This folder is the current single-file Kinetik prototype plus its app ecosystem.

## LLM Reading Order

Any LLM or builder should read these first, in order:

1. `KINETIK_HANDOFF.md` - current architecture, working features, limits, and next work.
2. `KINETIK_AGENT_SYSTEM.md` - Buddy, diamonds, `@kin`, cross-app actions, Moment Studio, and the deterministic agent model.
3. `APP_BUILD_STANDARD.md` - how to build portable `App_*.html` apps that plug back into Kinetik.
4. `KINETIK_APP_AUDIT.md` - current app list, roles, maturity, gaps, and economy posture.
5. `KINETIK_APP_HOUSEKEEPING.md` - cleanup order and app maturity matrix.
6. `Code.gs` - current Google Apps Script backend and Sheets schema.
7. `index.html` - current shell implementation.

## Hard Rules

- Do not change Buddy, diamonds, `@kin`, agent cards, app rewards, cross-app actions, or Moment Studio without reading `KINETIK_AGENT_SYSTEM.md`.
- Do not add or port an app without reading `APP_BUILD_STANDARD.md`.
- Every app should be one `App_<Category><Name>.html` file with its manifest and inline SVG icon inside the HTML.
- After app manifest changes, run `node build_app_catalog.mjs`.
- The prototype backend is Google Apps Script now; the target scale path is Supabase plus Vercel.

## Product Direction

Kinetik is a private app world for family and friends. The app system should feel
like a living home screen: useful apps, shared circles, memories, calendar, chat,
and one emotional companion that reacts to meaningful progress.
