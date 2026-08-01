const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const {
  parseCreditSms,
  decidePaymentMatch,
  normalizeUtr,
} = require("./smsPaymentMatch");

const DATA_DIR = path.join(__dirname, "..", "data");
const UPLOAD_DIR = path.join(__dirname, "..", "public", "payment-uploads");
const UPI_UPLOAD_DIR = path.join(__dirname, "..", "public", "upi-uploads");
const SUPPORT_UPLOAD_DIR = path.join(__dirname, "..", "public", "support-uploads");
const DB_FILE = path.join(DATA_DIR, "store.json");

const RATE_INR = Number(process.env.RATE_INR_PER_HOUR || 130);

/** Bigger packs = better discount (listPrice = hours × rate) */
const DEFAULT_PACKAGES = [
  {
    id: "1h",
    hours: 1,
    listPriceInr: RATE_INR * 1,
    priceInr: RATE_INR * 1,
    label: "1 Hour",
    badge: "",
    popular: false,
  },
  {
    id: "2h",
    hours: 2,
    listPriceInr: RATE_INR * 2,
    priceInr: RATE_INR * 2 - 20,
    label: "2 Hours",
    badge: "Save 8%",
    popular: false,
  },
  {
    id: "5h",
    hours: 5,
    listPriceInr: RATE_INR * 5,
    priceInr: RATE_INR * 5 - 100,
    label: "5 Hours",
    badge: "Popular",
    popular: true,
  },
  {
    id: "10h",
    hours: 10,
    listPriceInr: RATE_INR * 10,
    priceInr: RATE_INR * 10 - 301,
    label: "10 Hours",
    badge: "Best value",
    popular: false,
  },
];

/** @deprecated use DEFAULT_PACKAGES — kept for exports */
const PACKAGES = DEFAULT_PACKAGES;

function enrichPackage(p) {
  const list = Number(p.listPriceInr != null ? p.listPriceInr : p.priceInr);
  const price = Number(p.priceInr);
  const save = Math.max(0, list - price);
  const discountPct = list > 0 ? Math.round((save / list) * 100) : 0;
  return {
    ...p,
    listPriceInr: list,
    priceInr: price,
    saveInr: save,
    discountPct,
    perHourInr: Math.round(price / Math.max(0.01, Number(p.hours) || 1)),
  };
}

function defaultSettings() {
  return {
    upiId: process.env.UPI_ID || "yourname@upi",
    upiName: process.env.UPI_NAME || "Chat Service",
    qrImageUrl: process.env.UPI_QR_URL || "/upi-qr.svg",
    trialMinutes: 5,
    packages: DEFAULT_PACKAGES.map((p) => ({ ...p })),
  };
}

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  if (!fs.existsSync(UPI_UPLOAD_DIR)) fs.mkdirSync(UPI_UPLOAD_DIR, { recursive: true });
  if (!fs.existsSync(SUPPORT_UPLOAD_DIR)) {
    fs.mkdirSync(SUPPORT_UPLOAD_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(
      DB_FILE,
      JSON.stringify(
        {
          users: {},
          payments: {},
          tokens: {},
          devices: {},
          chats: {},
          supportThreads: {},
          smsCredits: {},
          payIntents: {},
          adminNotices: {},
          settings: defaultSettings(),
        },
        null,
        2
      )
    );
  }
}

function getSettings() {
  const db = readDb();
  if (!db.settings || typeof db.settings !== "object") {
    db.settings = defaultSettings();
    writeDb(db);
  } else {
    let dirty = false;
    if (!Array.isArray(db.settings.packages) || !db.settings.packages.length) {
      db.settings.packages = DEFAULT_PACKAGES.map((p) => ({ ...p }));
      dirty = true;
    }
    if (
      !Number.isFinite(Number(db.settings.trialMinutes)) ||
      Number(db.settings.trialMinutes) <= 0
    ) {
      db.settings.trialMinutes = 5;
      dirty = true;
    }
    if (dirty) writeDb(db);
  }
  return db.settings;
}

/** Free trial length for new signups (1–120 minutes). */
function getTrialMinutes() {
  const n = Math.round(Number(getSettings().trialMinutes));
  if (!Number.isFinite(n) || n < 1) return 5;
  return Math.min(120, n);
}

function getPackages() {
  return getSettings().packages.map(enrichPackage);
}

function getPackage(packageId) {
  const p = getSettings().packages.find((x) => x.id === packageId);
  return p ? enrichPackage(p) : null;
}

function paymentInfo() {
  const s = getSettings();
  return {
    upiId: s.upiId || process.env.UPI_ID || "yourname@upi",
    upiName: s.upiName || process.env.UPI_NAME || "Chat Service",
    qrImageUrl: s.qrImageUrl || process.env.UPI_QR_URL || "/upi-qr.svg",
    rateInrPerHour: RATE_INR,
    trialMinutes: getTrialMinutes(),
    noteHint: "Remark = your 4-digit User ID (auto-filled). Don’t change it.",
  };
}

function normalizePackagesInput(list) {
  if (!Array.isArray(list) || !list.length) {
    throw new Error("At least one package required");
  }
  return list.map((raw, i) => {
    const hours = Number(raw.hours);
    const priceInr = Number(raw.priceInr);
    const listPriceInr = Number(
      raw.listPriceInr != null ? raw.listPriceInr : priceInr
    );
    if (!Number.isFinite(hours) || hours <= 0) {
      throw new Error("Package " + (i + 1) + ": invalid hours");
    }
    if (!Number.isFinite(priceInr) || priceInr < 0) {
      throw new Error("Package " + (i + 1) + ": invalid price");
    }
    const id =
      String(raw.id || "").trim() ||
      String(hours).replace(/\./g, "p") + "h-" + (i + 1);
    return {
      id: id.slice(0, 32),
      hours,
      priceInr,
      listPriceInr: Number.isFinite(listPriceInr) ? listPriceInr : priceInr,
      label: String(raw.label || hours + " Hour" + (hours === 1 ? "" : "s")).slice(
        0,
        40
      ),
      badge: String(raw.badge || "").slice(0, 24),
      popular: !!raw.popular,
    };
  });
}

function updatePaySettings({ upiId, upiName, packages, trialMinutes }) {
  const db = readDb();
  if (!db.settings) db.settings = defaultSettings();
  if (upiId != null) {
    db.settings.upiId = String(upiId).trim().slice(0, 80) || db.settings.upiId;
  }
  if (upiName != null) {
    db.settings.upiName =
      String(upiName).trim().slice(0, 80) || db.settings.upiName;
  }
  if (trialMinutes != null && trialMinutes !== "") {
    const n = Math.round(Number(trialMinutes));
    if (!Number.isFinite(n) || n < 1 || n > 120) {
      throw new Error("Trial minutes must be between 1 and 120");
    }
    db.settings.trialMinutes = n;
  }
  if (packages != null) {
    db.settings.packages = normalizePackagesInput(packages);
  }
  writeDb(db);
  return {
    ok: true,
    settings: {
      ...db.settings,
      packages: db.settings.packages.map(enrichPackage),
    },
  };
}

function saveUpiQrBase64(base64Data) {
  ensureDirs();
  const raw = String(base64Data || "");
  const m = raw.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  const b64 = m ? m[2] : raw.includes(",") ? raw.split(",").pop() : raw;
  const mime = m ? m[1] : "image/png";
  const ext = mime.includes("jpeg") || mime.includes("jpg")
    ? "jpg"
    : mime.includes("webp")
      ? "webp"
      : "png";
  const buf = Buffer.from(b64, "base64");
  if (!buf.length || buf.length > 3 * 1024 * 1024) {
    throw new Error("QR image invalid or too large (max ~3MB)");
  }
  // Remove old uploaded qrs
  try {
    for (const f of fs.readdirSync(UPI_UPLOAD_DIR)) {
      if (/^qr\./i.test(f)) fs.unlinkSync(path.join(UPI_UPLOAD_DIR, f));
    }
  } catch (_) {
    /* ignore */
  }
  const filename = "qr." + ext;
  fs.writeFileSync(path.join(UPI_UPLOAD_DIR, filename), buf);
  const url = "/upi-uploads/" + filename + "?v=" + Date.now();
  const db = readDb();
  if (!db.settings) db.settings = defaultSettings();
  db.settings.qrImageUrl = url;
  writeDb(db);
  return { ok: true, qrImageUrl: url };
}

function clearUpiQr() {
  const db = readDb();
  if (!db.settings) db.settings = defaultSettings();
  try {
    for (const f of fs.readdirSync(UPI_UPLOAD_DIR)) {
      if (/^qr\./i.test(f)) fs.unlinkSync(path.join(UPI_UPLOAD_DIR, f));
    }
  } catch (_) {
    /* ignore */
  }
  db.settings.qrImageUrl = process.env.UPI_QR_URL || "/upi-qr.svg";
  writeDb(db);
  return { ok: true, qrImageUrl: db.settings.qrImageUrl };
}

function adminGetSettings() {
  const s = getSettings();
  return {
    upiId: s.upiId,
    upiName: s.upiName,
    qrImageUrl: s.qrImageUrl,
    trialMinutes: getTrialMinutes(),
    packages: (s.packages || []).map(enrichPackage),
  };
}

function readDb() {
  ensureDirs();
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function writeDb(db) {
  ensureDirs();
  const tmp = DB_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

function randomId(prefix, len = 6) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  const bytes = crypto.randomBytes(len);
  for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length];
  return `${prefix}_${out}`;
}

/** Easy 4-digit User ID (1000–9999), unique across all users */
function generateUniqueUserId(db) {
  const used = new Set(Object.keys(db.users || {}));
  for (let i = 0; i < 8000; i++) {
    const id = String(crypto.randomInt(1000, 10000));
    if (!used.has(id)) return id;
  }
  throw new Error("No free 4-digit user IDs left (1000–9999 all used)");
}

function hashPin(pin, salt) {
  return crypto.createHash("sha256").update(`${salt}:${pin}`).digest("hex");
}

function normalizeDeviceId(raw) {
  const s = String(raw || "").trim().slice(0, 80);
  if (!/^[a-zA-Z0-9_-]{10,80}$/.test(s)) return "";
  return s;
}

/**
 * Normalize device id for optional analytics — no signup cooldown.
 * Users may create as many accounts as they want.
 */
function assertCanRegister({ deviceId }) {
  const did = normalizeDeviceId(deviceId);
  if (!did) {
    // Soft fallback so signup never blocks on missing device fingerprint
    const fallback =
      "web_" +
      crypto.randomBytes(8).toString("hex");
    return { ok: true, deviceId: fallback };
  }
  return { ok: true, deviceId: did };
}

/** Require DOB proving age >= 18. Accepts YYYY-MM-DD. */
function assertAdultDob(dateOfBirth) {
  const raw = String(dateOfBirth || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return { ok: false, error: "Date of birth required (YYYY-MM-DD)." };
  }
  const [y, m, d] = raw.split("-").map(Number);
  const dob = new Date(Date.UTC(y, m - 1, d));
  if (
    Number.isNaN(dob.getTime()) ||
    dob.getUTCFullYear() !== y ||
    dob.getUTCMonth() !== m - 1 ||
    dob.getUTCDate() !== d
  ) {
    return { ok: false, error: "Invalid date of birth." };
  }
  const now = new Date();
  const todayUtc = Date.UTC(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  if (dob.getTime() > todayUtc) {
    return { ok: false, error: "Date of birth cannot be in the future." };
  }
  let age = now.getFullYear() - y;
  const hadBirthday =
    now.getMonth() > m - 1 ||
    (now.getMonth() === m - 1 && now.getDate() >= d);
  if (!hadBirthday) age -= 1;
  if (age < 18) {
    return {
      ok: false,
      error: "You must be 18 or older to create an account.",
    };
  }
  if (age > 120) {
    return { ok: false, error: "Invalid date of birth." };
  }
  return { ok: true, ageYears: age, iso: raw };
}

function assertUserPin(pin) {
  const raw = String(pin || "").trim();
  if (!/^\d{4}$/.test(raw)) {
    return { ok: false, error: "PIN must be exactly 4 digits." };
  }
  return { ok: true, pin: raw };
}

function createUser({ deviceId, ip, dateOfBirth, pin: pinInput } = {}) {
  const age = assertAdultDob(dateOfBirth);
  if (!age.ok) {
    return { error: age.error };
  }

  const pinCheck = assertUserPin(pinInput);
  if (!pinCheck.ok) {
    return { error: pinCheck.error };
  }
  const pin = pinCheck.pin;

  const gate = assertCanRegister({ deviceId, ip });
  if (!gate.ok) {
    return {
      error: gate.error,
      retryAfterMs: gate.retryAfterMs,
      existingUserId: gate.existingUserId,
    };
  }

  const db = readDb();
  if (!db.devices) db.devices = {};

  // Never let User ID equal the chosen PIN — pick another ID instead of failing.
  let userId = generateUniqueUserId(db);
  for (let n = 0; n < 20 && userId === pin; n += 1) {
    userId = generateUniqueUserId(db);
  }
  if (userId === pin) {
    return { error: "Could not assign User ID. Try a different PIN." };
  }

  const salt = crypto.randomBytes(8).toString("hex");
  const pinHash = hashPin(pin, salt);
  const trialMinutes = getTrialMinutes();
  const now = Date.now();

  db.users[userId] = {
    userId,
    pinHash,
    pinSalt: salt,
    pinPlain: pin,
    hoursBalance: trialMinutes / 60,
    trialMinutes,
    hasPaid: false,
    createdAt: now,
    lastTickAt: null,
    sessionActive: false,
    deviceId: gate.deviceId,
    dateOfBirth: age.iso,
    ageYears: age.ageYears,
    ageVerifiedAt: now,
  };

  db.devices[gate.deviceId] = {
    lastRegisterAt: now,
    userId,
    ip: String(ip || "").slice(0, 80) || null,
  };

  writeDb(db);

  // Round-trip check so a bad hash never ships to the client
  const saved = readDb().users[userId];
  if (!saved || saved.pinHash !== hashPin(pin, saved.pinSalt)) {
    return { error: "Account created but PIN save failed. Contact admin." };
  }

  return { userId, trialMinutes };
}

function loginUser(userId, pin) {
  const db = readDb();
  const raw = String(userId || "").trim();
  // Support old USR_ ids (uppercase) and new 4-digit ids
  const id = /^\d{4}$/.test(raw) ? raw : raw.toUpperCase();
  const user = db.users[id];
  if (!user) return null;
  const ok = user.pinHash === hashPin(String(pin || "").trim(), user.pinSalt);
  if (!ok) return null;

  const token = crypto.randomBytes(24).toString("hex");
  db.tokens[token] = { userId: id, createdAt: Date.now(), role: "user" };
  writeDb(db);
  return { token, user: publicUser(user) };
}

function adminLogin(userId, password) {
  const expectedId = String(process.env.ADMIN_ID || "admin").trim().toLowerCase();
  const expectedPass = String(process.env.ADMIN_PASSWORD || "admin123").trim();
  const id = String(userId || "").trim().toLowerCase();
  const pass = String(password || "").trim();
  if (!pass || pass !== expectedPass) return null;
  // ID required and must match when provided; empty id allowed only for password-only calls
  if (id && id !== expectedId) return null;
  const db = readDb();
  const token = crypto.randomBytes(24).toString("hex");
  db.tokens[token] = { userId: "ADMIN", createdAt: Date.now(), role: "admin" };
  writeDb(db);
  return { token, role: "admin", adminId: expectedId };
}

/** Main login form: detect admin ID + password. */
function isAdminCredentials(userId, pin) {
  const expectedId = String(process.env.ADMIN_ID || "admin").trim().toLowerCase();
  const expectedPass = String(process.env.ADMIN_PASSWORD || "admin123").trim();
  return (
    String(userId || "").trim().toLowerCase() === expectedId &&
    String(pin || "").trim() === expectedPass
  );
}

function getTokenRecord(token) {
  if (!token) return null;
  const db = readDb();
  return db.tokens[token] || null;
}

function publicUser(user) {
  const hours = liveHoursBalance(user);
  // Trial is ~5 min; anything ~1h+ means paid (also supports older accounts)
  const hasPaid = !!user.hasPaid || Number(user.hoursBalance || 0) >= 0.99;
  const totalSec = Math.max(0, Math.floor(hours * 3600));
  const minutes = Math.max(0, Math.ceil(hours * 60));
  const active =
    !!user.sessionActive &&
    !!user.lastTickAt &&
    Date.now() - Number(user.lastTickAt) <= STALE_SESSION_MS;
  return {
    userId: user.userId,
    hoursBalance: hours,
    hasPaid,
    minutesLeft: minutes,
    secondsLeft: totalSec,
    timeLabel: formatClock(totalSec),
    sessionActive: active,
  };
}

/** 0:59 or 1:05:03 */
function formatClock(totalSec) {
  const s = Math.max(0, Math.floor(Number(totalSec) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, "0");
  if (h > 0) return h + ":" + pad(m) + ":" + pad(sec);
  return m + ":" + pad(sec);
}

function getUser(userId) {
  const db = readDb();
  return db.users[userId] || null;
}

/** Keep chats (live + archive) for 5 days from last activity, then wipe. */
const CHAT_RETENTION_MS = 5 * 24 * 60 * 60 * 1000;

function chatStamp(session) {
  return Number((session && (session.archivedAt || session.updatedAt)) || 0);
}

function visibleChatMessages(history) {
  return (history || []).filter(
    (m) =>
      m &&
      m.content &&
      !/^Setup locked for this chat:/i.test(String(m.content))
  );
}

function normalizeArchiveList(entry) {
  if (!entry) return [];
  if (Array.isArray(entry)) return entry.filter(Boolean);
  return [entry];
}

function purgeExpiredChats(db) {
  const cutoff = Date.now() - CHAT_RETENTION_MS;
  let changed = false;

  if (db.chats) {
    for (const id of Object.keys(db.chats)) {
      const s = db.chats[id];
      if (chatStamp(s) && chatStamp(s) < cutoff) {
        delete db.chats[id];
        changed = true;
      }
    }
  }

  if (db.chatArchive) {
    for (const id of Object.keys(db.chatArchive)) {
      const kept = normalizeArchiveList(db.chatArchive[id]).filter(
        (s) => chatStamp(s) >= cutoff
      );
      if (!kept.length) {
        delete db.chatArchive[id];
        changed = true;
      } else if (
        kept.length !== normalizeArchiveList(db.chatArchive[id]).length ||
        !Array.isArray(db.chatArchive[id])
      ) {
        db.chatArchive[id] = kept;
        changed = true;
      }
    }
  }

  return changed;
}

function pushChatToArchive(db, userId, session) {
  if (!session) return;
  const msgs = visibleChatMessages(session.history);
  if (!msgs.length) return;
  if (!db.chatArchive) db.chatArchive = {};
  const list = normalizeArchiveList(db.chatArchive[userId]);
  list.push(
    Object.assign({}, session, {
      archivedAt: Date.now(),
      archiveId: randomId("ARCH", 8),
    })
  );
  // Cap stored archives per user (still purged by 5-day rule)
  db.chatArchive[userId] = list.slice(-30);
}

/** Move live chat into 5-day archive (keeps history for admin). */
function wipeChatInDb(db, userId) {
  if (db.chats && db.chats[userId]) {
    pushChatToArchive(db, userId, db.chats[userId]);
    delete db.chats[userId];
  }
  purgeExpiredChats(db);
}

function collectUserSessions(db, userId) {
  purgeExpiredChats(db);
  const id = String(userId || "").trim();
  const sessions = [];
  if (db.chats && db.chats[id]) {
    sessions.push({
      source: "live",
      session: db.chats[id],
      archiveId: null,
    });
  }
  for (const s of normalizeArchiveList(db.chatArchive && db.chatArchive[id])) {
    sessions.push({
      source: "archived",
      session: s,
      archiveId: s.archiveId || null,
    });
  }
  sessions.sort(
    (a, b) => chatStamp(b.session) - chatStamp(a.session)
  );
  return sessions;
}

/**
 * Client polls ~every 15s while the live timer runs. If the tab dies without
 * /pause, sessionActive can stay true forever and hoursBalance freezes.
 * Never bill more than one gap; auto-pause when polling has clearly stopped.
 */
const MAX_BILLABLE_GAP_MS = 60 * 1000;
const STALE_SESSION_MS = 90 * 1000;

/** Hours left including drain since lastTickAt (read-only; does not mutate). */
function liveHoursBalance(user, now = Date.now()) {
  let hours = Number(user && user.hoursBalance != null ? user.hoursBalance : 0);
  if (user && user.sessionActive && user.lastTickAt) {
    const elapsed = Math.max(0, now - Number(user.lastTickAt));
    const billable = Math.min(elapsed, MAX_BILLABLE_GAP_MS);
    hours = Math.max(0, hours - billable / 3600000);
  }
  return hours;
}

/**
 * Apply elapsed drain onto user object. If stale (no poll), charge at most
 * MAX_BILLABLE_GAP_MS and pause — do not wipe wallet for a ghost "online".
 */
function applySessionElapsed(user, now = Date.now(), { keepAlive = true } = {}) {
  if (!user || !user.sessionActive || !user.lastTickAt) {
    return { changed: false, stale: false, empty: false };
  }
  const elapsed = Math.max(0, now - Number(user.lastTickAt));
  const stale = elapsed > STALE_SESSION_MS;
  const billable = Math.min(elapsed, MAX_BILLABLE_GAP_MS);
  if (billable > 0) {
    user.hoursBalance = Math.max(
      0,
      Number(user.hoursBalance || 0) - billable / 3600000
    );
  }
  const empty = Number(user.hoursBalance || 0) <= 0.0001;
  if (empty) {
    user.hoursBalance = 0;
    user.sessionActive = false;
    user.lastTickAt = null;
    return { changed: true, stale, empty: true };
  }
  if (stale || !keepAlive) {
    user.sessionActive = false;
    user.lastTickAt = null;
    return { changed: true, stale: true, empty: false };
  }
  user.lastTickAt = now;
  return { changed: billable > 0, stale: false, empty: false };
}

/** Pause ghost sessions so admin does not show ONLINE with frozen time. */
function settleStaleSessions() {
  const db = readDb();
  const now = Date.now();
  let changed = false;
  for (const user of Object.values(db.users || {})) {
    if (!user || !user.sessionActive) continue;
    if (!user.lastTickAt) {
      user.sessionActive = false;
      changed = true;
      continue;
    }
    if (now - Number(user.lastTickAt) <= STALE_SESSION_MS) continue;
    const r = applySessionElapsed(user, now, { keepAlive: false });
    if (r.changed || r.stale) changed = true;
  }
  if (changed) writeDb(db);
  return changed;
}

/** Drain wallet by elapsed time while session is active. */
function tickUserHours(userId) {
  const db = readDb();
  const user = db.users[userId];
  if (!user) return { ok: false, error: "User not found" };

  const now = Date.now();
  applySessionElapsed(user, now, { keepAlive: true });

  if (Number(user.hoursBalance || 0) <= 0.0001) {
    user.hoursBalance = 0;
    user.sessionActive = false;
    user.lastTickAt = null;
    // Keep live chat — user pays to continue from the same scene (no wipe).
    writeDb(db);
    return {
      ok: false,
      error:
        "Time’s up. Scene paused here. Pay to continue this same chat.",
      user: publicUser(user),
      chatCleared: false,
    };
  }

  if (!user.sessionActive) {
    user.sessionActive = true;
  }
  user.lastTickAt = now;
  writeDb(db);
  return { ok: true, user: publicUser(user) };
}

function pauseSession(userId) {
  const db = readDb();
  const user = db.users[userId];
  if (!user) return null;
  if (user.sessionActive && user.lastTickAt) {
    const elapsed = Math.max(0, Date.now() - Number(user.lastTickAt));
    const usedHours = Math.min(elapsed, MAX_BILLABLE_GAP_MS) / 3600000;
    user.hoursBalance = Math.max(0, Number(user.hoursBalance || 0) - usedHours);
  }
  user.sessionActive = false;
  user.lastTickAt = null;
  let chatCleared = false;
  if (Number(user.hoursBalance || 0) <= 0.0001) {
    user.hoursBalance = 0;
    // Keep chat on pause for pay-to-continue
  }
  writeDb(db);
  const pub = publicUser(user);
  pub.chatCleared = chatCleared;
  return pub;
}

function saveScreenshot(base64Data, userId) {
  ensureDirs();
  const raw = String(base64Data || "");
  const m = raw.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  const b64 = m ? m[2] : raw.includes(",") ? raw.split(",").pop() : raw;
  const mime = m ? m[1] : "image/jpeg";
  const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
  const buf = Buffer.from(b64, "base64");
  if (!buf.length || buf.length > 4.5 * 1024 * 1024) {
    throw new Error("Screenshot invalid or too large (max ~4MB)");
  }
  const filename = `${userId}-${Date.now()}.${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), buf);
  return `/payment-uploads/${filename}`;
}

const PAY_INTENT_MS = 12 * 60 * 1000; // Scan QR / wait for SMS auto-match window

function submitPayment({ userId, packageId, screenshotBase64, upiNote, utr, skipScreenshot }) {
  const pack = getPackage(packageId);
  if (!pack) throw new Error("Invalid package");

  let screenshotUrl = null;
  if (!skipScreenshot) {
    if (!screenshotBase64) throw new Error("Screenshot required");
    screenshotUrl = saveScreenshot(screenshotBase64, userId);
  }
  const db = readDb();
  const paymentId = randomId("PAY", 8);
  const cleanUtr = normalizeUtr(utr);
  db.payments[paymentId] = {
    paymentId,
    userId,
    packageId: pack.id,
    hours: pack.hours,
    amountInr: pack.priceInr,
    screenshotUrl,
    upiNote: String(upiNote || "").slice(0, 120),
    utr: cleanUtr || "",
    status: "pending",
    createdAt: Date.now(),
    reviewedAt: null,
    reviewedBy: null,
  };
  // Clear pay intent — they submitted proof (or SMS path will clear)
  if (db.payIntents && db.payIntents[userId]) {
    delete db.payIntents[userId];
  }
  writeDb(db);
  return db.payments[paymentId];
}

/** User opened UPI / tapped I've paid — short window for SMS auto-match (low traffic). */
function recordPayIntent({ userId, packageId, source }) {
  const id = String(userId || "").trim();
  const pack = getPackage(packageId);
  if (!id) return { ok: false, error: "Login required" };
  if (!pack) return { ok: false, error: "Invalid package" };
  const db = readDb();
  if (!db.users[id]) return { ok: false, error: "User not found" };
  if (!db.payIntents || typeof db.payIntents !== "object") db.payIntents = {};
  const now = Date.now();
  db.payIntents[id] = {
    userId: id,
    packageId: pack.id,
    amountInr: pack.priceInr,
    hours: pack.hours,
    source: String(source || "pay").slice(0, 40),
    createdAt: now,
    expiresAt: now + PAY_INTENT_MS,
  };
  writeDb(db);
  return { ok: true, intent: db.payIntents[id], windowMs: PAY_INTENT_MS };
}

function listActivePayIntents(db, amountInr) {
  if (!db.payIntents || typeof db.payIntents !== "object") return [];
  const now = Date.now();
  let changed = false;
  const active = [];
  for (const uid of Object.keys(db.payIntents)) {
    const intent = db.payIntents[uid];
    if (!intent || Number(intent.expiresAt || 0) < now) {
      delete db.payIntents[uid];
      changed = true;
      continue;
    }
    if (
      amountInr == null ||
      Math.round(Number(intent.amountInr)) === Math.round(Number(amountInr))
    ) {
      active.push(intent);
    }
  }
  if (changed) writeDb(db);
  return active;
}

function listPayments(status) {
  const db = readDb();
  let list = Object.values(db.payments);
  if (status) list = list.filter((p) => p.status === status);
  return list.sort((a, b) => b.createdAt - a.createdAt);
}

function approvePayment(paymentId, opts) {
  const options = opts || {};
  const db = readDb();
  const pay = db.payments[paymentId];
  if (!pay) return { ok: false, error: "Payment not found" };
  if (pay.status !== "pending") {
    return { ok: false, error: `Already ${pay.status}` };
  }
  const user = db.users[pay.userId];
  if (!user) return { ok: false, error: "User missing" };

  user.hoursBalance = Number(user.hoursBalance || 0) + Number(pay.hours);
  user.hasPaid = true;
  pay.status = "approved";
  pay.reviewedAt = Date.now();
  pay.reviewedBy = String(options.reviewedBy || "admin").slice(0, 40);
  if (options.matchVia) pay.matchVia = String(options.matchVia).slice(0, 40);
  if (options.smsCreditId) pay.smsCreditId = String(options.smsCreditId).slice(0, 40);
  if (options.utr && !pay.utr) pay.utr = normalizeUtr(options.utr);
  writeDb(db);
  return { ok: true, payment: pay, user: publicUser(user) };
}

/**
 * Admin phone / paste: bank credit SMS → safe auto-approve.
 * Order: UTR → unique ₹+screenshot → unique pay-intent (no shot) → else review/no_match.
 */
function ingestSmsCredit({ smsText, amountInr, utr }) {
  const parsed = parseCreditSms(smsText);
  const amount = Math.round(Number(amountInr != null ? amountInr : parsed.amountInr));
  const ref = normalizeUtr(utr || parsed.utr);
  const body = String(smsText || parsed.raw || "").slice(0, 800);

  if (parsed.isCredit === false && amountInr == null) {
    return {
      ok: true,
      action: "ignored",
      reason: "SMS does not look like a credit",
      parsed,
    };
  }

  const db = readDb();
  if (!db.smsCredits || typeof db.smsCredits !== "object") db.smsCredits = {};
  if (!db.payIntents || typeof db.payIntents !== "object") db.payIntents = {};

  if (ref && db.smsCredits[ref] && db.smsCredits[ref].action === "approve") {
    return {
      ok: true,
      action: "duplicate",
      reason: "This UTR was already used to auto-approve",
      credit: db.smsCredits[ref],
      parsed: { amountInr: amount, utr: ref, isCredit: true },
    };
  }

  const pending = Object.values(db.payments || {}).filter((p) => p.status === "pending");
  const packAmounts = getPackages().map((p) => p.priceInr);
  const activeIntents = listActivePayIntents(db, amount);
  const decision = decidePaymentMatch({
    amountInr: amount,
    utr: ref,
    pendingPayments: pending,
    packAmounts,
    activePayIntents: activeIntents,
  });

  const creditId = ref || randomId("SMS", 10);
  const creditRow = {
    creditId,
    amountInr: Number.isFinite(amount) ? amount : null,
    utr: ref || "",
    smsText: body,
    action: decision.action,
    reason: decision.reason,
    paymentId: decision.paymentId || null,
    candidates: decision.candidates || null,
    createdAt: Date.now(),
  };

  function saveCreditAndReturn(payload, dbWrite) {
    const store = dbWrite || readDb();
    if (!store.smsCredits || typeof store.smsCredits !== "object") {
      store.smsCredits = {};
    }
    store.smsCredits[creditId] = creditRow;
    writeDb(store);
    return payload;
  }

  if (decision.action === "approve" && decision.paymentId) {
    const approved = approvePayment(decision.paymentId, {
      reviewedBy: "sms-auto",
      matchVia: decision.matchVia || "sms",
      smsCreditId: creditId,
      utr: ref,
    });
    const dbAfter = readDb();
    if (!approved.ok) {
      creditRow.action = "needs_review";
      creditRow.reason = approved.error || "Approve failed";
      return saveCreditAndReturn(
        {
          ok: false,
          action: "needs_review",
          reason: creditRow.reason,
          credit: creditRow,
          parsed: { amountInr: amount, utr: ref, isCredit: true },
        },
        dbAfter
      );
    }
    if (dbAfter.payIntents && approved.payment && approved.payment.userId) {
      delete dbAfter.payIntents[approved.payment.userId];
    }
    creditRow.action = "approve";
    creditRow.paymentId = decision.paymentId;
    creditRow.userId = approved.payment.userId;
    creditRow.hours = approved.payment.hours;
    return saveCreditAndReturn(
      {
        ok: true,
        action: "approve",
        reason: decision.reason,
        payment: approved.payment,
        user: approved.user,
        credit: creditRow,
        parsed: { amountInr: amount, utr: ref, isCredit: true },
      },
      dbAfter
    );
  }

  if (decision.action === "approve_intent" && decision.intent) {
    const intent = decision.intent;
    let payment;
    try {
      payment = submitPayment({
        userId: intent.userId,
        packageId: intent.packageId,
        upiNote: intent.userId,
        utr: ref,
        skipScreenshot: true,
      });
    } catch (e) {
      creditRow.action = "needs_review";
      creditRow.reason = e.message || "Could not create payment from intent";
      return saveCreditAndReturn({
        ok: false,
        action: "needs_review",
        reason: creditRow.reason,
        credit: creditRow,
        parsed: { amountInr: amount, utr: ref, isCredit: true },
      });
    }
    const approved = approvePayment(payment.paymentId, {
      reviewedBy: "sms-auto",
      matchVia: "pay_intent",
      smsCreditId: creditId,
      utr: ref,
    });
    const dbAfter = readDb();
    if (dbAfter.payIntents) delete dbAfter.payIntents[intent.userId];
    if (!approved.ok) {
      creditRow.action = "needs_review";
      creditRow.reason = approved.error || "Approve failed after intent";
      creditRow.paymentId = payment.paymentId;
      return saveCreditAndReturn(
        {
          ok: false,
          action: "needs_review",
          reason: creditRow.reason,
          credit: creditRow,
          parsed: { amountInr: amount, utr: ref, isCredit: true },
        },
        dbAfter
      );
    }
    creditRow.action = "approve";
    creditRow.paymentId = payment.paymentId;
    creditRow.userId = intent.userId;
    creditRow.hours = intent.hours;
    creditRow.matchVia = "pay_intent";
    return saveCreditAndReturn(
      {
        ok: true,
        action: "approve",
        reason: decision.reason,
        payment: approved.payment,
        user: approved.user,
        credit: creditRow,
        parsed: { amountInr: amount, utr: ref, isCredit: true },
      },
      dbAfter
    );
  }

  return saveCreditAndReturn(
    {
      ok: true,
      action: decision.action,
      reason: decision.reason,
      candidates: decision.candidates || null,
      credit: creditRow,
      parsed: { amountInr: amount, utr: ref, isCredit: true },
    },
    db
  );
}

function listSmsCredits(limit) {
  const db = readDb();
  const list = Object.values(db.smsCredits || {});
  return list
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
    .slice(0, Math.min(100, Number(limit) || 40));
}

/** Compact feed for admin Android app notifications (poll since timestamp). */
function getAdminAlerts(sinceMs) {
  const since = Math.max(0, Number(sinceMs) || 0);
  const db = readDb();
  const now = Date.now();

  const newUsers = Object.values(db.users || {})
    .filter((u) => Number(u.createdAt || 0) > since)
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
    .slice(0, 30)
    .map((u) => ({
      type: "new_user",
      userId: u.userId,
      createdAt: u.createdAt,
      title: "New user " + u.userId,
      body: "Registered · PIN saved on their browser",
    }));

  const newPayments = Object.values(db.payments || {})
    .filter((p) => Number(p.createdAt || 0) > since)
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
    .slice(0, 40)
    .map((p) => ({
      type: p.status === "pending" ? "pending_payment" : "payment_" + p.status,
      paymentId: p.paymentId,
      userId: p.userId,
      amountInr: p.amountInr,
      status: p.status,
      createdAt: p.createdAt,
      title:
        p.status === "pending"
          ? "Pending pay ₹" + p.amountInr
          : "Payment " + p.status + " ₹" + p.amountInr,
      body: "User " + p.userId + " · " + (p.packageId || ""),
    }));

  const support = Object.values(db.supportThreads || {})
    .filter((t) => Number(t.updatedAt || 0) > since && t.needsAdmin)
    .sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0))
    .slice(0, 30)
    .map((t) => {
      const msgs = t.messages || [];
      const last = msgs[msgs.length - 1];
      return {
        type: "support",
        userId: t.userId,
        createdAt: t.updatedAt,
        title: "Support from " + t.userId,
        body: String(
          (last && last.text) || (last && last.screenshotUrl ? "[screenshot]" : "New message")
        ).slice(0, 120),
      };
    });

  const smsAuto = Object.values(db.smsCredits || {})
    .filter((c) => Number(c.createdAt || 0) > since && c.action === "approve")
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
    .slice(0, 20)
    .map((c) => ({
      type: "sms_auto_approve",
      userId: c.userId,
      paymentId: c.paymentId,
      amountInr: c.amountInr,
      createdAt: c.createdAt,
      title: "SMS auto-unlocked ₹" + (c.amountInr || ""),
      body: "User " + (c.userId || "?") + " · " + (c.reason || "approved"),
    }));

  const alerts = []
    .concat(newUsers, newPayments, support, smsAuto)
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));

  return {
    since: since,
    serverTime: now,
    count: alerts.length,
    alerts: alerts,
    summary: {
      newUsers: newUsers.length,
      payments: newPayments.length,
      support: support.length,
      smsAuto: smsAuto.length,
    },
  };
}

function rejectPayment(paymentId, reason) {
  const db = readDb();
  const pay = db.payments[paymentId];
  if (!pay) return { ok: false, error: "Payment not found" };
  if (pay.status !== "pending") {
    return { ok: false, error: `Already ${pay.status}` };
  }
  pay.status = "rejected";
  pay.rejectReason = String(reason || "").slice(0, 200);
  pay.reviewedAt = Date.now();
  pay.reviewedBy = "admin";
  writeDb(db);
  return { ok: true, payment: pay };
}

function extractBriefFromSetup(rpSetup) {
  const s = String(rpSetup || "");
  const m =
    s.match(/USER RP BRIEF[^:\n]*:\s*([^\n]+)/i) ||
    s.match(/Place:\s*([^\n]+)/i);
  if (!m) return "";
  let brief = m[1]
    .trim()
    .replace(
      /\.\s*(Start vibe|Pace|Resistance|All adults|Scene rule|ACTIVE MOOD|Identity lock|Default shy).*/i,
      ""
    )
    .trim();
  if (!brief || /^none\b/i.test(brief)) return "";
  return brief.slice(0, 200);
}

function extractMoodFromSetup(rpSetup) {
  const m = String(rpSetup || "").match(/ACTIVE MOOD:\s*([^\n.]+)/i);
  return m ? m[1].trim().slice(0, 80) : "";
}

function listUsers() {
  settleStaleSessions();
  const db = readDb();
  if (purgeExpiredChats(db)) writeDb(db);
  const payments = Object.values(db.payments || {});
  const now = Date.now();
  return Object.values(db.users || {})
    .map((u) => {
      const mine = payments.filter((p) => p.userId === u.userId);
      const isLegacy = !/^\d{4}$/.test(String(u.userId || ""));
      const sessions = collectUserSessions(db, u.userId);
      const live = db.chats && db.chats[u.userId];
      const archives = normalizeArchiveList(
        db.chatArchive && db.chatArchive[u.userId]
      );
      let chatMsgCount = 0;
      let latestSession = null;
      for (const item of sessions) {
        const n = visibleChatMessages(item.session && item.session.history).length;
        chatMsgCount += n;
        if (!latestSession) latestSession = item.session;
      }
      const session = latestSession;
      const charName =
        (session && session.form && session.form.characterName) ||
        (session && session.selectedCharacter && session.selectedCharacter.name) ||
        "";
      const botRole =
        (session && session.form && session.form.botRole) || "";
      const hoursLive = liveHoursBalance(u, now);
      const reallyOnline =
        !!u.sessionActive &&
        !!u.lastTickAt &&
        now - Number(u.lastTickAt) <= STALE_SESSION_MS;
      const supportThread = db.supportThreads && db.supportThreads[u.userId];
      const supportUnseen = supportThread
        ? (supportThread.messages || []).filter(function (m) {
            return m.from === "admin" && !m.seenByUserAt;
          }).length
        : 0;
      return {
        userId: u.userId,
        pin: u.pinPlain || null,
        isLegacy,
        needsFourDigit: isLegacy,
        hoursBalance: hoursLive,
        hasPaid: !!u.hasPaid,
        sessionActive: reallyOnline,
        createdAt: u.createdAt,
        lastTickAt: u.lastTickAt || null,
        pendingPayments: mine.filter((p) => p.status === "pending").length,
        approvedPayments: mine.filter((p) => p.status === "approved").length,
        rejectedPayments: mine.filter((p) => p.status === "rejected").length,
        chatMsgCount,
        chatSessionCount: sessions.length,
        chatLive: !!live,
        chatArchived: archives.length > 0,
        characterName: String(charName || "").slice(0, 40),
        botRole: String(botRole || "").slice(0, 40),
        userRole: String(
          (session && session.form && session.form.userRole) || ""
        ).slice(0, 40),
        sceneNote: String(
          (session && session.form && session.form.note) ||
            extractBriefFromSetup(session && session.rpSetup) ||
            ""
        ).slice(0, 160),
        resistance: String(
          (session && session.form && session.form.resistance) || ""
        ).slice(0, 20),
        vibe: String((session && session.form && session.form.vibe) || "").slice(
          0,
          40
        ),
        activeMood: String(extractMoodFromSetup(session && session.rpSetup) || "").slice(
          0,
          40
        ),
        chatUpdatedAt: (session && (session.updatedAt || session.archivedAt)) || null,
        supportUnseen: supportUnseen,
        supportAwaitingUser: supportUnseen > 0,
      };
    })
    .sort((a, b) => b.createdAt - a.createdAt);
}

/** Admin: live + archived chats kept for CHAT_RETENTION_MS (5 days). */
function getChatSessionAdmin(userId) {
  const db = readDb();
  if (purgeExpiredChats(db)) writeDb(db);
  const sessions = collectUserSessions(db, userId);
  const primary = sessions[0] || null;
  return {
    session: primary ? primary.session : null,
    source: primary ? primary.source : null,
    sessions,
    keepDays: 5,
  };
}

function adminAddHours(userId, hours) {
  const db = readDb();
  const id = String(userId || "").trim();
  const user = db.users[id];
  if (!user) return { ok: false, error: "User not found" };
  const add = Number(hours);
  if (!Number.isFinite(add) || add === 0) {
    return { ok: false, error: "Invalid hours" };
  }
  user.hoursBalance = Math.max(0, Number(user.hoursBalance || 0) + add);
  if (add > 0) user.hasPaid = true;
  writeDb(db);
  return { ok: true, user: publicUser(user) };
}

function adminSetHours(userId, hours) {
  const db = readDb();
  const id = String(userId || "").trim();
  const user = db.users[id];
  if (!user) return { ok: false, error: "User not found" };
  const val = Number(hours);
  if (!Number.isFinite(val) || val < 0) {
    return { ok: false, error: "Invalid hours" };
  }
  user.hoursBalance = val;
  if (val <= 0) {
    user.sessionActive = false;
    user.lastTickAt = null;
    // Do not wipe chat — same as natural time-out (pay / add hours to continue)
  }
  writeDb(db);
  return { ok: true, user: publicUser(user), chatCleared: false };
}

function adminResetPin(userId) {
  const db = readDb();
  const id = String(userId || "").trim();
  const user = db.users[id];
  if (!user) return { ok: false, error: "User not found" };

  let pin;
  do {
    pin = String(crypto.randomInt(1000, 10000));
  } while (pin === id);

  const salt = crypto.randomBytes(8).toString("hex");
  user.pinSalt = salt;
  user.pinHash = hashPin(pin, salt);
  user.pinPlain = pin;
  writeDb(db);
  return { ok: true, userId: id, pin };
}

/** Convert old USR_xxx id → unique 4-digit id (keeps hours + payments) */
function adminMigrateToFourDigit(userId) {
  const db = readDb();
  const oldId = String(userId || "").trim();
  const user = db.users[oldId];
  if (!user) return { ok: false, error: "User not found" };
  if (/^\d{4}$/.test(oldId)) {
    return { ok: false, error: "Already a 4-digit ID" };
  }

  const newId = generateUniqueUserId(db);
  let pin = user.pinPlain;
  if (!pin) {
    do {
      pin = String(crypto.randomInt(1000, 10000));
    } while (pin === newId);
  }
  const salt = crypto.randomBytes(8).toString("hex");

  db.users[newId] = {
    ...user,
    userId: newId,
    pinSalt: salt,
    pinHash: hashPin(pin, salt),
    pinPlain: pin,
    migratedFrom: oldId,
  };
  delete db.users[oldId];

  Object.values(db.payments || {}).forEach((p) => {
    if (p.userId === oldId) p.userId = newId;
  });
  Object.values(db.tokens || {}).forEach((t) => {
    if (t.userId === oldId) t.userId = newId;
  });

  writeDb(db);
  return { ok: true, oldId, userId: newId, pin };
}

const MAX_CHAT_MESSAGES = 40;
const MAX_MSG_CHARS = 3500;

function saveChatSession(userId, session) {
  const db = readDb();
  purgeExpiredChats(db);
  const user = db.users[userId];
  if (!user) return { ok: false, error: "User not found" };
  // Allow saving even at 0 hours so the paused scene stays for pay-to-continue
  if (!db.chats) db.chats = {};

  const history = Array.isArray(session?.history) ? session.history : [];
  const cleanHistory = history
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && m.content)
    .slice(-MAX_CHAT_MESSAGES)
    .map((m) => ({
      role: m.role,
      content: String(m.content).slice(0, MAX_MSG_CHARS),
    }));

  const prev = db.chats[userId];
  if (prev && visibleChatMessages(prev.history).length > 0) {
    const prevSetup = String(prev.rpSetup || "");
    const nextSetup = String(session?.rpSetup || "");
    const setupChanged = prevSetup && nextSetup && prevSetup !== nextSetup;
    const resetLike =
      cleanHistory.length <= 3 &&
      visibleChatMessages(prev.history).length > 5;
    if (setupChanged || resetLike) {
      pushChatToArchive(db, userId, prev);
    }
  }

  const hoursLeft = Number(user.hoursBalance || 0);
  db.chats[userId] = {
    updatedAt: Date.now(),
    // Soft hint only; paused (0h) chats keep retention window, not instant expiry
    expiresAt:
      hoursLeft > 0.0001
        ? Date.now() + Math.ceil(hoursLeft * 3600000)
        : Date.now() + CHAT_RETENTION_MS,
    setupLocked: !!session?.setupLocked,
    rpSetup: String(session?.rpSetup || "").slice(0, 2500),
    chatSource: String(session?.chatSource || "maa").slice(0, 20),
    form: session?.form && typeof session.form === "object" ? session.form : {},
    selectedCharacter: session?.selectedCharacter || null,
    history: cleanHistory,
  };
  writeDb(db);
  return { ok: true, session: db.chats[userId] };
}

function getChatSession(userId) {
  const db = readDb();
  if (purgeExpiredChats(db)) writeDb(db);
  const user = db.users[userId];
  if (!user) return null;
  // Return live chat even at 0 hours (paused until they pay)
  const session = (db.chats && db.chats[userId]) || null;
  return session || null;
}

function clearChatSession(userId) {
  const db = readDb();
  if (db.chats && db.chats[userId]) {
    wipeChatInDb(db, userId);
    writeDb(db);
  }
  return { ok: true };
}

/** Hard-delete live + archived chats (no 5-day keep). Frees store space. */
function adminDeleteUserChats(userId) {
  const db = readDb();
  const id = String(userId || "").trim();
  if (!id) return { ok: false, error: "User ID required" };
  let removed = 0;
  if (db.chats && db.chats[id]) {
    delete db.chats[id];
    removed += 1;
  }
  if (db.chatArchive && db.chatArchive[id]) {
    const n = normalizeArchiveList(db.chatArchive[id]).length;
    removed += n;
    delete db.chatArchive[id];
  }
  purgeExpiredChats(db);
  writeDb(db);
  return { ok: true, userId: id, removedSessions: removed };
}

function tryUnlinkUpload(urlPath) {
  try {
    const rel = String(urlPath || "");
    if (!rel.startsWith("/payment-uploads/")) return;
    const name = path.basename(rel);
    if (!name || name === "." || name === "..") return;
    const full = path.join(UPLOAD_DIR, name);
    if (fs.existsSync(full)) fs.unlinkSync(full);
  } catch (e) {
    /* ignore file errors */
  }
}

function tryUnlinkSupportUpload(urlPath) {
  try {
    const rel = String(urlPath || "");
    if (!rel.startsWith("/support-uploads/")) return;
    const name = path.basename(rel);
    if (!name || name === "." || name === "..") return;
    const full = path.join(SUPPORT_UPLOAD_DIR, name);
    if (fs.existsSync(full)) fs.unlinkSync(full);
  } catch (e) {
    /* ignore file errors */
  }
}

/** Wipe every store object keyed to this user (support, notices, reports, intents, SMS). */
function purgeUserRelatedData(db, userId) {
  const id = String(userId || "").trim();
  if (!id) return;

  if (db.supportThreads && db.supportThreads[id]) {
    const msgs = db.supportThreads[id].messages || [];
    for (const m of msgs) {
      if (m && m.screenshotUrl) tryUnlinkSupportUpload(m.screenshotUrl);
    }
    delete db.supportThreads[id];
  }

  if (db.adminNotices) {
    for (const nid of Object.keys(db.adminNotices)) {
      const n = db.adminNotices[nid];
      if (n && String(n.userId || "") === id) delete db.adminNotices[nid];
    }
  }

  if (db.aiReports) {
    for (const rid of Object.keys(db.aiReports)) {
      const r = db.aiReports[rid];
      if (r && String(r.userId || "") === id) delete db.aiReports[rid];
    }
  }

  if (db.payIntents && db.payIntents[id]) {
    delete db.payIntents[id];
  }

  if (db.smsCredits) {
    for (const cid of Object.keys(db.smsCredits)) {
      const c = db.smsCredits[cid];
      if (c && String(c.userId || "") === id) delete db.smsCredits[cid];
    }
  }
}

/** Delete account + chats + tokens + payments + support + reports + notices. */
function adminDeleteUser(userId) {
  const db = readDb();
  const id = String(userId || "").trim();
  if (!id) return { ok: false, error: "User ID required" };
  if (!db.users || !db.users[id]) {
    return { ok: false, error: "User not found" };
  }

  delete db.users[id];

  if (db.chats && db.chats[id]) delete db.chats[id];
  if (db.chatArchive && db.chatArchive[id]) delete db.chatArchive[id];

  let paymentsRemoved = 0;
  if (db.payments) {
    for (const payId of Object.keys(db.payments)) {
      const p = db.payments[payId];
      if (p && p.userId === id) {
        tryUnlinkUpload(p.screenshotUrl);
        delete db.payments[payId];
        paymentsRemoved += 1;
      }
    }
  }

  let tokensRemoved = 0;
  if (db.tokens) {
    for (const tok of Object.keys(db.tokens)) {
      const t = db.tokens[tok];
      if (t && t.userId === id) {
        delete db.tokens[tok];
        tokensRemoved += 1;
      }
    }
  }

  // Device gate entries that only pointed at this user
  if (db.devices) {
    for (const did of Object.keys(db.devices)) {
      const d = db.devices[did];
      if (d && d.userId === id) delete db.devices[did];
    }
  }

  purgeUserRelatedData(db, id);

  purgeExpiredChats(db);
  writeDb(db);
  return {
    ok: true,
    userId: id,
    paymentsRemoved,
    tokensRemoved,
  };
}

/** Drop all chats older than retention (5 days). */
function adminPurgeOldChats() {
  const db = readDb();
  const beforeChats = Object.keys(db.chats || {}).length;
  let beforeArch = 0;
  for (const id of Object.keys(db.chatArchive || {})) {
    beforeArch += normalizeArchiveList(db.chatArchive[id]).length;
  }
  purgeExpiredChats(db);
  const afterChats = Object.keys(db.chats || {}).length;
  let afterArch = 0;
  for (const id of Object.keys(db.chatArchive || {})) {
    afterArch += normalizeArchiveList(db.chatArchive[id]).length;
  }
  writeDb(db);
  return {
    ok: true,
    removedLive: Math.max(0, beforeChats - afterChats),
    removedArchived: Math.max(0, beforeArch - afterArch),
    keepDays: 5,
  };
}

const MAX_AI_REPORTS = 800;

function submitAiReport(payload) {
  const db = readDb();
  if (!db.aiReports) db.aiReports = {};
  const userId = String(payload.userId || "").trim();
  if (!userId) return { ok: false, error: "Login required" };

  const aiMessage = String(payload.aiMessage || "").trim().slice(0, 8000);
  if (!aiMessage) return { ok: false, error: "Nothing to report" };

  const reason = String(payload.reason || "bad reply").trim().slice(0, 80);
  const note = String(payload.note || "").trim().slice(0, 500);
  const context = Array.isArray(payload.context)
    ? payload.context
        .filter((m) => m && (m.role === "user" || m.role === "assistant") && m.content)
        .slice(-12)
        .map((m) => ({
          role: m.role,
          content: String(m.content).slice(0, 3500),
        }))
    : [];

  const reportId = randomId("RPT", 8);
  db.aiReports[reportId] = {
    reportId,
    userId,
    reason,
    note,
    aiMessage,
    context,
    setup: String(payload.setup || "").slice(0, 2500),
    characterName: String(payload.characterName || "").slice(0, 40),
    botRole: String(payload.botRole || "").slice(0, 40),
    userRole: String(payload.userRole || "").slice(0, 40),
    botGender: String(payload.botGender || "").slice(0, 12),
    userGender: String(payload.userGender || "").slice(0, 12),
    createdAt: Date.now(),
  };

  // Cap storage — drop oldest
  const all = Object.values(db.aiReports).sort((a, b) => a.createdAt - b.createdAt);
  if (all.length > MAX_AI_REPORTS) {
    for (let i = 0; i < all.length - MAX_AI_REPORTS; i++) {
      delete db.aiReports[all[i].reportId];
    }
  }

  writeDb(db);
  return { ok: true, reportId };
}

function listAiReports() {
  const db = readDb();
  return Object.values(db.aiReports || {}).sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Aggregate recent AI reports into actionable themes for prompts + admin UI.
 */
function getAiReportDigest(options = {}) {
  const days = Math.min(30, Math.max(1, Number(options.days) || 7));
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  const reports = listAiReports().filter(
    (r) => Number(r.createdAt || 0) >= since
  );

  const themeDefs = [
    {
      id: "ignored-line",
      label: "ignored last message / off-topic",
      re: /(ignore|off.?topic|not.?answer|galat.?jawab|irrelevant|kitchen|weather|padhai|same.?hello)/i,
      hint: "MUST react to the user's latest line first; never pivot to kitchen/padhai/weather off their ask",
    },
    {
      id: "stock-opener",
      label: "stock / repetitive opener",
      re: /(repeat|same|stock|template|aankh|pallu|chehra|boring|har.?baar)/i,
      hint: "Vary openers for every role; ban aankhein-phat / pallu / Main-teri-X-hoon stock essays",
    },
    {
      id: "wrong-role",
      label: "wrong role / address / gender",
      re: /(wrong.?role|bahu|damad|gender|address|rishta|samjhi|papa.?ji|mummy.?ji)/i,
      hint: "Keep correct rishta address and gender verbs every line (Saas≠bahu for damad, etc.)",
    },
    {
      id: "too-fast",
      label: "too fast / instant sex",
      re: /(too.?fast|instant|jaldi|easy|no.?resist|theek.?hai.?aaja|ready)/i,
      hint: "Respect Resistance: dirty talk OK early, but no instant body-yes / Theek-hai-aaja",
    },
    {
      id: "amnesia",
      label: "forgot scene / amnesia",
      re: /(forget|forgot|amnesia|continuity|scene|yaad|pehli.?baar|rewind)/i,
      hint: "Honor ESTABLISHED place/clothes/acts; never rewind mid-scene facts",
    },
    {
      id: "english-essay",
      label: "English / essay / fake voice",
      re: /(english|essay|awkward|uncomfortable|weird|robot|ai|fake)/i,
      hint: "Stay short desi WhatsApp Hinglish; no English filler (awkward/weird/suddenly)",
    },
  ];

  const themes = themeDefs
    .map(function (def) {
      const matched = reports.filter(function (r) {
        const blob = [r.reason, r.note, r.aiMessage].join(" ");
        return def.re.test(blob);
      });
      return {
        id: def.id,
        label: def.label,
        hint: def.hint,
        count: matched.length,
      };
    })
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Always include top universal hints so voice stays sharp even with few reports
  if (!themes.length) {
    themes.push(
      {
        id: "ignored-line",
        label: "stay on last line",
        hint: "MUST react to the user's latest line first; never pivot to kitchen/padhai/weather off their ask",
        count: 0,
      },
      {
        id: "stock-opener",
        label: "vary openers",
        hint: "Vary openers for every role; ban aankhein-phat / pallu / Main-teri-X-hoon stock essays",
        count: 0,
      }
    );
  }

  const byRole = {};
  reports.forEach(function (r) {
    const role = String(r.botRole || "unknown").toLowerCase() || "unknown";
    byRole[role] = (byRole[role] || 0) + 1;
  });

  return {
    days,
    total: reports.length,
    themes,
    byRole: Object.keys(byRole)
      .map(function (k) {
        return { role: k, count: byRole[k] };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 12),
    topNotes: reports
      .filter((r) => r.note)
      .slice(0, 8)
      .map(function (r) {
        return {
          reason: r.reason,
          note: String(r.note).slice(0, 120),
          botRole: r.botRole,
          createdAt: r.createdAt,
        };
      }),
  };
}

function clearAiReports() {
  const db = readDb();
  const n = Object.keys(db.aiReports || {}).length;
  db.aiReports = {};
  writeDb(db);
  return { ok: true, cleared: n };
}

function saveSupportScreenshot(base64Data, userId) {
  ensureDirs();
  const raw = String(base64Data || "");
  const m = raw.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  const b64 = m ? m[2] : raw.includes(",") ? raw.split(",").pop() : raw;
  const mime = m ? m[1] : "image/jpeg";
  const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
  const buf = Buffer.from(b64, "base64");
  if (!buf.length || buf.length > 4.5 * 1024 * 1024) {
    throw new Error("Screenshot invalid or too large (max ~4MB)");
  }
  const filename = `${userId}-${Date.now()}.${ext}`;
  fs.writeFileSync(path.join(SUPPORT_UPLOAD_DIR, filename), buf);
  return `/support-uploads/${filename}`;
}

function getOrCreateSupportThread(db, userId) {
  if (!db.supportThreads) db.supportThreads = {};
  const id = String(userId || "").trim();
  if (!db.supportThreads[id]) {
    db.supportThreads[id] = {
      userId: id,
      status: "open",
      updatedAt: Date.now(),
      messages: [],
    };
  }
  return db.supportThreads[id];
}

function publicSupportThread(thread) {
  if (!thread) {
    return {
      userId: "",
      status: "open",
      updatedAt: null,
      awaitingUserSeen: false,
      messages: [],
    };
  }
  return {
    userId: thread.userId,
    status: thread.status || "open",
    updatedAt: thread.updatedAt || null,
    awaitingUserSeen: !!thread.awaitingUserSeen,
    messages: (thread.messages || []).map(function (m) {
      return {
        id: m.id,
        from: m.from,
        text: m.text || "",
        screenshotUrl: m.screenshotUrl || null,
        createdAt: m.createdAt,
        seenByUserAt: m.seenByUserAt || null,
        notifyUser: !!m.notifyUser,
      };
    }),
  };
}

function getSupportThread(userId) {
  const db = readDb();
  const id = String(userId || "").trim();
  if (!id) return { ok: false, error: "Login required" };
  if (!db.users[id]) return { ok: false, error: "User not found" };
  if (!db.supportThreads || !db.supportThreads[id]) {
    return {
      ok: true,
      thread: { userId: id, status: "open", updatedAt: null, messages: [] },
    };
  }
  return { ok: true, thread: publicSupportThread(db.supportThreads[id]) };
}

function addSupportMessage({ userId, from, text, screenshotBase64 }) {
  const id = String(userId || "").trim();
  const role = from === "admin" ? "admin" : "user";
  const body = String(text || "").trim().slice(0, 2000);
  if (!id) return { ok: false, error: "User ID required" };
  if (!body && !screenshotBase64) {
    return { ok: false, error: "Write a message or add a screenshot" };
  }

  const db = readDb();
  if (!db.users[id]) return { ok: false, error: "User not found" };

  let screenshotUrl = null;
  if (screenshotBase64) {
    try {
      screenshotUrl = saveSupportScreenshot(screenshotBase64, id);
    } catch (e) {
      return { ok: false, error: e.message || "Screenshot upload failed" };
    }
  }

  const thread = getOrCreateSupportThread(db, id);
  const msg = {
    id: randomId("SUP", 8),
    from: role,
    text: body,
    screenshotUrl,
    createdAt: Date.now(),
    notifyUser: role === "admin",
    seenByUserAt: role === "admin" ? null : Date.now(),
  };
  thread.messages = thread.messages || [];
  thread.messages.push(msg);
  if (thread.messages.length > 200) {
    thread.messages = thread.messages.slice(-200);
  }
  thread.updatedAt = Date.now();
  thread.status = "open";
  if (role === "user") {
    thread.needsAdmin = true;
    // User replied — treat admin's pending notify as seen
    markSupportMessagesSeenInThread(thread);
    thread.awaitingUserSeen = false;
  }
  if (role === "admin") {
    thread.needsAdmin = false;
    thread.awaitingUserSeen = true;
  }
  writeDb(db);
  return { ok: true, thread: publicSupportThread(thread), message: msg };
}

function markSupportMessagesSeenInThread(thread) {
  if (!thread || !thread.messages) return;
  const now = Date.now();
  for (const m of thread.messages) {
    if (m.from === "admin" && m.notifyUser && !m.seenByUserAt) {
      m.seenByUserAt = now;
    }
  }
}

/** User opened popup / Support — mark admin messages as seen. */
function markSupportSeenByUser(userId) {
  const id = String(userId || "").trim();
  if (!id) return { ok: false, error: "Login required" };
  const db = readDb();
  const thread = db.supportThreads && db.supportThreads[id];
  if (!thread) return { ok: true, seen: 0 };
  let n = 0;
  const now = Date.now();
  for (const m of thread.messages || []) {
    if (m.from === "admin" && !m.seenByUserAt) {
      m.seenByUserAt = now;
      n += 1;
    }
  }
  thread.awaitingUserSeen = false;
  writeDb(db);
  return { ok: true, seen: n };
}

/** Latest admin Support message waiting for user popup. */
function getSupportPopupForUser(userId) {
  const id = String(userId || "").trim();
  const db = readDb();
  const thread = db.supportThreads && db.supportThreads[id];
  if (!thread) return null;
  const unseen = (thread.messages || [])
    .filter(function (m) {
      return m.from === "admin" && !m.seenByUserAt;
    })
    .sort(function (a, b) {
      return Number(b.createdAt || 0) - Number(a.createdAt || 0);
    });
  if (!unseen.length) return null;
  const m = unseen[0];
  return {
    messageId: m.id,
    title: "Support · Admin",
    text: m.text || (m.screenshotUrl ? "[screenshot]" : ""),
    createdAt: m.createdAt,
    unreadCount: unseen.length,
  };
}

function listSupportThreads() {
  const db = readDb();
  if (!db.supportThreads) db.supportThreads = {};

  // Drop leftover threads for deleted accounts
  let purged = false;
  for (const uid of Object.keys(db.supportThreads)) {
    if (!db.users || !db.users[uid]) {
      purgeUserRelatedData(db, uid);
      purged = true;
    }
  }
  if (purged) writeDb(db);

  const threads = Object.values(db.supportThreads || {});
  return threads
    .map(function (t) {
      const msgs = t.messages || [];
      const last = msgs[msgs.length - 1];
      const unseenForUser = msgs.filter(function (m) {
        return m.from === "admin" && !m.seenByUserAt;
      }).length;
      return {
        userId: t.userId,
        status: t.status || "open",
        updatedAt: t.updatedAt || 0,
        needsAdmin: !!t.needsAdmin,
        awaitingUserSeen: !!t.awaitingUserSeen || unseenForUser > 0,
        userUnseenCount: unseenForUser,
        messageCount: msgs.length,
        lastFrom: last ? last.from : null,
        lastText: last
          ? String(last.text || (last.screenshotUrl ? "[screenshot]" : "")).slice(
              0,
              120
            )
          : "",
        lastAt: last ? last.createdAt : t.updatedAt || 0,
      };
    })
    .sort(function (a, b) {
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });
}

function setSupportThreadStatus(userId, status) {
  const db = readDb();
  const id = String(userId || "").trim();
  const thread = db.supportThreads && db.supportThreads[id];
  if (!thread) return { ok: false, error: "No support thread" };
  thread.status = status === "closed" ? "closed" : "open";
  if (thread.status === "closed") thread.needsAdmin = false;
  thread.updatedAt = Date.now();
  writeDb(db);
  return { ok: true, thread: publicSupportThread(thread) };
}

/** Read-only dashboard metrics from existing store (no schema change). */
function getAnalytics() {
  settleStaleSessions();
  const db = readDb();
  const users = Object.values(db.users || {});
  const payments = Object.values(db.payments || {});
  const reports = Object.values(db.aiReports || {});
  const now = Date.now();
  const dayMs = 24 * 3600000;
  const weekMs = 7 * dayMs;

  const approved = payments.filter((p) => p.status === "approved");
  const pending = payments.filter((p) => p.status === "pending");
  const rejected = payments.filter((p) => p.status === "rejected");

  let chatMessages = 0;
  let liveChats = 0;
  for (const u of users) {
    const sessions = collectUserSessions(db, u.userId);
    if (db.chats && db.chats[u.userId]) liveChats += 1;
    for (const item of sessions) {
      chatMessages += visibleChatMessages(item.session && item.session.history).length;
    }
  }

  const hoursSold = approved.reduce((s, p) => s + Number(p.hours || 0), 0);
  const moneyInr = approved.reduce((s, p) => s + Number(p.amountInr || 0), 0);
  const hoursLive = users.reduce((s, u) => s + liveHoursBalance(u, now), 0);
  const reallyOnline = (u) =>
    !!u.sessionActive &&
    !!u.lastTickAt &&
    now - Number(u.lastTickAt) <= STALE_SESSION_MS;

  return {
    usersTotal: users.length,
    usersToday: users.filter((u) => now - Number(u.createdAt || 0) < dayMs).length,
    usersWeek: users.filter((u) => now - Number(u.createdAt || 0) < weekMs).length,
    paidUsers: users.filter((u) => u.hasPaid).length,
    trialOnly: users.filter((u) => !u.hasPaid).length,
    withTimeLeft: users.filter((u) => liveHoursBalance(u, now) > 0.0001).length,
    sessionActive: users.filter(reallyOnline).length,
    liveChats,
    chatMessages,
    paymentsPending: pending.length,
    paymentsApproved: approved.length,
    paymentsRejected: rejected.length,
    moneyInr: Math.round(moneyInr),
    hoursSold: Math.round(hoursSold * 10) / 10,
    hoursLive: Math.round(hoursLive * 10) / 10,
    aiReports: reports.length,
    aiReportsToday: reports.filter((r) => now - Number(r.createdAt || 0) < dayMs).length,
    generatedAt: now,
  };
}

function ensureAdminNotices(db) {
  if (!db.adminNotices || typeof db.adminNotices !== "object") {
    db.adminNotices = {};
  }
}

function sendAdminNotice({ userId, text, title }) {
  const id = String(userId || "").trim();
  const body = String(text || "").trim().slice(0, 500);
  const head = String(title || "").trim().slice(0, 80);
  if (!id) return { ok: false, error: "User ID required" };
  if (!body) return { ok: false, error: "Message required" };

  const db = readDb();
  if (!db.users[id]) return { ok: false, error: "User not found" };
  ensureAdminNotices(db);

  const noticeId = randomId("NTC", 8);
  const notice = {
    noticeId,
    userId: id,
    title: head || "Message from admin",
    text: body,
    createdAt: Date.now(),
    seenAt: null,
    createdBy: "admin",
  };
  db.adminNotices[noticeId] = notice;
  writeDb(db);
  return { ok: true, notice: publicAdminNotice(notice) };
}

function publicAdminNotice(n) {
  return {
    noticeId: n.noticeId,
    userId: n.userId,
    title: n.title || "Message from admin",
    text: n.text,
    createdAt: n.createdAt,
    seenAt: n.seenAt || null,
    seen: !!n.seenAt,
  };
}

function listAdminNotices(opts) {
  const options = opts || {};
  const db = readDb();
  ensureAdminNotices(db);
  let list = Object.values(db.adminNotices);
  if (options.userId) {
    const uid = String(options.userId).trim();
    list = list.filter((n) => n.userId === uid);
  }
  if (options.unseenOnly) {
    list = list.filter((n) => !n.seenAt);
  }
  return list
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
    .slice(0, Math.min(200, Number(options.limit) || 80))
    .map(publicAdminNotice);
}

function listUserNotices(userId, opts) {
  const options = opts || {};
  const db = readDb();
  ensureAdminNotices(db);
  let list = Object.values(db.adminNotices).filter(
    (n) => n.userId === String(userId || "").trim()
  );
  if (options.unseenOnly) list = list.filter((n) => !n.seenAt);
  return list
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
    .slice(0, 20)
    .map(publicAdminNotice);
}

function markNoticeSeen(userId, noticeId) {
  const db = readDb();
  ensureAdminNotices(db);
  const n = db.adminNotices[String(noticeId || "")];
  if (!n) return { ok: false, error: "Notice not found" };
  if (n.userId !== String(userId || "").trim()) {
    return { ok: false, error: "Not your notice" };
  }
  if (!n.seenAt) n.seenAt = Date.now();
  writeDb(db);
  return { ok: true, notice: publicAdminNotice(n) };
}

function noticeStatsForUser(db, userId) {
  ensureAdminNotices(db);
  const mine = Object.values(db.adminNotices).filter(
    (n) => n.userId === String(userId || "")
  );
  const unread = mine.filter((n) => !n.seenAt).length;
  const latest = mine.sort(
    (a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)
  )[0];
  return {
    noticeUnread: unread,
    lastNoticeSeen: latest ? !!latest.seenAt : null,
    lastNoticeAt: latest ? latest.createdAt : null,
  };
}

module.exports = {
  ensureDirs,
  PACKAGES,
  getPackages,
  getTrialMinutes,
  assertAdultDob,
  createUser,
  loginUser,
  adminLogin,
  isAdminCredentials,
  getTokenRecord,
  publicUser,
  getUser,
  tickUserHours,
  pauseSession,
  settleStaleSessions,
  liveHoursBalance,
  formatClock,
  submitPayment,
  recordPayIntent,
  listPayments,
  approvePayment,
  rejectPayment,
  ingestSmsCredit,
  listSmsCredits,
  getAdminAlerts,
  parseCreditSms,
  paymentInfo,
  listUsers,
  adminAddHours,
  adminSetHours,
  adminResetPin,
  adminMigrateToFourDigit,
  saveChatSession,
  getChatSession,
  getChatSessionAdmin,
  clearChatSession,
  adminDeleteUserChats,
  adminDeleteUser,
  adminPurgeOldChats,
  submitAiReport,
  listAiReports,
  getAiReportDigest,
  clearAiReports,
  getSupportThread,
  addSupportMessage,
  listSupportThreads,
  setSupportThreadStatus,
  markSupportSeenByUser,
  getSupportPopupForUser,
  getAnalytics,
  getSettings,
  adminGetSettings,
  updatePaySettings,
  saveUpiQrBase64,
  clearUpiQr,
  sendAdminNotice,
  listAdminNotices,
  listUserNotices,
  markNoticeSeen,
};
