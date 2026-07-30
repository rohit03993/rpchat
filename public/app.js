(function () {
  const messagesEl = document.getElementById("messages");
  const form = document.getElementById("chat-form");
  const input = document.getElementById("message-input");
  const sendBtn = document.getElementById("send-btn");
  const statusEl = document.getElementById("status");
  const titleEl = document.getElementById("chat-title");
  const resetBtn = document.getElementById("reset-btn");
  const botRoleEl = document.getElementById("bot-role");
  const userRoleEl = document.getElementById("user-role");
  const languageEl = document.getElementById("language");
  const chatModeEl = document.getElementById("chat-mode");
  const chatSourceEl = document.getElementById("chat-source");
  const maaPanel = document.getElementById("maa-panel");
  const venicePanel = document.getElementById("venice-panel");
  const customPanel = document.getElementById("custom-panel");
  const charSearchEl = document.getElementById("char-search");
  const charSearchBtn = document.getElementById("char-search-btn");
  const charAdultEl = document.getElementById("char-adult");
  const characterSelect = document.getElementById("character-select");
  const charInfo = document.getElementById("char-info");
  const rpPlaceEl = null; // place removed — user decides in chat / RP brief
  const rpVibeEl = document.getElementById("rp-vibe");
  const rpPaceEl = document.getElementById("rp-pace");
  const rpNoteEl = document.getElementById("rp-note");
  const rpResistanceEl = document.getElementById("rp-resistance");
  const charNameEl = document.getElementById("char-name");
  const rpBotRoleEl = document.getElementById("rp-bot-role");
  const rpUserRoleEl = document.getElementById("rp-user-role");
  const rpCustomRoles = document.getElementById("rp-custom-roles");
  const rpCustomBot = document.getElementById("rp-custom-bot");
  const rpCustomUser = document.getElementById("rp-custom-user");
  const rpSetupStatus = document.getElementById("rp-setup-status");
  const settingsPanel = document.getElementById("settings-panel");
  const sceneChip = document.getElementById("scene-chip");
  const sceneChipText = document.getElementById("scene-chip-text");
  const sceneEditBtn = document.getElementById("scene-edit-btn");
  const appShellEl = document.getElementById("app-shell");
  const sceneForm = document.getElementById("scene-form");
  const setupModal = document.getElementById("setup-modal");
  const setupFormSlot = document.getElementById("setup-form-slot");
  const sidebar = document.getElementById("sidebar");
  const sidebarFormSlot = document.getElementById("sidebar-form-slot");
  const sidebarBackdrop = document.getElementById("sidebar-backdrop");
  const sidebarClose = document.getElementById("sidebar-close");
  const menuBtn = document.getElementById("menu-btn");
  const startChatBtn = document.getElementById("start-chat-btn");
  const applySettingsBtn = document.getElementById("apply-settings-btn");
  const newChatBtn = document.getElementById("new-chat-btn");
  const authGate = document.getElementById("auth-gate");
  const appShell = document.getElementById("app-shell");
  const hoursBadge = document.getElementById("hours-badge");
  const userIdChip = document.getElementById("user-id-chip");
  const billingPanel = document.getElementById("pay-sheet");
  const billingToggle = document.getElementById("billing-toggle");
  const payCloseBtn = document.getElementById("pay-close-btn");
  const payBackdrop = document.getElementById("pay-backdrop");
  const logoutBtn = document.getElementById("logout-btn");
  const packageSelect = document.getElementById("package-select");
  const packageCardsEl = document.getElementById("package-cards");
  const payScreenshot = document.getElementById("pay-screenshot");
  const payUploadLabel = document.getElementById("pay-upload-label");
  const payUploadText = document.getElementById("pay-upload-text");
  const payPreview = document.getElementById("pay-preview");
  const submitPayBtn = document.getElementById("submit-pay-btn");
  const payMsg = document.getElementById("pay-msg");
  const payInstructions = document.getElementById("pay-instructions");
  const billingUserEl = document.getElementById("billing-user");
  const upiQr = document.getElementById("upi-qr");
  const upiNoteEl = document.getElementById("upi-note");
  const upiIdDisplay = document.getElementById("upi-id-display");
  const copyUpiBtn = document.getElementById("copy-upi-btn");
  const upiOpenBtn = document.getElementById("upi-open-btn");
  const payAmountLine = document.getElementById("pay-amount-line");
  const paySelectedSummary = document.getElementById("pay-selected-summary");
  const payPendingBanner = document.getElementById("pay-pending-banner");
  const myPaymentsEl = document.getElementById("my-payments");
  const payStepEls = document.querySelectorAll(".pay-step");
  const payPanes = document.querySelectorAll(".pay-pane");
  const payGoto2 = document.getElementById("pay-goto-2");
  const payGoto3 = document.getElementById("pay-goto-3");
  const payBack1 = document.getElementById("pay-back-1");
  const payBack2 = document.getElementById("pay-back-2");
  const payProofSummary = document.getElementById("pay-proof-summary");
  const payUploadBlock = document.getElementById("pay-upload-block");
  const payProofNav = document.getElementById("pay-proof-nav");
  const payRefreshStatusBtn = document.getElementById("pay-refresh-status");
  const copyPayDetailsBtn = document.getElementById("copy-pay-details-btn");
  const welcomeTipEl = document.getElementById("welcome-tip");
  const welcomeTipDismissBtn = document.getElementById("welcome-tip-dismiss");
  let payWizardStep = 1;
  const tabLogin = document.getElementById("tab-login");
  const tabRegister = document.getElementById("tab-register");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const loginBtn = document.getElementById("login-btn");
  const registerBtn = document.getElementById("register-btn");
  const registerDobDay = document.getElementById("register-dob-day");
  const registerDobMonth = document.getElementById("register-dob-month");
  const registerDobYear = document.getElementById("register-dob-year");
  const registerAgeConfirm = document.getElementById("register-age-confirm");
  const registerPinEl = document.getElementById("register-pin");
  const registerPinConfirmEl = document.getElementById("register-pin-confirm");
  const loginIdEl = document.getElementById("login-id");
  const loginPinEl = document.getElementById("login-pin");
  const loginRememberEl = document.getElementById("login-remember");
  const forgetSavedLoginBtn = document.getElementById("forget-saved-login");
  const registerResult = document.getElementById("register-result");
  const registerCredsEl = document.getElementById("register-creds");
  const registerCredsIdEl = document.getElementById("register-creds-id");
  const registerCredsPinEl = document.getElementById("register-creds-pin");
  const credsContinueLoginBtn = document.getElementById("creds-continue-login");
  const copyNewIdBtn = document.getElementById("copy-new-id");
  const copyNewPinBtn = document.getElementById("copy-new-pin");
  const sidebarUserIdEl = document.getElementById("sidebar-user-id");
  const copySidebarIdBtn = document.getElementById("copy-sidebar-id");
  const payIdValueEl = document.getElementById("pay-id-value");
  const copyPayIdBtn = document.getElementById("copy-pay-id");
  const authError = document.getElementById("auth-error");
  const jumpLatestBtn = document.getElementById("jump-latest");
  const soundToggle = document.getElementById("sound-toggle");
  const sendIcon = sendBtn && sendBtn.querySelector(".send-icon");
  const sendSpinner = sendBtn && sendBtn.querySelector(".send-spinner");

  const SAVED_ID_KEY = "savedUserId";
  const SAVED_PIN_KEY = "savedUserPin";
  let pendingNewCreds = null;

  const DOB_MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  function daysInMonth(year, month) {
    if (!year || !month) return 31;
    return new Date(year, month, 0).getDate();
  }

  function fillDobSelects() {
    if (!registerDobDay || !registerDobMonth || !registerDobYear) return;
    const now = new Date();
    const maxYear = now.getFullYear() - 18;
    const minYear = now.getFullYear() - 100;

    if (registerDobMonth.options.length <= 1) {
      DOB_MONTHS.forEach(function (name, i) {
        const opt = document.createElement("option");
        opt.value = String(i + 1);
        opt.textContent = name;
        registerDobMonth.appendChild(opt);
      });
    }

    if (registerDobYear.options.length <= 1) {
      for (let y = maxYear; y >= minYear; y -= 1) {
        const opt = document.createElement("option");
        opt.value = String(y);
        opt.textContent = String(y);
        registerDobYear.appendChild(opt);
      }
    }

    function refreshDays() {
      const y = Number(registerDobYear.value) || 0;
      const m = Number(registerDobMonth.value) || 0;
      const keep = registerDobDay.value;
      const maxDay = daysInMonth(y || 2000, m || 1);
      registerDobDay.innerHTML = '<option value="">DD</option>';
      for (let d = 1; d <= maxDay; d += 1) {
        const opt = document.createElement("option");
        opt.value = String(d);
        opt.textContent = String(d).padStart(2, "0");
        registerDobDay.appendChild(opt);
      }
      if (keep && Number(keep) <= maxDay) {
        registerDobDay.value = keep;
      }
    }

    registerDobMonth.addEventListener("change", refreshDays);
    registerDobYear.addEventListener("change", refreshDays);
    refreshDays();
  }

  function getRegisterDob() {
    if (!registerDobDay || !registerDobMonth || !registerDobYear) return "";
    const d = Number(registerDobDay.value);
    const m = Number(registerDobMonth.value);
    const y = Number(registerDobYear.value);
    if (!d || !m || !y) return "";
    return (
      String(y) +
      "-" +
      String(m).padStart(2, "0") +
      "-" +
      String(d).padStart(2, "0")
    );
  }

  fillDobSelects();
  let soundEnabled = localStorage.getItem("chatSoundOn") === "1";
  if (soundToggle) soundToggle.checked = soundEnabled;

  function toast(message, type) {
    const host = document.getElementById("toast-host") || document.body;
    const el = document.createElement("div");
    el.className = "toast" + (type ? " toast-" + type : "");
    el.textContent = message;
    host.appendChild(el);
    setTimeout(function () {
      el.classList.add("toast-out");
      setTimeout(function () {
        el.remove();
      }, 280);
    }, 2800);
  }

  function playReplyFeedback() {
    if (!soundEnabled) return;
    try {
      if (navigator.vibrate) navigator.vibrate(28);
    } catch (e) {
      /* ignore */
    }
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 880;
      g.gain.value = 0.04;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      o.stop(ctx.currentTime + 0.14);
      setTimeout(function () {
        ctx.close();
      }, 200);
    } catch (e) {
      /* ignore */
    }
  }

  function isNearBottom() {
    if (!messagesEl) return true;
    return (
      messagesEl.scrollHeight - messagesEl.scrollTop - messagesEl.clientHeight <
      80
    );
  }

  function scrollMessagesToEnd(force) {
    if (!messagesEl) return;
    if (force || isNearBottom()) {
      messagesEl.scrollTop = messagesEl.scrollHeight;
      if (jumpLatestBtn) jumpLatestBtn.classList.add("hidden");
    } else if (jumpLatestBtn) {
      jumpLatestBtn.classList.remove("hidden");
    }
  }

  function updateJumpLatest() {
    if (!jumpLatestBtn || !messagesEl) return;
    jumpLatestBtn.classList.toggle("hidden", isNearBottom());
  }

  if (!messagesEl || !form || !input) {
    window.__chatBootError && window.__chatBootError("chat HTML elements missing");
    return;
  }

  let history = [];
  let selectedCharacter = null;
  let rpSetup = "";
  let setupLocked = false;
  let authToken = localStorage.getItem("userToken") || "";
  let currentUser = null;
  let localHours = 0;
  let localSyncedAt = 0;
  let timerRunning = false;
  let timerTickId = null;
  let timerSyncId = null;
  let hoursCounting = false;
  let sessionSaveTimer = null;
  let restoringSession = false;
  let planEndedHandled = false;
  let warnedAt60 = false;
  let warnedAt30 = false;

  function currentUserId() {
    return (
      (currentUser && currentUser.userId) ||
      localStorage.getItem("userId") ||
      ""
    );
  }

  function localSessionKey() {
    const id = currentUserId();
    return id ? "chatSession_v1_" + id : "";
  }

  function collectFormState() {
    return {
      characterName: charNameEl ? charNameEl.value : "",
      botRole: rpBotRoleEl ? rpBotRoleEl.value : "mummy",
      userRole: rpUserRoleEl ? rpUserRoleEl.value : "beta",
      customBot: rpCustomBot ? rpCustomBot.value : "",
      customUser: rpCustomUser ? rpCustomUser.value : "",
      language: languageEl ? languageEl.value : "hinglish",
      vibe: rpVibeEl ? rpVibeEl.value : "",
      pace: rpPaceEl ? rpPaceEl.value : "",
      note: rpNoteEl ? rpNoteEl.value : "",
      resistance: rpResistanceEl ? rpResistanceEl.value : "strict",
      chatSource: chatSourceEl ? chatSourceEl.value : "maa",
      chatMode: chatModeEl ? chatModeEl.value : "normal",
      botRoleCustom: botRoleEl ? botRoleEl.value : "",
      userRoleCustom: userRoleEl ? userRoleEl.value : "",
    };
  }

  function applyFormState(form) {
    if (!form) return;
    if (charNameEl && form.characterName != null) charNameEl.value = form.characterName;
    if (rpBotRoleEl && form.botRole) rpBotRoleEl.value = form.botRole;
    if (rpUserRoleEl && form.userRole) rpUserRoleEl.value = form.userRole;
    if (rpCustomBot && form.customBot != null) rpCustomBot.value = form.customBot;
    if (rpCustomUser && form.customUser != null) rpCustomUser.value = form.customUser;
    if (languageEl && form.language) languageEl.value = form.language;
    if (rpVibeEl && form.vibe) rpVibeEl.value = form.vibe;
    if (rpPaceEl && form.pace) rpPaceEl.value = form.pace;
    if (rpNoteEl && form.note != null) rpNoteEl.value = form.note;
    if (rpResistanceEl && form.resistance) rpResistanceEl.value = form.resistance;
    if (chatSourceEl && form.chatSource) chatSourceEl.value = form.chatSource;
    if (chatModeEl && form.chatMode) chatModeEl.value = form.chatMode;
    if (botRoleEl && form.botRoleCustom != null) botRoleEl.value = form.botRoleCustom;
    if (userRoleEl && form.userRoleCustom != null) userRoleEl.value = form.userRoleCustom;
    syncCustomRoleFields();
    syncPanels();
    syncTitle();
  }

  function isSetupMetaMessage(content) {
    return /^Setup locked for this chat:/i.test(String(content || ""));
  }

  function buildSessionPayload() {
    return {
      setupLocked: setupLocked,
      rpSetup: rpSetup,
      chatSource: chatSourceEl ? chatSourceEl.value : "maa",
      form: collectFormState(),
      selectedCharacter: selectedCharacter,
      history: history.slice(-40),
    };
  }

  function saveChatSessionLocal() {
    const key = localSessionKey();
    if (!key || restoringSession) return;
    try {
      localStorage.setItem(key, JSON.stringify(buildSessionPayload()));
    } catch (e) {
      /* quota */
    }
  }

  function scheduleSaveChatSession() {
    saveChatSessionLocal();
    if (!authToken || restoringSession) return;
    if (sessionSaveTimer) clearTimeout(sessionSaveTimer);
    sessionSaveTimer = setTimeout(async function () {
      try {
        await fetch("/api/chat/session", {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify(buildSessionPayload()),
        });
      } catch (e) {
        /* offline ok — local copy remains */
      }
    }, 800);
  }

  /** Flush chat to server now (used on time-out so scene is not lost). */
  async function flushChatSessionNow() {
    saveChatSessionLocal();
    if (!authToken || restoringSession) return;
    if (sessionSaveTimer) {
      clearTimeout(sessionSaveTimer);
      sessionSaveTimer = null;
    }
    try {
      await fetch("/api/chat/session", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(buildSessionPayload()),
      });
    } catch (e) {
      /* local copy remains */
    }
  }

  function renderHistoryBubbles() {
    messagesEl.innerHTML = "";
    history.forEach(function (m) {
      if (!m || !m.content) return;
      if (isSetupMetaMessage(m.content)) return;
      if (m.role === "user") addBubble(m.content, "outgoing");
      else if (m.role === "assistant") addBubble(m.content, "incoming");
    });
  }

  function applySessionData(session) {
    if (!session || !session.setupLocked) return false;
    restoringSession = true;
    try {
      applyFormState(session.form || {});
      selectedCharacter = session.selectedCharacter || null;
      rpSetup = session.rpSetup || buildRpSetupText();
      setupLocked = true;
      history = Array.isArray(session.history) ? session.history.slice() : [];
      renderHistoryBubbles();
      syncTitle();
      closeSetupModal();
      parkSceneForm("sidebar");
      closeSidebar();
      if (appShellEl) appShellEl.classList.add("chat-ready");
      updateSetupStatus();
      return history.length > 0 || !!rpSetup;
    } finally {
      restoringSession = false;
    }
  }

  async function restoreChatSession() {
    const key = localSessionKey();
    let local = null;
    if (key) {
      try {
        local = JSON.parse(localStorage.getItem(key) || "null");
      } catch (e) {
        local = null;
      }
    }

    let remote = null;
    if (authToken) {
      try {
        const res = await fetch("/api/chat/session", {
          headers: authHeaders(false),
        });
        const data = await res.json();
        if (res.ok) remote = data.session || null;
      } catch (e) {
        remote = null;
      }
    }

    // Prefer newer / richer copy (keep even at 0 hours for pay-to-continue)
    let chosen = null;
    const remoteAt = remote && remote.updatedAt ? remote.updatedAt : 0;
    if (remote && remote.setupLocked && remoteAt) {
      const localLen = (local && local.history && local.history.length) || 0;
      const remoteLen = (remote.history && remote.history.length) || 0;
      chosen = localLen > remoteLen ? local : remote;
    } else if (local && local.setupLocked) {
      chosen = local;
    } else if (remote && remote.setupLocked) {
      chosen = remote;
    }

    if (chosen && applySessionData(chosen)) {
      saveChatSessionLocal();
      if (
        remainingHoursNow() <= 0.0001 &&
        Number((currentUser && currentUser.hoursBalance) || 0) <= 0.0001
      ) {
        setTimeout(function () {
          handlePlanEnded(
            "Time’s up. Your scene is saved here — pay to continue from this chat."
          );
        }, 400);
      } else {
        maybeShowWelcomeTip();
      }
      return true;
    }
    return false;
  }

  async function clearSavedChatSession() {
    const key = localSessionKey();
    if (key) {
      try {
        localStorage.removeItem(key);
      } catch (e) {}
    }
    if (!authToken) return;
    try {
      await fetch("/api/chat/session", {
        method: "DELETE",
        headers: authHeaders(false),
      });
    } catch (e) {}
  }

  function getDeviceId() {
    var key = "chatDeviceId";
    var id = "";
    try {
      id = localStorage.getItem(key) || "";
    } catch (e) {}
    if (!id || id.length < 10) {
      id =
        "d_" +
        (window.crypto && crypto.randomUUID
          ? crypto.randomUUID().replace(/-/g, "")
          : String(Date.now()) + Math.random().toString(36).slice(2, 12));
      try {
        localStorage.setItem(key, id);
      } catch (e) {}
    }
    try {
      document.cookie =
        key + "=" + encodeURIComponent(id) + ";max-age=31536000;path=/;SameSite=Lax";
    } catch (e) {}
    return id;
  }

  function getSavedCredentials() {
    try {
      return {
        userId: localStorage.getItem(SAVED_ID_KEY) || "",
        pin: localStorage.getItem(SAVED_PIN_KEY) || "",
      };
    } catch (e) {
      return { userId: "", pin: "" };
    }
  }

  function saveCredentials(userId, pin) {
    const id = String(userId || "").trim();
    const p = String(pin || "").trim();
    if (!id) return;
    try {
      localStorage.setItem(SAVED_ID_KEY, id);
      localStorage.setItem("userId", id);
      if (p) localStorage.setItem(SAVED_PIN_KEY, p);
    } catch (e) {}
  }

  function clearSavedCredentials() {
    try {
      localStorage.removeItem(SAVED_ID_KEY);
      localStorage.removeItem(SAVED_PIN_KEY);
    } catch (e) {}
    pendingNewCreds = null;
    syncForgetSavedBtn();
  }

  function syncForgetSavedBtn() {
    if (!forgetSavedLoginBtn) return;
    const saved = getSavedCredentials();
    forgetSavedLoginBtn.classList.toggle("hidden", !(saved.userId || saved.pin));
  }

  function prefillLoginFromSaved() {
    const saved = getSavedCredentials();
    if (loginIdEl && saved.userId && !loginIdEl.value) {
      loginIdEl.value = saved.userId;
    }
    if (loginPinEl && saved.pin && !loginPinEl.value) {
      loginPinEl.value = saved.pin;
    }
    syncForgetSavedBtn();
  }

  async function copyText(value, label) {
    const text = String(value || "");
    if (!text) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      }
      toast((label || "Copied") + ": " + text, "ok");
    } catch (e) {
      toast("Copy failed — select manually", "err");
    }
  }

  function displayUserId(user) {
    return (
      (user && user.userId) ||
      localStorage.getItem("userId") ||
      getSavedCredentials().userId ||
      ""
    );
  }

  function setUserChip(user) {
    var id = displayUserId(user);
    if (userIdChip) {
      userIdChip.textContent = id ? "ID " + id : "";
      userIdChip.title = id ? "Tap to copy User ID " + id : "Your User ID";
    }
    if (sidebarUserIdEl) sidebarUserIdEl.textContent = id || "—";
    if (payIdValueEl) payIdValueEl.textContent = id || "—";
    if (statusEl) {
      var base = "online";
      statusEl.textContent = id ? base + " · ID " + id : base;
    }
  }

  function showRegisterCreds(userId, pin) {
    pendingNewCreds = { userId: userId, pin: pin };
    saveCredentials(userId, pin);
    if (registerCredsIdEl) registerCredsIdEl.textContent = userId;
    if (registerCredsPinEl) registerCredsPinEl.textContent = pin;
    if (registerCredsEl) registerCredsEl.classList.remove("hidden");
    if (registerBtn) registerBtn.classList.add("hidden");
  }

  function authHeaders(json) {
    const h = { Authorization: "Bearer " + authToken };
    if (json !== false) h["Content-Type"] = "application/json";
    return h;
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function formatCountdown(hours) {
    const totalSec = Math.max(0, Math.floor(Number(hours) * 3600));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return h + ":" + pad2(m) + ":" + pad2(s);
    return m + ":" + pad2(s);
  }

  function remainingHoursNow() {
    if (!timerRunning) return Math.max(0, localHours);
    const elapsedH = Math.max(0, Date.now() - localSyncedAt) / 3600000;
    return Math.max(0, localHours - elapsedH);
  }

  async function handlePlanEnded(message) {
    // Stay on THIS chat — never open model/role setup on time-out
    closeSetupModal();
    closeSidebar();
    if (history.length || rpSetup) {
      setupLocked = true;
      if (appShellEl) appShellEl.classList.add("chat-ready");
    }

    if (planEndedHandled) {
      openPaySheet();
      return;
    }
    planEndedHandled = true;
    hoursCounting = false;
    stopLiveTimer();

    if (messagesEl) {
      var pauseMsg =
        message ||
        "Time’s up. Scene paused here — pay to continue this same chat.";
      var last = messagesEl.lastElementChild;
      var already =
        last &&
        last.classList.contains("error") &&
        /Time.?s up|Time over|Scene paused/i.test(last.textContent || "");
      if (!already) addBubble(pauseMsg, "error");
    }

    await flushChatSessionNow();
    toast("Time over · Pay to continue", "err");
    openPaySheet();
  }

  function syncLocalClock(user) {
    if (!user) return;
    let next = Number(user.hoursBalance != null ? user.hoursBalance : 0);
    // While the live timer runs, never rewind from a stale server snapshot
    // (e.g. chat response captured hours at request start before a long AI wait).
    if (timerRunning) {
      const clientLeft = remainingHoursNow();
      if (next > clientLeft + 1 / 3600) {
        next = clientLeft;
      }
    }
    localHours = Math.max(0, next);
    localSyncedAt = Date.now();
    if (currentUser) {
      currentUser.hoursBalance = localHours;
      currentUser.timeLabel = formatCountdown(localHours);
      currentUser.secondsLeft = Math.floor(localHours * 3600);
    }
    if (localHours > 0.0001) {
      planEndedHandled = false;
      if (localHours > 1 / 60) {
        warnedAt60 = false;
        warnedAt30 = false;
      }
    }
    paintLiveBadge();
  }

  function paintLiveBadge() {
    if (!hoursBadge) return;
    const left = remainingHoursNow();
    const leftSec = Math.max(0, Math.floor(left * 3600));
    hoursBadge.textContent = formatCountdown(left);
    hoursBadge.title = timerRunning
      ? left > 0
        ? "Time left (counting)"
        : "Time over — Pay to continue"
      : left > 0
        ? "Timer starts after your first message"
        : "Time over — Pay to continue";
    hoursBadge.classList.toggle("hours-low", left > 0 && left < 5 / 60);
    hoursBadge.classList.toggle("hours-empty", left <= 0);

    // Warn before time ends (once each)
    if (timerRunning && left > 0) {
      if (!warnedAt60 && leftSec <= 60 && leftSec > 30) {
        warnedAt60 = true;
        toast("1 minute left · Pay soon to keep this scene", "err");
      }
      if (!warnedAt30 && leftSec <= 30) {
        warnedAt30 = true;
        warnedAt60 = true;
        toast("30 seconds left · Tap Pay to continue after time ends", "err");
      }
    }

    // As soon as time hits 0 → Pay popup on same chat (do not wait / do not open setup)
    if (left <= 0 && (timerRunning || hoursCounting || setupLocked)) {
      timerRunning = false;
      if (!planEndedHandled) {
        handlePlanEnded();
      }
      refreshMe();
    }
  }

  function stopLiveTimer() {
    timerRunning = false;
    if (timerTickId) {
      clearInterval(timerTickId);
      timerTickId = null;
    }
    if (timerSyncId) {
      clearInterval(timerSyncId);
      timerSyncId = null;
    }
  }

  function startLiveTimer() {
    stopLiveTimer();
    timerRunning = true;
    paintLiveBadge();
    timerTickId = setInterval(paintLiveBadge, 1000);
    timerSyncId = setInterval(function () {
      refreshMe();
    }, 15000);
  }

  async function resumeSession() {
    if (!authToken) return;
    try {
      const res = await fetch("/api/billing/resume", {
        method: "POST",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.user) {
        currentUser = Object.assign({}, currentUser || {}, data.user);
        syncLocalClock(currentUser);
      }
    } catch (e) {
      /* ignore — timer still runs from last known balance */
    }
  }

  /** Timer starts only after user's first message (not on login / open chat). */
  async function ensureHoursCounting() {
    const already = hoursCounting;
    hoursCounting = true;
    // Always resume + ensure the interval is running (early-return used to leave
    // hoursCounting=true while timerRunning stayed false after a pause/race).
    await resumeSession();
    if (!already || !timerRunning) {
      startLiveTimer();
    }
  }

  async function pauseBillingQuiet() {
    if (!authToken) return;
    try {
      const res = await fetch("/api/billing/pause", {
        method: "POST",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.user) {
        currentUser = Object.assign({}, currentUser || {}, data.user);
        syncLocalClock(currentUser);
      }
    } catch (e) {
      /* ignore */
    }
  }

  function formatTime(u) {
    const hours = Number(u && u.hoursBalance != null ? u.hoursBalance : 0);
    return formatCountdown(hours);
  }

  function setHoursBadge(userOrHours) {
    if (!hoursBadge) return;
    if (userOrHours && typeof userOrHours === "object") {
      syncLocalClock(userOrHours);
      return;
    }
    syncLocalClock({
      hoursBalance: userOrHours,
      hasPaid: currentUser && currentUser.hasPaid,
    });
  }

  function applyTimeFromResponse(data) {
    if (!data) return;
    if (data.user) {
      currentUser = Object.assign({}, currentUser || {}, data.user);
      syncLocalClock(currentUser);
      return;
    }
    if (typeof data.hoursBalance === "number") {
      currentUser = Object.assign({}, currentUser || {}, {
        hoursBalance: data.hoursBalance,
        hasPaid:
          data.hasPaid != null
            ? data.hasPaid
            : currentUser && currentUser.hasPaid,
        timeLabel: data.timeLabel,
        minutesLeft: data.minutesLeft,
        secondsLeft: data.secondsLeft,
      });
      syncLocalClock(currentUser);
    }
  }

  function setPublicSeoMode(isPublicLanding) {
    const robots = document.getElementById("meta-robots");
    const googlebot = document.getElementById("meta-googlebot");
    if (isPublicLanding) {
      if (robots) {
        robots.setAttribute(
          "content",
          "index, follow, max-snippet:-1, max-image-preview:large"
        );
      }
      if (googlebot) googlebot.setAttribute("content", "index, follow");
      document.title =
        "Best Roleplay Site | Private Desi WhatsApp-Style RP – DesiChat";
    } else {
      // Logged-in private chat must not be indexed
      if (robots) robots.setAttribute("content", "noindex, nofollow");
      if (googlebot) googlebot.setAttribute("content", "noindex, nofollow");
      document.title = "DesiChat";
    }
  }

  function showAuth() {
    stopLiveTimer();
    if (authGate) authGate.classList.remove("hidden");
    if (appShell) {
      appShell.classList.add("hidden");
      appShell.setAttribute("aria-hidden", "true");
    }
    setPublicSeoMode(true);
  }

  async function showApp() {
    if (authGate) authGate.classList.add("hidden");
    if (appShell) {
      appShell.classList.remove("hidden");
      appShell.setAttribute("aria-hidden", "false");
    }
    setPublicSeoMode(false);
    hoursCounting = false;
    stopLiveTimer();
    // Wait for first user message before draining time
    await pauseBillingQuiet();
    await refreshMe();
    setUserChip(currentUser);
    paintLiveBadge();
  }

  function logout() {
    hoursCounting = false;
    stopLiveTimer();
    authToken = "";
    currentUser = null;
    localHours = 0;
    localStorage.removeItem("userToken");
    // Keep saved ID/PIN on this browser for next login
    showAuth();
    prefillLoginFromSaved();
    setUserChip(null);
  }

  async function refreshMe() {
    if (!authToken) return false;
    const res = await fetch("/api/billing/me", { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) {
      logout();
      return false;
    }
    currentUser = data.user;
    syncLocalClock(currentUser);
    if (billingUserEl) {
      billingUserEl.textContent =
        "Logged in: " +
        currentUser.userId +
        " · Left: " +
        formatCountdown(remainingHoursNow());
    }
    return true;
  }

  let payCatalog = { packages: [], payment: {} };
  let selectedPackId = "5h";
  let payPollId = null;

  function setPaySteps(activeStep) {
    payWizardStep = activeStep;
    payStepEls.forEach(function (el) {
      const n = Number(el.getAttribute("data-step"));
      el.classList.toggle("active", n === activeStep);
      el.classList.toggle("done", n < activeStep);
    });
    payPanes.forEach(function (pane) {
      const n = Number(pane.getAttribute("data-pane"));
      pane.classList.toggle("active", n === activeStep);
    });
  }

  function goPayStep(step) {
    if (step === 2 && !selectedPack()) {
      if (payMsg) {
        payMsg.className = "pay-msg err";
        payMsg.textContent = "Please choose a pack first.";
      }
      setPaySteps(1);
      return;
    }
    setPaySteps(step);
    syncPayUi();
    if (step === 3 && payProofSummary) {
      var pack = selectedPack();
      var uid = (currentUser && currentUser.userId) || "";
      payProofSummary.textContent = pack
        ? "Paid ₹" +
          pack.priceInr +
          " (" +
          pack.label +
          ") · remark " +
          uid +
          " — now upload the screenshot."
        : "Upload your payment screenshot.";
    }
  }

  function selectedPack() {
    const packs = payCatalog.packages || [];
    return (
      packs.find(function (p) {
        return p.id === selectedPackId;
      }) ||
      packs[0] ||
      null
    );
  }

  function buildUpiLink(pack) {
    const pay = payCatalog.payment || {};
    const uid = (currentUser && currentUser.userId) || "";
    const params = new URLSearchParams({
      pa: pay.upiId || "",
      pn: pay.upiName || "Chat",
      am: String((pack && pack.priceInr) || ""),
      cu: "INR",
      tn: uid,
    });
    return "upi://pay?" + params.toString();
  }

  function showPendingBanner(payment) {
    if (!payPendingBanner) return;
    if (!payment) {
      payPendingBanner.classList.add("hidden");
      payPendingBanner.innerHTML = "";
      if (payRefreshStatusBtn) payRefreshStatusBtn.classList.add("hidden");
      return;
    }
    payPendingBanner.classList.remove("hidden", "approved");
    if (payment.status === "approved") {
      payPendingBanner.classList.add("approved");
      payPendingBanner.innerHTML =
        "<strong>Approved ✓ Hours unlocked</strong>" +
        "₹" +
        payment.amountInr +
        " · " +
        payment.packageId +
        " hours added. Check the timer — you can continue chatting.";
      if (payRefreshStatusBtn) payRefreshStatusBtn.classList.add("hidden");
      return;
    }
    if (payment.status === "rejected") {
      payPendingBanner.innerHTML =
        "<strong>Payment rejected</strong>" +
        "₹" +
        payment.amountInr +
        " request was rejected. Please submit again with a clear screenshot.";
      if (payRefreshStatusBtn) payRefreshStatusBtn.classList.add("hidden");
      return;
    }
    payPendingBanner.innerHTML =
      "<strong>Pending admin approval</strong>" +
      "You submitted a screenshot for <b>₹" +
      payment.amountInr +
      "</b> (" +
      payment.packageId +
      ").<br/>" +
      "Usually unlocked in a few minutes after admin verifies.<br/>" +
      "Keep this open — it updates automatically, or tap Refresh status.";
    if (payRefreshStatusBtn) payRefreshStatusBtn.classList.remove("hidden");
  }

  async function refreshPayStatus() {
    if (payRefreshStatusBtn) {
      payRefreshStatusBtn.disabled = true;
      payRefreshStatusBtn.textContent = "Checking…";
    }
    try {
      await refreshMe();
      const list = await loadMyPayments();
      const pending = (list || []).find(function (p) {
        return p.status === "pending";
      });
      const approved = (list || []).find(function (p) {
        return p.status === "approved";
      });
      if (pending) showPendingBanner(pending);
      else if (
        approved &&
        remainingHoursNow() > 0.05
      ) {
        showPendingBanner(approved);
        toast("Hours unlocked · continue chatting", "ok");
      } else {
        toast("Still pending · try again in a minute", "ok");
      }
      paintLiveBadge();
    } catch (e) {
      toast("Could not refresh — try again", "err");
    } finally {
      if (payRefreshStatusBtn) {
        payRefreshStatusBtn.disabled = false;
        payRefreshStatusBtn.textContent = "Refresh status";
      }
    }
  }

  function copyPayDetails() {
    const pack = selectedPack();
    const uid = displayUserId(currentUser);
    if (!pack) {
      toast("Choose a pack first", "err");
      return;
    }
    const text =
      "Pay ₹" +
      pack.priceInr +
      " · User ID (UPI remark): " +
      (uid || "—");
    copyText(text, "Payment details");
  }

  const WELCOME_TIP_KEY = "welcomeTipDismissed";

  function maybeShowWelcomeTip() {
    if (!welcomeTipEl) return;
    try {
      if (localStorage.getItem(WELCOME_TIP_KEY) === "1") {
        welcomeTipEl.classList.add("hidden");
        return;
      }
    } catch (e) {}
    welcomeTipEl.classList.remove("hidden");
  }

  function dismissWelcomeTip() {
    try {
      localStorage.setItem(WELCOME_TIP_KEY, "1");
    } catch (e) {}
    if (welcomeTipEl) welcomeTipEl.classList.add("hidden");
  }

  function syncPayUi() {
    const pack = selectedPack();
    const pay = payCatalog.payment || {};
    const uid = (currentUser && currentUser.userId) || "";

    if (upiNoteEl) upiNoteEl.value = uid;
    if (upiIdDisplay) upiIdDisplay.textContent = pay.upiId || "—";

    if (packageCardsEl) {
      packageCardsEl.querySelectorAll(".package-card").forEach(function (btn) {
        btn.classList.toggle("selected", btn.getAttribute("data-id") === selectedPackId);
      });
    }
    if (packageSelect) packageSelect.value = selectedPackId;

    if (pack) {
      if (copyPayDetailsBtn) copyPayDetailsBtn.classList.remove("hidden");
      var saveHtml =
        pack.saveInr > 0
          ? " · <span class='sum-save'>You save ₹" + pack.saveInr + "</span>"
          : "";
      var listHtml =
        pack.saveInr > 0
          ? " <span class='sum-was'>₹" + pack.listPriceInr + "</span>"
          : "";
      if (payAmountLine) {
        payAmountLine.innerHTML =
          "Pay exactly <b>₹" +
          pack.priceInr +
          "</b>" +
          listHtml +
          " · " +
          pack.label +
          " · remark <b>" +
          uid +
          "</b>";
      }
      if (paySelectedSummary) {
        paySelectedSummary.classList.remove("hidden");
        paySelectedSummary.innerHTML =
          '<span class="sum-amount">₹' +
          pack.priceInr +
          listHtml +
          "</span>" +
          '<span class="sum-detail">Selected: <b>' +
          pack.label +
          "</b> · ₹" +
          pack.perHourInr +
          "/hr" +
          saveHtml +
          "<br/>UPI remark = User ID <b>" +
          uid +
          "</b></span>";
      }
      if (submitPayBtn) {
        submitPayBtn.textContent = "Submit ₹" + pack.priceInr + " screenshot";
      }
      if (upiOpenBtn) {
        upiOpenBtn.textContent = "Open UPI · Pay ₹" + pack.priceInr;
        upiOpenBtn.href = buildUpiLink(pack);
        upiOpenBtn.setAttribute("aria-disabled", pay.upiId ? "false" : "true");
      }
      if (payInstructions) {
        payInstructions.innerHTML =
          "Pay exactly <b>₹" +
          pack.priceInr +
          "</b> on UPI" +
          (pack.saveInr > 0 ? " (save ₹" + pack.saveInr + ")" : "") +
          " · Remark = <b>" +
          uid +
          "</b> · Then tap <b>I’ve paid</b>.";
      }
      // stay on current wizard step — don't jump
    } else {
      if (copyPayDetailsBtn) copyPayDetailsBtn.classList.add("hidden");
      if (payAmountLine) payAmountLine.textContent = "Select a pack first";
      if (paySelectedSummary) {
        paySelectedSummary.classList.add("hidden");
        paySelectedSummary.innerHTML = "";
      }
      if (submitPayBtn) submitPayBtn.textContent = "Submit screenshot";
    }
  }

  function renderPackageCards(packs) {
    if (!packageCardsEl) return;
    packageCardsEl.innerHTML = "";
    // Prefer Popular (5h) as default if nothing selected yet
    if (!selectedPackId) {
      var pop = packs.find(function (p) {
        return p.popular;
      });
      selectedPackId = (pop && pop.id) || (packs[0] && packs[0].id) || "1h";
    }
    packs.forEach(function (p) {
      const btn = document.createElement("button");
      btn.type = "button";
      var extra =
        (p.id === selectedPackId ? " selected" : "") +
        (p.popular ? " pack-popular" : "") +
        (p.badge === "Best value" ? " pack-best" : "");
      btn.className = "package-card" + extra;
      btn.setAttribute("data-id", p.id);
      btn.setAttribute("role", "option");
      var badge =
        p.badge
          ? '<span class="pack-badge">' + p.badge + "</span>"
          : '<span class="pack-badge pack-badge-muted">Standard</span>';
      var was =
        p.saveInr > 0
          ? '<span class="pack-was">₹' + p.listPriceInr + "</span>"
          : "";
      var saveLine =
        p.saveInr > 0
          ? '<span class="pack-save">Save ₹' + p.saveInr + "</span>"
          : '<span class="pack-save pack-save-muted">No discount</span>';
      btn.innerHTML =
        badge +
        '<span class="pack-label">' +
        p.label +
        "</span>" +
        '<span class="pack-price-row">' +
        was +
        '<span class="pack-price">₹' +
        p.priceInr +
        "</span></span>" +
        '<span class="pack-meta">₹' +
        p.perHourInr +
        "/hr</span>" +
        saveLine;
      btn.addEventListener("click", function () {
        selectedPackId = p.id;
        syncPayUi();
      });
      packageCardsEl.appendChild(btn);
    });
  }

  async function loadBillingInfo() {
    const res = await fetch("/api/billing/packages");
    const data = await res.json();
    payCatalog = {
      packages: data.packages || [],
      payment: data.payment || {},
    };
    const packs = payCatalog.packages;
    if (packageSelect) {
      packageSelect.innerHTML = "";
      packs.forEach(function (p) {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = p.label + " — ₹" + p.priceInr;
        packageSelect.appendChild(opt);
      });
    }
    if (!selectedPackId && packs[0]) selectedPackId = packs[0].id;
    renderPackageCards(packs);

    if (upiQr && payCatalog.payment.qrImageUrl) {
      upiQr.src = payCatalog.payment.qrImageUrl;
      upiQr.classList.remove("hidden");
      upiQr.onerror = function () {
        upiQr.alt = "Add QR at public/upi-qr.png or set UPI_QR_URL";
      };
    }
    syncPayUi();
    await loadMyPayments();
  }

  async function loadMyPayments() {
    if (!myPaymentsEl || !authToken) return [];
    const res = await fetch("/api/billing/my-payments", { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) {
      myPaymentsEl.textContent = "";
      return [];
    }
    const list = (data.payments || []).slice(0, 6);
    if (!list.length) {
      myPaymentsEl.innerHTML = "<div class='char-info'>No payments yet.</div>";
      return [];
    }
    myPaymentsEl.innerHTML = list
      .map(function (p) {
        var statusLabel =
          p.status === "pending"
            ? "PENDING ADMIN"
            : p.status === "approved"
              ? "APPROVED"
              : String(p.status || "").toUpperCase();
        return (
          "<div class='pay-history-item'><span>" +
          p.packageId +
          " · ₹" +
          p.amountInr +
          "</span><span class='pay-status " +
          p.status +
          "'>" +
          statusLabel +
          "</span></div>"
        );
      })
      .join("");

    var latest = list[0];
    if (latest && (latest.status === "pending" || latest.status === "approved" || latest.status === "rejected")) {
      showPendingBanner(latest);
    }
    return list;
  }

  function stopPayPoll() {
    if (payPollId) {
      clearInterval(payPollId);
      payPollId = null;
    }
  }

  function startPayPoll() {
    if (payPollId) return;
    payPollId = setInterval(async function () {
      const list = await loadMyPayments();
      await refreshMe();
      const stillPending =
        list &&
        list.some(function (p) {
          return p.status === "pending";
        });
      const unlocked = remainingHoursNow() > 0.05 && currentUser && (currentUser.hasPaid || remainingHoursNow() > 0.1);
      if (unlocked && list && list.some(function (p) { return p.status === "approved"; })) {
        var approved = list.find(function (p) {
          return p.status === "approved";
        });
        showPendingBanner(approved);
        if (payMsg) {
          payMsg.className = "pay-msg ok";
          payMsg.textContent =
            "Unlocked ✓ Hours added. Close this sheet and continue from the same scene.";
        }
        planEndedHandled = false;
        toast("Unlocked · continue from where you left", "ok");
        stopPayPoll();
        if (input) input.focus();
        return;
      }
      if (!stillPending) stopPayPoll();
    }, 8000);
  }

  function fileToBase64(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () {
        resolve(reader.result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /** Shrink big phone screenshots so upload stays fast */
  function compressImageFile(file) {
    return new Promise(function (resolve) {
      if (!file || !/^image\//.test(file.type)) {
        resolve(null);
        return;
      }
      if (file.size < 900000) {
        fileToBase64(file).then(resolve).catch(function () {
          resolve(null);
        });
        return;
      }
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = function () {
        const maxW = 1280;
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        fileToBase64(file).then(resolve).catch(function () {
          resolve(null);
        });
      };
      img.src = url;
    });
  }

  async function submitPayment() {
    if (!payMsg) return;
    payMsg.className = "pay-msg";
    payMsg.textContent = "Uploading screenshot...";
    if (submitPayBtn) submitPayBtn.disabled = true;
    try {
      const file = payScreenshot && payScreenshot.files && payScreenshot.files[0];
      if (!file) {
        payMsg.className = "pay-msg err";
        payMsg.textContent = "Please add a payment screenshot first.";
        goPayStep(3);
        return;
      }
      if (!selectedPackId) {
        payMsg.className = "pay-msg err";
        payMsg.textContent = "Please choose a package first.";
        goPayStep(1);
        return;
      }
      const b64 = (await compressImageFile(file)) || (await fileToBase64(file));
      const res = await fetch("/api/billing/submit", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          packageId: selectedPackId,
          screenshotBase64: b64,
          upiNote:
            (upiNoteEl && upiNoteEl.value.trim()) ||
            (currentUser && currentUser.userId) ||
            "",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        payMsg.className = "pay-msg err";
        payMsg.textContent = data.error || "Submit failed";
        return;
      }
      const pack = selectedPack();
      const payment = data.payment || {
        status: "pending",
        amountInr: pack ? pack.priceInr : "",
        packageId: selectedPackId,
      };
      showPendingBanner(payment);
      payMsg.className = "pay-msg ok";
      payMsg.textContent =
        "Submitted ✓ Pending admin approval. Hours unlock after verify.";
      toast("Payment pending · waiting for admin", "ok");
      if (payUploadBlock) payUploadBlock.classList.add("hidden");
      if (payProofNav) payProofNav.classList.add("hidden");
      goPayStep(3);
      if (payScreenshot) payScreenshot.value = "";
      if (payPreview) {
        payPreview.classList.add("hidden");
        payPreview.removeAttribute("src");
      }
      if (payUploadText) payUploadText.textContent = "Tap to add screenshot";
      if (payUploadLabel) payUploadLabel.classList.remove("has-file");
      await loadMyPayments();
      startPayPoll();
    } catch (e) {
      payMsg.className = "pay-msg err";
      payMsg.textContent = "Upload error — try a smaller screenshot.";
    } finally {
      if (submitPayBtn) submitPayBtn.disabled = false;
    }
  }

  function timeNow() {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function escapeHtml(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  /** Escape + turn *actions* into italic spans (Venice RP style). */
  function formatRpHtml(text) {
    const escaped = escapeHtml(text);
    return escaped.replace(
      /\*([^*]+)\*/g,
      '<span class="rp-action">*$1*</span>'
    );
  }

  function addBubble(text, type) {
    const bubble = document.createElement("div");
    bubble.className = "bubble " + type;
    bubble.innerHTML =
      formatRpHtml(text) + '<span class="meta">' + timeNow() + "</span>";
    if (type === "incoming" && String(text || "").trim()) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "bubble-report-btn";
      btn.textContent = "Report";
      btn.title = "Report bad AI reply";
      btn.addEventListener("click", function () {
        openReportSheet(String(text || ""), btn);
      });
      bubble.appendChild(btn);
    }
    messagesEl.appendChild(bubble);
    scrollMessagesToEnd(type === "outgoing" || type === "error");
    if (type === "incoming") playReplyFeedback();
  }

  let reportTargetText = "";
  let reportTargetBtn = null;
  const reportSheet = document.getElementById("report-sheet");
  const reportBackdrop = document.getElementById("report-backdrop");
  const reportReasonEl = document.getElementById("report-reason");
  const reportNoteEl = document.getElementById("report-note");
  const reportSendBtn = document.getElementById("report-send");
  const reportCancelBtn = document.getElementById("report-cancel");

  function openReportSheet(aiText, btn) {
    if (!authToken) {
      toast("Login required", "err");
      return;
    }
    reportTargetText = aiText;
    reportTargetBtn = btn || null;
    if (reportNoteEl) reportNoteEl.value = "";
    if (reportReasonEl) reportReasonEl.value = "bad reply";
    if (reportSheet) {
      reportSheet.classList.remove("hidden");
      reportSheet.setAttribute("aria-hidden", "false");
    }
  }

  function closeReportSheet() {
    if (reportSheet) {
      reportSheet.classList.add("hidden");
      reportSheet.setAttribute("aria-hidden", "true");
    }
    reportTargetText = "";
    reportTargetBtn = null;
  }

  async function sendAiReport() {
    if (!reportTargetText || !authToken) return;
    const roles = typeof getRpRoles === "function" ? getRpRoles() : {};
    const reason = reportReasonEl ? reportReasonEl.value : "bad reply";
    const note = reportNoteEl ? reportNoteEl.value.trim() : "";
    if (reportSendBtn) reportSendBtn.disabled = true;
    try {
      const res = await fetch("/api/chat/report", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          reason: reason,
          note: note,
          aiMessage: reportTargetText,
          context: (history || []).slice(-12),
          setup: rpSetup || (typeof buildRpSetupText === "function" ? buildRpSetupText() : ""),
          characterName: roles.characterName || "",
          botRole: roles.botRole || "",
          userRole: roles.userRole || "",
          botGender: roles.botGender || "",
          userGender: roles.userGender || "",
        }),
      });
      const data = await res.json().catch(function () {
        return {};
      });
      if (!res.ok) {
        if (res.status === 401) {
          logout();
          return;
        }
        toast(data.error || "Report failed", "err");
        return;
      }
      if (reportTargetBtn) {
        reportTargetBtn.textContent = "Reported";
        reportTargetBtn.classList.add("done");
      }
      toast("Report sent — thanks", "ok");
      closeReportSheet();
    } catch (e) {
      toast("Network error", "err");
    } finally {
      if (reportSendBtn) reportSendBtn.disabled = false;
    }
  }

  if (reportSendBtn) reportSendBtn.addEventListener("click", sendAiReport);
  if (reportCancelBtn) reportCancelBtn.addEventListener("click", closeReportSheet);
  if (reportBackdrop) reportBackdrop.addEventListener("click", closeReportSheet);

  function addWorkedStatus(ms, steps) {
    // Hidden for normal users (immersion). Enable with ?debug=1 or localStorage debugWorked=1
    var debug =
      /(?:\?|&)debug=1(?:&|$)/.test(location.search) ||
      localStorage.getItem("debugWorked") === "1";
    if (!debug) return;
    const el = document.createElement("div");
    el.className = "worked-status";
    el.style.display = "block";
    const sec = Math.max(1, Math.round((ms || 0) / 1000));
    const n = steps || 1;
    el.textContent = "Worked for " + sec + "s · " + n + " step" + (n === 1 ? "" : "s") + " ›";
    messagesEl.appendChild(el);
    scrollMessagesToEnd(true);
  }

  function showTyping() {
    hideTyping();
    const name =
      (charNameEl && charNameEl.value.trim()) ||
      (titleEl && titleEl.textContent.trim()) ||
      "Chat";
    const el = document.createElement("div");
    el.className = "typing";
    el.id = "typing";
    el.innerHTML =
      '<span class="typing-label">' +
      escapeHtml(name) +
      " typing…</span>" +
      '<span class="typing-dots"><span></span><span></span><span></span></span>';
    messagesEl.appendChild(el);
    scrollMessagesToEnd(true);
  }

  function hideTyping() {
    const t = document.getElementById("typing");
    if (t) t.remove();
  }

  function setBusy(busy, label) {
    sendBtn.disabled = busy;
    input.disabled = busy;
    if (sendIcon) sendIcon.classList.toggle("hidden", !!busy);
    if (sendSpinner) sendSpinner.classList.toggle("hidden", !busy);
    sendBtn.classList.toggle("is-busy", !!busy);
    if (busy) {
      statusEl.textContent =
        label ||
        ((charNameEl && charNameEl.value.trim()) || "Chat") + " typing…";
    } else {
      setUserChip(currentUser);
    }
  }

  function source() {
    return chatSourceEl.value;
  }

  function isVeniceMode() {
    return source() === "venice";
  }

  function isMaaMode() {
    return source() === "maa";
  }

  function syncPanels() {
    const s = source();
    if (maaPanel) maaPanel.classList.toggle("hidden", s !== "maa");
    if (venicePanel) venicePanel.classList.toggle("hidden", s !== "venice");
    if (customPanel) customPanel.classList.toggle("hidden", s !== "custom");
  }

  function syncTitle() {
    if (isMaaMode()) {
      titleEl.textContent = (charNameEl && charNameEl.value.trim()) || "Chat";
      return;
    }
    if (isVeniceMode() && selectedCharacter) {
      titleEl.textContent = selectedCharacter.name || selectedCharacter.slug;
      return;
    }
    titleEl.textContent = (botRoleEl && botRoleEl.value.trim()) || "Buddy";
  }

  function roleIsClient(role) {
    const names = Array.prototype.slice.call(arguments, 1);
    const r = String(role || "")
      .toLowerCase()
      .trim();
    if (!r || !names.length) return false;
    for (let i = 0; i < names.length; i++) {
      if (r === names[i]) return true;
    }
    const sorted = names.slice().sort(function (a, b) {
      return b.length - a.length;
    });
    for (let i = 0; i < sorted.length; i++) {
      const n = sorted[i];
      if (!n) continue;
      const re = new RegExp(
        "\\b" + n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b"
      );
      if (re.test(r)) return true;
    }
    return false;
  }

  function inferGenderClient(role) {
    const r = String(role || "")
      .toLowerCase()
      .trim();
    const femaleExact = {
      mom: 1,
      mummy: 1,
      maa: 1,
      mother: 1,
      sister: 1,
      bahan: 1,
      gf: 1,
      girlfriend: 1,
      wife: 1,
      biwi: 1,
      girl: 1,
      didi: 1,
      female: 1,
      woman: 1,
      ladki: 1,
      aunty: 1,
      mausi: 1,
      maushi: 1,
      mami: 1,
      bua: 1,
      chachi: 1,
      tai: 1,
      dadi: 1,
      nani: 1,
      saas: 1,
      bhabhi: 1,
      nanad: 1,
      sali: 1,
      bahu: 1,
      beti: 1,
      bhanji: 1,
      poti: 1,
      bhatiji: 1,
    };
    const maleExact = {
      dad: 1,
      papa: 1,
      father: 1,
      brother: 1,
      bhai: 1,
      bf: 1,
      boyfriend: 1,
      husband: 1,
      pati: 1,
      boy: 1,
      male: 1,
      man: 1,
      beta: 1,
      son: 1,
      uncle: 1,
      ladka: 1,
      mama: 1,
      mausa: 1,
      chacha: 1,
      tau: 1,
      phupha: 1,
      dada: 1,
      nana: 1,
      sasur: 1,
      jija: 1,
      devar: 1,
      jeth: 1,
      sala: 1,
      jamai: 1,
      damad: 1,
      bhanja: 1,
      bhatija: 1,
      pota: 1,
    };
    if (femaleExact[r]) return "female";
    if (maleExact[r]) return "male";
    // Word-boundary only (saas⊂sasur, nana⊂nanad never flip)
    if (
      roleIsClient(
        r,
        "mom",
        "mummy",
        "maa",
        "mother",
        "sister",
        "gf",
        "girlfriend",
        "wife",
        "biwi",
        "girl",
        "didi",
        "bahan",
        "female",
        "woman",
        "ladki",
        "aunty",
        "mausi",
        "maushi",
        "mami",
        "bua",
        "chachi",
        "tai",
        "dadi",
        "nani",
        "saas",
        "bhabhi",
        "nanad",
        "sali",
        "bahu",
        "beti",
        "bhanji",
        "poti",
        "bhatiji"
      )
    )
      return "female";
    if (
      roleIsClient(
        r,
        "dad",
        "papa",
        "father",
        "brother",
        "bhai",
        "bf",
        "boyfriend",
        "husband",
        "pati",
        "boy",
        "male",
        "man",
        "beta",
        "son",
        "uncle",
        "ladka",
        "mama",
        "mausa",
        "chacha",
        "tau",
        "phupha",
        "dada",
        "nana",
        "sasur",
        "jija",
        "devar",
        "jeth",
        "sala",
        "jamai",
        "damad",
        "bhanja",
        "bhatija",
        "pota"
      )
    )
      return "male";
    return "female";
  }

  /** Smart defaults — opposite sex auto-pair (AI is → You are) */
  const ROLE_SMART = {
    mummy: { userRole: "beta", name: "Maa", hint: "Maa↔beta · private 1-on-1 first; family only if you ask." },
    dad: { userRole: "beti", name: "Papa", hint: "Papa↔beti · correct address + guests." },
    mausi: { userRole: "bhanja", name: "Mausi", hint: "Mausi ↔ bhanja (F↔M)." },
    mausa: { userRole: "bhanji", name: "Mausa", hint: "Mausa ↔ bhanji (M↔F)." },
    mama: { userRole: "bhanji", name: "Mama", hint: "Mama ↔ bhanji (M↔F)." },
    mami: { userRole: "bhanja", name: "Mami", hint: "Mami ↔ bhanja (F↔M)." },
    nani: { userRole: "pota", name: "Nani", hint: "Nani ↔ pota (F↔M)." },
    nana: { userRole: "poti", name: "Nana", hint: "Nana ↔ poti (M↔F)." },
    chachi: { userRole: "bhatija", name: "Chachi", hint: "Chachi ↔ bhatija (F↔M)." },
    chacha: { userRole: "beti", name: "Chacha", hint: "Chacha ↔ bhatiji/beti (M↔F)." },
    tai: { userRole: "bhatija", name: "Tai", hint: "Tai ↔ bhatija (F↔M)." },
    tau: { userRole: "beti", name: "Tauji", hint: "Tau ↔ bhatiji/beti (M↔F)." },
    bua: { userRole: "bhatija", name: "Bua", hint: "Bua ↔ bhatija (F↔M)." },
    phupha: { userRole: "beti", name: "Phupha", hint: "Phupha ↔ bhatiji/beti (M↔F)." },
    dadi: { userRole: "pota", name: "Dadi", hint: "Dadi ↔ pota (F↔M)." },
    dada: { userRole: "poti", name: "Dada", hint: "Dada ↔ poti (M↔F)." },
    sister: { userRole: "brother", name: "Didi", hint: "Didi ↔ bhai (F↔M)." },
    brother: { userRole: "sister", name: "Bhai", hint: "Bhai ↔ didi (M↔F)." },
    bhabhi: { userRole: "devar", name: "Bhabhi", hint: "Bhabhi ↔ devar (F↔M)." },
    jija: { userRole: "sali", name: "Jija", hint: "Jija ↔ sali (M↔F)." },
    saas: { userRole: "bahu", name: "Saas", hint: "Saas↔bahu · bahu says Mummy ji." },
    sasur: { userRole: "bahu", name: "Sasur", hint: "Sasur↔bahu · bahu says Papa ji." },
    bahu: { userRole: "sasur", name: "Bahu", hint: "Bahu↔sasur · you say Papa ji." },
    nanad: { userRole: "jamai", name: "Nanad", hint: "Nanad ↔ jamai (F↔M)." },
    devar: { userRole: "bhabhi", name: "Devar", hint: "Devar ↔ bhabhi (M↔F)." },
    jeth: { userRole: "bhabhi", name: "Jeth", hint: "Jeth ↔ bhabhi (M↔F)." },
    sali: { userRole: "jija", name: "Sali", hint: "Sali ↔ jija (F↔M)." },
    sala: { userRole: "sister", name: "Sala", hint: "Sala ↔ behen (M↔F)." },
    girlfriend: { userRole: "boyfriend", name: "Baby", hint: "GF ↔ BF (F↔M)." },
    boyfriend: { userRole: "girlfriend", name: "Babe", hint: "BF ↔ GF (M↔F)." },
    wife: { userRole: "husband", name: "Biwi", hint: "Wife ↔ husband (F↔M)." },
    husband: { userRole: "wife", name: "Pati", hint: "Husband ↔ wife (M↔F)." },
    "friend girl": { userRole: "boyfriend", name: "Priya", hint: "Girl friend ↔ BF (F↔M)." },
    "friend boy": { userRole: "girlfriend", name: "Rahul", hint: "Guy friend ↔ GF (M↔F)." },
    custom: { userRole: "custom", name: "", hint: "Custom — type both roles clearly." },
  };

  const DEFAULT_CHAR_NAMES = Object.keys(ROLE_SMART)
    .map(function (k) {
      return ROLE_SMART[k].name;
    })
    .filter(Boolean)
    .concat([""]);

  function applySmartRoleDefaults(forceName) {
    if (!rpBotRoleEl) return;
    const key = rpBotRoleEl.value;
    const smart = ROLE_SMART[key];
    if (!smart) return;

    // Always sync "You are" when AI role changes — this is the smart pair.
    if (rpUserRoleEl && smart.userRole) {
      rpUserRoleEl.value = smart.userRole;
      // Fallback if option somehow missing
      if (rpUserRoleEl.value !== smart.userRole) {
        const opt = document.createElement("option");
        opt.value = smart.userRole;
        opt.textContent = smart.userRole;
        rpUserRoleEl.appendChild(opt);
        rpUserRoleEl.value = smart.userRole;
      }
    }
    if (charNameEl && smart.name) {
      const cur = charNameEl.value.trim();
      if (forceName || DEFAULT_CHAR_NAMES.indexOf(cur) !== -1) {
        charNameEl.value = smart.name;
      }
    }
    syncCustomRoleFields();
    syncTitle();
    if (rpSetupStatus) {
      rpSetupStatus.textContent = smart.hint + (setupLocked ? " Save changes in sidebar." : " Tap Start chat.");
    }
    // Parent roles default to strict resistance (slow burn)
    if (rpResistanceEl && (key === "mummy" || key === "dad")) {
      if (!setupLocked || forceName) rpResistanceEl.value = "strict";
    }
  }

  function getRpRoles() {
    let botRole = rpBotRoleEl ? rpBotRoleEl.value : "mummy";
    let userRole = rpUserRoleEl ? rpUserRoleEl.value : "beta";
    if (botRole === "custom" && rpCustomBot) {
      botRole = rpCustomBot.value.trim() || "partner";
    }
    if (userRole === "custom" && rpCustomUser) {
      userRole = rpCustomUser.value.trim() || "friend";
    }
    return {
      characterName: (charNameEl && charNameEl.value.trim()) || "Maa",
      botRole: botRole,
      userRole: userRole,
      botGender: inferGenderClient(botRole),
      userGender: inferGenderClient(userRole),
    };
  }

  function syncCustomRoleFields() {
    if (!rpCustomRoles || !rpBotRoleEl || !rpUserRoleEl) return;
    const show =
      rpBotRoleEl.value === "custom" || rpUserRoleEl.value === "custom";
    rpCustomRoles.classList.toggle("hidden", !show);
  }

  function buildRpSetupText() {
    const roles = getRpRoles();
    const brief = rpNoteEl ? rpNoteEl.value.trim() : "";
    const vibe = rpVibeEl ? rpVibeEl.value : "shy and flirty";
    const pace = rpPaceEl
      ? rpPaceEl.value
      : "slow: shy then flirty then more only if user pushes";
    const resistance = rpResistanceEl ? rpResistanceEl.value : "strict";
    const resistanceLine =
      resistance === "easy"
        ? "Resistance: easy — soft denials short; can heat up faster when user pushes; still never jump soft→sex in one line."
        : resistance === "normal"
          ? "Resistance: normal — tease and shy first; sex only after several clear pushes; no instant yes to papa-wali baat."
          : "Resistance: strict — seedhi-saadi saree Maa/Papa. Real daily talk first. Change topic + resist + tiny hook. Hard to seduce. Many shy/deny beats before any sex yes. NEVER 'Theek hai aaja' early. Body describe only when heated (full/bulky actress vibe). Easy yes FORBIDDEN.";
    const relationship =
      roles.botRole +
      " primary with " +
      roles.userRole +
      " — NEVER swap gender or rishta; masti with user only unless user asks to add a relative or wants a confession; never invent 'I hooked up with your nani/mummy'.";
    const briefBlock = brief
      ? "USER RP BRIEF (OBEY carefully — scene, place, pace, boundaries, address): " +
        brief
      : "USER RP BRIEF: none — ask lightly in chat where you are; do NOT assume bedroom-at-night.";
    return (
      "Character name: " +
      roles.characterName +
      ". AI role: " +
      roles.botRole +
      ". User role: " +
      roles.userRole +
      ". AI gender: " +
      roles.botGender +
      ". User gender: " +
      roles.userGender +
      ". Relationship: " +
      relationship +
      ". Identity lock: stay " +
      roles.botGender +
      " " +
      roles.botRole +
      " named " +
      roles.characterName +
      " every message. Rishta lock: speak with correct Indian addressing (Mummy says meri Maa not Nani; Bahu says Papa ji to Sasur). Family: one relative at a time only if asked. Place: NOT fixed — follow USER RP BRIEF and chat; never force night bedroom. Start vibe: " +
      vibe +
      ". Pace: " +
      pace +
      ". " +
      resistanceLine +
      " All adults 18+. " +
      briefBlock +
      ". Default shy + flirty first unless brief/vibe says otherwise."
    );
  }

  function shortSceneLabel() {
    if (!isMaaMode()) {
      if (isVeniceMode() && selectedCharacter) {
        return selectedCharacter.name || selectedCharacter.slug;
      }
      return "Custom chat";
    }
    const roles = getRpRoles();
    return "✓ " + roles.characterName + " · " + roles.botRole;
  }

  function parkSceneForm(where) {
    if (!sceneForm) return;
    sceneForm.hidden = false;
    if (where === "sidebar" && sidebarFormSlot) {
      sidebarFormSlot.appendChild(sceneForm);
    } else if (setupFormSlot) {
      setupFormSlot.appendChild(sceneForm);
    }
  }

  function openSetupModal() {
    parkSceneForm("modal");
    if (setupModal) {
      setupModal.classList.remove("hidden");
      setupModal.setAttribute("aria-hidden", "false");
    }
    closeSidebar();
    if (appShellEl) appShellEl.classList.remove("chat-ready");
  }

  function closeSetupModal() {
    if (setupModal) {
      setupModal.classList.add("hidden");
      setupModal.setAttribute("aria-hidden", "true");
    }
  }

  function openSidebar() {
    if (!setupLocked) {
      openSetupModal();
      return;
    }
    parkSceneForm("sidebar");
    if (sidebar) {
      sidebar.classList.remove("hidden");
      sidebar.setAttribute("aria-hidden", "false");
    }
  }

  function closeSidebar() {
    if (sidebar) {
      sidebar.classList.add("hidden");
      sidebar.setAttribute("aria-hidden", "true");
    }
  }

  function syncSceneUi() {
    if (setupLocked) {
      closeSetupModal();
      parkSceneForm("sidebar");
      if (appShellEl) appShellEl.classList.add("chat-ready");
    } else {
      openSetupModal();
    }
    updateSetupStatus();
  }

  /** How the AI character naturally addresses the user */
  function userAddressName(userRole) {
    const r = String(userRole || "")
      .toLowerCase()
      .trim();
    const map = {
      beta: "beta",
      son: "beta",
      beti: "beti",
      bhatija: "bhatija",
      bhanja: "bhanja",
      bhanji: "bhanji",
      pota: "pota",
      poti: "poti",
      brother: "bhai",
      sister: "didi",
      devar: "devar",
      jeth: "jeth",
      nanad: "nanad",
      bhabhi: "bhabhi",
      bahu: "bahu",
      jamai: "jamai",
      sala: "sala",
      sali: "sali",
      boyfriend: "jaan",
      girlfriend: "jaan",
      husband: "ji",
      wife: "ji",
      friend: "yaar",
    };
    if (map[r]) return map[r];
    if (r && r !== "custom") return r;
    return "jaan";
  }

  function buildRoleOpener(roles) {
    const name = roles.characterName || "Chat";
    const you = userAddressName(roles.userRole);
    const bot = String(roles.botRole || "").toLowerCase();
    if (roleIsClient(bot, "dad", "papa", "father")) {
      return (
        name +
        ": Hello meri " +
        you +
        "... Papa yahan hai. Bol, kya haal hai? 💕"
      );
    }
    if (roleIsClient(bot, "mom", "mummy", "maa", "mother")) {
      return (
        name +
        ": Hello " +
        you +
        "... Mummy yahan hai. Bol, kya haal hai? 💕"
      );
    }
    if (roleIsClient(bot, "sasur")) {
      return (
        name +
        ": Hello bahu... aao. Mujhe Papa ji bolna — samjhi? Bol, kya haal hai? 💕"
      );
    }
    if (roleIsClient(bot, "saas")) {
      return (
        name +
        ": Hello bahu... aao. Mujhe Mummy ji bolna — samjhi? Bol, kya haal hai? 💕"
      );
    }
    if (roleIsClient(bot, "bahu")) {
      return (
        name +
        ": Hello Papa ji... bahu yahan hai. Bolie, kya haal hai? 💕"
      );
    }
    if (roleIsClient(bot, "nani")) {
      return name + ": Hello " + you + "... Nani yahan hai. Bol, kya haal hai? 💕";
    }
    if (roleIsClient(bot, "dadi")) {
      return name + ": Hello " + you + "... Dadi yahan hai. Bol, kya haal hai? 💕";
    }
    if (roleIsClient(bot, "mausi", "maushi")) {
      return name + ": Hello " + you + "... Mausi yahan hai. Bol, kya haal hai? 💕";
    }
    if (roleIsClient(bot, "bua")) {
      return name + ": Hello " + you + "... Bua yahan hai. Bol, kya haal hai? 💕";
    }
    return (
      name +
      ": Hello " +
      you +
      "... main yahan hu. Bol, kya haal hai? 💕"
    );
  }

  function beginChatFromSetup() {
    if (isVeniceMode() && !selectedCharacter) {
      if (rpSetupStatus) {
        rpSetupStatus.textContent = "Select a Venice character first.";
      }
      return;
    }
    rpSetup = buildRpSetupText();
    setupLocked = true;
    syncTitle();
    closeSetupModal();
    parkSceneForm("sidebar");
    closeSidebar();
    if (appShellEl) appShellEl.classList.add("chat-ready");

    history = [];
    messagesEl.innerHTML = "";
    const roles = getRpRoles();
    const opener = buildRoleOpener(roles);
    addBubble(opener, "incoming");
    history.push({ role: "assistant", content: opener });
    history.push({
      role: "assistant",
      content: "Setup locked for this chat: " + rpSetup,
    });
    scheduleSaveChatSession();
    maybeShowWelcomeTip();
    input.focus();
  }

  function updateSetupStatus() {
    if (!rpSetupStatus) return;
    if (setupLocked) {
      rpSetupStatus.textContent = "Live. Edit in sidebar · New chat to reset.";
    } else {
      rpSetupStatus.textContent =
        "Choose who the AI is, optional note → Start. Place stays in your control in chat.";
    }
  }

  function starterMessage() {
    if (isMaaMode()) {
      const roles = getRpRoles();
      return (
        roles.characterName +
        ": Roles locked. Send your first message when ready. 💕"
      );
    }
    if (isVeniceMode()) {
      if (!selectedCharacter) {
        return "Select a Venice character first (search), then send a message.";
      }
      return (
        "Hey! Main " +
        (selectedCharacter.name || selectedCharacter.slug) +
        " hoon. Bol, kya baat karni hai?"
      );
    }
    const mode = chatModeEl.value;
    if (mode === "lust") {
      return "Beta... mummy ready hai. Jab chahe pass aa jaana.";
    }
    if (mode === "flirty") {
      return "Arre beta, aaj mummy ko thoda yaad aa raha tha tu... din kaisa gaya?";
    }
    return "Haan beta, mummy yahin hai. Bol, kya haal hai?";
  }

  function resetChat() {
    history = [];
    messagesEl.innerHTML = "";
    setupLocked = false;
    rpSetup = "";
    clearSavedChatSession();
    syncTitle();
    openSetupModal();
    updateSetupStatus();
    input.focus();
  }

  async function loadCharacters() {
    if (!charSearchEl || !characterSelect) return;
    const q = (charSearchEl.value || "").trim();
    if (charInfo) charInfo.textContent = "Loading characters...";
    characterSelect.innerHTML = '<option value="">Loading...</option>';

    try {
      const params = new URLSearchParams({
        limit: "40",
        sortBy: "highlyRated",
      });
      if (q) params.set("search", q);
      if (charAdultEl && charAdultEl.checked) params.set("isAdult", "true");

      const res = await fetch("/api/characters?" + params.toString(), {
        headers: authHeaders(false),
      });
      const data = await res.json();
      if (!res.ok) {
        characterSelect.innerHTML = '<option value="">Failed</option>';
        if (charInfo) charInfo.textContent = data.error || "Character list failed";
        return;
      }

      const list = data.data || [];
      characterSelect.innerHTML = "";
      if (!list.length) {
        characterSelect.innerHTML = '<option value="">No characters found</option>';
        if (charInfo) {
          charInfo.textContent = "No characters found. Try another search.";
        }
        return;
      }

      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "Select a Venice character...";
      characterSelect.appendChild(placeholder);

      list.forEach(function (c) {
        const opt = document.createElement("option");
        opt.value = c.slug;
        opt.textContent =
          c.name + (c.adult ? " 🔞" : "") + " (" + c.slug + ")";
        opt.dataset.name = c.name || c.slug;
        opt.dataset.model = c.modelId || "";
        opt.dataset.desc = c.description || "";
        characterSelect.appendChild(opt);
      });

      if (charInfo) {
        charInfo.textContent =
          list.length + " characters loaded. Select one to chat.";
      }
    } catch (e) {
      characterSelect.innerHTML = '<option value="">Error</option>';
      if (charInfo) {
        charInfo.textContent = "Network error while loading characters.";
      }
    }
  }

  function onCharacterPicked() {
    const opt = characterSelect.selectedOptions[0];
    if (!opt || !opt.value) {
      selectedCharacter = null;
      if (charInfo) {
        charInfo.textContent = "Pick a Venice character — persona runs automatically.";
      }
      resetChat();
      return;
    }
    selectedCharacter = {
      slug: opt.value,
      name: opt.dataset.name || opt.value,
      modelId: opt.dataset.model || "",
      description: opt.dataset.desc || "",
    };
    if (charInfo) {
      charInfo.textContent =
        (selectedCharacter.description || selectedCharacter.name).slice(0, 140) +
        " | slug: " +
        selectedCharacter.slug;
    }
    resetChat();
  }

  async function sendChat(text) {
    if (!setupLocked) {
      addBubble("Finish setup first — tap Start chat.", "error");
      openSetupModal();
      return;
    }

    if (isVeniceMode() && !selectedCharacter) {
      addBubble("Select a Venice character first.", "error");
      return;
    }

    await ensureHoursCounting();

    addBubble(text, "outgoing");
    history.push({ role: "user", content: text });
    setBusy(true, "typing...");
    showTyping();

    const t0 = Date.now();

    try {
      const body = {
        messages: history,
        language: languageEl.value,
        chatSource: source(),
      };

      if (isMaaMode()) {
        const roles = getRpRoles();
        body.chatMode = "maa";
        body.rpSetup = rpSetup;
        body.characterName = roles.characterName;
        body.botRole = roles.botRole;
        body.userRole = roles.userRole;
        body.botGender = roles.botGender;
        body.userGender = roles.userGender;
      } else if (isVeniceMode()) {
        body.characterSlug = selectedCharacter.slug;
        body.characterModel = selectedCharacter.modelId || "";
      } else {
        body.botRole = botRoleEl.value.trim() || "dost";
        body.userRole = userRoleEl.value.trim() || "dost";
        body.chatMode = chatModeEl.value;
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });

      const data = await res.json();
      hideTyping();

      if (!res.ok) {
        if (res.status === 401) {
          logout();
          return;
        }
        if (data.code === "NO_HOURS" || res.status === 402) {
          await handlePlanEnded(
            data.error ||
              "Time’s up. Scene paused — pay to continue this same chat."
          );
          return;
        }
        addBubble(data.error || "Something went wrong", "error");
        if (data.user) applyTimeFromResponse(data);
        return;
      }

      if (typeof data.hoursBalance === "number") applyTimeFromResponse(data);

      const workedMs = data.workedMs != null ? data.workedMs : Date.now() - t0;
      if (isMaaMode() || data.mode === "maa-agent") {
        addWorkedStatus(workedMs, data.steps || 2);
      }

      const reply = data.reply || "";
      history.push({ role: "assistant", content: reply });
      addBubble(reply, "incoming");
      scheduleSaveChatSession();
    } catch (e) {
      hideTyping();
      addBubble("Network issue — try again in a moment.", "error");
    } finally {
      setBusy(false);
      input.focus();
    }
  }

  chatSourceEl.addEventListener("change", function () {
    syncPanels();
    resetChat();
    if (isVeniceMode()) loadCharacters();
  });
  if (sceneEditBtn) {
    sceneEditBtn.addEventListener("click", openSidebar);
  }
  if (menuBtn) menuBtn.addEventListener("click", openSidebar);
  if (sidebarClose) sidebarClose.addEventListener("click", closeSidebar);
  if (sidebarBackdrop) sidebarBackdrop.addEventListener("click", closeSidebar);
  if (startChatBtn) startChatBtn.addEventListener("click", beginChatFromSetup);
  if (applySettingsBtn) {
    applySettingsBtn.addEventListener("click", function () {
      rpSetup = buildRpSetupText();
      syncTitle();
      closeSidebar();
      addBubble("Settings updated ✓", "incoming");
      history.push({ role: "assistant", content: "Settings updated ✓" });
      scheduleSaveChatSession();
    });
  }
  if (newChatBtn) {
    newChatBtn.addEventListener("click", function () {
      closeSidebar();
      resetChat();
    });
  }
  if (resetBtn) resetBtn.addEventListener("click", resetChat);
  languageEl.addEventListener("change", function () {
    if (!setupLocked) resetChat();
    else scheduleSaveChatSession();
  });
  if (chatModeEl) {
    chatModeEl.addEventListener("change", function () {
      if (!setupLocked) resetChat();
      else scheduleSaveChatSession();
    });
  }
  if (botRoleEl) {
    botRoleEl.addEventListener("change", function () {
      if (!setupLocked) resetChat();
    });
  }
  if (userRoleEl) {
    userRoleEl.addEventListener("change", function () {
      if (!setupLocked) resetChat();
    });
  }
  [rpVibeEl, rpPaceEl, rpNoteEl, rpResistanceEl, charNameEl, rpBotRoleEl, rpUserRoleEl, rpCustomBot, rpCustomUser].forEach(function (el) {
    if (!el) return;
    el.addEventListener("change", function () {
      if (el === rpBotRoleEl) {
        // Force name + You are whenever AI role changes (Papa ≠ Mummy/beta).
        applySmartRoleDefaults(true);
        return;
      }
      syncCustomRoleFields();
      syncTitle();
      if (setupLocked && rpSetupStatus) {
        rpSetupStatus.textContent =
          "Sidebar → Save changes, or New chat for a full reset.";
        return;
      }
      updateSetupStatus();
    });
    el.addEventListener("input", function () {
      syncTitle();
      if (!setupLocked) updateSetupStatus();
    });
  });
  syncCustomRoleFields();
  applySmartRoleDefaults(true);
  if (charSearchBtn) charSearchBtn.addEventListener("click", loadCharacters);
  if (charSearchEl) {
    charSearchEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        loadCharacters();
      }
    });
  }
  if (characterSelect) {
    characterSelect.addEventListener("change", onCharacterPicked);
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    await sendChat(text);
  });

  function openPaySheet() {
    if (!billingPanel) return;
    billingPanel.classList.remove("hidden");
    billingPanel.setAttribute("aria-hidden", "false");
    var uid = displayUserId(currentUser);
    setUserChip(currentUser);
    if (billingUserEl) {
      billingUserEl.textContent =
        "User ID " +
        (uid || "—") +
        " · Left " +
        formatCountdown(remainingHoursNow());
    }
    if (payIdValueEl) payIdValueEl.textContent = uid || "—";
    if (payUploadBlock) payUploadBlock.classList.remove("hidden");
    if (payProofNav) payProofNav.classList.remove("hidden");
    goPayStep(1);
    refreshMe();
    loadBillingInfo().then(function () {
      loadMyPayments().then(function (list) {
        if (
          list &&
          list.some(function (p) {
            return p.status === "pending";
          })
        ) {
          if (payUploadBlock) payUploadBlock.classList.add("hidden");
          if (payProofNav) payProofNav.classList.add("hidden");
          goPayStep(3);
          startPayPoll();
        }
      });
    });
  }

  function closePaySheet() {
    if (!billingPanel) return;
    billingPanel.classList.add("hidden");
    billingPanel.setAttribute("aria-hidden", "true");
  }

  if (hoursBadge) {
    hoursBadge.style.cursor = "pointer";
    hoursBadge.addEventListener("click", openPaySheet);
  }

  if (billingToggle && billingPanel) {
    billingToggle.addEventListener("click", openPaySheet);
  }
  if (payCloseBtn) payCloseBtn.addEventListener("click", closePaySheet);
  if (payBackdrop) payBackdrop.addEventListener("click", closePaySheet);
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async function () {
      try {
        await fetch("/api/billing/pause", {
          method: "POST",
          headers: authHeaders(),
          body: "{}",
        });
      } catch (e) {}
      logout();
    });
  }
  if (submitPayBtn) submitPayBtn.addEventListener("click", submitPayment);

  if (payGoto2) {
    payGoto2.addEventListener("click", function () {
      goPayStep(2);
    });
  }
  if (payGoto3) {
    payGoto3.addEventListener("click", function () {
      goPayStep(3);
    });
  }
  if (payBack1) {
    payBack1.addEventListener("click", function () {
      goPayStep(1);
    });
  }
  if (payBack2) {
    payBack2.addEventListener("click", function () {
      if (payUploadBlock) payUploadBlock.classList.remove("hidden");
      if (payProofNav) payProofNav.classList.remove("hidden");
      goPayStep(2);
    });
  }

  if (copyUpiBtn) {
    copyUpiBtn.addEventListener("click", async function () {
      const text = (payCatalog.payment && payCatalog.payment.upiId) || "";
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        copyUpiBtn.textContent = "Copied";
        toast("UPI ID copied", "ok");
        setTimeout(function () {
          copyUpiBtn.textContent = "Copy";
        }, 1200);
      } catch (e) {
        copyUpiBtn.textContent = "Select & copy";
        toast("Copy failed — select UPI manually", "err");
      }
    });
  }

  if (copyPayDetailsBtn) {
    copyPayDetailsBtn.addEventListener("click", copyPayDetails);
  }
  if (payRefreshStatusBtn) {
    payRefreshStatusBtn.addEventListener("click", refreshPayStatus);
  }
  if (welcomeTipDismissBtn) {
    welcomeTipDismissBtn.addEventListener("click", dismissWelcomeTip);
  }

  if (payScreenshot) {
    payScreenshot.addEventListener("change", function () {
      const file = payScreenshot.files && payScreenshot.files[0];
      if (!file) {
        if (payPreview) payPreview.classList.add("hidden");
        if (payUploadText) payUploadText.textContent = "Tap to add screenshot";
        if (payUploadLabel) payUploadLabel.classList.remove("has-file");
        return;
      }
      if (payUploadText) payUploadText.textContent = file.name || "Screenshot selected";
      if (payUploadLabel) payUploadLabel.classList.add("has-file");
      if (payPreview) {
        const url = URL.createObjectURL(file);
        payPreview.src = url;
        payPreview.classList.remove("hidden");
      }
    });
  }

  if (tabLogin && tabRegister) {
    const authCardTitle = document.querySelector(".auth-card-title");
    const authSub = document.querySelector(".auth-sub");

    function showLoginTab(opts) {
      const o = opts || {};
      tabLogin.classList.add("active");
      tabRegister.classList.remove("active");
      loginForm.classList.remove("hidden");
      registerForm.classList.add("hidden");
      if (authCardTitle) authCardTitle.textContent = "Welcome back";
      if (authSub) {
        authSub.textContent =
          o.sub || "Login with your ID, or create a new one.";
      }
      if (o.userId != null && loginIdEl) loginIdEl.value = String(o.userId);
      if (o.clearPin && loginPinEl) loginPinEl.value = "";
      if (o.pin != null && loginPinEl) loginPinEl.value = String(o.pin);
      authError.textContent = o.error || "";
      if (o.focusPin && loginPinEl) {
        setTimeout(function () {
          loginPinEl.focus();
          loginPinEl.select();
        }, 50);
      }
    }

    tabLogin.addEventListener("click", function () {
      showLoginTab();
    });
    tabRegister.addEventListener("click", function () {
      tabRegister.classList.add("active");
      tabLogin.classList.remove("active");
      registerForm.classList.remove("hidden");
      loginForm.classList.add("hidden");
      if (authCardTitle) authCardTitle.textContent = "Create account";
      if (authSub) {
        authSub.textContent = "Get a unique 4-digit ID and start free trial.";
      }
      authError.textContent = "";
    });

    // Expose for register success handoff
    window.__showLoginTab = showLoginTab;
  }

  if (credsContinueLoginBtn) {
    credsContinueLoginBtn.addEventListener("click", function () {
      var id =
        (pendingNewCreds && pendingNewCreds.userId) ||
        (registerCredsIdEl && registerCredsIdEl.textContent) ||
        "";
      var pin =
        (pendingNewCreds && pendingNewCreds.pin) ||
        (registerCredsPinEl && registerCredsPinEl.textContent) ||
        "";
      if (typeof window.__showLoginTab === "function") {
        window.__showLoginTab({
          userId: id,
          pin: pin,
          focusPin: true,
          sub:
            "Your User ID is " +
            id +
            ". PIN is filled from this browser — tap Login.",
        });
      }
    });
  }

  if (copyNewIdBtn) {
    copyNewIdBtn.addEventListener("click", function () {
      copyText(
        (pendingNewCreds && pendingNewCreds.userId) ||
          (registerCredsIdEl && registerCredsIdEl.textContent),
        "User ID"
      );
    });
  }
  if (copyNewPinBtn) {
    copyNewPinBtn.addEventListener("click", function () {
      copyText(
        (pendingNewCreds && pendingNewCreds.pin) ||
          (registerCredsPinEl && registerCredsPinEl.textContent),
        "PIN"
      );
    });
  }
  if (forgetSavedLoginBtn) {
    forgetSavedLoginBtn.addEventListener("click", function () {
      clearSavedCredentials();
      if (loginIdEl) loginIdEl.value = "";
      if (loginPinEl) loginPinEl.value = "";
      toast("Saved login cleared on this browser", "ok");
    });
  }
  if (userIdChip) {
    userIdChip.addEventListener("click", function () {
      copyText(displayUserId(currentUser), "User ID");
    });
  }
  if (copySidebarIdBtn) {
    copySidebarIdBtn.addEventListener("click", function () {
      copyText(displayUserId(currentUser), "User ID");
    });
  }
  if (copyPayIdBtn) {
    copyPayIdBtn.addEventListener("click", function () {
      copyText(displayUserId(currentUser), "User ID");
    });
  }

  if (loginBtn) {
    loginBtn.addEventListener("click", async function () {
      authError.textContent = "";
      const userId = loginIdEl ? loginIdEl.value.trim() : "";
      const pin = loginPinEl ? loginPinEl.value.trim() : "";
      if (!userId) {
        authError.textContent = "Enter your User ID.";
        return;
      }
      if (!pin) {
        authError.textContent = "Enter your PIN.";
        if (loginPinEl) loginPinEl.focus();
        return;
      }
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: userId,
            pin: pin,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          authError.textContent = data.error || "Login failed";
          return;
        }
        // Admin ID + password → open admin panel (separate from chat users)
        if (data.role === "admin" && data.token) {
          localStorage.setItem("adminToken", data.token);
          localStorage.removeItem("userToken");
          window.location.href = "/admin.html";
          return;
        }
        authToken = data.token;
        localStorage.setItem("userToken", authToken);
        localStorage.removeItem("adminToken");
        currentUser = data.user;
        if (currentUser && currentUser.userId) {
          localStorage.setItem("userId", currentUser.userId);
        }
        if (!loginRememberEl || loginRememberEl.checked) {
          saveCredentials(
            (currentUser && currentUser.userId) || userId,
            pin
          );
        }
        setHoursBadge(currentUser);
        setUserChip(currentUser);
        await showApp();
        syncPanels();
        const restored = await restoreChatSession();
        if (!restored) {
          resetChat();
        }
        updateSetupStatus();
        await loadBillingInfo();
        toast("Logged in · ID " + ((currentUser && currentUser.userId) || userId), "ok");
      } catch (e) {
        authError.textContent = "Network error";
      }
    });
  }

  if (loginPinEl) {
    loginPinEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && loginBtn) loginBtn.click();
    });
  }
  if (loginIdEl) {
    loginIdEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && loginPinEl) loginPinEl.focus();
    });
  }

  function digitsOnlyInput(el) {
    if (!el) return;
    el.addEventListener("input", function () {
      el.value = el.value.replace(/\D/g, "").slice(0, 4);
    });
  }
  digitsOnlyInput(registerPinEl);
  digitsOnlyInput(registerPinConfirmEl);
  // login ID/PIN: allow admin credentials (letters / longer password)

  if (registerBtn) {
    registerBtn.addEventListener("click", async function () {
      authError.textContent = "";
      const dob = getRegisterDob();
      if (!dob) {
        authError.textContent = "Please complete date of birth (day / month / year).";
        return;
      }
      if (registerAgeConfirm && !registerAgeConfirm.checked) {
        authError.textContent = "Please tick the 18+ confirmation checkbox.";
        return;
      }
      const pin = registerPinEl ? String(registerPinEl.value || "").trim() : "";
      const pin2 = registerPinConfirmEl
        ? String(registerPinConfirmEl.value || "").trim()
        : "";
      if (!/^\d{4}$/.test(pin)) {
        authError.textContent = "PIN must be exactly 4 digits.";
        return;
      }
      if (pin !== pin2) {
        authError.textContent = "PIN and Confirm PIN do not match.";
        return;
      }
      // Client-side age check (server also enforces)
      const parts = dob.split("-").map(Number);
      if (parts.length === 3) {
        const now = new Date();
        let age = now.getFullYear() - parts[0];
        const hadBday =
          now.getMonth() + 1 > parts[1] ||
          (now.getMonth() + 1 === parts[1] && now.getDate() >= parts[2]);
        if (!hadBday) age -= 1;
        if (age < 18) {
          authError.textContent =
            "You must be 18 or older to create an account.";
          return;
        }
      }
      registerBtn.disabled = true;
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deviceId: getDeviceId(),
            dateOfBirth: dob,
            pin: pin,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          authError.textContent = data.error || "Register failed";
          if (data.existingUserId && typeof window.__showLoginTab === "function") {
            window.__showLoginTab({
              userId: data.existingUserId,
              clearPin: true,
              focusPin: true,
              sub: "This device already has an ID — enter your PIN to login.",
              error: data.error || "Register failed",
            });
          }
          return;
        }
        if (registerResult) {
          registerResult.classList.add("hidden");
          registerResult.textContent = "";
        }
        showRegisterCreds(data.userId, pin);
        if (loginIdEl) loginIdEl.value = data.userId;
        if (loginPinEl) loginPinEl.value = pin;
        toast("ID " + data.userId + " created · saved on this browser", "ok");
      } catch (e) {
        authError.textContent = "Network error";
      } finally {
        registerBtn.disabled = false;
      }
    });
  }

  (async function boot() {
    if (jumpLatestBtn) {
      jumpLatestBtn.addEventListener("click", function () {
        scrollMessagesToEnd(true);
      });
    }
    if (messagesEl) {
      messagesEl.addEventListener("scroll", updateJumpLatest, { passive: true });
    }
    if (soundToggle) {
      soundToggle.addEventListener("change", function () {
        soundEnabled = !!soundToggle.checked;
        localStorage.setItem("chatSoundOn", soundEnabled ? "1" : "0");
        toast(soundEnabled ? "Sound on" : "Sound off", "ok");
      });
    }
    /* Lock layout to live visual viewport (stops mobile rubber-band / keyboard jump) */
    function syncAppViewport() {
      var h =
        window.visualViewport && window.visualViewport.height
          ? window.visualViewport.height
          : window.innerHeight;
      document.documentElement.style.setProperty(
        "--app-height",
        Math.round(h) + "px"
      );
      if (appShell) {
        var offsetTop =
          window.visualViewport && typeof window.visualViewport.offsetTop === "number"
            ? window.visualViewport.offsetTop
            : 0;
        if (window.matchMedia("(max-width: 560px)").matches) {
          appShell.style.top = offsetTop + "px";
        } else {
          appShell.style.top = "";
        }
      }
      if (isNearBottom()) scrollMessagesToEnd(true);
    }
    syncAppViewport();
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", syncAppViewport);
      window.visualViewport.addEventListener("scroll", syncAppViewport);
    }
    window.addEventListener("resize", syncAppViewport);
    window.addEventListener("orientationchange", function () {
      setTimeout(syncAppViewport, 80);
    });
    if (input) {
      input.addEventListener("focus", function () {
        setTimeout(function () {
          syncAppViewport();
          scrollMessagesToEnd(true);
        }, 120);
      });
      input.addEventListener("blur", function () {
        setTimeout(syncAppViewport, 120);
      });
    }

    if (authToken) {
      const ok = await refreshMe();
      if (ok) {
        await showApp();
        syncPanels();
        const restored = await restoreChatSession();
        if (!restored) {
          // Only open setup when they still have time and no saved scene
          if (remainingHoursNow() > 0.0001) {
            resetChat();
          } else {
            closeSetupModal();
            openPaySheet();
            toast("Time over · Pay to unlock chat", "err");
          }
        }
        updateSetupStatus();
        return;
      }
    }
    try {
      var legacyId = localStorage.getItem("userId");
      if (legacyId && !localStorage.getItem(SAVED_ID_KEY)) {
        localStorage.setItem(SAVED_ID_KEY, legacyId);
      }
    } catch (e) {}
    showAuth();
    prefillLoginFromSaved();
  })();
})();
