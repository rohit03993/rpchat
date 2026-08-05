/**
 * Parse bank/UPI credit SMS and match to pending payments (safe order).
 * Amount-only never auto-approves when 2+ pending share the same ₹.
 */

function normalizeUtr(raw) {
  const s = String(raw || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  return s.length >= 8 ? s : "";
}

/**
 * Extract amount + UTR/ref from typical Indian bank / UPI SMS bodies.
 */
function parseCreditSms(smsText) {
  const text = String(smsText || "").replace(/\s+/g, " ").trim();
  if (!text) return { amountInr: null, utr: "", isCredit: false };

  const debitHint =
    /\b(debited|withdrawn|spent\s+on|paid\s+to|sent\s+to|dr\b)\b/i.test(text);
  const noiseHint =
    /\b(otp|one\s*time\s*password|verification\s*code|do\s+not\s+share|failed|unsuccessful|declined|insufficient|request\s+to\s+pay|collect\s+request|payment\s+request|available\s+bal|avl\s+bal|a\/c\s+bal|account\s+balance|mini\s+statement|overdue|emi\b)\b/i.test(
      text
    );
  const creditHint =
    /(credited|has\s+been\s+credited|neft.*credit|imps.*credit|upi.*credit|deposited|(?:received)\s+(?:from|in\s+your)|(?:a\/c|account).{0,40}credited|\bcr\b)/i.test(
      text
    );

  // Strict: must look like money arriving — not every SMS with Rs./UPI
  let isCredit = false;
  if (noiseHint && !creditHint) isCredit = false;
  else if (debitHint && !creditHint) isCredit = false;
  else if (creditHint) isCredit = true;

  let amountInr = null;
  const amountPatterns = [
    /(?:₹|rs\.?|inr)\s*([0-9]+(?:\.[0-9]{1,2})?)/i,
    /(?:(?:inr|rs\.?)\s*)?([0-9]+(?:\.[0-9]{1,2})?)\s*(?:inr|rs\.?|₹)/i,
    /(?:amount|amt|sum)\s*(?:of|:)?\s*(?:₹|rs\.?|inr)?\s*([0-9]+(?:\.[0-9]{1,2})?)/i,
  ];
  for (const re of amountPatterns) {
    const m = text.match(re);
    if (m) {
      amountInr = Math.round(Number(m[1]));
      if (Number.isFinite(amountInr) && amountInr > 0) break;
      amountInr = null;
    }
  }

  let utr = "";
  const utrPatterns = [
    /\b(?:UTR|UPI\s*Ref(?:erence)?|Ref(?:erence)?\s*(?:No|Num|ID)?|Txn(?:\s*ID)?|Transaction\s*ID|RRN)\s*[:\-#]?\s*([A-Z0-9]{8,22})\b/i,
    /\b([0-9]{12,22})\b/,
  ];
  for (const re of utrPatterns) {
    const m = text.match(re);
    if (m) {
      utr = normalizeUtr(m[1]);
      if (utr) break;
    }
  }

  return { amountInr, utr, isCredit, raw: text };
}

/**
 * Decide match without writing DB.
 * Order: UTR+screenshot → unique ₹+screenshot → unique active pay-intent (no shot OK) → else review/no_match
 * @returns {{ action, reason, paymentId?, intent?, candidates?, matchVia? }}
 */
function decidePaymentMatch({
  amountInr,
  utr,
  pendingPayments,
  packAmounts,
  activePayIntents,
}) {
  const amount = Math.round(Number(amountInr));
  const ref = normalizeUtr(utr);
  const pending = (pendingPayments || []).filter((p) => p && p.status === "pending");
  const intents = (activePayIntents || []).filter(function (i) {
    return i && Math.round(Number(i.amountInr)) === amount;
  });

  if (!Number.isFinite(amount) || amount <= 0) {
    return { action: "ignored", reason: "No amount found in SMS" };
  }

  const knownPack = (packAmounts || []).some((a) => Math.round(Number(a)) === amount);
  const knownIntent = (activePayIntents || []).some(function (i) {
    return i && Math.round(Number(i.amountInr)) === amount;
  });
  if (packAmounts && packAmounts.length && !knownPack && !knownIntent) {
    return {
      action: "ignored",
      reason: "Amount ₹" + amount + " does not match any sell pack",
    };
  }

  const withShot = pending.filter((p) => !!p.screenshotUrl);

  // 1) UTR exact on payment.utr or inside upiNote (prefer with screenshot, else any pending)
  if (ref) {
    const byUtrShot = withShot.filter(function (p) {
      const payUtr = normalizeUtr(p.utr);
      const note = String(p.upiNote || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      return payUtr === ref || (note && note.indexOf(ref) !== -1);
    });
    if (byUtrShot.length === 1) {
      return {
        action: "approve",
        reason: "UTR matched pending payment with screenshot",
        paymentId: byUtrShot[0].paymentId,
        matchVia: "utr",
      };
    }
    if (byUtrShot.length > 1) {
      return {
        action: "needs_review",
        reason: "UTR matched multiple pending payments",
        candidates: byUtrShot.map((p) => p.paymentId),
      };
    }
  }

  // 2) Exact amount + screenshot
  const byAmount = withShot.filter((p) => Math.round(Number(p.amountInr)) === amount);
  if (byAmount.length === 1) {
    return {
      action: "approve",
      reason: "Single pending ₹" + amount + " with screenshot",
      paymentId: byAmount[0].paymentId,
      matchVia: "amount_unique",
    };
  }
  if (byAmount.length > 1) {
    return {
      action: "needs_review",
      reason:
        byAmount.length +
        " pending payments for ₹" +
        amount +
        " — need UTR or manual pick",
      candidates: byAmount.map((p) => p.paymentId),
    };
  }

  // 3) Low-traffic: unique recent pay intent (Open UPI / I've paid) — no screenshot required
  if (intents.length === 1) {
    return {
      action: "approve_intent",
      reason:
        "Single user was on Pay for ₹" +
        amount +
        " (intent) — auto unlock without screenshot",
      intent: intents[0],
      matchVia: "pay_intent",
    };
  }
  if (intents.length > 1) {
    return {
      action: "needs_review",
      reason:
        intents.length +
        " users opened Pay for ₹" +
        amount +
        " — need screenshot/UTR",
      candidates: intents.map(function (i) {
        return i.userId;
      }),
    };
  }

  // 4) Pending without screenshot — unique only
  const noShot = pending.filter(
    (p) => !p.screenshotUrl && Math.round(Number(p.amountInr)) === amount
  );
  if (noShot.length === 1) {
    return {
      action: "approve",
      reason: "Single pending ₹" + amount + " (no screenshot)",
      paymentId: noShot[0].paymentId,
      matchVia: "amount_no_shot",
    };
  }
  if (noShot.length > 1) {
    return {
      action: "needs_review",
      reason: "Multiple pending without screenshot for ₹" + amount,
      candidates: noShot.map((p) => p.paymentId),
    };
  }

  return {
    action: "no_match",
    reason: "No pending payment or pay-intent for ₹" + amount,
  };
}

module.exports = {
  normalizeUtr,
  parseCreditSms,
  decidePaymentMatch,
};
