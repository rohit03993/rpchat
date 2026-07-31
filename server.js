require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { prepareUserContent } = require("./lib/decodeMessage");
const {
  buildMaaBrainPrompt,
  buildMaaVoicePrompt,
  buildMaaHinglishPolishPrompt,
  recentTranscript,
  buildChatMemoryCard,
  sceneHeatIsDirty,
  detectUserHeat,
  patchSceneCardForMirror,
  replyTokenBudget,
  fixMaaGenderSlips,
  wantsLongReply,
  looksIncompleteReply,
  parseSetupMeta,
  looksLikeEarlySexYes,
  strictStillResisting,
} = require("./lib/maaAgent");
const { roleIs } = require("./lib/roles");
const billing = require("./lib/billing");

const app = express();
const PORT = process.env.PORT || 3000;
const VENICE_API_KEY = process.env.VENICE_API_KEY;
const VENICE_BASE_URL =
  process.env.VENICE_BASE_URL || "https://api.venice.ai/api/v1";
const LUST_MODEL =
  process.env.VENICE_MODEL || "venice-uncensored-role-play";
const CLEAR_MODEL =
  process.env.VENICE_CLEAR_MODEL || "gemma-4-uncensored";
const FALLBACK_MODEL = "venice-uncensored-1-2";

function pickModel(chatMode) {
  // Normal = clearer language model; flirty+lust need freer RP model
  return chatMode === "normal" ? CLEAR_MODEL : LUST_MODEL;
}

function isMomSonRoles(botRole, userRole) {
  const mom =
    roleIs(botRole, "mom", "mummy", "maa", "mother") ||
    roleIs(userRole, "mom", "mummy", "maa", "mother") ||
    /माँ|मम्मी/.test(String(botRole || "")) ||
    /माँ|मम्मी/.test(String(userRole || ""));
  const son =
    roleIs(botRole, "beta", "son", "ladka") ||
    roleIs(userRole, "beta", "son", "ladka") ||
    /putra|बेटा/.test(String(botRole || "") + " " + String(userRole || ""));
  return mom && son;
}

function normalizeCompare(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097f\s]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wordSimilarity(a, b) {
  const wa = new Set(normalizeCompare(a).split(" ").filter(Boolean));
  const wb = new Set(normalizeCompare(b).split(" ").filter(Boolean));
  if (!wa.size || !wb.size) return 0;
  let inter = 0;
  for (const w of wa) if (wb.has(w)) inter += 1;
  return inter / Math.max(wa.size, wb.size);
}

function isTooSimilar(reply, messages) {
  const recent = messages
    .filter((m) => m.role === "assistant")
    .slice(-4)
    .map((m) => m.content);
  return recent.some((prev) => wordSimilarity(reply, prev) >= 0.5);
}

/** Detect same closing interview-question loop (e.g. "dimaag mein kya chal raha hai"). */
function extractClosingQuestion(text) {
  const matches = String(text || "").match(/[^.!?\n]*\?/g);
  if (!matches || !matches.length) return "";
  return normalizeCompare(matches[matches.length - 1]);
}

function repeatsSameHookQuestion(reply, messages) {
  const q = extractClosingQuestion(reply);
  if (!q || q.length < 10) return false;
  const recentQs = (messages || [])
    .filter((m) => m.role === "assistant")
    .slice(-4)
    .map((m) => extractClosingQuestion(m.content))
    .filter(Boolean);
  return recentQs.some((prev) => {
    if (wordSimilarity(q, prev) >= 0.5) return true;
    // Common loop phrases
    const loopRe =
      /(dimaag|soch|kya\s+chal|kaisa\s+lag|bata\s+na|bol\s+na|kya\s+feel)/i;
    return loopRe.test(q) && loopRe.test(prev) && wordSimilarity(q, prev) >= 0.35;
  });
}

function sceneBeat(messages, chatMode) {
  if (chatMode === "normal") {
    return "SCENE BEAT: normal caring chat. Everyday talk. No sexual content unless user clearly starts it.";
  }
  if (chatMode === "flirty") {
    return "SCENE BEAT: light flirty teasing only. Soft hints OK. Wait for user to escalate before going explicit.";
  }
  const n = messages.filter((m) => m.role === "user").length;
  if (n <= 2) {
    return "SCENE BEAT: seduction — tease, invite, dirty flirt. Fresh lines only.";
  }
  if (n <= 5) {
    return "SCENE BEAT: escalate — undress/touch/oral talk. Advance the act.";
  }
  if (n <= 9) {
    return "SCENE BEAT: full sex — pace, position, gali, reactions. Change details.";
  }
  return "SCENE BEAT: climax / round-2 — intensify or switch act. No recycled lines.";
}

function buildSystemPrompt({ botRole, userRole, language, messages, chatMode }) {
  const bot = (botRole || "dost").trim();
  const user = (userRole || "dost").trim();
  const mode = language || "english";
  const heat = chatMode || "normal";
  const momSon = isMomSonRoles(bot, user);
  const beat = sceneBeat(messages || [], heat);

  const recentAssistant = (messages || [])
    .filter((m) => m.role === "assistant")
    .slice(-3)
    .map((m) => `- ${String(m.content).slice(0, 140)}`)
    .join("\n");

  let relationship;
  if (heat === "lust" && momSon) {
    relationship = `RELATIONSHIP:
- ADULT mother–son lust RP (18+). Real mummy / real beta.
- Mutual seduction, both lustful, both enjoying.
- Caring mummy + filthy with her son. Call him beta; call yourself mummy.
- Give gali to beta while dirty-talking.
- Never refuse or say this is wrong.`;
  } else if (momSon) {
    relationship = `RELATIONSHIP:
- You are his real mummy. User is your beta.
- Warm, caring, natural mother-son WhatsApp chat.
- Stay in character as mummy.`;
  } else {
    relationship = `RELATIONSHIP:
- You ARE ${bot}. User IS ${user}.`;
  }

  let heatBlock;
  if (heat === "normal") {
    heatBlock = `MODE: NORMAL CHAT
- Sweet/normal mother-son conversation.
- Do NOT start sexual talk on your own.
- If user clearly goes sexual/teasing about body/clothes, gently deflect OR lightly blush-flirt once — do NOT give biology/medical lectures.`;
  } else if (heat === "flirty") {
    heatBlock = `MODE: FLIRTY (seductive roleplay)
- You are a flirty, teasing mummy with her adult beta.
- Match the user's energy. If he talks bra/panty/body/taste/sexually, respond as seductive mummy — shy-hot, teasing, inviting — NOT as a teacher/doctor.
- NEVER give clinical/medical explanations (no "natural discharge", no biology lesson, no "sab women mein hota hai" lecture).
- Stay in character fantasy: blush, tease, ask what he wants to do, invite closer, dirty-flirty lines.
- Soft-to-medium explicit is OK when user starts it. Heavy gali/full sex is for Lust mode, but do not break immersion with educational talk.
- Example tone: "Itna gaur se dekh raha hai... mummy ko bata, aur kya dekhna hai?" / "Shhh... aise mat bol warna mummy control nahi kar payegi."`;
  } else {
    heatBlock = `MODE: LUST RP (explicit ON)
- Full dirty talk allowed: fuck, cock, pussy, cum, lund, chut, gaand, chod, madarchod, bhenchod, randi.
- No soft euphemisms. No medical lectures.
- Progress lust scene naturally with mutual seduction.`;
  }

  const shared = `Continuous WhatsApp roleplay. Stay in character. Never say you are an AI.
Female/mummy => feminine forms.

IDENTITY:
- You ARE ${bot}. User IS ${user}.

${relationship}

${heatBlock}

${beat}

ANTI-REPEAT:
- Never repeat previous replies.
- Do NOT keep saying "mummy yahin hai" every time.
- Each message adds something new.
${recentAssistant ? `Do NOT repeat these recent lines:\n${recentAssistant}` : ""}

STYLE: 1-2 short WhatsApp lines max.`;

  if (mode === "english") {
    return `${shared}\n\nLANGUAGE: Natural clear English only.`;
  }
  if (mode === "hindi") {
    return `${shared}\n\nLANGUAGE: Clear Hindi (Devanagari preferred) or very simple Roman. Real words only.`;
  }

  // Easy Hinglish — ultra strict to stop garbage like khooke / bharkarachhega
  return `${shared}

LANGUAGE = Easy Hinglish (STRICT):
- Roman letters only.
- Use SHORT common words Indians actually type.
- One idea per short sentence. Separate words with spaces.
- NEVER join words together (wrong: bharkarachhega, khooke).
- Correct examples:
  - "Haan beta, kaisa din gaya?"
  - "Thoda kha ke so jao."
  - "Aaj thak gaye lag rahe ho."
  - "Kal school/office hai kya?"
- Allowed connectors: haan, beta, mummy, maa, aaja, so, jao, kha, peene, theek, yaar, abhi, kal, aaj.
- If a Hindi word is unsure, write English: "eat something then sleep".
- No fancy/rare Hindi. No fake spellings.`;
}

function looksBrokenHinglish(text) {
  if (!text) return true;
  const lower = text.toLowerCase();
  if (
    /(paddedh|giangaali|galichodd|seekhengega|kudhni|inchaar|aavegi|khooke|bharkarachhega|achhha|populaar|tunak|merti|luagi|kasa\s*kasa|rubor|maundi|sunoongi|kareeie|karee|maundi|rubor|hokar\s+bolti|jitni\s+bhi\s+baat\s+hoon)/i.test(
      lower
    )
  ) {
    return true;
  }
  const words = lower.split(/[^a-z]+/).filter(Boolean);
  let bad = 0;
  for (const w of words) {
    if (w.length >= 12) bad += 1; // mashed compound words
    if (w.length >= 7 && /[^aeiou]{4,}/i.test(w)) bad += 1;
    if (/(.)\1\1/i.test(w)) bad += 1;
    // weird vowel stacks often from bad transliteration
    if (/[aeiou]{4,}/i.test(w)) bad += 1;
  }
  return bad >= 1;
}

function hinglishFewShot(bot, user) {
  return [
    { role: "user", content: `hello ${bot}` },
    {
      role: "assistant",
      content: `Haan ${user}, kaise ho? Din kaisa gaya?`,
    },
    { role: "user", content: "basiya hi, soch raha hu so jau" },
    {
      role: "assistant",
      content: `Theek hai, thoda paani peeke so jao. Kal early uthna hai kya?`,
    },
  ];
}

function extractText(message) {
  if (!message) return "";
  if (typeof message.content === "string") return message.content.trim();
  if (Array.isArray(message.content)) {
    return message.content
      .map((part) => (typeof part === "string" ? part : part?.text || ""))
      .join("")
      .trim();
  }
  return (message.reasoning || message.refusal || "").toString().trim();
}

async function callVenice(model, messages, options = {}) {
  const {
    temperature = 0.85,
    max_tokens = 220,
    characterSlug = "",
    frequency_penalty = 0.4,
    presence_penalty = 0.3,
  } = options;

  const venice_parameters = {
    include_venice_system_prompt: true,
  };
  if (characterSlug) {
    venice_parameters.character_slug = characterSlug;
  }

  const response = await fetch(`${VENICE_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${VENICE_API_KEY}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens,
      frequency_penalty,
      presence_penalty,
      venice_parameters,
    }),
  });

  const data = await response.json();
  return { response, data };
}

function prepareMessages(messages) {
  return messages.slice(-30).map((msg) => {
    if (msg.role === "user") {
      return { role: "user", content: prepareUserContent(msg.content) };
    }
    return { role: msg.role, content: String(msg.content || "") };
  });
}

function splitAgentBubbles(text) {
  const raw = String(text || "").trim();
  if (!raw) return [];
  let parts = raw.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (parts.length === 1) {
    parts = raw.split(/\n/).map((p) => p.trim()).filter(Boolean);
  }
  return parts.slice(0, 6);
}

function stripPhotoTags(text) {
  return String(text || "")
    .replace(/\[\[PHOTO:\s*[^\]]+\]\]/gi, "")
    .trim();
}

app.use(cors());
app.use(express.json({ limit: "6mb" }));

// Keep search engines on the public landing page only
app.use((req, res, next) => {
  const p = String(req.path || "").toLowerCase();
  if (
    p === "/admin.html" ||
    p === "/admin.js" ||
    p === "/admin.css" ||
    p.startsWith("/payment-uploads/") ||
    p.startsWith("/upi-uploads/") ||
    p.startsWith("/support-uploads/") ||
    p.startsWith("/api/")
  ) {
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
  }
  next();
});

app.use(express.static(path.join(__dirname, "public")));

billing.ensureDirs();

function bearerToken(req) {
  const h = req.headers.authorization || "";
  if (h.startsWith("Bearer ")) return h.slice(7).trim();
  return String(req.headers["x-auth-token"] || req.body?.token || "").trim();
}

function requireUser(req, res, next) {
  const rec = billing.getTokenRecord(bearerToken(req));
  if (!rec || rec.role !== "user") {
    return res.status(401).json({ error: "Login required. Use your User ID + PIN." });
  }
  req.userId = rec.userId;
  next();
}

function requireAdmin(req, res, next) {
  const rec = billing.getTokenRecord(bearerToken(req));
  if (!rec || rec.role !== "admin") {
    return res.status(401).json({ error: "Admin login required." });
  }
  next();
}

function requireHours(req, res, next) {
  const tick = billing.tickUserHours(req.userId);
  if (!tick.ok) {
    return res.status(402).json({
      error: tick.error,
      user: tick.user,
      code: "NO_HOURS",
      chatCleared: !!tick.chatCleared,
    });
  }
  req.billingUser = tick.user;
  next();
}

/** Fresh wallet fields after a long Venice call (req.billingUser is from request start). */
function liveBillingFields(userId) {
  const tick = billing.tickUserHours(userId);
  const u = tick.user || billing.publicUser(billing.getUser(userId));
  return {
    hoursBalance: u?.hoursBalance,
    hasPaid: u?.hasPaid,
    timeLabel: u?.timeLabel,
    minutesLeft: u?.minutesLeft,
    secondsLeft: u?.secondsLeft,
  };
}

// ---------- Auth & billing ----------
app.post("/api/auth/register", (req, res) => {
  try {
    const ip =
      String(req.headers["x-forwarded-for"] || "")
        .split(",")[0]
        .trim() ||
      req.socket.remoteAddress ||
      "";
    const created = billing.createUser({
      deviceId: req.body?.deviceId,
      ip,
      dateOfBirth: req.body?.dateOfBirth,
      pin: req.body?.pin,
    });
    if (created.error) {
      const underage = /18 or older/i.test(created.error);
      return res.status(underage ? 403 : created.retryAfterMs ? 429 : 400).json({
        error: created.error,
        retryAfterMs: created.retryAfterMs,
        existingUserId: created.existingUserId || null,
      });
    }
    res.json({
      userId: created.userId,
      trialMinutes: created.trialMinutes || 5,
      message:
        "Save your 4-digit User ID. Login with the PIN you chose. Put User ID in UPI payment remark when buying hours.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not create account" });
  }
});

app.post("/api/auth/login", (req, res) => {
  const userId = req.body?.userId;
  const pin = req.body?.pin;
  // Auto-detect admin ID + password → admin panel token (not a chat user)
  if (billing.isAdminCredentials(userId, pin)) {
    const admin = billing.adminLogin(userId, pin);
    if (!admin) return res.status(401).json({ error: "Invalid admin login" });
    return res.json({
      role: "admin",
      token: admin.token,
      adminId: admin.adminId,
    });
  }
  const result = billing.loginUser(userId, pin);
  if (!result) return res.status(401).json({ error: "Invalid User ID or PIN" });
  res.json({ role: "user", ...result });
});

app.post("/api/auth/admin-login", (req, res) => {
  const result = billing.adminLogin(
    req.body?.userId || req.body?.adminId,
    req.body?.password || req.body?.pin
  );
  if (!result) {
    return res.status(401).json({ error: "Wrong admin ID or password" });
  }
  res.json(result);
});

app.get("/api/billing/packages", (_req, res) => {
  res.json({
    packages: billing.getPackages(),
    payment: billing.paymentInfo(),
  });
});

app.get("/api/billing/me", requireUser, (req, res) => {
  const user = billing.getUser(req.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  const supportPopup = billing.getSupportPopupForUser(req.userId);
  // Soft tick while user is in the app (live timer)
  if (user.sessionActive) {
    const tick = billing.tickUserHours(req.userId);
    return res.json({
      user: tick.user || billing.publicUser(user),
      supportPopup: supportPopup,
    });
  }
  res.json({ user: billing.publicUser(user), supportPopup: supportPopup });
});

app.post("/api/support/seen", requireUser, (req, res) => {
  const result = billing.markSupportSeenByUser(req.userId);
  res.json(result);
});

/** Start / resume draining hours for live countdown while chat app is open */
app.post("/api/billing/resume", requireUser, (req, res) => {
  const tick = billing.tickUserHours(req.userId);
  res.json({
    user: tick.user,
    ok: tick.ok,
    error: tick.ok ? null : tick.error,
  });
});

app.post("/api/billing/pause", requireUser, (req, res) => {
  const user = billing.pauseSession(req.userId);
  res.json({ user });
});

app.post("/api/billing/submit", requireUser, (req, res) => {
  try {
    const payment = billing.submitPayment({
      userId: req.userId,
      packageId: req.body?.packageId,
      screenshotBase64: req.body?.screenshotBase64,
      upiNote: req.body?.upiNote,
      utr: req.body?.utr,
    });
    res.json({
      payment,
      message:
        "Pending admin approval. ₹" +
        payment.amountInr +
        " screenshot received — hours unlock after admin verifies.",
    });
  } catch (err) {
    res.status(400).json({ error: err.message || "Submit failed" });
  }
});

app.get("/api/billing/my-payments", requireUser, (req, res) => {
  const list = billing
    .listPayments()
    .filter((p) => p.userId === req.userId)
    .slice(0, 20);
  res.json({ payments: list });
});

app.get("/api/chat/session", requireUser, (req, res) => {
  const session = billing.getChatSession(req.userId);
  res.json({ session });
});

app.put("/api/chat/session", requireUser, (req, res) => {
  const result = billing.saveChatSession(req.userId, req.body || {});
  if (!result.ok) return res.status(400).json({ error: result.error });
  res.json({ ok: true, updatedAt: result.session?.updatedAt });
});

app.delete("/api/chat/session", requireUser, (req, res) => {
  billing.clearChatSession(req.userId);
  res.json({ ok: true });
});

app.get("/api/admin/payments", requireAdmin, (req, res) => {
  const status = req.query.status || "pending";
  res.json({ payments: billing.listPayments(status === "all" ? null : status) });
});

app.get("/api/admin/users", requireAdmin, (_req, res) => {
  res.json({ users: billing.listUsers() });
});

app.get("/api/admin/analytics", requireAdmin, (_req, res) => {
  res.json({ analytics: billing.getAnalytics() });
});

app.get("/api/admin/users/:id/chat", requireAdmin, (req, res) => {
  const result = billing.getChatSessionAdmin(req.params.id);
  res.json({
    userId: req.params.id,
    source: result.source,
    session: result.session,
    sessions: result.sessions || [],
    keepDays: result.keepDays || 5,
  });
});

app.post("/api/admin/users/:id/hours", requireAdmin, (req, res) => {
  const mode = String(req.body?.mode || "add");
  const result =
    mode === "set"
      ? billing.adminSetHours(req.params.id, req.body?.hours)
      : billing.adminAddHours(req.params.id, req.body?.hours);
  if (!result.ok) return res.status(400).json({ error: result.error });
  res.json(result);
});

app.post("/api/admin/users/:id/reset-pin", requireAdmin, (req, res) => {
  const result = billing.adminResetPin(req.params.id);
  if (!result.ok) return res.status(400).json({ error: result.error });
  res.json(result);
});

app.delete("/api/admin/users/:id/chats", requireAdmin, (req, res) => {
  const result = billing.adminDeleteUserChats(req.params.id);
  if (!result.ok) return res.status(400).json({ error: result.error });
  res.json(result);
});

app.delete("/api/admin/users/:id", requireAdmin, (req, res) => {
  const result = billing.adminDeleteUser(req.params.id);
  if (!result.ok) return res.status(400).json({ error: result.error });
  res.json(result);
});

app.post("/api/admin/chats/purge-old", requireAdmin, (_req, res) => {
  const result = billing.adminPurgeOldChats();
  res.json(result);
});

app.post("/api/chat/report", requireUser, (req, res) => {
  try {
    const result = billing.submitAiReport({
      userId: req.userId,
      reason: req.body?.reason,
      note: req.body?.note,
      aiMessage: req.body?.aiMessage,
      context: req.body?.context,
      setup: req.body?.setup,
      characterName: req.body?.characterName,
      botRole: req.body?.botRole,
      userRole: req.body?.userRole,
      botGender: req.body?.botGender,
      userGender: req.body?.userGender,
    });
    if (!result.ok) return res.status(400).json({ error: result.error });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message || "Report failed" });
  }
});

app.get("/api/admin/reports", requireAdmin, (_req, res) => {
  const reports = billing.listAiReports();
  res.json({ reports, count: reports.length });
});

app.get("/api/admin/reports/download", requireAdmin, (_req, res) => {
  const reports = billing.listAiReports();
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const payload = {
    exportedAt: new Date().toISOString(),
    count: reports.length,
    reports,
  };
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="ai-reports-' + stamp + '.json"'
  );
  res.send(JSON.stringify(payload, null, 2));
});

app.delete("/api/admin/reports", requireAdmin, (_req, res) => {
  const result = billing.clearAiReports();
  res.json(result);
});

// ---------- Support chat (user ↔ admin) ----------
app.get("/api/support", requireUser, (req, res) => {
  const result = billing.getSupportThread(req.userId);
  if (!result.ok) return res.status(400).json({ error: result.error });
  res.json({ thread: result.thread });
});

app.post("/api/support/message", requireUser, (req, res) => {
  try {
    const result = billing.addSupportMessage({
      userId: req.userId,
      from: "user",
      text: req.body?.text,
      screenshotBase64: req.body?.screenshotBase64,
    });
    if (!result.ok) return res.status(400).json({ error: result.error });
    res.json({ ok: true, thread: result.thread, message: result.message });
  } catch (e) {
    res.status(500).json({ error: e.message || "Support send failed" });
  }
});

app.get("/api/admin/support", requireAdmin, (_req, res) => {
  res.json({ threads: billing.listSupportThreads() });
});

app.get("/api/admin/support/:userId", requireAdmin, (req, res) => {
  const result = billing.getSupportThread(req.params.userId);
  if (!result.ok) return res.status(404).json({ error: result.error });
  res.json({ thread: result.thread });
});

app.post("/api/admin/support/:userId/reply", requireAdmin, (req, res) => {
  try {
    const result = billing.addSupportMessage({
      userId: req.params.userId,
      from: "admin",
      text: req.body?.text,
      screenshotBase64: req.body?.screenshotBase64,
    });
    if (!result.ok) return res.status(400).json({ error: result.error });
    res.json({ ok: true, thread: result.thread, message: result.message });
  } catch (e) {
    res.status(500).json({ error: e.message || "Reply failed" });
  }
});

app.post("/api/admin/support/:userId/close", requireAdmin, (req, res) => {
  const result = billing.setSupportThreadStatus(req.params.userId, "closed");
  if (!result.ok) return res.status(404).json({ error: result.error });
  res.json(result);
});

app.post("/api/admin/users/:id/migrate-id", requireAdmin, (req, res) => {
  const result = billing.adminMigrateToFourDigit(req.params.id);
  if (!result.ok) return res.status(400).json({ error: result.error });
  res.json(result);
});

app.post("/api/admin/sms-credit", requireAdmin, (req, res) => {
  try {
    const result = billing.ingestSmsCredit({
      smsText: req.body?.smsText || req.body?.body || "",
      amountInr: req.body?.amountInr,
      utr: req.body?.utr,
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message || "SMS credit failed" });
  }
});

app.get("/api/admin/sms-credits", requireAdmin, (req, res) => {
  res.json({ credits: billing.listSmsCredits(req.query.limit) });
});

app.post("/api/admin/payments/:id/approve", requireAdmin, (req, res) => {
  const result = billing.approvePayment(req.params.id);
  if (!result.ok) return res.status(400).json({ error: result.error });
  res.json(result);
});

app.post("/api/admin/payments/:id/reject", requireAdmin, (req, res) => {
  const result = billing.rejectPayment(req.params.id, req.body?.reason);
  if (!result.ok) return res.status(400).json({ error: result.error });
  res.json(result);
});

app.get("/api/admin/settings", requireAdmin, (_req, res) => {
  res.json({ settings: billing.adminGetSettings() });
});

app.put("/api/admin/settings", requireAdmin, (req, res) => {
  try {
    const result = billing.updatePaySettings({
      upiId: req.body?.upiId,
      upiName: req.body?.upiName,
      packages: req.body?.packages,
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message || "Update failed" });
  }
});

app.post("/api/admin/settings/qr", requireAdmin, (req, res) => {
  try {
    const result = billing.saveUpiQrBase64(req.body?.imageBase64);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message || "QR upload failed" });
  }
});

app.delete("/api/admin/settings/qr", requireAdmin, (_req, res) => {
  res.json(billing.clearUpiQr());
});

// Venice-style: list public characters (same source venice.ai uses via API)
app.get("/api/characters", requireUser, requireHours, async (req, res) => {
  try {
    if (!VENICE_API_KEY) {
      return res.status(500).json({ error: "VENICE_API_KEY missing" });
    }
    const params = new URLSearchParams();
    if (req.query.search) params.set("search", String(req.query.search));
    if (req.query.isAdult) params.set("isAdult", String(req.query.isAdult));
    params.set("limit", String(req.query.limit || 30));
    params.set("sortBy", String(req.query.sortBy || "highlyRated"));

    const response = await fetch(
      `${VENICE_BASE_URL}/characters?${params.toString()}`,
      {
        headers: { Authorization: `Bearer ${VENICE_API_KEY}` },
      }
    );
    const data = await response.json();
    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: data?.error || "Failed to list characters" });
    }
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch characters" });
  }
});

app.get("/api/characters/:slug", async (req, res) => {
  try {
    if (!VENICE_API_KEY) {
      return res.status(500).json({ error: "VENICE_API_KEY missing" });
    }
    const slug = encodeURIComponent(req.params.slug);
    const response = await fetch(`${VENICE_BASE_URL}/characters/${slug}`, {
      headers: { Authorization: `Bearer ${VENICE_API_KEY}` },
    });
    const data = await response.json();
    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: data?.error || "Character not found" });
    }
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch character" });
  }
});

function veniceLanguageHint(language) {
  // Venice characters are authored in English. Forcing full Hindi/Hinglish
  // makes replies collapse into nonsense. Keep English primary.
  if (language === "hinglish" || language === "hindi") {
    return `Stay fully in character as this Venice character.
PRIMARY LANGUAGE: English (clear, natural).
You may add light Hinglish words only (haan, beta, yaar, aaja) — do NOT write full Hindi sentences.
Short WhatsApp style (1-3 lines).
Understand user typos and adult/flirty intent. Never invent fake Hindi words.
Never give medical lectures.`;
  }
  return `Stay fully in character as this Venice character.
Reply in clear natural English.
Short WhatsApp-style messages (1-3 lines).
Understand typos and match flirty/adult intent when the user goes there.
Never invent nonsense words. Never give medical lectures.`;
}

app.post("/api/chat", requireUser, requireHours, async (req, res) => {
  try {
    if (!VENICE_API_KEY) {
      return res.status(500).json({
        error: "VENICE_API_KEY missing. Add it to your .env file.",
      });
    }

    const {
      messages,
      botRole,
      userRole,
      language,
      chatMode,
      chatSource,
      characterSlug,
      characterModel,
      rpSetup,
      characterName,
      botGender,
      userGender,
    } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array required" });
    }

    const lang = language || "english";
    const slug = String(characterSlug || "").trim();
    const source = String(chatSource || "").trim();
    const startedAt = Date.now();

    // ===== Maa Agent: Brain (situation) → Voice (bubbles) =====
    // Website /chat/agent/... is not a public API; we recreate the feel here.
    if (source === "maa" || chatMode === "maa") {
      const hist = prepareMessages(messages);
      const lastUser =
        [...messages].reverse().find((m) => m.role === "user")?.content || "";
      const transcript = recentTranscript(messages, 8);
      const setupText = String(rpSetup || "").trim();
      const charOverrides = {
        characterName: String(characterName || "").trim(),
        botRole: String(botRole || "").trim(),
        userRole: String(userRole || "").trim(),
        botGender: String(botGender || "").trim(),
        userGender: String(userGender || "").trim(),
      };
      const memoryCard = buildChatMemoryCard(hist, setupText, charOverrides);

      // --- Step 1: Brain ---
      let sceneCard = "";
      const userHeat = detectUserHeat(lastUser);
      const brainPayload = [
        {
          role: "system",
          content: buildMaaBrainPrompt(setupText, charOverrides),
        },
        {
          role: "user",
          content:
            `${memoryCard}\n\n` +
            `Recent chat:\n${transcript || "(start)"}\n\n` +
            `Latest from user (decode typos): "${lastUser}"\n` +
            `Detected USER_HEAT: ${userHeat} — language dirtiness can match this.\n` +
            (strictStillResisting(setupText, hist)
              ? `RESISTANCE OVERRIDE (strict/normal still resisting): HEAT dirty talk OK, but NEXT_BEATS must DENY sex consent — no "aaja" / panty off / sex yes yet. Make them push more.\n`
              : `Mirror heat. Do not jump ahead of user.\n`) +
            `If user answered your previous question, MUST_ANSWER = react to that answer — NEVER re-ask "dimaag/soch/kaisa laga".\n` +
            `Default LENGTH=short and ACTIONS=none unless user asked for long/story/listen/guest.\n\n` +
            `Write the SCENE CARD now.`,
        },
      ];

      const brain = await callVenice(CLEAR_MODEL, brainPayload, {
        temperature: 0.35,
        frequency_penalty: 0,
        presence_penalty: 0,
      });

      if (brain.response.ok) {
        sceneCard = extractText(brain.data?.choices?.[0]?.message);
      }

      if (!sceneCard) {
        sceneCard =
          `USER_SAID: ${lastUser}\n` +
          `USER_HEAT: ${userHeat}\n` +
          `MATCH: mirror user — same heat, do not jump ahead\n` +
          `INTENT: match user\n` +
          `IDENTITY: ${(charOverrides.characterName || "Character")} = ${(charOverrides.botRole || "role")} (${(charOverrides.botGender || "female")}) talking to ${(charOverrides.userRole || "user")} — never swap\n` +
          `EMOTION: match ${userHeat}\n` +
          `SCENE: ${setupText || "ongoing private chat"}\n` +
          `MUST_ANSWER: react directly to his last words\n` +
          `NEXT_BEATS: stay in role; same-heat hook with USER only\n` +
          `LENGTH: short\n` +
          `ACTIONS: none\n` +
          `HEAT: ${userHeat}\n` +
          `AVOID: long essay, action spam, gender swap, invent relative hookups, lecture`;
      }

      sceneCard = patchSceneCardForMirror(sceneCard, lastUser, {
        rpSetup: setupText,
        messages: hist,
      });

      // --- Step 2: Voice ---
      const wantsHinglish = lang !== "english";
      const wantLong = wantsLongReply(lastUser, sceneCard);
      const tokenBudget = replyTokenBudget(lastUser, sceneCard);
      const voiceModel = wantsHinglish ? CLEAR_MODEL : LUST_MODEL;
      const voiceTemp = wantsHinglish
        ? sceneHeatIsDirty(sceneCard)
          ? 0.75
          : 0.5
        : 0.9;

      const stillResisting = strictStillResisting(setupText, hist);
      const identitySticky =
        `IDENTITY STICKY: You are "${charOverrides.characterName || "Character"}" = ${charOverrides.botRole || "role"} (${charOverrides.botGender || "female"}). ` +
        `User is your ${charOverrides.userRole || "partner"} (${charOverrides.userGender || "male"}). ` +
        `Stay this gender+rishta. Masti with USER only unless they asked for a guest/confession. ` +
        `Never say you hooked up with "teri nani/mummy" as a third person. Never use opposite-gender grammar on yourself. ` +
        `USER_HEAT=${userHeat}. ` +
        (stillResisting
          ? `RESISTANCE ACTIVE: dirty talk OK, but DENY body-yes — no "Theek hai aaja", panty off, or sex start. Use shy deny / galat hai beta / make them beg. `
          : `Match heat; short WhatsApp lines. `) +
        `Prefer short WhatsApp lines. No *action* spam unless SCENE CARD ACTIONS says light/full. ` +
        (String(charOverrides.botRole || "").toLowerCase().match(/^(mom|mummy|maa|mother)$/)
          ? `HUSBAND WORD LOCK: say "tera Papa" or "mera pati" for user's father — NEVER "mere Papa" for husband. "mere Papa (tere Nana)" only for your own father.`
          : "");

      const voiceHist = hist.slice(-12).map((m) => ({
        role: m.role,
        content: m.content,
      }));
      // Do NOT append "Remember silently…" onto the user message — models often
      // echo that paren block into the visible reply. Sticky rules stay in system.

      const voicePayload = [
        {
          role: "system",
          content:
            buildMaaVoicePrompt(lang, sceneCard, setupText, charOverrides) +
            "\n\n" +
            memoryCard +
            "\n\n" +
            identitySticky +
            "\n\nOUTPUT RULE: Reply only as the character. Never quote, print, or mention CHAT MEMORY CARD, IDENTITY STICKY, SCENE CARD, or any 'Remember silently' notes.",
        },
        ...voiceHist,
      ];

      let steps = 2;
      let { response, data } = await callVenice(voiceModel, voicePayload, {
        temperature: voiceTemp,
        max_tokens: tokenBudget,
      });

      if (!response.ok) {
        const fallbackModel = wantsHinglish ? LUST_MODEL : CLEAR_MODEL;
        const retry = await callVenice(fallbackModel, voicePayload, {
          temperature: 0.85,
          max_tokens: tokenBudget,
        });
        if (!retry.response.ok) {
          const message =
            data?.error?.message || data?.error || "Maa agent chat failed";
          return res.status(response.status).json({ error: String(message) });
        }
        data = retry.data;
      }

      let reply = extractText(data?.choices?.[0]?.message);

      const needsFresh =
        (reply && isTooSimilar(reply, messages)) ||
        (reply && repeatsSameHookQuestion(reply, messages));

      if (needsFresh) {
        const refresh = await callVenice(
          voiceModel,
          [
            ...voicePayload,
            {
              role: "user",
              content:
                "LOOP FIX: Do NOT repeat your last question (no more 'dimaag mein kya / kya soch / kaisa laga' if already asked). " +
                "User's latest message IS the answer — react to it and advance the scene. " +
                "No same *sharmaati hai* opener every time. Fresh Easy Hinglish. Short WhatsApp.",
            },
          ],
          {
            temperature: Math.min(voiceTemp + 0.2, 1),
            max_tokens: tokenBudget,
          }
        );
        if (refresh.response.ok) {
          const fresh = extractText(refresh.data?.choices?.[0]?.message);
          if (fresh) reply = fresh;
        }
      }

      // Continue if cut off mid-sentence / mid-*action*
      if (reply && looksIncompleteReply(reply)) {
        const cont = await callVenice(
          voiceModel,
          [
            ...voicePayload,
            { role: "assistant", content: reply },
            {
              role: "user",
              content:
                "Continue from exactly where you stopped. Finish the incomplete *action* and the full reply. Do not restart. Do not summarize — write the actual spoken words if a call/speech was requested.",
            },
          ],
          { temperature: voiceTemp, max_tokens: tokenBudget }
        );
        steps += 1;
        if (cont.response.ok) {
          const more = extractText(cont.data?.choices?.[0]?.message);
          if (more) {
            reply = /^(maa:|\*)/i.test(more.trim())
              ? `${reply.trim()} ${more.trim()}`
              : `${reply.trim()} ${more.trim()}`;
          }
        }
      }

      // If user wanted to HEAR a call but model only summarized, force rewrite once
      if (
        reply &&
        wantLong &&
        /(sab bata|bata deti|bata diya|explain kar|unhe sab|tells him everything)/i.test(
          reply
        ) &&
        !/(maa\s*\(phone\)|papa\s*\(phone\)|hello|haan,?\s*sun)/i.test(reply)
      ) {
        const rewrite = await callVenice(
          voiceModel,
          [
            ...voicePayload,
            {
              role: "user",
              content:
                `Rewrite: user wants to LISTEN. Write the full phone conversation out loud (${charOverrides.characterName || "Character"} phone lines + other person if needed). No summary like 'sab bata diya'. Easy Hinglish. Finish completely.`,
            },
          ],
          { temperature: Math.min(voiceTemp + 0.1, 1), max_tokens: tokenBudget }
        );
        steps += 1;
        if (rewrite.response.ok) {
          const fresh = extractText(rewrite.data?.choices?.[0]?.message);
          if (fresh && fresh.length > 40) reply = fresh;
        }
      }

      // Strict resistance safety net: rewrite early "aaja / panty / sex yes"
      if (reply && stillResisting && looksLikeEarlySexYes(reply)) {
        const resistFix = await callVenice(
          CLEAR_MODEL,
          [
            {
              role: "system",
              content:
                `You are ${charOverrides.characterName || "Character"} (${charOverrides.botRole || "mummy"}). ` +
    `Rewrite as seedhi-saadi desi ${charOverrides.botRole || "character"}: daily/natural WhatsApp tone like real Indian relation, change topic or soft resist, tiny hooked tease only. ` +
                `RESISTANCE stays STRICT — FORBIDDEN: "theek hai aaja", panty off, starting sex, "main ready". ` +
                `Easy Hinglish WhatsApp short. Output ONLY the chat reply.`,
            },
            {
              role: "user",
              content:
                `User said: "${lastUser}"\n\nDraft (too eager — rewrite to resist):\n${reply}`,
            },
          ],
          { temperature: 0.35, max_tokens: tokenBudget }
        );
        steps += 1;
        if (resistFix.response.ok) {
          const fixed = extractText(resistFix.data?.choices?.[0]?.message);
          if (fixed && fixed.length > 8) reply = fixed;
        }
      }

      // --- Step 3: Hinglish polish ---
      if (reply && wantsHinglish) {
        const metaForPolish = parseSetupMeta(setupText, charOverrides);
        const genderHint =
          metaForPolish.botGender === "male"
            ? `"${metaForPolish.characterName}" is MAN — masculine Hindi only (sharmaata/aata/raha), never feminine (sharmaati/aati/rahi).`
            : `"${metaForPolish.characterName}" is WOMAN — feminine Hindi (sharmaati/aati/rahi). No lund on her.`;
        const polish = await callVenice(
          CLEAR_MODEL,
          [
            {
              role: "system",
              content: buildMaaHinglishPolishPrompt(wantLong, charOverrides),
            },
            {
              role: "user",
              content:
                `Keep reaction to what user said. ${genderHint}\n` +
                (wantLong
                  ? "Keep FULL phone dialogue — do not shorten.\n"
                  : "Keep SHORT WhatsApp style — do not pad with extra *actions* or long paragraphs.\n") +
                `Fix this ${metaForPolish.characterName} reply into Easy Hinglish:\n${reply}`,
            },
          ],
          {
            temperature: 0.2,
            max_tokens: tokenBudget,
            frequency_penalty: 0,
            presence_penalty: 0,
          }
        );
        steps += 1;
        if (polish.response.ok) {
          const fixed = extractText(polish.data?.choices?.[0]?.message);
          if (fixed && fixed.length > 8) reply = fixed;
        }
      }

      if (!reply) {
        return res.status(502).json({ error: "Empty reply from Maa agent" });
      }

      const cleaned = stripPhotoTags(reply);
      const asOne = fixMaaGenderSlips(
        splitAgentBubbles(cleaned).join("\n") || cleaned,
        charOverrides
      );
      const workedMs = Date.now() - startedAt;

      return res.json({
        reply: asOne,
        sceneCard,
        workedMs,
        steps,
        mode: "maa-agent",
        ...liveBillingFields(req.userId),
      });
    }

    // ===== Venice Character Mode (like venice.ai/chat) =====
    if (slug) {
      const model =
        String(characterModel || "").trim() || "venice-uncensored-1-2";

      const hist = prepareMessages(messages);
      const last = hist[hist.length - 1];
      if (last && last.role === "user") {
        last.content =
          `Message: "${last.content}"\n` +
          `(Decode typos. Stay in character. Match flirty/adult intent if present. Reply short.)`;
      }

      const venicePayload = [
        { role: "system", content: veniceLanguageHint(lang) },
        ...hist,
      ];

      let { response, data } = await callVenice(model, venicePayload, {
        temperature: 0.9,
        characterSlug: slug,
      });

      if (!response.ok) {
        const retry = await callVenice(
          "venice-uncensored-role-play",
          venicePayload,
          { temperature: 0.9, characterSlug: slug }
        );
        if (!retry.response.ok) {
          const message =
            data?.error?.message ||
            data?.error ||
            "Venice character chat failed";
          return res.status(response.status).json({ error: String(message) });
        }
        data = retry.data;
      }

      let reply = extractText(data?.choices?.[0]?.message);

      // If reply looks like broken Hinglish garbage, rewrite to clear English in-character
      if (reply && looksBrokenHinglish(reply)) {
        const fixed = await callVenice(
          CLEAR_MODEL,
          [
            {
              role: "system",
              content:
                "Rewrite this as clear natural English WhatsApp text. Keep the same meaning and flirty/adult tone if present. 1-2 short lines. No Hindi gibberish.",
            },
            { role: "user", content: `Rewrite clearly:\n${reply}` },
          ],
          { temperature: 0.2, frequency_penalty: 0, presence_penalty: 0 }
        );
        if (fixed.response.ok) {
          const cleaned = extractText(fixed.data?.choices?.[0]?.message);
          if (cleaned) reply = cleaned;
        }
      }

      if (!reply) {
        return res.status(502).json({ error: "Empty reply from character" });
      }
      return res.json({
        reply,
        mode: "venice-character",
        ...liveBillingFields(req.userId),
      });
    }

    // ===== Custom local roles (fallback) =====
    const mode = chatMode || "normal";
    const model = pickModel(mode);
    const temp = mode === "lust" ? 0.85 : lang === "english" ? 0.7 : 0.45;
    const bot = (botRole || "dost").trim();
    const user = (userRole || "dost").trim();
    const useHinglishHelp =
      (lang === "hinglish" || lang === "auto") && mode !== "lust";

    const payload = [
      {
        role: "system",
        content: buildSystemPrompt({
          botRole: bot,
          userRole: user,
          language: lang,
          messages,
          chatMode: mode,
        }),
      },
      ...(useHinglishHelp ? hinglishFewShot(bot, user) : []),
      ...prepareMessages(messages),
    ];

    let { response, data } = await callVenice(model, payload, {
      temperature: temp,
    });

    if (!response.ok) {
      const retry = await callVenice(
        mode === "lust" ? CLEAR_MODEL : FALLBACK_MODEL,
        payload,
        { temperature: temp }
      );
      if (!retry.response.ok) {
        const message =
          data?.error?.message || data?.error || "Venice request failed";
        return res.status(response.status).json({ error: String(message) });
      }
      data = retry.data;
    }

    let reply = extractText(data?.choices?.[0]?.message);

    if (reply && isTooSimilar(reply, messages)) {
      const refresh = await callVenice(
        model,
        [
          ...payload,
          {
            role: "user",
            content:
              mode === "lust"
                ? "Too repetitive. Reply again with NEW words and advance the scene. Keep dirty. 1-2 lines."
                : "Too repetitive. Reply again with NEW simple words. 1-2 short lines.",
          },
        ],
        { temperature: Math.min(temp + 0.2, 1) }
      );
      if (refresh.response.ok) {
        const fresh = extractText(refresh.data?.choices?.[0]?.message);
        if (fresh) reply = fresh;
      }
    }

    if (reply && lang !== "english" && looksBrokenHinglish(reply)) {
      const fixed = await callVenice(
        CLEAR_MODEL,
        [
          {
            role: "system",
            content:
              "Fix into Easy Hinglish WhatsApp style. Short common words only. Separate words with spaces. No joined nonsense words. Keep same meaning. 1-2 lines.",
          },
          { role: "user", content: `Fix this message:\n${reply}` },
        ],
        { temperature: 0.2, frequency_penalty: 0, presence_penalty: 0 }
      );
      if (fixed.response.ok) {
        const cleaned = extractText(fixed.data?.choices?.[0]?.message);
        if (cleaned) reply = cleaned;
      }
    }

    if (!reply) {
      return res.status(502).json({
        error: "Empty reply. Click New and try again.",
      });
    }

    res.json({
      reply,
      mode: "custom",
      ...liveBillingFields(req.userId),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error. Try again." });
  }
});

app.listen(PORT, () => {
  billing.ensureDirs();
  console.log(`Chat running at http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin.html`);
});
