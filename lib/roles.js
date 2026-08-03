/**
 * Role / gender helpers — exact + word-boundary matching.
 * Prevents bugs like saas ⊂ sasur, nana ⊂ nanad, etc.
 */

const FEMALE_ROLES = [
  "mom",
  "mummy",
  "maa",
  "mother",
  "sister",
  "bahan",
  "gf",
  "girlfriend",
  "wife",
  "biwi",
  "girl",
  "aunty",
  "mami",
  "didi",
  "female",
  "woman",
  "ladki",
  "mausi",
  "maushi",
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
  "daughter",
  "bhanji",
  "poti",
  "bhatiji",
];

const MALE_ROLES = [
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
  "uncle",
  "male",
  "man",
  "ladka",
  "beta",
  "son",
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
  "pota",
];

const FEMALE_SET = new Set(FEMALE_ROLES);
const MALE_SET = new Set(MALE_ROLES);

function normRole(role) {
  return String(role || "")
    .toLowerCase()
    .trim();
}

function escapeRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** True if role equals any name, or contains it as a whole word (longer names win). */
function roleIs(role, ...names) {
  const r = normRole(role);
  if (!r || !names.length) return false;
  for (const n of names) {
    if (r === n) return true;
  }
  const sorted = names.slice().sort((a, b) => b.length - a.length);
  for (const n of sorted) {
    if (!n) continue;
    if (new RegExp("\\b" + escapeRe(n) + "\\b").test(r)) return true;
  }
  return false;
}

function inferGender(role) {
  const r = normRole(role);
  if (!r) return "female";
  if (FEMALE_SET.has(r)) return "female";
  if (MALE_SET.has(r)) return "male";

  // Longer tokens first so sasur/nanad beat saas/nana
  const femaleSorted = FEMALE_ROLES.slice().sort((a, b) => b.length - a.length);
  const maleSorted = MALE_ROLES.slice().sort((a, b) => b.length - a.length);

  for (const n of femaleSorted) {
    if (new RegExp("\\b" + escapeRe(n) + "\\b").test(r)) return "female";
  }
  for (const n of maleSorted) {
    if (new RegExp("\\b" + escapeRe(n) + "\\b").test(r)) return "male";
  }
  return "female";
}

/**
 * Known role gender always wins over a bad override
 * (e.g. setup text "AI gender: female" with role sasur).
 */
function hardenRoleGender(role, gender) {
  const r = normRole(role);
  if (MALE_SET.has(r)) return "male";
  if (FEMALE_SET.has(r)) return "female";

  const inferred = inferGender(role);
  if (inferred === "male" || inferred === "female") {
    // If any known role word is present, trust inference over override
    const hitKnown =
      MALE_ROLES.some((n) => roleIs(r, n)) ||
      FEMALE_ROLES.some((n) => roleIs(r, n));
    if (hitKnown) return inferred;
  }
  if (gender === "male") return "male";
  if (gender === "female") return "female";
  return inferred;
}

module.exports = {
  FEMALE_ROLES,
  MALE_ROLES,
  normRole,
  roleIs,
  inferGender,
  hardenRoleGender,
};
