/**
 * Local unit test for SMS parse + safe match order (no server / DB).
 * Run: node scripts/test-sms-match.js
 */
const {
  parseCreditSms,
  decidePaymentMatch,
} = require("../lib/smsPaymentMatch");

let passed = 0;
let failed = 0;

function assert(cond, label) {
  if (cond) {
    passed += 1;
    console.log("OK  " + label);
  } else {
    failed += 1;
    console.log("FAIL " + label);
  }
}

const sample =
  "Dear Customer, Rs.130.00 credited to A/c XX1234 on 31-07-26 via UPI. UTR 412345678901. Avl Bal Rs.5000";

const parsed = parseCreditSms(sample);
assert(parsed.amountInr === 130, "parse amount 130");
assert(parsed.utr === "412345678901", "parse UTR");
assert(parsed.isCredit === true, "parse is credit");

const packs = [130, 240, 550, 999];

assert(
  decidePaymentMatch({
    amountInr: 130,
    utr: "412345678901",
    packAmounts: packs,
    pendingPayments: [
      {
        paymentId: "PAY1",
        status: "pending",
        amountInr: 130,
        screenshotUrl: "/x.jpg",
        utr: "412345678901",
      },
      {
        paymentId: "PAY2",
        status: "pending",
        amountInr: 130,
        screenshotUrl: "/y.jpg",
      },
    ],
  }).action === "approve",
  "UTR wins even if two same amounts"
);

assert(
  decidePaymentMatch({
    amountInr: 130,
    utr: "",
    packAmounts: packs,
    pendingPayments: [
      {
        paymentId: "PAY1",
        status: "pending",
        amountInr: 130,
        screenshotUrl: "/x.jpg",
      },
    ],
  }).action === "approve",
  "unique amount+screenshot approves"
);

assert(
  decidePaymentMatch({
    amountInr: 130,
    utr: "",
    packAmounts: packs,
    pendingPayments: [
      {
        paymentId: "PAY1",
        status: "pending",
        amountInr: 130,
        screenshotUrl: "/x.jpg",
      },
      {
        paymentId: "PAY2",
        status: "pending",
        amountInr: 130,
        screenshotUrl: "/y.jpg",
      },
    ],
  }).action === "needs_review",
  "two same amounts need review"
);

assert(
  decidePaymentMatch({
    amountInr: 99,
    utr: "",
    packAmounts: packs,
    pendingPayments: [],
  }).action === "ignored",
  "unknown pack amount ignored"
);

assert(
  decidePaymentMatch({
    amountInr: 130,
    utr: "",
    packAmounts: packs,
    pendingPayments: [],
    activePayIntents: [
      {
        userId: "7824",
        packageId: "1h",
        amountInr: 130,
        hours: 1,
      },
    ],
  }).action === "approve_intent",
  "unique pay-intent approves without screenshot"
);

assert(
  decidePaymentMatch({
    amountInr: 130,
    utr: "",
    packAmounts: packs,
    pendingPayments: [],
    activePayIntents: [
      { userId: "1111", packageId: "1h", amountInr: 130, hours: 1 },
      { userId: "2222", packageId: "1h", amountInr: 130, hours: 1 },
    ],
  }).action === "needs_review",
  "two pay-intents need review"
);

assert(
  decidePaymentMatch({
    amountInr: 130,
    utr: "",
    packAmounts: packs,
    pendingPayments: [],
  }).action === "no_match",
  "no pending → no_match"
);

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed ? 1 : 0);
