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

  const creditHint =
    /(credited|cr\b|received|deposited|neft.*credit|imps.*credit|upi.*credit|has\s+credited)/i.test(
      text
    );
  const debitHint = /(debited|dr\b|withdrawn|spent|paid\s+to)/i.test(text);
  const isCredit = creditHint || (!debitHint && /₹|inr|rs\.?/i.test(text));

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
 * @returns {{ action, reason, paymentId?, candidates? }}
 */
function decidePaymentMatch({ amountInr, utr, pendingPayments, packAmounts }) {
  const amount = Math.round(Number(amountInr));
  const ref = normalizeUtr(utr);
  const pending = (pendingPayments || []).filter((p) => p && p.status === "pending");

  if (!Number.isFinite(amount) || amount <= 0) {
    return { action: "ignored", reason: "No amount found in SMS" };
  }

  const knownPack = (packAmounts || []).some((a) => Math.round(Number(a)) === amount);
  if (packAmounts && packAmounts.length && !knownPack) {
    return {
      action: "ignored",
      reason: "Amount ₹" + amount + " does not match any sell pack",
    };
  }

  const withShot = pending.filter((p) => !!p.screenshotUrl);

  // 1) UTR exact on payment.utr or inside upiNote
  if (ref) {
    const byUtr = withShot.filter(function (p) {
      const payUtr = normalizeUtr(p.utr);
      const note = String(p.upiNote || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      return payUtr === ref || (note && note.indexOf(ref) !== -1);
    });
    if (byUtr.length === 1) {
      return {
        action: "approve",
        reason: "UTR matched pending payment with screenshot",
        paymentId: byUtr[0].paymentId,
        matchVia: "utr",
      };
    }
    if (byUtr.length > 1) {
      return {
        action: "needs_review",
        reason: "UTR matched multiple pending payments",
        candidates: byUtr.map((p) => p.paymentId),
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

  // 3) Pending without screenshot but same amount (weak)
  const noShot = pending.filter(
    (p) => !p.screenshotUrl && Math.round(Number(p.amountInr)) === amount
  );
  if (noShot.length) {
    return {
      action: "needs_review",
      reason: "Amount matches pending but screenshot missing",
      candidates: noShot.map((p) => p.paymentId),
    };
  }

  return {
    action: "no_match",
    reason: "No pending payment with screenshot for ₹" + amount,
  };
}

module.exports = {
  normalizeUtr,
  parseCreditSms,
  decidePaymentMatch,
};
