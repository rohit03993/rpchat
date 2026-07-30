/**
 * Light typo cleanup only — do not wrap with extra instructions
 * (that breaks roleplay memory/flow).
 */

const REPLACEMENTS = [
  [/\bmujes\b/gi, "mujhe"],
  [/\bmje\b/gi, "mujhe"],
  [/\bkrega\b/gi, "karega"],
  [/\bkregi\b/gi, "karegi"],
  [/\bkrna\b/gi, "karna"],
  [/\bkna\b/gi, "karna"],
  [/\brhi\b/gi, "rahi"],
  [/\brha\b/gi, "raha"],
  [/\bmumy\b/gi, "mummy"],
  [/\bmuumy\b/gi, "mummy"],
  [/\bmumsy\b/gi, "mummy"],
  [/\bluga\b/gi, "lunga"],
  [/\brat\b/gi, "raat"],
  [/\bapki\b/gi, "aapki"],
  [/\bapke\b/gi, "aapke"],
  [/\bapko\b/gi, "aapko"],
  [/\bpls\b/gi, "please"],
  [/\bplz\b/gi, "please"],
];

function normalizeHinglish(text) {
  let out = String(text || "").trim().replace(/\s+/g, " ");
  for (const [pattern, value] of REPLACEMENTS) {
    out = out.replace(pattern, value);
  }
  return out;
}

function prepareUserContent(raw) {
  return normalizeHinglish(raw);
}

module.exports = {
  normalizeHinglish,
  prepareUserContent,
};
