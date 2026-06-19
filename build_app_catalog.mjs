import fs from "node:fs";

const ROOT = new URL(".", import.meta.url);
const INDEX = new URL("index.html", ROOT);
const APP_RE = /^App_.*\.html$/i;
const START = "/*KINETIK_APPS_START*/";
const END = "/*KINETIK_APPS_END*/";
const CHECK = process.argv.includes("--check");

const CAT_PREFIX = {
  game: "games", games: "games",
  sport: "sports", sports: "sports",
  productivity: "productivity", pro: "productivity", work: "productivity",
  social: "social",
  entertainment: "entertainment", ent: "entertainment", fun: "entertainment"
};
const CAT_KEYWORD = [
  [/(padel|tennis|basket|football|soccer|golf|swim|box|run|volley|pickle|americano|sport)/i, "sports"],
  [/(chess|clash|emoji|ladder|lucky|trivia|riddle|memory|word|game|quiz|play)/i, "games"],
  [/(poll|movie night|restaurant|weekend|gift|vote|party|circle|invite|social)/i, "social"],
  [/(video|music|watch|stream|player|show|movie|media)/i, "entertainment"]
];
const ALLOWED_CATS = ["games", "sports", "productivity", "social", "entertainment"];
const ALLOWED_CIRCLE_TYPES = ["family", "friends"];
const ALLOWED_WORKS_WITH = ["calendar", "moments", "media", "offline", "standalone"];
const ALLOWED_AUDIENCE = ["all", "kids", "adults"];
const ALLOWED_STATUS = ["live", "soon"];
const REQUIRED = ["appId", "name", "icon", "gradient", "category", "tagline", "about", "circleTypes", "worksWith"];
const ICONS = {
  Chess: "♟️", Clash: "⚡", Emoji: "😄", Ladder: "🎲", Lucky: "🎡",
  Padel: "🎾", Tennis: "🎾", Basket: "🏀", Football: "⚽", Golf: "⛳",
  Guitar: "🎸", Piano: "🎹", Times: "✖️", Table: "✖️", Philosophy: "🧩",
  Data: "🔎", Grocery: "🛒", Cook: "🍳", Meal: "🍽️", Poll: "🐣",
  Buddy: "🐣", Movie: "🎬", Cinema: "🎬", Quiz: "❓", Charisma: "🗣️",
  Present: "🎤", Wisdom: "📘", Clock: "⏱️", Habit: "🌱", Read: "📚",
  Money: "💰", Behaviour: "🌱", Agentic: "🤖", Articulation: "🎙️"
};

function appWords(file) {
  return String(file).replace(/^App[_-]?/, "").replace(/\.html?$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
}

function parseAppFile(file) {
  const words = appWords(file);
  const first = (words[0] || "").toLowerCase();
  let category = CAT_PREFIX[first] || null;
  let rest = words;
  if (category) rest = words.slice(1);
  if (!category) {
    const joined = words.join(" ");
    const hit = CAT_KEYWORD.find(([re]) => re.test(joined));
    category = hit ? hit[1] : "productivity";
  }
  if (!ALLOWED_CATS.includes(category)) category = "productivity";
  return { category, name: (rest.join(" ") || words.join(" ") || "App").trim() };
}

function fileId(file) {
  return String(file).replace(/^App[_-]?/i, "").replace(/\.html?$/i, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase().replace(/^-+|-+$/g, "") || "app";
}

function guessIcon(name) {
  const key = Object.keys(ICONS).find(w => new RegExp(w, "i").test(name));
  return ICONS[key] || "✦";
}

function cleanList(values, allowed, fallback) {
  if (!Array.isArray(values)) return fallback;
  const kept = values.filter(v => allowed.includes(v));
  return kept.length ? [...new Set(kept)] : fallback;
}

function titleOf(html) {
  const m = String(html).match(/<title>([\s\S]*?)<\/title>/i);
  return m ? m[1].replace(/\s*[-–|]\s*Kinetik.*$/i, "").trim() : "";
}

function manifestOf(html, file, issues) {
  const m = String(html).match(/<script[^>]*type=["']application\/kinetik-app\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!m) {
    issues.push(`${file}: missing application/kinetik-app+json manifest`);
    return null;
  }
  try {
    return JSON.parse(m[1].trim());
  } catch (err) {
    issues.push(`${file}: invalid manifest JSON (${err.message})`);
    return null;
  }
}

function validateManifest(file, j, issues) {
  if (!j) return;
  for (const key of REQUIRED) {
    const value = j[key];
    if (value == null || value === "" || (Array.isArray(value) && !value.length)) {
      issues.push(`${file}: manifest missing ${key}`);
    }
  }
  if (typeof j.appId === "string" && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(j.appId)) {
    issues.push(`${file}: appId must be kebab-case`);
  }
  if (j.shortName && String(j.shortName).length > 14) {
    issues.push(`${file}: shortName should be 14 characters or fewer`);
  }
  if (!ALLOWED_CATS.includes(j.category)) {
    issues.push(`${file}: category must be one of ${ALLOWED_CATS.join(", ")}`);
  }
  if (!Array.isArray(j.gradient) || j.gradient.length < 2 || j.gradient.some(c => !/^#[0-9a-f]{3,8}$/i.test(String(c)))) {
    issues.push(`${file}: gradient must contain two hex colors`);
  }
  const icon = String(j.icon || "").trim();
  if (!/^<svg\b/i.test(icon)) {
    issues.push(`${file}: icon must be an inline SVG stored in the app manifest`);
  }
  if (/<text\b/i.test(icon)) {
    issues.push(`${file}: icon must be a symbolic SVG, not a text/initial lettermark`);
  }
  if (j.audience && !ALLOWED_AUDIENCE.includes(j.audience)) {
    issues.push(`${file}: audience must be one of ${ALLOWED_AUDIENCE.join(", ")}`);
  }
  if (!Array.isArray(j.circleTypes) || j.circleTypes.some(v => !ALLOWED_CIRCLE_TYPES.includes(v))) {
    issues.push(`${file}: circleTypes must use only ${ALLOWED_CIRCLE_TYPES.join(", ")}`);
  }
  if (!Array.isArray(j.worksWith) || j.worksWith.some(v => !ALLOWED_WORKS_WITH.includes(v))) {
    issues.push(`${file}: worksWith must use only ${ALLOWED_WORKS_WITH.join(", ")}`);
  }
  if (j.status && !ALLOWED_STATUS.includes(j.status)) {
    issues.push(`${file}: status must be live or soon`);
  }
  if (j.rating !== undefined) issues.push(`${file}: manifest must not include rating`);
  if (j.version !== undefined) issues.push(`${file}: manifest must not include version`);
}

function catalogEntry(file, html, j) {
  const pf = parseAppFile(file);
  const name = j.name || titleOf(html) || pf.name;
  const avatar = String(j.avatar || j.homeIcon || j.homeGlyph || guessIcon(name));
  return {
    id: fileId(file),
    appId: j.appId || fileId(file),
    name,
    shortName: j.shortName || name,
    file,
    glyph: String(j.icon || guessIcon(name)),
    avatar,
    homeGlyph: avatar,
    gradient: Array.isArray(j.gradient) && j.gradient.length ? j.gradient : ["#6366f1", "#22d3ee"],
    category: pf.category,
    tagline: j.tagline || "",
    status: j.status === "soon" ? "soon" : "live",
    allowed: cleanList(j.circleTypes, ALLOWED_CIRCLE_TYPES, ["family", "friends"]),
    active: true,
    audience: j.audience || "all",
    worksWith: cleanList(j.worksWith, ALLOWED_WORKS_WITH, ["standalone"]),
    emits: Array.isArray(j.emits) ? [...new Set(j.emits.map(String).filter(Boolean))] : [],
    minMembers: j.minMembers || 1,
    desc: j.about || j.tagline || ""
  };
}

function scriptJson(value) {
  return JSON.stringify(value, null, 2).replace(/<\//g, "<\\/");
}

const files = fs.readdirSync(ROOT)
  .filter(name => APP_RE.test(name))
  .sort((a, b) => a.localeCompare(b));

const issues = [];
const seenAppIds = new Map();
const catalog = [];

for (const file of files) {
  const html = fs.readFileSync(new URL(file, ROOT), "utf8");
  const manifest = manifestOf(html, file, issues);
  validateManifest(file, manifest, issues);
  if (!manifest) continue;
  if (seenAppIds.has(manifest.appId)) {
    issues.push(`${file}: duplicate appId also used by ${seenAppIds.get(manifest.appId)}`);
  }
  seenAppIds.set(manifest.appId, file);
  catalog.push(catalogEntry(file, html, manifest));
}

if (issues.length) {
  console.error(`Kinetik catalog failed with ${issues.length} issue${issues.length === 1 ? "" : "s"}:`);
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

const catalogJs = `const BUILTIN_APP_CATALOG=${scriptJson(catalog)};`;
const seedJs = `const SEED_FILES=${scriptJson(files)};`;

const original = fs.readFileSync(INDEX, "utf8");
const start = original.indexOf(START);
const end = original.indexOf(END);
if (start < 0 || end < 0 || end < start) throw new Error("KINETIK app catalog markers not found");

let next = original.slice(0, start + START.length) + "\n" + catalogJs + "\n" + original.slice(end);
next = next.replace(/const SEED_FILES=\[[\s\S]*?\];/, seedJs);

if (CHECK) {
  if (next !== original) {
    console.error("Kinetik catalog is stale. Run: node build_app_catalog.mjs");
    process.exit(1);
  }
  console.log(`Kinetik catalog is fresh: ${catalog.length} apps`);
} else {
  fs.writeFileSync(INDEX, next, "utf8");
  console.log(`Wrote ${catalog.length} apps into index.html`);
}
