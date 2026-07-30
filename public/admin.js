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
  const tabPaySetup = document.getElementById("tab-pay-setup");
  const usersView = document.getElementById("users-view");
  const paymentsView = document.getElementById("payments-view");
  const paySetupView = document.getElementById("pay-setup-view");
  const statUsers = document.getElementById("stat-users");
  const statPending = document.getElementById("stat-pending");
  const statHours = document.getElementById("stat-hours");
  const statMoney = document.getElementById("stat-money");
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

  function showUsersTab() {
    tabUsers.classList.add("active");
    tabPayments.classList.remove("active");
    if (tabPaySetup) tabPaySetup.classList.remove("active");
    usersView.classList.remove("hidden");
    paymentsView.classList.add("hidden");
    if (paySetupView) paySetupView.classList.add("hidden");
  }

  function showPaymentsTab() {
    tabPayments.classList.add("active");
    tabUsers.classList.remove("active");
    if (tabPaySetup) tabPaySetup.classList.remove("active");
    paymentsView.classList.remove("hidden");
    usersView.classList.add("hidden");
    if (paySetupView) paySetupView.classList.add("hidden");
  }

  function showPaySetupTab() {
    if (tabPaySetup) tabPaySetup.classList.add("active");
    tabUsers.classList.remove("active");
    tabPayments.classList.remove("active");
    if (paySetupView) paySetupView.classList.remove("hidden");
    usersView.classList.add("hidden");
    paymentsView.classList.add("hidden");
    loadPaySettings();
  }

  function renderPackageEditor(packages) {
    if (!setPackages) return;
    const list = packages && packages.length ? packages : [];
    setPackages.innerHTML = list
      .map(function (p, i) {
        return (
          '<div class="pkg-row" data-i="' +
          i +
          '">' +
          '<input data-f="label" type="text" value="' +
          String(p.label || "").replace(/"/g, "&quot;") +
          '" placeholder="Label" />' +
          '<input data-f="hours" type="number" min="0.1" step="0.1" value="' +
          p.hours +
          '" title="Hours" />' +
          '<input data-f="priceInr" type="number" min="0" step="1" value="' +
          p.priceInr +
          '" title="Price ₹" />' +
          '<input data-f="listPriceInr" type="number" min="0" step="1" value="' +
          (p.listPriceInr != null ? p.listPriceInr : p.priceInr) +
          '" title="List ₹" />' +
          '<input data-f="badge" type="text" value="' +
          String(p.badge || "").replace(/"/g, "&quot;") +
          '" placeholder="Badge" />' +
          '<label class="pkg-pop"><input data-f="popular" type="checkbox" ' +
          (p.popular ? "checked" : "") +
          "/> Pop</label>" +
          '<button type="button" class="btn-danger btn-sm" data-del-pkg="' +
          i +
          '">Del</button>' +
          '<input data-f="id" type="hidden" value="' +
          String(p.id || "").replace(/"/g, "&quot;") +
          '" />' +
          "</div>"
        );
      })
      .join("");
  }

  function collectPackagesFromEditor() {
    const rows = setPackages ? setPackages.querySelectorAll(".pkg-row") : [];
    const out = [];
    rows.forEach(function (row) {
      const get = function (f) {
        return row.querySelector('[data-f="' + f + '"]');
      };
      out.push({
        id: get("id").value,
        label: get("label").value,
        hours: Number(get("hours").value),
        priceInr: Number(get("priceInr").value),
        listPriceInr: Number(get("listPriceInr").value),
        badge: get("badge").value,
        popular: get("popular").checked,
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

  function updateStats(users, allPayments) {
    const list = users || [];
    const pays = allPayments || [];
    statUsers.textContent = String(list.length);
    statPending.textContent = String(
      pays.filter(function (p) {
        return p.status === "pending";
      }).length
    );
    const hours = list.reduce(function (sum, u) {
      return sum + Number(u.hoursBalance || 0);
    }, 0);
    statHours.textContent = hours.toFixed(1);
    const collected = pays
      .filter(function (p) {
        return p.status === "approved";
      })
      .reduce(function (sum, p) {
        return sum + Number(p.amountInr || 0);
      }, 0);
    if (statMoney) {
      statMoney.textContent = "₹" + Math.round(collected).toLocaleString("en-IN");
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

    const rows = filtered
      .map(function (u) {
        const clock = formatClock(u.hoursBalance);
        const chatLabel = u.chatMsgCount
          ? u.chatMsgCount +
            (u.chatSessionCount > 1 ? " / " + u.chatSessionCount + " chats" : "") +
            (u.chatArchived && !u.chatLive ? " (old)" : "")
          : "—";
        const scene =
          (u.characterName || "—") +
          (u.botRole ? " · " + u.botRole : "");
        const paidBadge = u.hasPaid
          ? "<span class='badge approved'>paid</span>"
          : "<span class='badge'>unpaid</span>";
        return (
          "<tr>" +
          "<td><button type='button' class='id-pill id-link' title='View chat' data-view-chat='" +
          escapeHtml(u.userId) +
          "'>" +
          escapeHtml(u.userId) +
          "</button></td>" +
          "<td><span class='pin-cell'>" +
          escapeHtml(u.pin || "—") +
          "</span></td>" +
          "<td><div class='time-cell'>" +
          clock +
          "<small>" +
          Number(u.hoursBalance || 0).toFixed(2) +
          "h</small></div></td>" +
          "<td><span class='badge " +
          (u.sessionActive ? "online" : "") +
          "'>" +
          (u.sessionActive ? "online" : "idle") +
          "</span> " +
          paidBadge +
          "</td>" +
          "<td class='scene-cell' title='" +
          escapeHtml(scene) +
          "'>" +
          escapeHtml(scene) +
          "</td>" +
          "<td class='meta'><button type='button' class='chat-count-btn' data-view-chat='" +
          escapeHtml(u.userId) +
          "'>" +
          chatLabel +
          "</button></td>" +
          "<td class='meta'>P " +
          (u.pendingPayments || 0) +
          " · A " +
          (u.approvedPayments || 0) +
          (u.rejectedPayments ? " · R " + u.rejectedPayments : "") +
          "</td>" +
          "<td class='meta'>" +
          new Date(u.createdAt).toLocaleString() +
          "</td>" +
          "<td><div class='row-actions'>" +
          "<button type='button' class='btn btn-sm' data-add-hours='" +
          escapeHtml(u.userId) +
          "'>+1h</button>" +
          "<button type='button' class='btn-ghost btn-sm' data-add-hours5='" +
          escapeHtml(u.userId) +
          "'>+5h</button>" +
          "<button type='button' class='btn-danger btn-sm' title='Set time to zero and end chat' data-clear-hours='" +
          escapeHtml(u.userId) +
          "'>Clear time</button>" +
          "<button type='button' class='btn-ghost btn-sm' data-reset-pin='" +
          escapeHtml(u.userId) +
          "'>Reset PIN</button>" +
          "<button type='button' class='btn-ghost btn-sm' title='Delete live + archived chats' data-delete-chats='" +
          escapeHtml(u.userId) +
          "'>Del chats</button>" +
          "<button type='button' class='btn-danger btn-sm' title='Delete account forever' data-delete-user='" +
          escapeHtml(u.userId) +
          "'>Del account</button>" +
          (u.isLegacy || u.needsFourDigit
            ? "<button type='button' class='btn btn-sm' data-migrate='" +
              escapeHtml(u.userId) +
              "'>→ 4-digit</button>"
            : "") +
          "</div></td>" +
          "</tr>"
        );
      })
      .join("");

    usersEl.innerHTML =
      "<table class='data-table'>" +
      "<thead><tr>" +
      "<th>User ID</th><th>PIN</th><th>Time left</th><th>Status</th><th>Scene</th><th>Msgs</th><th>Pays</th><th>Joined</th><th>Actions</th>" +
      "</tr></thead><tbody>" +
      rows +
      "</tbody></table>";
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
    updateStats(users, allPays);
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
          "[data-view-chat], [data-add-hours], [data-add-hours5], [data-clear-hours], [data-reset-pin], [data-migrate], [data-delete-chats], [data-delete-user]"
        )
      : e.target;
    if (!t) return;

    const viewChat = t.getAttribute("data-view-chat");
    if (viewChat) {
      openUserChat(viewChat);
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
  if (tabPaySetup) tabPaySetup.addEventListener("click", showPaySetupTab);

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
})();
