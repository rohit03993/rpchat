(function () {
  const loginScreen = document.getElementById("login-screen");
  const dash = document.getElementById("dash");
  const topBar = document.getElementById("top-bar");
  const passEl = document.getElementById("admin-pass");
  const adminIdEl = document.getElementById("admin-id");
  const loginBtn = document.getElementById("admin-login-btn");
  const loginMsg = document.getElementById("login-msg");
  const logoutBtn = document.getElementById("logout-btn");
  const paymentsEl = document.getElementById("payments");
  const usersEl = document.getElementById("users");
  const usersCount = document.getElementById("users-count");
  const statusFilter = document.getElementById("status-filter");
  const paySearch = document.getElementById("pay-search");
  const paymentsCount = document.getElementById("payments-count");
  const userFilter = document.getElementById("user-filter");
  const refreshBtn = document.getElementById("refresh-btn");
  const refreshUsersBtn = document.getElementById("refresh-users-btn");
  const tabUsers = document.getElementById("tab-users");
  const tabPayments = document.getElementById("tab-payments");
  const tabSupport = document.getElementById("tab-support");
  const tabReports = document.getElementById("tab-reports");
  const tabNotices = document.getElementById("tab-notices");
  const tabPaySetup = document.getElementById("tab-pay-setup");
  const usersView = document.getElementById("users-view");
  const paymentsView = document.getElementById("payments-view");
  const noticesView = document.getElementById("notices-view");
  const noticesList = document.getElementById("notices-list");
  const noticesCount = document.getElementById("notices-count");
  const noticeUserIdEl = document.getElementById("notice-user-id");
  const noticeTextEl = document.getElementById("notice-text");
  const noticeSendBtn = document.getElementById("notice-send-btn");
  const refreshNoticesBtn = document.getElementById("refresh-notices-btn");
  const supportView = document.getElementById("support-view");
  const reportsView = document.getElementById("reports-view");
  const paySetupView = document.getElementById("pay-setup-view");
  const supportThreadList = document.getElementById("support-thread-list");
  const supportThreadTitle = document.getElementById("support-thread-title");
  const supportThreadMeta = document.getElementById("support-thread-meta");
  const supportAdminMessages = document.getElementById("support-admin-messages");
  const supportAdminCompose = document.getElementById("support-admin-compose");
  const supportAdminInput = document.getElementById("support-admin-input");
  const supportAdminSend = document.getElementById("support-admin-send");
  const supportCloseThreadBtn = document.getElementById("support-close-thread-btn");
  const supportBackBtn = document.getElementById("support-back-btn");
  const supportCount = document.getElementById("support-count");
  const refreshSupportBtn = document.getElementById("refresh-support-btn");
  let supportThreadsCache = [];
  let openSupportUserId = "";
  let supportPollId = null;

  function setSupportMobileMode(mode) {
    if (!supportView) return;
    supportView.classList.toggle("is-thread", mode === "thread");
    if (supportBackBtn) {
      supportBackBtn.classList.toggle("hidden", mode !== "thread");
    }
  }

  function closeSupportThreadView() {
    openSupportUserId = "";
    setSupportMobileMode("list");
    if (supportThreadTitle) supportThreadTitle.textContent = "Select a user";
    if (supportThreadMeta) supportThreadMeta.textContent = "";
    if (supportCloseThreadBtn) supportCloseThreadBtn.classList.add("hidden");
    if (supportAdminCompose) supportAdminCompose.classList.add("hidden");
    if (supportAdminMessages) {
      supportAdminMessages.innerHTML =
        "<div class='empty'>Pick a support thread from the list.</div>";
    }
    renderSupportThreadList(supportThreadsCache);
  }
  const reportsList = document.getElementById("reports-list");
  const reportsCount = document.getElementById("reports-count");
  const downloadReportsBtn = document.getElementById("download-reports-btn");
  const clearReportsBtn = document.getElementById("clear-reports-btn");
  const refreshReportsBtn = document.getElementById("refresh-reports-btn");
  let reportsCache = [];
  const statUsers = document.getElementById("stat-users");
  const statPending = document.getElementById("stat-pending");
  const statHours = document.getElementById("stat-hours");
  const statMoney = document.getElementById("stat-money");
  const statPaid = document.getElementById("stat-paid");
  const statActive = document.getElementById("stat-active");
  const statHoursSold = document.getElementById("stat-hours-sold");
  const statMsgs = document.getElementById("stat-msgs");
  const statReports = document.getElementById("stat-reports");
  const statToday = document.getElementById("stat-today");
  const userSearch = document.getElementById("user-search");
  const chatDrawer = document.getElementById("chat-drawer");
  const chatDrawerTitle = document.getElementById("chat-drawer-title");
  const chatDrawerMeta = document.getElementById("chat-drawer-meta");
  const chatDrawerBody = document.getElementById("chat-drawer-body");
  const chatSessionTabs = document.getElementById("chat-session-tabs");
  const chatDeleteBtn = document.getElementById("chat-delete-btn");
  const purgeOldChatsBtn = document.getElementById("purge-old-chats-btn");
  let openChatUserId = "";
  const setUpiId = document.getElementById("set-upi-id");
  const setUpiName = document.getElementById("set-upi-name");
  const setQrPreview = document.getElementById("set-qr-preview");
  const setQrFile = document.getElementById("set-qr-file");
  const setQrUploadBtn = document.getElementById("set-qr-upload-btn");
  const setQrClearBtn = document.getElementById("set-qr-clear-btn");
  const setQrMsg = document.getElementById("set-qr-msg");
  const setPackages = document.getElementById("set-packages");
  const setPkgAdd = document.getElementById("set-pkg-add");
  const setSaveBtn = document.getElementById("set-save-btn");
  const setSaveMsg = document.getElementById("set-save-msg");

  let token = localStorage.getItem("adminToken") || "";
  let usersCache = [];
  let paymentsCache = [];
  let pendingQrBase64 = null;

  function toast(message, type) {
    let host = document.getElementById("toast-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "toast-host";
      document.body.appendChild(host);
    }
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

  function authHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    };
  }

  function setMsg(text, type) {
    loginMsg.textContent = text || "";
    loginMsg.className = "msg" + (type ? " " + type : "");
  }

  function showLogin() {
    loginScreen.classList.remove("hidden");
    dash.classList.add("hidden");
    topBar.classList.add("hidden");
  }

  function showDash() {
    loginScreen.classList.add("hidden");
    dash.classList.remove("hidden");
    topBar.classList.remove("hidden");
  }

  function logout() {
    token = "";
    localStorage.removeItem("adminToken");
    showLogin();
    setMsg("Logged out.", "ok");
  }

  function hideAllTabs() {
    tabUsers.classList.remove("active");
    tabPayments.classList.remove("active");
    if (tabSupport) tabSupport.classList.remove("active");
    if (tabNotices) tabNotices.classList.remove("active");
    if (tabReports) tabReports.classList.remove("active");
    if (tabPaySetup) tabPaySetup.classList.remove("active");
    usersView.classList.add("hidden");
    paymentsView.classList.add("hidden");
    if (noticesView) noticesView.classList.add("hidden");
    if (supportView) supportView.classList.add("hidden");
    if (reportsView) reportsView.classList.add("hidden");
    if (paySetupView) paySetupView.classList.add("hidden");
    if (supportPollId) {
      clearInterval(supportPollId);
      supportPollId = null;
    }
  }

  function showUsersTab() {
    hideAllTabs();
    tabUsers.classList.add("active");
    usersView.classList.remove("hidden");
  }

  function showPaymentsTab() {
    hideAllTabs();
    tabPayments.classList.add("active");
    paymentsView.classList.remove("hidden");
  }

  function showNoticesTab() {
    hideAllTabs();
    if (tabNotices) tabNotices.classList.add("active");
    if (noticesView) noticesView.classList.remove("hidden");
    loadNotices();
  }

  function showSupportTab() {
    hideAllTabs();
    if (tabSupport) tabSupport.classList.add("active");
    if (supportView) supportView.classList.remove("hidden");
    setSupportMobileMode(openSupportUserId ? "thread" : "list");
    loadSupportThreads();
    if (supportPollId) clearInterval(supportPollId);
    supportPollId = setInterval(function () {
      if (document.hidden) return;
      if (!supportView || supportView.classList.contains("hidden")) return;
      loadSupportThreads(true);
      if (openSupportUserId) openSupportThread(openSupportUserId, true);
    }, 15000);
  }

  function showReportsTab() {
    hideAllTabs();
    if (tabReports) tabReports.classList.add("active");
    if (reportsView) reportsView.classList.remove("hidden");
    loadReports();
  }

  function showPaySetupTab() {
    hideAllTabs();
    if (tabPaySetup) tabPaySetup.classList.add("active");
    if (paySetupView) paySetupView.classList.remove("hidden");
    loadPaySettings();
  }

  function renderPackageEditor(packages) {
    if (!setPackages) return;
    const list = packages && packages.length ? packages : [];
    if (!list.length) {
      setPackages.innerHTML =
        "<div class='empty'>No packs yet. Tap + Add pack.</div>";
      return;
    }
    setPackages.innerHTML = list
      .map(function (p, i) {
        const sell = p.priceInr != null ? p.priceInr : "";
        const listP =
          p.listPriceInr != null ? p.listPriceInr : p.priceInr != null ? p.priceInr : "";
        return (
          '<article class="pkg-card" data-i="' +
          i +
          '">' +
          '<div class="pkg-card-head">' +
          "<strong>Pack " +
          (i + 1) +
          "</strong>" +
          '<button type="button" class="btn-danger btn-sm" data-del-pkg="' +
          i +
          '">Delete</button>' +
          "</div>" +
          '<label class="pkg-field"><span>Name (shown to user)</span>' +
          '<input data-f="label" type="text" value="' +
          String(p.label || "").replace(/"/g, "&quot;") +
          '" placeholder="e.g. 1 Hour" /></label>' +
          '<div class="pkg-field-row">' +
          '<label class="pkg-field"><span>Hours</span>' +
          '<input data-f="hours" type="number" min="0.1" step="0.1" inputmode="decimal" value="' +
          p.hours +
          '" /></label>' +
          '<label class="pkg-field"><span>Sell price ₹</span>' +
          '<input data-f="priceInr" type="number" min="0" step="1" inputmode="numeric" value="' +
          sell +
          '" /></label>' +
          "</div>" +
          '<div class="pkg-field-row">' +
          '<label class="pkg-field"><span>Old / list price ₹</span>' +
          '<input data-f="listPriceInr" type="number" min="0" step="1" inputmode="numeric" value="' +
          listP +
          '" /></label>' +
          '<label class="pkg-field"><span>Badge text</span>' +
          '<input data-f="badge" type="text" value="' +
          String(p.badge || "").replace(/"/g, "&quot;") +
          '" placeholder="e.g. Save 8%" /></label>' +
          "</div>" +
          '<label class="pkg-pop">' +
          '<input data-f="popular" type="checkbox" ' +
          (p.popular ? "checked" : "") +
          "/> Mark as Popular</label>" +
          '<input data-f="id" type="hidden" value="' +
          String(p.id || "").replace(/"/g, "&quot;") +
          '" />' +
          "</article>"
        );
      })
      .join("");
  }

  function collectPackagesFromEditor() {
    const rows = setPackages
      ? setPackages.querySelectorAll(".pkg-card, .pkg-row")
      : [];
    const out = [];
    rows.forEach(function (row) {
      const get = function (f) {
        return row.querySelector('[data-f="' + f + '"]');
      };
      const idEl = get("id");
      const labelEl = get("label");
      const hoursEl = get("hours");
      const priceEl = get("priceInr");
      const listEl = get("listPriceInr");
      const badgeEl = get("badge");
      const popEl = get("popular");
      if (!labelEl || !hoursEl || !priceEl) return;
      out.push({
        id: idEl ? idEl.value : "",
        label: labelEl.value,
        hours: Number(hoursEl.value),
        priceInr: Number(priceEl.value),
        listPriceInr: Number(listEl ? listEl.value : priceEl.value),
        badge: badgeEl ? badgeEl.value : "",
        popular: popEl ? popEl.checked : false,
      });
    });
    return out;
  }

  async function loadPaySettings() {
    if (!paySetupView) return;
    try {
      const res = await fetch("/api/admin/settings", { headers: authHeaders() });
      const data = await res.json().catch(function () {
        return {};
      });
      if (!res.ok) {
        if (handleAuthFail(res)) return;
        toast(data.error || "Failed to load settings", "err");
        return;
      }
      const s = data.settings || {};
      if (setUpiId) setUpiId.value = s.upiId || "";
      if (setUpiName) setUpiName.value = s.upiName || "";
      if (setQrPreview) {
        setQrPreview.src = s.qrImageUrl || "/upi-qr.svg";
      }
      pendingQrBase64 = null;
      renderPackageEditor(s.packages || []);
    } catch (e) {
      toast("Network error loading settings", "err");
    }
  }

  function handleAuthFail(res) {
    if (res.status !== 401) return false;
    logout();
    setMsg("Session expired. Login again.", "err");
    return true;
  }

  async function login() {
    const adminId = String((adminIdEl && adminIdEl.value) || "").trim();
    const password = String(passEl.value || "").trim();
    if (!adminId || !password) {
      setMsg("Admin ID aur password dono likho.", "err");
      return;
    }
    loginBtn.disabled = true;
    setMsg("Checking...", "");
    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: adminId, password: password }),
      });
      const data = await res.json().catch(function () {
        return {};
      });
      if (!res.ok) {
        setMsg(data.error || "Wrong ID or password", "err");
        return;
      }
      if (!data.token) {
        setMsg("Login failed (no token).", "err");
        return;
      }
      token = data.token;
      localStorage.setItem("adminToken", token);
      passEl.value = "";
      setMsg("");
      showDash();
      await refreshAll();
    } catch (e) {
      setMsg("Network error — is server running?", "err");
    } finally {
      loginBtn.disabled = false;
    }
  }

  function updateStats(users, allPayments, analytics) {
    const a = analytics || {};
    const list = users || [];
    const pays = allPayments || [];
    if (statUsers) {
      statUsers.textContent = String(
        a.usersTotal != null ? a.usersTotal : list.length
      );
    }
    if (statPending) {
      statPending.textContent = String(
        a.paymentsPending != null
          ? a.paymentsPending
          : pays.filter(function (p) {
              return p.status === "pending";
            }).length
      );
    }
    if (statHours) {
      const hours =
        a.hoursLive != null
          ? a.hoursLive
          : list.reduce(function (sum, u) {
              return sum + Number(u.hoursBalance || 0);
            }, 0);
      statHours.textContent = Number(hours).toFixed(1);
    }
    if (statMoney) {
      const collected =
        a.moneyInr != null
          ? a.moneyInr
          : pays
              .filter(function (p) {
                return p.status === "approved";
              })
              .reduce(function (sum, p) {
                return sum + Number(p.amountInr || 0);
              }, 0);
      statMoney.textContent =
        "₹" + Math.round(collected).toLocaleString("en-IN");
    }
    if (statPaid) {
      statPaid.textContent = String(
        a.paidUsers != null
          ? a.paidUsers
          : list.filter(function (u) {
              return u.hasPaid;
            }).length
      );
    }
    if (statActive) {
      statActive.textContent = String(
        a.sessionActive != null
          ? a.sessionActive
          : list.filter(function (u) {
              return u.sessionActive;
            }).length
      );
    }
    if (statHoursSold) {
      statHoursSold.textContent = String(
        a.hoursSold != null ? a.hoursSold : "—"
      );
    }
    if (statMsgs) {
      statMsgs.textContent = String(
        a.chatMessages != null
          ? a.chatMessages.toLocaleString("en-IN")
          : list.reduce(function (sum, u) {
              return sum + Number(u.chatMsgCount || 0);
            }, 0)
      );
    }
    if (statReports) {
      statReports.textContent = String(a.aiReports != null ? a.aiReports : "—");
    }
    if (statToday) {
      statToday.textContent = String(a.usersToday != null ? a.usersToday : "—");
    }
  }

  async function loadAnalytics() {
    try {
      const res = await fetch("/api/admin/analytics", { headers: authHeaders() });
      const data = await res.json().catch(function () {
        return {};
      });
      if (!res.ok) {
        if (handleAuthFail(res)) return null;
        return null;
      }
      return data.analytics || null;
    } catch (e) {
      return null;
    }
  }
  function filterUsersList(list) {
    const q = String((userSearch && userSearch.value) || "")
      .trim()
      .toLowerCase();
    const f = (userFilter && userFilter.value) || "all";
    return list.filter(function (u) {
      if (f === "online" && !u.sessionActive) return false;
      if (f === "idle" && u.sessionActive) return false;
      if (f === "paid" && !u.hasPaid) return false;
      if (f === "unpaid" && u.hasPaid) return false;
      if (f === "has-time" && Number(u.hoursBalance || 0) <= 0.0001) return false;
      if (f === "no-time" && Number(u.hoursBalance || 0) > 0.0001) return false;
      if (!q) return true;
      const hay = [
        u.userId,
        u.pin,
        u.characterName,
        u.botRole,
        u.hasPaid ? "paid" : "unpaid",
        u.sessionActive ? "online" : "idle",
      ]
        .join(" ")
        .toLowerCase();
      return hay.indexOf(q) !== -1;
    });
  }

  function filterPaymentsList(list) {
    const status = (statusFilter && statusFilter.value) || "all";
    const q = String((paySearch && paySearch.value) || "")
      .trim()
      .toLowerCase();
    return list.filter(function (p) {
      if (status !== "all" && p.status !== status) return false;
      if (!q) return true;
      const hay = [
        p.userId,
        p.paymentId,
        p.packageId,
        p.upiNote,
        p.status,
        p.amountInr,
        p.hours,
      ]
        .join(" ")
        .toLowerCase();
      return hay.indexOf(q) !== -1;
    });
  }

  function formatClock(hoursBalance) {
    const totalSec = Math.max(0, Math.floor(Number(hoursBalance || 0) * 3600));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const pad = (n) => String(n).padStart(2, "0");
    if (h > 0) return h + ":" + pad(m) + ":" + pad(s);
    return m + ":" + pad(s);
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function closeChatDrawer() {
    if (!chatDrawer) return;
    chatDrawer.classList.add("hidden");
    chatDrawer.setAttribute("aria-hidden", "true");
    openChatUserId = "";
    if (chatDeleteBtn) chatDeleteBtn.classList.add("hidden");
    if (chatSessionTabs) {
      chatSessionTabs.classList.add("hidden");
      chatSessionTabs.innerHTML = "";
    }
  }

  function renderSessionMessages(session, source, keepDays) {
    if (!session || !Array.isArray(session.history) || !session.history.length) {
      chatDrawerMeta.textContent = "No saved chat yet for this user.";
      chatDrawerBody.innerHTML =
        "<div class='empty'>Empty — user has not chatted, or history was never saved.</div>";
      return;
    }

    const form = session.form || {};
    const char =
      form.characterName ||
      (session.selectedCharacter && session.selectedCharacter.name) ||
      "—";
    const role = form.botRole || "—";
    const when = session.updatedAt || session.archivedAt;
    chatDrawerMeta.textContent =
      (source === "archived" ? "Archived · " : "Live · ") +
      "Kept " +
      (keepDays || 5) +
      " days · Character: " +
      char +
      " · Role: " +
      role +
      (when ? " · " + new Date(when).toLocaleString() : "");

    const msgs = session.history.filter(function (m) {
      return (
        m &&
        m.content &&
        !/^Setup locked for this chat:/i.test(String(m.content))
      );
    });

    if (!msgs.length) {
      chatDrawerBody.innerHTML =
        "<div class='empty'>Only setup data — no dialogue yet.</div>";
      return;
    }

    chatDrawerBody.innerHTML = msgs
      .map(function (m) {
        const who = m.role === "user" ? "User" : "AI";
        const cls = m.role === "user" ? "user" : "ai";
        return (
          "<div class='chat-bubble " +
          cls +
          "'><span class='chat-who'>" +
          who +
          "</span><p>" +
          escapeHtml(m.content) +
          "</p></div>"
        );
      })
      .join("");
  }

  function renderChatSessions(sessions, keepDays) {
    if (!chatSessionTabs) return;
    if (!sessions || sessions.length <= 1) {
      chatSessionTabs.classList.add("hidden");
      chatSessionTabs.innerHTML = "";
      return;
    }
    chatSessionTabs.classList.remove("hidden");
    chatSessionTabs.innerHTML = sessions
      .map(function (item, idx) {
        const s = item.session || {};
        const when = s.updatedAt || s.archivedAt;
        const label =
          (item.source === "live" ? "Live" : "Old") +
          (when ? " · " + new Date(when).toLocaleString() : "") +
          " · #" +
          (idx + 1);
        return (
          "<button type='button' class='chat-session-tab" +
          (idx === 0 ? " active" : "") +
          "' data-session-idx='" +
          idx +
          "'>" +
          escapeHtml(label) +
          "</button>"
        );
      })
      .join("");

    chatSessionTabs.onclick = function (e) {
      const btn = e.target.closest("[data-session-idx]");
      if (!btn) return;
      const idx = Number(btn.getAttribute("data-session-idx"));
      const item = sessions[idx];
      if (!item) return;
      Array.prototype.forEach.call(
        chatSessionTabs.querySelectorAll(".chat-session-tab"),
        function (el) {
          el.classList.toggle(
            "active",
            el.getAttribute("data-session-idx") === String(idx)
          );
        }
      );
      renderSessionMessages(item.session, item.source, keepDays);
    };
  }

  async function openUserChat(userId) {
    if (!chatDrawer) return;
    openChatUserId = String(userId || "");
    chatDrawer.classList.remove("hidden");
    chatDrawer.setAttribute("aria-hidden", "false");
    chatDrawerTitle.textContent = "User " + userId;
    chatDrawerMeta.textContent = "Loading chat…";
    chatDrawerBody.innerHTML = "<p class='meta'>Loading…</p>";
    if (chatDeleteBtn) chatDeleteBtn.classList.remove("hidden");
    if (chatSessionTabs) {
      chatSessionTabs.classList.add("hidden");
      chatSessionTabs.innerHTML = "";
    }

    try {
      const res = await fetch(
        "/api/admin/users/" + encodeURIComponent(userId) + "/chat",
        { headers: authHeaders() }
      );
      const data = await res.json().catch(function () {
        return {};
      });
      if (!res.ok) {
        if (handleAuthFail(res)) return;
        chatDrawerMeta.textContent = "";
        chatDrawerBody.innerHTML =
          "<div class='empty'>" +
          escapeHtml(data.error || "Could not load chat") +
          "</div>";
        return;
      }

      const sessions =
        Array.isArray(data.sessions) && data.sessions.length
          ? data.sessions
          : data.session
            ? [{ source: data.source || "live", session: data.session }]
            : [];
      const keepDays = data.keepDays || 5;

      if (!sessions.length) {
        chatDrawerMeta.textContent = "No saved chat yet for this user.";
        chatDrawerBody.innerHTML =
          "<div class='empty'>Empty — user has not chatted, or history was never saved.</div>";
        return;
      }

      renderChatSessions(sessions, keepDays);
      renderSessionMessages(
        sessions[0].session,
        sessions[0].source,
        keepDays
      );
    } catch (e) {
      chatDrawerMeta.textContent = "";
      chatDrawerBody.innerHTML = "<div class='empty'>Network error</div>";
    }
  }

  function renderUsers(list) {
    const filtered = filterUsersList(list || []);

    usersCount.textContent = filtered.length + " shown · " + list.length + " total";

    if (!list.length) {
      usersEl.innerHTML =
        "<div class='empty'>No users yet.<br/>Open chat → New ID to create one.</div>";
      return;
    }
    if (!filtered.length) {
      usersEl.innerHTML = "<div class='empty'>No users match your search / filter.</div>";
      return;
    }

    const cards = filtered
      .map(function (u) {
        const clock = formatClock(u.hoursBalance);
        const chatLabel = u.chatMsgCount
          ? u.chatMsgCount +
            (u.chatSessionCount > 1 ? " / " + u.chatSessionCount + " chats" : "") +
            (u.chatArchived && !u.chatLive ? " (old)" : "")
          : "No chats";
        const scene =
          (u.characterName || "—") +
          (u.botRole ? " · " + u.botRole : "");
        const paidBadge = u.hasPaid
          ? "<span class='badge approved'>paid</span>"
          : "<span class='badge'>unpaid</span>";
        const onlineBadge =
          "<span class='badge " +
          (u.sessionActive ? "online" : "") +
          "'>" +
          (u.sessionActive ? "online" : "idle") +
          "</span>";
        const pays =
          "P " +
          (u.pendingPayments || 0) +
          " · A " +
          (u.approvedPayments || 0) +
          (u.rejectedPayments ? " · R " + u.rejectedPayments : "");

        return (
          "<article class='user-card" +
          (u.sessionActive ? " is-online" : "") +
          (Number(u.pendingPayments || 0) > 0 ? " has-pending" : "") +
          "'>" +
          "<div class='user-card-top'>" +
          "<button type='button' class='id-pill id-link' title='View chat' data-view-chat='" +
          escapeHtml(u.userId) +
          "'>" +
          escapeHtml(u.userId) +
          "</button>" +
          "<div class='user-card-badges'>" +
          onlineBadge +
          paidBadge +
          "</div>" +
          "</div>" +
          "<div class='user-card-main'>" +
          "<div class='user-card-time'>" +
          "<span class='user-card-clock'>" +
          clock +
          "</span>" +
          "<small>" +
          Number(u.hoursBalance || 0).toFixed(2) +
          "h left</small>" +
          "</div>" +
          "<div class='user-card-meta'>" +
          "<div><span class='uc-label'>PIN</span> <b class='pin-cell'>" +
          escapeHtml(u.pin || "—") +
          "</b></div>" +
          "<div><span class='uc-label'>Scene</span> " +
          escapeHtml(scene) +
          "</div>" +
          "<div><span class='uc-label'>Pays</span> " +
          pays +
          "</div>" +
          "<div><span class='uc-label'>Joined</span> " +
          new Date(u.createdAt).toLocaleString() +
          "</div>" +
          "</div>" +
          "</div>" +
          "<button type='button' class='user-card-chat' data-view-chat='" +
          escapeHtml(u.userId) +
          "'>" +
          "View chat · " +
          escapeHtml(chatLabel) +
          "</button>" +
          "<div class='user-card-actions'>" +
          "<button type='button' class='btn btn-sm' data-msg-user='" +
          escapeHtml(u.userId) +
          "'>Msg</button>" +
          "<button type='button' class='btn btn-sm' data-add-hours='" +
          escapeHtml(u.userId) +
          "'>+1h</button>" +
          "<button type='button' class='btn-ghost btn-sm' data-add-hours5='" +
          escapeHtml(u.userId) +
          "'>+5h</button>" +
          "<button type='button' class='btn-danger btn-sm' title='Set time to zero' data-clear-hours='" +
          escapeHtml(u.userId) +
          "'>Clear</button>" +
          "<button type='button' class='btn-ghost btn-sm' data-reset-pin='" +
          escapeHtml(u.userId) +
          "'>PIN</button>" +
          "<button type='button' class='btn-ghost btn-sm' data-delete-chats='" +
          escapeHtml(u.userId) +
          "'>Del chats</button>" +
          "<button type='button' class='btn-danger btn-sm' data-delete-user='" +
          escapeHtml(u.userId) +
          "'>Del</button>" +
          (u.isLegacy || u.needsFourDigit
            ? "<button type='button' class='btn btn-sm' data-migrate='" +
              escapeHtml(u.userId) +
              "'>→ 4-digit</button>"
            : "") +
          "</div>" +
          (Number(u.noticeUnread || 0) > 0
            ? "<p class='user-notice-flag unread'>Notice: Unseen (" +
              u.noticeUnread +
              ")</p>"
            : u.lastNoticeAt
              ? "<p class='user-notice-flag seen'>Last notice: Seen</p>"
              : "") +
          "</article>"
        );
      })
      .join("");

    usersEl.innerHTML = "<div class='users-cards'>" + cards + "</div>";
  }

  function renderPayments(list) {
    const filtered = filterPaymentsList(list || []);
    const approvedSum = (list || [])
      .filter(function (p) {
        return p.status === "approved";
      })
      .reduce(function (s, p) {
        return s + Number(p.amountInr || 0);
      }, 0);
    const filteredApproved = filtered
      .filter(function (p) {
        return p.status === "approved";
      })
      .reduce(function (s, p) {
        return s + Number(p.amountInr || 0);
      }, 0);

    if (paymentsCount) {
      paymentsCount.textContent =
        filtered.length + " shown · " + (list || []).length + " total";
    }
    const moneyLine = document.getElementById("pay-money-line");
    if (moneyLine) {
      moneyLine.textContent =
        "Collected (approved): ₹" +
        Math.round(approvedSum).toLocaleString("en-IN") +
        (statusFilter && statusFilter.value !== "all"
          ? " · This view approved: ₹" +
            Math.round(filteredApproved).toLocaleString("en-IN")
          : "");
    }

    if (!(list || []).length) {
      paymentsEl.innerHTML =
        "<div class='empty'>No payments yet.<br/>User: Chat → Pay → submit screenshot.</div>";
      return;
    }
    if (!filtered.length) {
      paymentsEl.innerHTML =
        "<div class='empty'>No payments match this search / status.</div>";
      return;
    }

    paymentsEl.innerHTML = "";
    filtered.forEach(function (p) {
      const card = document.createElement("article");
      card.className = "pay-card";
      card.innerHTML =
        "<div class='pay-card-head'>" +
        "<span class='id-pill'>" +
        escapeHtml(p.userId) +
        "</span>" +
        "<span class='badge " +
        escapeHtml(p.status) +
        "'>" +
        escapeHtml(p.status) +
        "</span>" +
        "</div>" +
        "<div class='pay-amount'>₹" +
        p.amountInr +
        "</div>" +
        "<div class='meta'>" +
        escapeHtml(p.packageId) +
        " · " +
        p.hours +
        "h<br/>" +
        escapeHtml(p.paymentId) +
        "<br/>Remark: <b>" +
        escapeHtml(p.upiNote || "—") +
        "</b><br/>" +
        new Date(p.createdAt).toLocaleString() +
        "</div>" +
        (p.screenshotUrl
          ? "<a href='" +
            escapeHtml(p.screenshotUrl) +
            "' target='_blank' rel='noopener'><img class='shot' src='" +
            escapeHtml(p.screenshotUrl) +
            "' alt='payment screenshot' /></a>"
          : "") +
        (p.status === "pending"
          ? "<div class='actions'>" +
            "<button type='button' class='btn btn-sm' data-approve='" +
            escapeHtml(p.paymentId) +
            "'>Approve · unlock hours</button>" +
            "<button type='button' class='btn-danger btn-sm' data-reject='" +
            escapeHtml(p.paymentId) +
            "'>Reject</button>" +
            "</div>"
          : p.rejectReason
            ? "<div class='meta'>Reason: " +
              escapeHtml(p.rejectReason) +
              "</div>"
            : "");
      paymentsEl.appendChild(card);
    });
  }

  async function loadUsers() {
    usersEl.innerHTML = "<p class='meta'>Loading users...</p>";
    try {
      const res = await fetch("/api/admin/users", { headers: authHeaders() });
      const data = await res.json().catch(function () {
        return {};
      });
      if (!res.ok) {
        if (handleAuthFail(res)) return [];
        usersEl.innerHTML =
          "<div class='empty'>" + (data.error || "Failed to load users") + "</div>";
        return [];
      }
      usersCache = data.users || [];
      renderUsers(usersCache);
      return usersCache;
    } catch (e) {
      usersEl.innerHTML = "<div class='empty'>Network error</div>";
      return [];
    }
  }

  async function loadPayments() {
    paymentsEl.innerHTML = "<p class='meta'>Loading payments...</p>";
    try {
      const res = await fetch("/api/admin/payments?status=all", {
        headers: authHeaders(),
      });
      const data = await res.json().catch(function () {
        return {};
      });
      if (!res.ok) {
        if (handleAuthFail(res)) return [];
        paymentsEl.innerHTML =
          "<div class='empty'>" + (data.error || "Failed") + "</div>";
        return [];
      }
      paymentsCache = data.payments || [];
      renderPayments(paymentsCache);
      return paymentsCache;
    } catch (e) {
      paymentsEl.innerHTML = "<div class='empty'>Network error</div>";
      return [];
    }
  }

  async function refreshAll() {
    const users = await loadUsers();
    const allPays = await loadPayments();
    const analytics = await loadAnalytics();
    updateStats(users, allPays, analytics);
  }

  async function adjustHours(userId, hours, mode) {
    const res = await fetch(
      "/api/admin/users/" + encodeURIComponent(userId) + "/hours",
      {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ hours: hours, mode: mode || "add" }),
      }
    );
    const data = await res.json().catch(function () {
      return {};
    });
    if (!res.ok) {
      if (handleAuthFail(res)) return;
      toast(data.error || "Failed", "err");
      return;
    }
    toast("Hours updated", "ok");
    await refreshAll();
  }

  usersEl.addEventListener("click", async function (e) {
    const t = e.target.closest
      ? e.target.closest(
          "[data-view-chat], [data-msg-user], [data-add-hours], [data-add-hours5], [data-clear-hours], [data-reset-pin], [data-migrate], [data-delete-chats], [data-delete-user]"
        )
      : e.target;
    if (!t) return;

    const viewChat = t.getAttribute("data-view-chat");
    if (viewChat) {
      openUserChat(viewChat);
      return;
    }
    const msgUser = t.getAttribute("data-msg-user");
    if (msgUser) {
      const text = prompt("Message / offer for User " + msgUser + ":");
      if (text == null) return;
      if (!String(text).trim()) {
        toast("Empty message", "err");
        return;
      }
      const res = await fetch("/api/admin/notices", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ userId: msgUser, text: String(text).trim() }),
      });
      const data = await res.json().catch(function () {
        return {};
      });
      if (!res.ok) toast(data.error || "Send failed", "err");
      else toast("Notice sent · waiting for Seen", "ok");
      await refreshAll();
      return;
    }
    if (t.getAttribute("data-add-hours")) {
      adjustHours(t.getAttribute("data-add-hours"), 1, "add");
    }
    if (t.getAttribute("data-add-hours5")) {
      adjustHours(t.getAttribute("data-add-hours5"), 5, "add");
    }
    if (t.getAttribute("data-clear-hours")) {
      const id = t.getAttribute("data-clear-hours");
      if (
        !confirm(
          "Clear time for " +
            id +
            "?\n\nSets hours to 0 and ends their live chat (copy kept in admin archive for 5 days)."
        )
      ) {
        return;
      }
      adjustHours(id, 0, "set");
    }
    const deleteChats = t.getAttribute("data-delete-chats");
    if (deleteChats) {
      if (
        !confirm(
          "Delete ALL chats for " +
            deleteChats +
            "?\n\nLive + archived chats removed forever (not recoverable)."
        )
      ) {
        return;
      }
      const res = await fetch(
        "/api/admin/users/" + encodeURIComponent(deleteChats) + "/chats",
        { method: "DELETE", headers: authHeaders() }
      );
      const data = await res.json().catch(function () {
        return {};
      });
      if (!res.ok) {
        if (handleAuthFail(res)) return;
        toast(data.error || "Delete chats failed", "err");
      } else {
        toast(
          "Chats deleted (" + (data.removedSessions || 0) + " sessions)",
          "ok"
        );
        if (openChatUserId === deleteChats) closeChatDrawer();
      }
      await refreshAll();
      return;
    }
    const deleteUser = t.getAttribute("data-delete-user");
    if (deleteUser) {
      if (
        !confirm(
          "DELETE ACCOUNT " +
            deleteUser +
            " forever?\n\nRemoves user, chats, login tokens, and payment records/screenshots."
        )
      ) {
        return;
      }
      if (
        !confirm(
          "Final confirm: permanently delete user " + deleteUser + "?"
        )
      ) {
        return;
      }
      const res = await fetch(
        "/api/admin/users/" + encodeURIComponent(deleteUser),
        { method: "DELETE", headers: authHeaders() }
      );
      const data = await res.json().catch(function () {
        return {};
      });
      if (!res.ok) {
        if (handleAuthFail(res)) return;
        toast(data.error || "Delete account failed", "err");
      } else {
        toast("Account " + deleteUser + " deleted", "ok");
        if (openChatUserId === deleteUser) closeChatDrawer();
      }
      await refreshAll();
      return;
    }
    const resetPin = t.getAttribute("data-reset-pin");
    if (resetPin) {
      const res = await fetch(
        "/api/admin/users/" + encodeURIComponent(resetPin) + "/reset-pin",
        { method: "POST", headers: authHeaders(), body: "{}" }
      );
      const data = await res.json().catch(function () {
        return {};
      });
      if (!res.ok) toast(data.error || "Reset failed", "err");
      else toast("New PIN for " + resetPin + ": " + data.pin, "ok");
      await refreshAll();
    }
    const migrate = t.getAttribute("data-migrate");
    if (migrate) {
      const res = await fetch(
        "/api/admin/users/" + encodeURIComponent(migrate) + "/migrate-id",
        { method: "POST", headers: authHeaders(), body: "{}" }
      );
      const data = await res.json().catch(function () {
        return {};
      });
      if (!res.ok) toast(data.error || "Migrate failed", "err");
      else
        toast(
          "Old " +
            data.oldId +
            " → ID " +
            data.userId +
            " · PIN " +
            data.pin,
          "ok"
        );
      await refreshAll();
    }
  });

  if (chatDeleteBtn) {
    chatDeleteBtn.addEventListener("click", async function () {
      if (!openChatUserId) return;
      if (
        !confirm(
          "Delete ALL chats for " +
            openChatUserId +
            "?\n\nRemoved forever from server."
        )
      ) {
        return;
      }
      const res = await fetch(
        "/api/admin/users/" + encodeURIComponent(openChatUserId) + "/chats",
        { method: "DELETE", headers: authHeaders() }
      );
      const data = await res.json().catch(function () {
        return {};
      });
      if (!res.ok) {
        if (handleAuthFail(res)) return;
        toast(data.error || "Delete chats failed", "err");
        return;
      }
      toast("Chats deleted", "ok");
      closeChatDrawer();
      await refreshAll();
    });
  }

  if (purgeOldChatsBtn) {
    purgeOldChatsBtn.addEventListener("click", async function () {
      if (
        !confirm(
          "Purge chats older than 5 days?\n\nFrees store space. Newer chats stay."
        )
      ) {
        return;
      }
      const res = await fetch("/api/admin/chats/purge-old", {
        method: "POST",
        headers: authHeaders(),
        body: "{}",
      });
      const data = await res.json().catch(function () {
        return {};
      });
      if (!res.ok) {
        if (handleAuthFail(res)) return;
        toast(data.error || "Purge failed", "err");
        return;
      }
      toast(
        "Purged live " +
          (data.removedLive || 0) +
          " · archived " +
          (data.removedArchived || 0),
        "ok"
      );
      await refreshAll();
    });
  }
  paymentsEl.addEventListener("click", async function (e) {
    const approveId = e.target.getAttribute("data-approve");
    const rejectId = e.target.getAttribute("data-reject");
    if (approveId) {
      e.target.disabled = true;
      const res = await fetch("/api/admin/payments/" + approveId + "/approve", {
        method: "POST",
        headers: authHeaders(),
        body: "{}",
      });
      const data = await res.json().catch(function () {
        return {};
      });
      if (!res.ok) toast(data.error || "Approve failed", "err");
      else toast("Payment approved · hours unlocked", "ok");
      await refreshAll();
    }
    if (rejectId) {
      const reason = prompt("Reject reason (optional)") || "";
      const res = await fetch("/api/admin/payments/" + rejectId + "/reject", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ reason: reason }),
      });
      const data = await res.json().catch(function () {
        return {};
      });
      if (!res.ok) toast(data.error || "Reject failed", "err");
      else toast("Payment rejected", "ok");
      await refreshAll();
    }
  });

  const smsCreditInput = document.getElementById("sms-credit-input");
  const smsCreditBtn = document.getElementById("sms-credit-btn");
  const smsCreditResult = document.getElementById("sms-credit-result");
  if (smsCreditBtn) {
    smsCreditBtn.addEventListener("click", async function () {
      const smsText = smsCreditInput ? smsCreditInput.value.trim() : "";
      if (!smsText) {
        toast("Paste a credit SMS first", "err");
        return;
      }
      smsCreditBtn.disabled = true;
      if (smsCreditResult) smsCreditResult.textContent = "Matching…";
      try {
        const res = await fetch("/api/admin/sms-credit", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ smsText: smsText }),
        });
        const data = await res.json().catch(function () {
          return {};
        });
        if (!res.ok) {
          toast(data.error || "SMS match failed", "err");
          if (smsCreditResult) smsCreditResult.textContent = data.error || "Failed";
          return;
        }
        const action = data.action || "?";
        const reason = data.reason || "";
        if (smsCreditResult) {
          smsCreditResult.textContent =
            action.toUpperCase() +
            (data.parsed && data.parsed.amountInr ? " · ₹" + data.parsed.amountInr : "") +
            (data.payment && data.payment.userId ? " · user " + data.payment.userId : "") +
            " — " +
            reason;
        }
        if (action === "approve") {
          toast("Auto-approved · hours unlocked", "ok");
          if (smsCreditInput) smsCreditInput.value = "";
          await refreshAll();
        } else if (action === "needs_review") {
          toast("Needs review — open pending list", "err");
          await refreshAll();
        } else {
          toast(reason || action, "ok");
        }
      } catch (err) {
        toast("Network error", "err");
        if (smsCreditResult) smsCreditResult.textContent = "Network error";
      } finally {
        smsCreditBtn.disabled = false;
      }
    });
  }

  async function loadNotices() {
    if (!noticesList) return;
    try {
      const res = await fetch("/api/admin/notices", { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) {
        noticesList.innerHTML = "<div class='empty'>Could not load notices</div>";
        return;
      }
      const list = data.notices || [];
      if (noticesCount) {
        const unseen = list.filter(function (n) {
          return !n.seen;
        }).length;
        noticesCount.textContent =
          list.length + " msgs · " + unseen + " unseen";
      }
      if (!list.length) {
        noticesList.innerHTML =
          "<div class='empty'>No notices yet.<br/>Use Msg on a user, or send above.</div>";
        return;
      }
      noticesList.innerHTML = list
        .map(function (n) {
          return (
            "<article class='notice-admin-card" +
            (n.seen ? " is-seen" : " is-unseen") +
            "'>" +
            "<div class='notice-admin-top'>" +
            "<b>" +
            escapeHtml(n.userId) +
            "</b>" +
            "<span class='badge " +
            (n.seen ? "approved" : "pending") +
            "'>" +
            (n.seen ? "SEEN" : "UNSEEN") +
            "</span>" +
            "</div>" +
            "<p class='notice-admin-title'>" +
            escapeHtml(n.title || "Message") +
            "</p>" +
            "<p class='notice-admin-text'>" +
            escapeHtml(n.text || "") +
            "</p>" +
            "<p class='meta'>Sent " +
            new Date(n.createdAt).toLocaleString() +
            (n.seenAt
              ? " · Seen " + new Date(n.seenAt).toLocaleString()
              : " · Waiting…") +
            "</p>" +
            "</article>"
          );
        })
        .join("");
    } catch (e) {
      noticesList.innerHTML = "<div class='empty'>Network error</div>";
    }
  }

  async function sendNoticeFromForm() {
    const userId = noticeUserIdEl ? noticeUserIdEl.value.trim() : "";
    const text = noticeTextEl ? noticeTextEl.value.trim() : "";
    if (!userId || !text) {
      toast("User ID + message required", "err");
      return;
    }
    const res = await fetch("/api/admin/notices", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ userId: userId, text: text }),
    });
    const data = await res.json().catch(function () {
      return {};
    });
    if (!res.ok) {
      toast(data.error || "Send failed", "err");
      return;
    }
    toast("Notice sent to " + userId, "ok");
    if (noticeTextEl) noticeTextEl.value = "";
    await loadNotices();
    await refreshAll();
  }

  if (noticeSendBtn) noticeSendBtn.addEventListener("click", sendNoticeFromForm);
  if (refreshNoticesBtn) refreshNoticesBtn.addEventListener("click", loadNotices);

  loginBtn.addEventListener("click", login);
  passEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter") login();
  });
  if (adminIdEl) {
    adminIdEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") login();
    });
  }
  logoutBtn.addEventListener("click", logout);
  refreshBtn.addEventListener("click", refreshAll);
  refreshUsersBtn.addEventListener("click", refreshAll);
  statusFilter.addEventListener("change", function () {
    renderPayments(paymentsCache);
  });
  if (paySearch) {
    paySearch.addEventListener("input", function () {
      renderPayments(paymentsCache);
    });
  }
  if (userFilter) {
    userFilter.addEventListener("change", function () {
      renderUsers(usersCache);
    });
  }
  tabUsers.addEventListener("click", showUsersTab);
  tabPayments.addEventListener("click", showPaymentsTab);
  if (tabSupport) tabSupport.addEventListener("click", showSupportTab);
  if (tabNotices) tabNotices.addEventListener("click", showNoticesTab);
  if (tabReports) tabReports.addEventListener("click", showReportsTab);
  if (tabPaySetup) tabPaySetup.addEventListener("click", showPaySetupTab);

  function renderSupportThreadList(list) {
    if (!supportThreadList) return;
    if (!(list || []).length) {
      supportThreadList.innerHTML =
        "<div class='empty'>No support messages yet.<br/>Users open Settings → Support.</div>";
      return;
    }
    supportThreadList.innerHTML = list
      .map(function (t) {
        const active = String(t.userId) === String(openSupportUserId) ? " active" : "";
        const needs = t.needsAdmin ? " needs-admin" : "";
        const when = t.updatedAt ? new Date(t.updatedAt).toLocaleString() : "";
        return (
          "<button type='button' class='support-thread-card" +
          active +
          needs +
          "' data-support-user='" +
          escapeHtml(t.userId) +
          "'>" +
          "<div class='sth-top'>" +
          "<span class='id-pill'>" +
          escapeHtml(t.userId) +
          "</span>" +
          "<span class='badge " +
          (t.needsAdmin ? "pending" : t.status === "closed" ? "" : "approved") +
          "'>" +
          (t.needsAdmin ? "new" : escapeHtml(t.status || "open")) +
          "</span>" +
          "</div>" +
          "<div class='sth-preview'>" +
          escapeHtml(t.lastText || "—") +
          "<br/><span class='meta'>" +
          (t.messageCount || 0) +
          " msgs · " +
          escapeHtml(when) +
          "</span></div>" +
          "</button>"
        );
      })
      .join("");
  }

  async function loadSupportThreads(quiet) {
    if (!supportThreadList) return;
    if (!quiet) {
      supportThreadList.innerHTML = "<p class='meta'>Loading…</p>";
    }
    try {
      const res = await fetch("/api/admin/support", { headers: authHeaders() });
      const data = await res.json().catch(function () {
        return {};
      });
      if (!res.ok) {
        if (handleAuthFail(res)) return;
        supportThreadList.innerHTML =
          "<div class='empty'>" +
          escapeHtml(data.error || "Could not load support") +
          "</div>";
        return;
      }
      supportThreadsCache = data.threads || [];
      if (supportCount) {
        const waiting = supportThreadsCache.filter(function (t) {
          return t.needsAdmin;
        }).length;
        supportCount.textContent =
          supportThreadsCache.length +
          " thread" +
          (supportThreadsCache.length === 1 ? "" : "s") +
          (waiting ? " · " + waiting + " waiting" : "");
      }
      renderSupportThreadList(supportThreadsCache);
    } catch (e) {
      supportThreadList.innerHTML = "<div class='empty'>Network error</div>";
    }
  }

  function renderSupportAdminMessages(thread) {
    if (!supportAdminMessages) return;
    const msgs = (thread && thread.messages) || [];
    if (!msgs.length) {
      supportAdminMessages.innerHTML =
        "<div class='empty'>No messages in this thread yet.</div>";
      return;
    }
    supportAdminMessages.innerHTML = msgs
      .map(function (m) {
        const cls = m.from === "admin" ? "admin" : "user";
        const who = m.from === "admin" ? "Admin" : "User " + (thread.userId || "");
        const img = m.screenshotUrl
          ? "<a href='" +
            escapeHtml(m.screenshotUrl) +
            "' target='_blank' rel='noopener'><img src='" +
            escapeHtml(m.screenshotUrl) +
            "' alt='attachment' /></a>"
          : "";
        return (
          "<div class='support-admin-bubble " +
          cls +
          "'><span class='who'>" +
          escapeHtml(who) +
          "</span>" +
          escapeHtml(m.text || "") +
          img +
          "</div>"
        );
      })
      .join("");
    supportAdminMessages.scrollTop = supportAdminMessages.scrollHeight;
  }

  async function openSupportThread(userId, quiet) {
    openSupportUserId = String(userId || "");
    setSupportMobileMode("thread");
    if (!quiet) renderSupportThreadList(supportThreadsCache);
    if (supportThreadTitle) {
      supportThreadTitle.textContent = "User ID " + openSupportUserId;
    }
    if (supportThreadMeta) supportThreadMeta.textContent = "Loading…";
    if (supportCloseThreadBtn) supportCloseThreadBtn.classList.remove("hidden");
    if (supportAdminCompose) supportAdminCompose.classList.remove("hidden");
    try {
      const res = await fetch(
        "/api/admin/support/" + encodeURIComponent(openSupportUserId),
        { headers: authHeaders() }
      );
      const data = await res.json().catch(function () {
        return {};
      });
      if (!res.ok) {
        if (handleAuthFail(res)) return;
        if (supportThreadMeta) supportThreadMeta.textContent = "";
        supportAdminMessages.innerHTML =
          "<div class='empty'>" +
          escapeHtml(data.error || "Could not load thread") +
          "</div>";
        return;
      }
      const thread = data.thread || {};
      if (supportThreadMeta) {
        supportThreadMeta.textContent =
          (thread.status || "open") +
          " · " +
          ((thread.messages && thread.messages.length) || 0) +
          " messages";
      }
      renderSupportAdminMessages(thread);
    } catch (e) {
      supportAdminMessages.innerHTML = "<div class='empty'>Network error</div>";
    }
  }

  async function sendAdminSupportReply() {
    if (!openSupportUserId) return;
    const text = supportAdminInput ? supportAdminInput.value.trim() : "";
    if (!text) {
      toast("Write a reply first", "err");
      return;
    }
    if (supportAdminSend) supportAdminSend.disabled = true;
    try {
      const res = await fetch(
        "/api/admin/support/" + encodeURIComponent(openSupportUserId) + "/reply",
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ text: text }),
        }
      );
      const data = await res.json().catch(function () {
        return {};
      });
      if (!res.ok) {
        if (handleAuthFail(res)) return;
        toast(data.error || "Reply failed", "err");
        return;
      }
      if (supportAdminInput) supportAdminInput.value = "";
      renderSupportAdminMessages(data.thread);
      toast("Reply sent", "ok");
      loadSupportThreads(true);
    } catch (e) {
      toast("Network error", "err");
    } finally {
      if (supportAdminSend) supportAdminSend.disabled = false;
    }
  }

  if (supportThreadList) {
    supportThreadList.addEventListener("click", function (e) {
      const btn = e.target.closest("[data-support-user]");
      if (!btn) return;
      openSupportThread(btn.getAttribute("data-support-user"));
    });
  }
  if (supportBackBtn) {
    supportBackBtn.addEventListener("click", closeSupportThreadView);
  }
  if (supportAdminSend) {
    supportAdminSend.addEventListener("click", sendAdminSupportReply);
  }
  if (refreshSupportBtn) {
    refreshSupportBtn.addEventListener("click", function () {
      loadSupportThreads();
      if (openSupportUserId) openSupportThread(openSupportUserId);
    });
  }
  if (supportCloseThreadBtn) {
    supportCloseThreadBtn.addEventListener("click", async function () {
      if (!openSupportUserId) return;
      try {
        const res = await fetch(
          "/api/admin/support/" +
            encodeURIComponent(openSupportUserId) +
            "/close",
          { method: "POST", headers: authHeaders(), body: "{}" }
        );
        const data = await res.json().catch(function () {
          return {};
        });
        if (!res.ok) {
          toast(data.error || "Could not close", "err");
          return;
        }
        toast("Thread marked closed", "ok");
        loadSupportThreads();
        openSupportThread(openSupportUserId, true);
      } catch (e) {
        toast("Network error", "err");
      }
    });
  }

  async function loadReports() {
    if (!reportsList) return;
    reportsList.innerHTML = "<p class='meta'>Loading reports…</p>";
    try {
      const res = await fetch("/api/admin/reports", { headers: authHeaders() });
      const data = await res.json().catch(function () {
        return {};
      });
      if (!res.ok) {
        if (handleAuthFail(res)) return;
        reportsList.innerHTML =
          "<div class='empty'>" +
          escapeHtml(data.error || "Could not load reports") +
          "</div>";
        return;
      }
      reportsCache = data.reports || [];
      if (reportsCount) {
        reportsCount.textContent =
          reportsCache.length +
          " report" +
          (reportsCache.length === 1 ? "" : "s");
      }
      if (!reportsCache.length) {
        reportsList.innerHTML =
          "<div class='empty'>No AI reports yet.<br/>Users tap Report on a bad reply.</div>";
        return;
      }
      reportsList.innerHTML = reportsCache
        .map(function (r) {
          const when = r.createdAt
            ? new Date(r.createdAt).toLocaleString()
            : "—";
          const scene =
            (r.characterName || "—") +
            " · " +
            (r.botRole || "?") +
            " → " +
            (r.userRole || "?");
          return (
            "<article class='report-item'>" +
            "<div class='report-item-head'>" +
            "<span class='id-pill'>" +
            escapeHtml(r.userId || "") +
            "</span>" +
            "<span class='badge'>" +
            escapeHtml(r.reason || "bad reply") +
            "</span>" +
            "<span class='meta'>" +
            escapeHtml(when) +
            "</span>" +
            "</div>" +
            "<p class='meta'>" +
            escapeHtml(scene) +
            (r.botGender ? " · AI " + escapeHtml(r.botGender) : "") +
            "</p>" +
            (r.note
              ? "<p class='report-note'>" + escapeHtml(r.note) + "</p>"
              : "") +
            "<pre class='report-ai'>" +
            escapeHtml(String(r.aiMessage || "").slice(0, 600)) +
            (String(r.aiMessage || "").length > 600 ? "…" : "") +
            "</pre>" +
            "</article>"
          );
        })
        .join("");
    } catch (e) {
      reportsList.innerHTML = "<div class='empty'>Network error</div>";
    }
  }

  if (downloadReportsBtn) {
    downloadReportsBtn.addEventListener("click", async function () {
      try {
        const res = await fetch("/api/admin/reports/download", {
          headers: { Authorization: "Bearer " + token },
        });
        if (!res.ok) {
          if (handleAuthFail(res)) return;
          const data = await res.json().catch(function () {
            return {};
          });
          toast(data.error || "Download failed", "err");
          return;
        }
        const blob = await res.blob();
        const dispo = res.headers.get("Content-Disposition") || "";
        const match = dispo.match(/filename=\"?([^\";]+)\"?/i);
        const filename = match
          ? match[1]
          : "ai-reports.json";
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast("Reports downloaded", "ok");
      } catch (e) {
        toast("Download failed", "err");
      }
    });
  }

  if (clearReportsBtn) {
    clearReportsBtn.addEventListener("click", async function () {
      if (
        !confirm(
          "Clear ALL AI reports?\n\nDownload first if you still need them."
        )
      ) {
        return;
      }
      const res = await fetch("/api/admin/reports", {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json().catch(function () {
        return {};
      });
      if (!res.ok) {
        if (handleAuthFail(res)) return;
        toast(data.error || "Clear failed", "err");
        return;
      }
      toast("Cleared " + (data.cleared || 0) + " reports", "ok");
      loadReports();
    });
  }

  if (refreshReportsBtn) {
    refreshReportsBtn.addEventListener("click", loadReports);
  }

  if (setPackages) {
    setPackages.addEventListener("click", function (e) {
      const del = e.target.getAttribute("data-del-pkg");
      if (del == null) return;
      const packs = collectPackagesFromEditor();
      packs.splice(Number(del), 1);
      renderPackageEditor(packs);
    });
  }
  if (setPkgAdd) {
    setPkgAdd.addEventListener("click", function () {
      const packs = collectPackagesFromEditor();
      packs.push({
        id: "pack-" + Date.now(),
        label: "New pack",
        hours: 1,
        priceInr: 130,
        listPriceInr: 130,
        badge: "",
        popular: false,
      });
      renderPackageEditor(packs);
    });
  }
  if (setSaveBtn) {
    setSaveBtn.addEventListener("click", async function () {
      if (setSaveMsg) setSaveMsg.textContent = "Saving…";
      try {
        const res = await fetch("/api/admin/settings", {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify({
            upiId: setUpiId ? setUpiId.value : "",
            upiName: setUpiName ? setUpiName.value : "",
            packages: collectPackagesFromEditor(),
          }),
        });
        const data = await res.json().catch(function () {
          return {};
        });
        if (!res.ok) {
          if (handleAuthFail(res)) return;
          if (setSaveMsg) setSaveMsg.textContent = data.error || "Save failed";
          toast(data.error || "Save failed", "err");
          return;
        }
        if (setSaveMsg) setSaveMsg.textContent = "Saved.";
        toast("UPI & prices saved", "ok");
        if (data.settings) renderPackageEditor(data.settings.packages || []);
      } catch (e) {
        toast("Network error", "err");
      }
    });
  }
  if (setQrFile) {
    setQrFile.addEventListener("change", function () {
      const file = setQrFile.files && setQrFile.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function () {
        pendingQrBase64 = reader.result;
        if (setQrPreview) setQrPreview.src = pendingQrBase64;
        if (setQrMsg) setQrMsg.textContent = "Ready — click Upload QR";
      };
      reader.readAsDataURL(file);
    });
  }
  if (setQrUploadBtn) {
    setQrUploadBtn.addEventListener("click", async function () {
      if (!pendingQrBase64) {
        toast("Choose a QR image first", "err");
        return;
      }
      setQrUploadBtn.disabled = true;
      try {
        const res = await fetch("/api/admin/settings/qr", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ imageBase64: pendingQrBase64 }),
        });
        const data = await res.json().catch(function () {
          return {};
        });
        if (!res.ok) {
          toast(data.error || "Upload failed", "err");
          return;
        }
        pendingQrBase64 = null;
        if (setQrPreview && data.qrImageUrl) setQrPreview.src = data.qrImageUrl;
        if (setQrMsg) setQrMsg.textContent = "QR live for users.";
        toast("QR uploaded", "ok");
      } catch (e) {
        toast("Network error", "err");
      } finally {
        setQrUploadBtn.disabled = false;
      }
    });
  }
  if (setQrClearBtn) {
    setQrClearBtn.addEventListener("click", async function () {
      if (!confirm("Clear custom QR and use default placeholder?")) return;
      const res = await fetch("/api/admin/settings/qr", {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json().catch(function () {
        return {};
      });
      if (!res.ok) {
        toast(data.error || "Clear failed", "err");
        return;
      }
      if (setQrPreview) setQrPreview.src = data.qrImageUrl || "/upi-qr.svg";
      toast("QR cleared", "ok");
    });
  }

  if (userSearch) {
    userSearch.addEventListener("input", function () {
      renderUsers(usersCache);
    });
  }

  if (chatDrawer) {
    chatDrawer.addEventListener("click", function (e) {
      if (e.target.getAttribute("data-close-chat") !== null) closeChatDrawer();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeChatDrawer();
    });
  }

  // Boot: validate saved token
  (async function boot() {
    if (!token) {
      showLogin();
      return;
    }
    showDash();
    const res = await fetch("/api/admin/users", { headers: authHeaders() });
    if (!res.ok) {
      logout();
      setMsg("Please login again.", "err");
      return;
    }
    await refreshAll();
  })();

  // Live remaining time in admin — settle stale ONLINE rows every 20s
  setInterval(function () {
    if (!token) return;
    if (document.hidden) return;
    refreshAll().catch(function () {});
  }, 20000);
})();
