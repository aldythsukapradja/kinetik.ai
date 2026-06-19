/*
KINETIK GOOGLE SHEETS BACKEND v2.0 — adds the MOMENTS MEDIA PIPELINE

PRODUCT: Kinetik — private life app for Family + Friends circles. Plans. People. Play.
FRONTEND: Kinetik.html main shell + App_*.html modular apps (embedded or standalone PWA).
BACKEND: Google Sheets via this Apps Script web app. Generic CRUD, JSON responses.

CORE SHEETS (run setupKinetik() once to create them):
Users People Circles CircleMembers Relationships Calendar_Routines Calendar_Events
Calendar_Exceptions AppCatalog CircleApps AppRecords AgentLogs Settings AuditLog
KinetikEvents DiamondEvents BuddyState

RULES:
1. Generic CRUD endpoints only. 2. circleId, never familyId. 3. personId, never memberId.
4. App data goes in AppRecords. 5. No production passwords. 6. Consistent JSON envelope.
7. Keep replaceable by Firebase: stable ids, circleId scoping, createdAt/updatedAt.

Firebase scale-up note:
- This Apps Script backend is a prototype adapter. UI must call DataAPI, not this directly.
- Future Firebase replacement preserves collection names, IDs, circleId scoping, permissions.
- Firestore security rules must enforce circle membership server-side.

DEPLOY:
1. Create a Google Sheet, open Extensions > Apps Script, paste this file.
2. Run setupKinetik() once (authorize when prompted).
3. Deploy > New deployment > Web app > Execute as: Me, Access: Anyone.
4. Paste the web app URL into Kinetik > Me > Advanced > Backend: Google Sheets.

API:
GET  ?action=list&collection=Calendar_Events&circleId=c_family
GET  ?action=get&collection=People&id=p_aldyth
POST body JSON {action:"create"|"update"|"remove", collection, id, payload}
All responses: {ok:true, items:[...]} or {ok:false, error:"..."}

MOMENTS MEDIA PIPELINE (v2):
POST actions: uploadMedia, createMemoryLine, listMemoryLines,
              createMomentStory, listMomentStories, ensureSetup, healthCheck
ECONOMY actions: recordKinetikEvent, getEconomyState, listDiamondEvents
- Files live in Google Drive: Kinetik_Media/circles/{circleId}/{memory-lines|moment-stories}
- Metadata lives in sheets: MediaAssets, MemoryLines, MomentStories
- Uploaded files are set to "anyone with link can VIEW" — PROTOTYPE PRIVACY ONLY.
  Production must use Firebase/Supabase private storage + authenticated access.
- Stories are PERMANENT (family memory vault — no 24h expiry). expiresAt column
  is reserved/blank for a future optional ephemeral mode.
- Validation: Memory Line caption >= 1 char. Story title 3-40 chars.

REDEPLOY NOTE: after pasting this file, use Deploy > Manage deployments >
edit (pencil) > Version: New version — the web app URL stays the same.
*/

var SHEETS = [
  "Users","People","Circles","CircleMembers","Relationships",
  "Calendar_Routines","Calendar_Events","Calendar_Exceptions",
  "AppCatalog","CircleApps","AppRecords","AgentLogs","Settings","AuditLog",
  "KinetikEvents","DiamondEvents","BuddyState",
  "MediaAssets","MemoryLines","MomentStories","Comments","Messages","Reactions"
];

/* Moments media pipeline config */
var MEDIA_ROOT = "Kinetik_Media";
var STORY_MIN_TITLE = 3, STORY_MAX_TITLE = 40, MEMORY_MIN_CAPTION = 1;
var MEMORY_MIN_TITLE = 2, MEMORY_MAX_TITLE = 60, COMMENT_MAX = 300;
var ECONOMY_RULES = {
  "task.completed":{energy:"Care",defaultAmount:0,maxPerEvent:0,dailyCap:0,mood:"waiting"},
  "task.approved":{energy:"Care",defaultAmount:8,maxPerEvent:30,dailyCap:80,mood:"proud"},
  "practice.completed":{energy:"Growth",defaultAmount:3,maxPerEvent:12,dailyCap:45,mood:"focused"},
  "mastery.unlocked":{energy:"Growth",defaultAmount:15,maxPerEvent:40,dailyCap:80,mood:"amazed"},
  "game.round.completed":{energy:"Play",defaultAmount:2,maxPerEvent:8,dailyCap:30,mood:"playful"},
  "game.win":{energy:"Play",defaultAmount:5,maxPerEvent:15,dailyCap:35,mood:"hyped"},
  "calendar.created":{energy:"Circle",defaultAmount:2,maxPerEvent:5,dailyCap:15,mood:"organized"},
  "reflection.saved":{energy:"Growth",defaultAmount:2,maxPerEvent:8,dailyCap:25,mood:"thoughtful"},
  "moment.created":{energy:"Story",defaultAmount:3,maxPerEvent:10,dailyCap:25,mood:"glowing"},
  "moment.styled":{energy:"Story",defaultAmount:2,maxPerEvent:8,dailyCap:20,mood:"sparkly"},
  "buddy.quest.completed":{energy:"Care",defaultAmount:12,maxPerEvent:35,dailyCap:80,mood:"celebrating"},
  "diamond.gift":{energy:"Circle",defaultAmount:10,maxPerEvent:100,dailyCap:500,mood:"generous"}
};

var HEADERS = {
  Users:["id","username","displayName","email","passwordDemo","avatar","defaultPersonId","createdAt","updatedAt","active"],
  People:["id","displayName","avatar","color","birthYear","notes","createdByUserId","createdAt","updatedAt","active"],
  Circles:["id","name","type","ownerUserId","icon","color","description","createdAt","updatedAt","active"],
  CircleMembers:["id","circleId","personId","userId","role","permission","joinedAt","active"],
  Relationships:["id","circleId","fromPersonId","toPersonId","relationshipType","reverseRelationshipType","notes","createdAt","active"],
  Calendar_Routines:["id","circleId","title","participantPersonIdsJson","responsiblePersonId","dayOfWeek","startTime","endTime","category","location","teacherCoach","preparationJson","repeatRule","notes","createdAt","updatedAt","active","durationMin"],
  Calendar_Events:["id","circleId","title","date","startTime","endTime","participantPersonIdsJson","responsiblePersonId","category","location","preparationJson","notes","createdAt","updatedAt","active","durationMin","endDate"],
  Calendar_Exceptions:["id","circleId","routineId","date","action","newStartTime","newEndTime","reason","createdAt","updatedAt"],
  AppCatalog:["id","name","shortName","file","category","status","version","tagline","description","iconType","gradient","defaultInstalledForCircleTypesJson","allowedCircleTypesJson","pwaManifest","createdAt","updatedAt","active"],
  CircleApps:["id","circleId","appId","installed","order","pinned","allowedPersonIdsJson","settingsJson","installedAt","updatedAt"],
  AppRecords:["id","circleId","appId","collection","ownerPersonId","payloadJson","createdAt","updatedAt","deleted","version"],
  AgentLogs:["id","circleId","userId","personId","prompt","intent","responseType","artifactJson","actionJson","createdAt"],
  Settings:["id","scope","scopeId","key","valueJson","updatedAt"],
  AuditLog:["id","circleId","userId","action","targetCollection","targetId","detailJson","createdAt"],
  KinetikEvents:["id","circleId","personId","userId","appId","eventType","sourceRecordId","proposedAmount","metadataJson","status","reason","createdAt"],
  DiamondEvents:["id","kinetikEventId","circleId","personId","userId","appId","eventType","energy","amount","capApplied","reason","sourceRecordId","metadataJson","createdAt"],
  BuddyState:["circleId","diamonds","xp","level","mood","energyJson","byPersonJson","lastReaction","updatedAt"],
  /* --- Moments media pipeline (v2) --- */
  MediaAssets:["mediaId","circleId","ownerUserId","type","mimeType","driveFileId","driveUrl","viewUrl","fileName","fileSize","createdAt","status"],
  MemoryLines:["postId","circleId","authorUserId","caption","mediaIdsJson","createdAt","status","title"],
  MomentStories:["storyId","circleId","authorUserId","title","mediaId","caption","createdAt","expiresAt","status"],
  Comments:["commentId","circleId","postId","authorUserId","text","createdAt","status"],
  Messages:["id","circleId","authorUserId","text","createdAt","status"],
  /* one row per (postId,userId); emoji is the chosen reaction, status=deleted when cleared */
  Reactions:["reactionId","circleId","postId","userId","emoji","createdAt","status"]
};

/* ---------- setup ---------- */
function setupKinetik() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  SHEETS.forEach(function (name) {
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    var head = HEADERS[name];
    sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight("bold");
    sh.setFrozenRows(1);
  });
}

/* ---------- helpers ---------- */
function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
function sheetOf(collection) {
  if (SHEETS.indexOf(collection) === -1) throw new Error("Unknown collection: " + collection);
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(collection);
  if (!sh) throw new Error("Sheet missing: " + collection + " (run setupKinetik)");
  return sh;
}
/* Sheets coerces "15:00" into a TIME value; reading it returns a 1899-epoch Date
   that JSON.stringify shifts by the sheet's historical TZ offset (-> wrong time in
   the app). Re-format any Date cell in the spreadsheet's OWN timezone so HH:mm
   round-trips exactly. Time cols -> "HH:mm", date col -> "yyyy-MM-dd", else ISO. */
var _TZ_ = null;
function ssTz_() { if (!_TZ_) _TZ_ = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(); return _TZ_; }
function fmtCell(key, v) {
  if (Object.prototype.toString.call(v) === "[object Date]") {
    var tz = ssTz_();
    if (/time$/i.test(key)) return Utilities.formatDate(v, tz, "HH:mm");
    if (/date$/i.test(key)) return Utilities.formatDate(v, tz, "yyyy-MM-dd");
    return Utilities.formatDate(v, tz, "yyyy-MM-dd'T'HH:mm:ss'Z'");
  }
  return v;
}
function readAll(collection) {
  var sh = sheetOf(collection), vals = sh.getDataRange().getValues();
  if (vals.length < 2) return [];
  var head = vals[0], rows = [];
  for (var i = 1; i < vals.length; i++) {
    var o = {};
    for (var j = 0; j < head.length; j++) o[head[j]] = fmtCell(head[j], vals[i][j]);
    if (o.id !== "" && o.id != null) { o._row = i + 1; rows.push(o); }
  }
  return rows;
}
function rowFromObj(collection, obj) {
  return HEADERS[collection].map(function (h) {
    var v = obj[h];
    if (v == null) return "";
    if (typeof v === "object") return JSON.stringify(v);
    return v;
  });
}
function clean(rows) {
  return rows.map(function (r) { var c = {}; for (var k in r) if (k !== "_row") c[k] = r[k]; return c; });
}

/* ---------- CRUD ---------- */
function listItems(collection, filters) {
  var rows = readAll(collection);
  if (filters) rows = rows.filter(function (r) {
    return Object.keys(filters).every(function (k) { return String(r[k]) === String(filters[k]); });
  });
  return clean(rows);
}
function createItem(collection, payload) {
  payload.id = payload.id || collection.slice(0, 2).toLowerCase() + "_" + Utilities.getUuid().slice(0, 8);
  payload.createdAt = payload.createdAt || new Date().toISOString();
  payload.updatedAt = new Date().toISOString();
  sheetOf(collection).appendRow(rowFromObj(collection, payload));
  return payload;
}
function updateItem(collection, id, payload) {
  var rows = readAll(collection);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].id) === String(id)) {
      var merged = {};
      for (var k in rows[i]) if (k !== "_row") merged[k] = rows[i][k];
      for (var k2 in payload) merged[k2] = payload[k2];
      merged.updatedAt = new Date().toISOString();
      sheetOf(collection).getRange(rows[i]._row, 1, 1, HEADERS[collection].length)
        .setValues([rowFromObj(collection, merged)]);
      return merged;
    }
  }
  throw new Error("Not found: " + id);
}
function removeItem(collection, id) {
  var rows = readAll(collection);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].id) === String(id)) { sheetOf(collection).deleteRow(rows[i]._row); return true; }
  }
  return false;
}
function audit(action, collection, id) {
  try {
    createItem("AuditLog", { circleId: "", userId: "", action: action, targetCollection: collection, targetId: id || "", detailJson: "" });
  } catch (e) { /* never block on audit */ }
}

/* ---------- web app entry points ---------- */
function doGet(e) {
  try {
    var p = e.parameter || {};
    var action = p.action || "list";
    if (action === "list") {
      var filters = {};
      Object.keys(p).forEach(function (k) { if (k !== "action" && k !== "collection") filters[k] = p[k]; });
      return out({ ok: true, items: listItems(p.collection, Object.keys(filters).length ? filters : null) });
    }
    if (action === "get") {
      var item = listItems(p.collection, { id: p.id })[0] || null;
      return out({ ok: true, items: item ? [item] : [] });
    }
    if (action === "ping" || action === "healthCheck") return out({ ok: true, items: [{ pong: new Date().toISOString(), version: "2.0" }] });
    return out({ ok: false, error: "Unknown GET action" });
  } catch (err) { return out({ ok: false, error: String(err) }); }
}

function doPost(e) {
  try {
    var b = JSON.parse(e.postData.contents || "{}");
    var col = b.collection, action = b.action;
    /* --- Moments media pipeline actions (v2) --- */
    if (action === "healthCheck") return out({ ok: true, items: [{ ts: new Date().toISOString(), version: "2.0" }] });
    if (action === "ensureSetup") return out(ensureSetup());
    if (action === "uploadMedia") return out(uploadMedia(b));
    if (action === "createMemoryLine") return out(createMemoryLine(b));
    if (action === "listMemoryLines") return out(listMemoryLines(b));
    if (action === "createMomentStory") return out(createMomentStory(b));
    if (action === "listMomentStories") return out(listMomentStories(b));
    if (action === "editMemoryLine") return out(editMemoryLine(b));
    if (action === "deleteMemoryLine") return out(deleteMemoryLine(b));
    if (action === "editMomentStory") return out(editMomentStory(b));
    if (action === "deleteMomentStory") return out(deleteMomentStory(b));
    if (action === "listComments") return out(listComments(b));
    if (action === "createComment") return out(createComment(b));
    if (action === "setReaction") return out(setReaction(b));
    if (action === "listReactions") return out(listReactions(b));
    if (action === "listMessages") return out(listMessages(b));
    if (action === "createMessage") return out(createMessage(b));
    if (action === "recordKinetikEvent") return out(recordKinetikEvent(b));
    if (action === "getEconomyState") return out(getEconomyState(b));
    if (action === "listDiamondEvents") return out(listDiamondEvents(b));
    /* shell sends "create"/"update"/"remove"; collection names map 1:1 where needed */
    var map = { routines: "Calendar_Routines", events: "Calendar_Events", exceptions: "Calendar_Exceptions",
                circleApps: "CircleApps", appRecords: "AppRecords", circles: "Circles",
                circleMembers: "CircleMembers", people: "People", users: "Users" };
    if (map[col]) col = map[col];
    if (action === "create") { var c = createItem(col, normalize(col, b.payload)); audit("create", col, c.id); return out({ ok: true, items: [c] }); }
    if (action === "update") { var u = updateItem(col, b.id, normalize(col, b.payload)); audit("update", col, b.id); return out({ ok: true, items: [u] }); }
    if (action === "remove") { removeItem(col, b.id); audit("remove", col, b.id); return out({ ok: true, items: [] }); }
    if (action === "list") return out({ ok: true, items: listItems(col, b.filters || null) });
    return out({ ok: false, error: "Unknown POST action" });
  } catch (err) { return out({ ok: false, error: String(err) }); }
}

/* frontend objects use arrays/objects; sheets store *Json columns */
function normalize(collection, payload) {
  var p = {};
  for (var k in payload) p[k] = payload[k];
  if (p.participantPersonIds) { p.participantPersonIdsJson = JSON.stringify(p.participantPersonIds); delete p.participantPersonIds; }
  if (p.preparation) { p.preparationJson = JSON.stringify(p.preparation); delete p.preparation; }
  if (p.payload) { p.payloadJson = JSON.stringify(p.payload); delete p.payload; }
  if (p.accent) { p.color = JSON.stringify(p.accent); delete p.accent; }
  delete p._row;
  return p;
}

/* =================================================================
   DIAMOND ECONOMY
   Apps propose KinetikEvents. Apps Script validates, caps, dedupes,
   writes DiamondEvents, then updates BuddyState per circle.
================================================================= */

function active_(v) {
  return v === true || v === "" || v == null || String(v).toLowerCase() === "true";
}
function jsonParse_(v, fallback) {
  if (v && typeof v === "object") return v;
  if (v === "" || v == null) return fallback;
  try { return JSON.parse(v); } catch (e) { return fallback; }
}
function economyError_(msg) {
  throw new Error("Economy: " + msg);
}
function circleMembers_(circleId) {
  return readSheet_("CircleMembers").rows.filter(function (m) {
    return String(m.circleId) === String(circleId) && active_(m.active);
  });
}
function assertCircleUser_(circleId, userId) {
  if (!circleId) economyError_("circleId required");
  if (!userId) economyError_("userId required");
  var rows = circleMembers_(circleId);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].userId) === String(userId)) return rows[i];
  }
  economyError_("user is not a member of this circle");
}
function assertEconomyAccess_(circleId, personId, userId) {
  var actor = assertCircleUser_(circleId, userId);
  if (!personId) economyError_("personId required");
  var rows = circleMembers_(circleId);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].personId) === String(personId)) {
      if (String(actor.personId) !== String(personId) && !isLeaderRole_(actor.role)) economyError_("only circle leaders can reward another member");
      return { actor: actor, subject: rows[i] };
    }
  }
  economyError_("person is not a member of this circle");
}
function isLeaderRole_(role) {
  return ["owner", "leader", "co-leader", "admin"].indexOf(String(role || "").toLowerCase()) !== -1;
}
function economyDay_(iso) {
  return String(iso || new Date().toISOString()).slice(0, 10);
}
function economyEventPayload_(row) {
  if (!row) return null;
  var out = {};
  for (var k in row) if (k !== "_row") out[k] = row[k];
  out.metadata = jsonParse_(row.metadataJson, {});
  out.amount = Number(row.amount || row.proposedAmount || 0);
  out.at = row.createdAt;
  delete out.metadataJson;
  return out;
}
function buddyDefault_(circleId) {
  return {
    circleId: circleId,
    diamonds: 0,
    xp: 0,
    level: 1,
    mood: "curious",
    energy: { Care: 0, Growth: 0, Play: 0, Move: 0, Circle: 0, Story: 0 },
    byPerson: {},
    lastReaction: "",
    updatedAt: ""
  };
}
function buddyFromRow_(row, circleId) {
  var st = buddyDefault_(circleId || (row && row.circleId) || "");
  if (!row) return st;
  st.diamonds = Number(row.diamonds || 0);
  st.xp = Number(row.xp || 0);
  st.level = Number(row.level || 1);
  st.mood = row.mood || "curious";
  st.energy = jsonParse_(row.energyJson, st.energy);
  st.byPerson = jsonParse_(row.byPersonJson, {});
  st.lastReaction = row.lastReaction || "";
  st.updatedAt = row.updatedAt || "";
  return st;
}
function getBuddyState_(circleId) {
  var rows = readSheet_("BuddyState").rows;
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].circleId) === String(circleId)) return buddyFromRow_(rows[i], circleId);
  }
  return buddyDefault_(circleId);
}
function saveBuddyState_(st) {
  var row = {
    circleId: st.circleId,
    diamonds: st.diamonds,
    xp: st.xp,
    level: st.level,
    mood: st.mood,
    energyJson: JSON.stringify(st.energy || {}),
    byPersonJson: JSON.stringify(st.byPerson || {}),
    lastReaction: st.lastReaction || "",
    updatedAt: st.updatedAt || new Date().toISOString()
  };
  var rows = readSheet_("BuddyState").rows;
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].circleId) === String(st.circleId)) {
      updateRowById_("BuddyState", "circleId", st.circleId, row);
      return st;
    }
  }
  appendRow_("BuddyState", row);
  return st;
}
function duplicateDiamond_(evt) {
  if (!evt.sourceRecordId) return null;
  var rows = readSheet_("DiamondEvents").rows;
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (String(r.circleId) === String(evt.circleId) &&
        String(r.personId) === String(evt.personId) &&
        String(r.appId) === String(evt.appId) &&
        String(r.eventType) === String(evt.eventType) &&
        String(r.sourceRecordId) === String(evt.sourceRecordId)) return r;
  }
  return null;
}
function duplicateKinetikEvent_(evt) {
  if (!evt.sourceRecordId) return null;
  var rows = readSheet_("KinetikEvents").rows;
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (String(r.circleId) === String(evt.circleId) &&
        String(r.personId) === String(evt.personId) &&
        String(r.appId) === String(evt.appId) &&
        String(r.eventType) === String(evt.eventType) &&
        String(r.sourceRecordId) === String(evt.sourceRecordId)) return r;
  }
  return null;
}
function usedToday_(evt) {
  var day = economyDay_(evt.createdAt), rows = readSheet_("DiamondEvents").rows, total = 0;
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (String(r.circleId) === String(evt.circleId) &&
        String(r.personId) === String(evt.personId) &&
        String(r.eventType) === String(evt.eventType) &&
        economyDay_(r.createdAt) === day) total += Number(r.amount || 0);
  }
  return total;
}
function listDiamondEvents(b) {
  assertCircleUser_(b.circleId, b.userId);
  var limit = Math.max(1, Math.min(Number(b.limit || 300), 500));
  var rows = readSheet_("DiamondEvents").rows.filter(function (r) {
    return String(r.circleId) === String(b.circleId) && (!b.personId || String(r.personId) === String(b.personId));
  });
  rows.sort(function (a, c) { return String(c.createdAt).localeCompare(String(a.createdAt)); });
  return { ok: true, items: rows.slice(0, limit).map(economyEventPayload_) };
}
function getEconomyState(b) {
  assertCircleUser_(b.circleId, b.userId);
  var events = listDiamondEvents({ circleId: b.circleId, userId: b.userId, limit: b.limit || 300 }).items;
  return { ok: true, buddy: getBuddyState_(b.circleId), diamondEvents: events, rules: ECONOMY_RULES };
}
function recordKinetikEvent(b) {
  var eventType = String(b.eventType || "").trim();
  var rule = ECONOMY_RULES[eventType];
  if (!rule) economyError_("unsupported event type");
  var circleId = String(b.circleId || "");
  var personId = String(b.personId || "");
  var userId = String(b.userId || "");
  var access = assertEconomyAccess_(circleId, personId, userId);
  if (eventType === "diamond.gift" && !isLeaderRole_(access.actor.role)) economyError_("only circle leaders can send diamond gifts");
  var metadata = jsonParse_(b.metadata, {});
  var appId = String(b.appId || metadata.appId || "unknown-app");
  var now = new Date().toISOString();
  var sourceRecordId = String(b.sourceRecordId || metadata.sourceRecordId || "");
  if (!sourceRecordId) {
    sourceRecordId = [appId, eventType, personId, economyDay_(now), String(metadata.title || "untitled").slice(0, 80)].join(":");
  }
  var proposedAmount = Number(b.amount != null ? b.amount : (b.diamonds != null ? b.diamonds : rule.defaultAmount));
  if (isNaN(proposedAmount)) proposedAmount = 0;
  var evt = {
    id: "ke_" + Utilities.getUuid().slice(0, 10),
    circleId: circleId,
    personId: personId,
    userId: userId,
    appId: appId,
    eventType: eventType,
    sourceRecordId: sourceRecordId,
    proposedAmount: proposedAmount,
    metadataJson: JSON.stringify(metadata),
    status: "accepted",
    reason: "",
    createdAt: now
  };

  var existingDiamond = duplicateDiamond_(evt);
  if (existingDiamond) {
    return { ok: true, duplicate: true, event: economyEventPayload_(duplicateKinetikEvent_(evt) || evt),
             diamond: economyEventPayload_(existingDiamond), buddy: getBuddyState_(circleId) };
  }
  var existingEvent = duplicateKinetikEvent_(evt);
  if (existingEvent && eventType === "task.completed") {
    return { ok: true, duplicate: true, event: economyEventPayload_(existingEvent), buddy: getBuddyState_(circleId) };
  }

  if (eventType === "task.completed" && (metadata.approvalRequired || metadata.status === "pending")) {
    evt.status = "pending_approval";
    evt.reason = "waiting for approval";
    appendRow_("KinetikEvents", evt);
    var action = { id: "aa_" + Utilities.getUuid().slice(0, 10), type: "approval.waiting",
      circleId: circleId, personId: personId, userId: userId, appId: appId, eventId: evt.id,
      title: metadata.title || "Task", status: "waiting", createdAt: now };
    return { ok: true, event: economyEventPayload_(evt), action: action, buddy: getBuddyState_(circleId) };
  }

  var wanted = Math.max(0, Math.round(proposedAmount || rule.defaultAmount || 0));
  var remaining = Math.max(0, Number(rule.dailyCap || 0) - usedToday_(evt));
  var amount = Math.min(wanted, Number(rule.maxPerEvent || wanted), remaining);
  var capApplied = amount < wanted;
  if (amount <= 0) {
    evt.status = "capped";
    evt.reason = "daily cap reached";
    appendRow_("KinetikEvents", evt);
    return { ok: true, capped: true, event: economyEventPayload_(evt), buddy: getBuddyState_(circleId) };
  }

  appendRow_("KinetikEvents", evt);
  var diamond = {
    id: "de_" + Utilities.getUuid().slice(0, 10),
    kinetikEventId: evt.id,
    circleId: circleId,
    personId: personId,
    userId: userId,
    appId: appId,
    eventType: eventType,
    energy: rule.energy,
    amount: amount,
    capApplied: capApplied,
    reason: metadata.title || eventType,
    sourceRecordId: sourceRecordId,
    metadataJson: JSON.stringify(metadata),
    createdAt: now
  };
  appendRow_("DiamondEvents", diamond);

  var st = getBuddyState_(circleId);
  st.diamonds = Number(st.diamonds || 0) + amount;
  st.xp = Number(st.xp || 0) + amount * 4;
  st.level = Math.max(1, Math.floor(st.xp / 120) + 1);
  st.mood = rule.mood;
  st.energy = st.energy || {};
  st.energy[rule.energy] = Number(st.energy[rule.energy] || 0) + amount;
  st.byPerson = st.byPerson || {};
  st.byPerson[personId] = Number(st.byPerson[personId] || 0) + amount;
  st.lastReaction = "Added " + rule.energy + " energy.";
  st.updatedAt = now;
  saveBuddyState_(st);

  return { ok: true, event: economyEventPayload_(evt), diamond: economyEventPayload_(diamond), buddy: st };
}

/* =================================================================
   MOMENTS MEDIA PIPELINE (v2)
   Files -> Google Drive, metadata -> sheets. Stories are PERMANENT.
================================================================= */

/* ---------- Drive folder tree (cached in ScriptProperties) ---------- */
function getOrCreateFolder(parent, name) {
  var it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}
function mediaRoot_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty("MEDIA_ROOT_ID");
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  var f = getOrCreateFolder(DriveApp.getRootFolder(), MEDIA_ROOT);
  props.setProperty("MEDIA_ROOT_ID", f.getId());
  return f;
}
function circleMediaFolder_(circleId, target) {
  var sub = (target === "moment-story" || target === "moment-stories") ? "moment-stories" : "memory-lines";
  var props = PropertiesService.getScriptProperties();
  var key = "MEDIA_FOLDER_" + circleId + "_" + sub;
  var id = props.getProperty(key);
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  var circles = getOrCreateFolder(mediaRoot_(), "circles");
  var cf = getOrCreateFolder(circles, String(circleId));
  var leaf = getOrCreateFolder(cf, sub);
  props.setProperty(key, leaf.getId());
  return leaf;
}

/* ---------- generic helpers keyed by a custom id column ---------- */
function readSheet_(name) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sh) throw new Error("Sheet missing: " + name + " (run ensureSetup)");
  var vals = sh.getDataRange().getValues();
  if (vals.length < 2) return { sh: sh, head: HEADERS[name], rows: [] };
  var head = vals[0], rows = [];
  for (var i = 1; i < vals.length; i++) {
    var o = {};
    for (var j = 0; j < head.length; j++) o[head[j]] = fmtCell(head[j], vals[i][j]);
    if (o[head[0]] !== "" && o[head[0]] != null) { o._row = i + 1; rows.push(o); }
  }
  return { sh: sh, head: head, rows: rows };
}
function appendRow_(name, obj) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  sh.appendRow(HEADERS[name].map(function (h) {
    var v = obj[h]; if (v == null) return ""; return (typeof v === "object") ? JSON.stringify(v) : v;
  }));
  return obj;
}
function driveViewUrl_(fileId) { return "https://lh3.googleusercontent.com/d/" + fileId; }
function driveFileUrl_(fileId) { return "https://drive.google.com/uc?export=view&id=" + fileId; }

/* ---------- actions ---------- */
function ensureSetup() {
  setupKinetik();           /* creates/updates all sheets incl. the 3 new ones */
  mediaRoot_();             /* creates the Drive root */
  return { ok: true, sheets: SHEETS.length, mediaRoot: MEDIA_ROOT };
}

function uploadMedia(b) {
  if (!b.circleId) throw new Error("circleId required");
  if (!b.base64) throw new Error("file data (base64) required");
  var mime = b.mimeType || "image/jpeg";
  var type = mime.indexOf("video") === 0 ? "video" : "image";
  var bytes = Utilities.base64Decode(b.base64);
  var blob = Utilities.newBlob(bytes, mime, b.fileName || ("upload." + (type === "video" ? "mp4" : "jpg")));
  var folder = circleMediaFolder_(b.circleId, b.target);
  var file = folder.createFile(blob);
  try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) {}
  var fileId = file.getId();
  var row = {
    mediaId: "media_" + Utilities.getUuid().slice(0, 10),
    circleId: b.circleId, ownerUserId: b.ownerUserId || "",
    type: type, mimeType: mime,
    driveFileId: fileId, driveUrl: file.getUrl(), viewUrl: driveViewUrl_(fileId),
    fileName: b.fileName || file.getName(), fileSize: file.getSize(),
    createdAt: new Date().toISOString(), status: "active"
  };
  appendRow_("MediaAssets", row);
  audit("uploadMedia", "MediaAssets", row.mediaId);
  return { ok: true, mediaId: row.mediaId, driveFileId: fileId, driveUrl: row.driveUrl, viewUrl: row.viewUrl, type: type };
}

function getMediaByIds_(ids) {
  if (!ids || !ids.length) return [];
  var all = readSheet_("MediaAssets").rows, byId = {};
  all.forEach(function (m) { byId[m.mediaId] = m; });
  return ids.map(function (id) {
    var m = byId[id]; if (!m) return null;
    return { mediaId: m.mediaId, type: m.type, mimeType: m.mimeType,
             driveFileId: m.driveFileId, driveUrl: m.driveUrl,
             viewUrl: m.viewUrl || driveViewUrl_(m.driveFileId) };
  }).filter(function (x) { return x; });
}

function createMemoryLine(b) {
  if (!b.circleId) throw new Error("circleId required");
  var title = String(b.title || "").trim();
  if (title.length < MEMORY_MIN_TITLE || title.length > MEMORY_MAX_TITLE) throw new Error("Title must be " + MEMORY_MIN_TITLE + "-" + MEMORY_MAX_TITLE + " characters");
  var caption = String(b.caption || "").trim();
  if (caption.length < MEMORY_MIN_CAPTION) throw new Error("Caption must be at least " + MEMORY_MIN_CAPTION + " characters");
  var mediaIds = b.mediaIds || [];
  if (!mediaIds.length) throw new Error("At least one media item required");
  var row = {
    postId: "post_" + Utilities.getUuid().slice(0, 10),
    circleId: b.circleId, authorUserId: b.authorUserId || "",
    title: title, caption: caption, mediaIdsJson: JSON.stringify(mediaIds),
    createdAt: new Date().toISOString(), status: "active"
  };
  appendRow_("MemoryLines", row);
  audit("createMemoryLine", "MemoryLines", row.postId);
  return { ok: true, postId: row.postId };
}

function commentCounts_(circleId) {
  var map = {};
  readSheet_("Comments").rows.forEach(function (r) {
    if (String(r.circleId) === String(circleId) && (r.status === "active" || r.status === "" || r.status == null))
      map[r.postId] = (map[r.postId] || 0) + 1;
  });
  return map;
}
function listMemoryLines(b) {
  var limit = b.limit || 20, cursor = b.cursor || "";
  var rows = readSheet_("MemoryLines").rows.filter(function (r) {
    return String(r.circleId) === String(b.circleId) && (r.status === "active" || r.status === "" || r.status == null);
  });
  rows.sort(function (a, c) { return String(c.createdAt).localeCompare(String(a.createdAt)); });
  var start = 0;
  if (cursor) { for (var i = 0; i < rows.length; i++) if (rows[i].postId === cursor) { start = i + 1; break; } }
  var page = rows.slice(start, start + limit);
  var counts = commentCounts_(b.circleId);
  var items = page.map(function (r) {
    var ids; try { ids = JSON.parse(r.mediaIdsJson || "[]"); } catch (e) { ids = []; }
    return { postId: r.postId, circleId: r.circleId, authorUserId: r.authorUserId,
             title: r.title || "", caption: r.caption, createdAt: r.createdAt,
             commentCount: counts[r.postId] || 0, media: getMediaByIds_(ids) };
  });
  var next = (start + limit < rows.length) ? page[page.length - 1].postId : "";
  return { ok: true, items: items, nextCursor: next };
}

function listComments(b) {
  var rows = readSheet_("Comments").rows.filter(function (r) {
    return String(r.postId) === String(b.postId) && (r.status === "active" || r.status === "" || r.status == null);
  });
  rows.sort(function (a, c) { return String(a.createdAt).localeCompare(String(c.createdAt)); });
  return { ok: true, items: rows.map(function (r) {
    return { commentId: r.commentId, postId: r.postId, authorUserId: r.authorUserId, text: r.text, createdAt: r.createdAt };
  }) };
}
/* ---------- Circle chat (members-only; polled ~4s) ---------- */
function listMessages(b) {
  var rows = readSheet_("Messages").rows.filter(function (r) {
    return String(r.circleId) === String(b.circleId) && (r.status === "active" || r.status === "" || r.status == null);
  });
  rows.sort(function (a, c) { return String(a.createdAt).localeCompare(String(c.createdAt)); });
  if (rows.length > 200) rows = rows.slice(rows.length - 200);  /* last 200, oldest-first */
  return { ok: true, items: rows.map(function (r) {
    return { id: r.id, circleId: r.circleId, authorUserId: r.authorUserId, text: r.text, createdAt: r.createdAt };
  }) };
}
function createMessage(b) {
  if (!b.circleId) throw new Error("circleId required");
  var text = String(b.text || "").trim();
  if (!text) throw new Error("Message is empty");
  if (text.length > 2000) text = text.slice(0, 2000);
  var row = {
    id: "msg_" + Utilities.getUuid().slice(0, 10),
    circleId: b.circleId, authorUserId: b.authorUserId || "",
    text: text, createdAt: new Date().toISOString(), status: "active"
  };
  appendRow_("Messages", row);
  return { ok: true, id: row.id, createdAt: row.createdAt };
}

function createComment(b) {
  if (!b.postId) throw new Error("postId required");
  var text = String(b.text || "").trim();
  if (!text) throw new Error("Comment is empty");
  if (text.length > COMMENT_MAX) text = text.slice(0, COMMENT_MAX);
  var row = {
    commentId: "cmt_" + Utilities.getUuid().slice(0, 10),
    circleId: b.circleId, postId: b.postId, authorUserId: b.authorUserId || "",
    text: text, createdAt: new Date().toISOString(), status: "active"
  };
  appendRow_("Comments", row);
  audit("createComment", "Comments", row.commentId);
  return { ok: true, commentId: row.commentId };
}

/* ---------- reactions (one per user per post; emoji from a fixed palette) ---------- */
function setReaction(b) {
  if (!b.postId) throw new Error("postId required");
  var userId = String(b.userId || ""); if (!userId) throw new Error("userId required");
  var emoji = String(b.emoji || "");
  var s = readSheet_("Reactions"), existing = null;
  for (var i = 0; i < s.rows.length; i++) {
    if (String(s.rows[i].postId) === String(b.postId) && String(s.rows[i].userId) === userId && s.rows[i].status !== "deleted") { existing = s.rows[i]; break; }
  }
  if (!emoji) {                                  /* clear my reaction */
    if (existing) updateRowById_("Reactions", "reactionId", existing.reactionId, { status: "deleted" });
    return { ok: true, removed: true };
  }
  if (existing) { updateRowById_("Reactions", "reactionId", existing.reactionId, { emoji: emoji, createdAt: new Date().toISOString() }); return { ok: true, reactionId: existing.reactionId }; }
  var row = { reactionId: "rx_" + Utilities.getUuid().slice(0, 10), circleId: b.circleId || "", postId: b.postId, userId: userId, emoji: emoji, createdAt: new Date().toISOString(), status: "active" };
  appendRow_("Reactions", row);
  return { ok: true, reactionId: row.reactionId };
}
function listReactions(b) {
  if (!b.circleId) throw new Error("circleId required");
  var rows = readSheet_("Reactions").rows.filter(function (r) {
    return String(r.circleId) === String(b.circleId) && r.status !== "deleted" && r.emoji;
  });
  return { ok: true, items: rows.map(function (r) { return { postId: r.postId, userId: r.userId, emoji: r.emoji }; }) };
}

function createMomentStory(b) {
  if (!b.circleId) throw new Error("circleId required");
  if (!b.mediaId) throw new Error("mediaId required");
  var title = String(b.title || "").trim();
  if (title.length < STORY_MIN_TITLE || title.length > STORY_MAX_TITLE)
    throw new Error("Title must be " + STORY_MIN_TITLE + "-" + STORY_MAX_TITLE + " characters");
  var row = {
    storyId: "story_" + Utilities.getUuid().slice(0, 10),
    circleId: b.circleId, authorUserId: b.authorUserId || "",
    title: title, mediaId: b.mediaId, caption: String(b.caption || "").trim(),
    createdAt: new Date().toISOString(),
    expiresAt: "",            /* PERMANENT — reserved for a future ephemeral mode */
    status: "active"
  };
  appendRow_("MomentStories", row);
  audit("createMomentStory", "MomentStories", row.storyId);
  return { ok: true, storyId: row.storyId };
}

/* ---------- edit / delete (author or leader; soft-delete + trash Drive file) ---------- */
function updateRowById_(name, idCol, id, patch) {
  var s = readSheet_(name), sh = s.sh;
  for (var i = 0; i < s.rows.length; i++) {
    if (String(s.rows[i][idCol]) === String(id)) {
      var merged = {}; for (var k in s.rows[i]) if (k !== "_row") merged[k] = s.rows[i][k];
      for (var k2 in patch) merged[k2] = patch[k2];
      sh.getRange(s.rows[i]._row, 1, 1, HEADERS[name].length).setValues([HEADERS[name].map(function (h) {
        var v = merged[h]; return v == null ? "" : (typeof v === "object" ? JSON.stringify(v) : v);
      })]);
      return merged;
    }
  }
  throw new Error("Not found: " + id);
}
function trashMedia_(mediaId) {
  try {
    var rows = readSheet_("MediaAssets").rows;
    for (var i = 0; i < rows.length; i++) if (String(rows[i].mediaId) === String(mediaId)) {
      if (rows[i].driveFileId) { try { DriveApp.getFileById(rows[i].driveFileId).setTrashed(true); } catch (e) {} }
      updateRowById_("MediaAssets", "mediaId", mediaId, { status: "deleted" });
      return;
    }
  } catch (e) {}
}
function editMemoryLine(b) {
  var patch = {};
  if (b.caption != null) {
    var caption = String(b.caption).trim();
    if (caption.length < MEMORY_MIN_CAPTION) throw new Error("Caption must be at least " + MEMORY_MIN_CAPTION + " characters");
    patch.caption = caption;
  }
  if (b.title != null) {
    var title = String(b.title).trim();
    if (title.length < MEMORY_MIN_TITLE || title.length > MEMORY_MAX_TITLE) throw new Error("Title must be " + MEMORY_MIN_TITLE + "-" + MEMORY_MAX_TITLE + " characters");
    patch.title = title;
  }
  updateRowById_("MemoryLines", "postId", b.postId, patch);
  audit("editMemoryLine", "MemoryLines", b.postId);
  return { ok: true, postId: b.postId };
}
function deleteMemoryLine(b) {
  var rows = readSheet_("MemoryLines").rows;
  for (var i = 0; i < rows.length; i++) if (String(rows[i].postId) === String(b.postId)) {
    var ids; try { ids = JSON.parse(rows[i].mediaIdsJson || "[]"); } catch (e) { ids = []; }
    ids.forEach(trashMedia_); break;
  }
  updateRowById_("MemoryLines", "postId", b.postId, { status: "deleted" });
  audit("deleteMemoryLine", "MemoryLines", b.postId);
  return { ok: true };
}
function editMomentStory(b) {
  var patch = {};
  if (b.title != null) {
    var t = String(b.title).trim();
    if (t.length < STORY_MIN_TITLE || t.length > STORY_MAX_TITLE) throw new Error("Title must be " + STORY_MIN_TITLE + "-" + STORY_MAX_TITLE + " characters");
    patch.title = t;
  }
  if (b.caption != null) patch.caption = String(b.caption).trim();
  updateRowById_("MomentStories", "storyId", b.storyId, patch);
  audit("editMomentStory", "MomentStories", b.storyId);
  return { ok: true, storyId: b.storyId };
}
function deleteMomentStory(b) {
  var rows = readSheet_("MomentStories").rows;
  for (var i = 0; i < rows.length; i++) if (String(rows[i].storyId) === String(b.storyId)) {
    if (rows[i].mediaId) trashMedia_(rows[i].mediaId); break;
  }
  updateRowById_("MomentStories", "storyId", b.storyId, { status: "deleted" });
  audit("deleteMomentStory", "MomentStories", b.storyId);
  return { ok: true };
}

function listMomentStories(b) {
  var rows = readSheet_("MomentStories").rows.filter(function (r) {
    return String(r.circleId) === String(b.circleId) && (r.status === "active" || r.status === "" || r.status == null);
  });
  /* stories are permanent — newest first, no expiry filter */
  rows.sort(function (a, c) { return String(c.createdAt).localeCompare(String(a.createdAt)); });
  var items = rows.map(function (r) {
    return { storyId: r.storyId, circleId: r.circleId, authorUserId: r.authorUserId,
             title: r.title, caption: r.caption, createdAt: r.createdAt,
             media: getMediaByIds_([r.mediaId])[0] || null };
  });
  return { ok: true, items: items };
}
