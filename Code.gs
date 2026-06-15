/*
KINETIK GOOGLE SHEETS BACKEND v2.0 — adds the MOMENTS MEDIA PIPELINE

PRODUCT: Kinetik — private life app for Family + Friends circles. Plans. People. Play.
FRONTEND: Kinetik.html main shell + App_*.html modular apps (embedded or standalone PWA).
BACKEND: Google Sheets via this Apps Script web app. Generic CRUD, JSON responses.

CORE SHEETS (run setupKinetik() once to create them):
Users People Circles CircleMembers Relationships Calendar_Routines Calendar_Events
Calendar_Exceptions AppCatalog CircleApps AppRecords AgentLogs Settings AuditLog

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
- Files live in Google Drive: Kinetik_Media/circles/{circleId}/{memory-lines|moment-stories}
- Metadata lives in sheets: MediaAssets, MemoryLines, MomentStories
- Uploaded files are set to "anyone with link can VIEW" — PROTOTYPE PRIVACY ONLY.
  Production must use Firebase/Supabase private storage + authenticated access.
- Stories are PERMANENT (family memory vault — no 24h expiry). expiresAt column
  is reserved/blank for a future optional ephemeral mode.
- Validation: Memory Line caption >= 10 chars. Story title 3-40 chars.

REDEPLOY NOTE: after pasting this file, use Deploy > Manage deployments >
edit (pencil) > Version: New version — the web app URL stays the same.
*/

var SHEETS = [
  "Users","People","Circles","CircleMembers","Relationships",
  "Calendar_Routines","Calendar_Events","Calendar_Exceptions",
  "AppCatalog","CircleApps","AppRecords","AgentLogs","Settings","AuditLog",
  "MediaAssets","MemoryLines","MomentStories","Comments","Messages","Reactions"
];

/* Moments media pipeline config */
var MEDIA_ROOT = "Kinetik_Media";
var STORY_MIN_TITLE = 3, STORY_MAX_TITLE = 40, MEMORY_MIN_CAPTION = 10;
var MEMORY_MIN_TITLE = 2, MEMORY_MAX_TITLE = 60, COMMENT_MAX = 300;

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
