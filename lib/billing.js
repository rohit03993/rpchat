const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = path.join(__dirname, "..", "data");
const UPLOAD_DIR = path.join(__dirname, "..", "public", "payment-uploads");
const UPI_UPLOAD_DIR = path.join(__dirname, "..", "public", "upi-uploads");
const DB_FILE = path.join(DATA_DIR, "store.json");

const RATE_INR = Number(process.env.RATE_INR_PER_HOUR || 130);
const DEVICE_REGISTER_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

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
    packages: DEFAULT_PACKAGES.map((p) => ({ ...p })),
  };
}

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  if (!fs.existsSync(UPI_UPLOAD_DIR)) fs.mkdirSync(UPI_UPLOAD_DIR, { recursive: true });
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
  } else if (!Array.isArray(db.settings.packages) || !db.settings.packages.length) {
    db.settings.packages = DEFAULT_PACKAGES.map((p) => ({ ...p }));
    writeDb(db);
  }
  return db.settings;
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

function updatePaySettings({ upiId, upiName, packages }) {
  const db = readDb();
  if (!db.settings) db.settings = defaultSettings();
  if (upiId != null) {
    db.settings.upiId = String(upiId).trim().slice(0, 80) || db.settings.upiId;
  }
  if (upiName != null) {
    db.settings.upiName =
      String(upiName).trim().slice(0, 80) || db.settings.upiName;
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

function hoursLeftLabel(ms) {
  const h = Math.max(1, Math.ceil(ms / 3600000));
  return h + "h";
}

/**
 * One new account per device (and soft per IP) every 24 hours.
 * Stops free-trial farming. Not as strong as phone OTP, but good local lock.
 */
function assertCanRegister({ deviceId, ip }) {
  const db = readDb();
  if (!db.devices) db.devices = {};

  const did = normalizeDeviceId(deviceId);
  if (!did) {
    return {
      ok: false,
      error: "Device check fail. Page refresh karke dubara try karo.",
    };
  }

  const now = Date.now();
  const byDevice = db.devices[did];
  if (byDevice && byDevice.lastRegisterAt) {
    const left = DEVICE_REGISTER_COOLDOWN_MS - (now - byDevice.lastRegisterAt);
    if (left > 0) {
      return {
        ok: false,
        error:
          "Is device pe naya ID " +
          hoursLeftLabel(left) +
          " baad banega. Pehle wala User ID + PIN use karo (save kiya hona chahiye).",
        retryAfterMs: left,
        existingUserId: byDevice.userId || null,
      };
    }
  }

  const ipKey = String(ip || "")
    .trim()
    .replace(/^::ffff:/, "");
  if (ipKey && ipKey !== "::1" && ipKey !== "127.0.0.1") {
    const ipHit = Object.values(db.devices).find(
      (d) =>
        d &&
        d.ip === ipKey &&
        d.lastRegisterAt &&
        now - d.lastRegisterAt < DEVICE_REGISTER_COOLDOWN_MS
    );
    if (ipHit) {
      const left = DEVICE_REGISTER_COOLDOWN_MS - (now - ipHit.lastRegisterAt);
      return {
        ok: false,
        error:
          "Is network se naya ID " +
          hoursLeftLabel(left) +
          " baad banega. Apna pehle wala User ID use karo.",
        retryAfterMs: left,
      };
    }
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
  const now = Date.now();

  db.users[userId] = {
    userId,
    pinHash,
    pinSalt: salt,
    pinPlain: pin,
    hoursBalance: 5 / 60,
    trialMinutes: 5,
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

  return { userId, trialMinutes: 5 };
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
  const hours = Number(user.hoursBalance || 0);
  // Trial is ~5 min; anything ~1h+ means paid (also supports older accounts)
  const hasPaid = !!user.hasPaid || hours >= 0.99;
  const totalSec = Math.max(0, Math.floor(hours * 3600));
  const minutes = Math.max(0, Math.ceil(hours * 60));
  return {
    userId: user.userId,
    hoursBalance: hours,
    hasPaid,
    minutesLeft: minutes,
    secondsLeft: totalSec,
    timeLabel: formatClock(totalSec),
    sessionActive: !!user.sessionActive,
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

/** Drain wallet by elapsed time while session is active. */
function tickUserHours(userId) {
  const db = readDb();
  const user = db.users[userId];
  if (!user) return { ok: false, error: "User not found" };

  const now = Date.now();
  if (user.sessionActive && user.lastTickAt) {
    const elapsedMs = Math.max(0, now - user.lastTickAt);
    const usedHours = elapsedMs / 3600000;
    user.hoursBalance = Math.max(0, Number(user.hoursBalance || 0) - usedHours);
  }

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
    const usedHours = Math.max(0, Date.now() - user.lastTickAt) / 3600000;
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

function submitPayment({ userId, packageId, screenshotBase64, upiNote }) {
  const pack = getPackage(packageId);
  if (!pack) throw new Error("Invalid package");

  const screenshotUrl = saveScreenshot(screenshotBase64, userId);
  const db = readDb();
  const paymentId = randomId("PAY", 8);
  db.payments[paymentId] = {
    paymentId,
    userId,
    packageId: pack.id,
    hours: pack.hours,
    amountInr: pack.priceInr,
    screenshotUrl,
    upiNote: String(upiNote || "").slice(0, 120),
    status: "pending",
    createdAt: Date.now(),
    reviewedAt: null,
    reviewedBy: null,
  };
  writeDb(db);
  return db.payments[paymentId];
}

function listPayments(status) {
  const db = readDb();
  let list = Object.values(db.payments);
  if (status) list = list.filter((p) => p.status === status);
  return list.sort((a, b) => b.createdAt - a.createdAt);
}

function approvePayment(paymentId) {
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
  pay.reviewedBy = "admin";
  writeDb(db);
  return { ok: true, payment: pay, user: publicUser(user) };
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

function listUsers() {
  const db = readDb();
  if (purgeExpiredChats(db)) writeDb(db);
  const payments = Object.values(db.payments || {});
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
      return {
        userId: u.userId,
        pin: u.pinPlain || null,
        isLegacy,
        needsFourDigit: isLegacy,
        hoursBalance: Number(u.hoursBalance || 0),
        hasPaid: !!u.hasPaid,
        sessionActive: !!u.sessionActive,
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
        chatUpdatedAt: (session && (session.updatedAt || session.archivedAt)) || null,
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

/** Delete account + chats + tokens + payments (and screenshot files). */
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

function clearAiReports() {
  const db = readDb();
  const n = Object.keys(db.aiReports || {}).length;
  db.aiReports = {};
  writeDb(db);
  return { ok: true, cleared: n };
}

/** Read-only dashboard metrics from existing store (no schema change). */
function getAnalytics() {
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
  const hoursLive = users.reduce((s, u) => s + Number(u.hoursBalance || 0), 0);

  return {
    usersTotal: users.length,
    usersToday: users.filter((u) => now - Number(u.createdAt || 0) < dayMs).length,
    usersWeek: users.filter((u) => now - Number(u.createdAt || 0) < weekMs).length,
    paidUsers: users.filter((u) => u.hasPaid).length,
    trialOnly: users.filter((u) => !u.hasPaid).length,
    withTimeLeft: users.filter((u) => Number(u.hoursBalance || 0) > 0.0001).length,
    sessionActive: users.filter((u) => u.sessionActive).length,
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

module.exports = {
  ensureDirs,
  PACKAGES,
  getPackages,
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
  formatClock,
  submitPayment,
  listPayments,
  approvePayment,
  rejectPayment,
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
  clearAiReports,
  getAnalytics,
  getSettings,
  adminGetSettings,
  updatePaySettings,
  saveUpiQrBase64,
  clearUpiQr,
};
