/**
 * Import adult Hindi/Hinglish web stories (URL multi-page or pasted text).
 * Strips comments/ads, follows next-page links, returns cleaned text.
 */

const MAX_PAGES = 8;
const MAX_CHARS = 90000;
const FETCH_TIMEOUT_MS = 14000;
const MAX_HTML = 1.8e6;

function isHttpUrl(raw) {
  try {
    const u = new URL(String(raw || "").trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch (_) {
    return false;
  }
}

function decodeEntities(s) {
  return String(s || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => {
      const c = Number(n);
      return Number.isFinite(c) ? String.fromCharCode(c) : "";
    });
}

function stripNoiseHtml(html) {
  let h = String(html || "");
  h = h.replace(/<script[\s\S]*?<\/script>/gi, " ");
  h = h.replace(/<style[\s\S]*?<\/style>/gi, " ");
  h = h.replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  h = h.replace(/<!--[\s\S]*?-->/g, " ");
  // Common comment / sidebar / ad blocks
  h = h.replace(
    /<(aside|footer|nav|form|header)[\s\S]*?<\/\1>/gi,
    " "
  );
  h = h.replace(
    /<div[^>]*(id|class)=["'][^"']*(comment|comments|disqus|reply|related|sidebar|share|social|advert|adsense|popup)[^"']*["'][^>]*>[\s\S]*?<\/div>/gi,
    " "
  );
  h = h.replace(
    /<(section|ul|ol|div)[^>]*(id|class)=["'][^"']*comment[^"']*["'][^>]*>[\s\S]*?<\/\1>/gi,
    " "
  );
  return h;
}

function htmlToText(html) {
  let h = stripNoiseHtml(html);
  // Prefer article / main / entry-content blocks when present
  const prefer =
    h.match(/<article[\s\S]*?<\/article>/i) ||
    h.match(/<main[\s\S]*?<\/main>/i) ||
    h.match(
      /<div[^>]*(class|id)=["'][^"']*(entry-content|post-content|story|content-area|td-post-content)[^"']*["'][^>]*>[\s\S]*?<\/div>/i
    );
  if (prefer) h = prefer[0];
  h = h.replace(/<br\s*\/?>/gi, "\n");
  h = h.replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "\n");
  h = h.replace(/<[^>]+>/g, " ");
  h = decodeEntities(h);
  h = h
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
  return h;
}

function looksLikeJunkLine(line) {
  const t = String(line || "").trim();
  if (!t) return true;
  if (t.length < 12) return true;
  if (
    /^(home|login|register|subscribe|share|facebook|twitter|whatsapp|telegram|related|categories|tags|leave a reply|post a comment|your email|search|menu)\b/i.test(
      t
    )
  ) {
    return true;
  }
  if (/cookie|privacy policy|terms of service|all rights reserved/i.test(t)) {
    return true;
  }
  return false;
}

function cleanStoryText(text) {
  const lines = String(text || "")
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => !looksLikeJunkLine(l));
  let out = lines.join("\n");
  if (out.length > MAX_CHARS) out = out.slice(0, MAX_CHARS);
  return out.trim();
}

function absolutize(href, baseUrl) {
  try {
    return new URL(href, baseUrl).toString();
  } catch (_) {
    return null;
  }
}

function sameStoryFamily(a, b) {
  try {
    const ua = new URL(a);
    const ub = new URL(b);
    if (ua.origin !== ub.origin) return false;
    const pa = ua.pathname.replace(/\/+$/, "");
    const pb = ub.pathname.replace(/\/+$/, "");
    // Allow page suffixes: story.html / story-2.html / story/2 /
    const baseA = pa.replace(/[-_/]?(page[-_/]?)?\d+$/i, "").replace(/\.html?$/i, "");
    const baseB = pb.replace(/[-_/]?(page[-_/]?)?\d+$/i, "").replace(/\.html?$/i, "");
    if (baseA && baseB && baseA === baseB) return true;
    // Query page=
    if (pa === pb && ua.searchParams.has("page") !== ub.searchParams.has("page")) {
      return true;
    }
    if (pa === pb) return true;
    return pa.indexOf(baseB) === 0 || pb.indexOf(baseA) === 0;
  } catch (_) {
    return false;
  }
}

function findNextPageUrls(html, currentUrl, seen) {
  const found = [];
  const re =
    /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html))) {
    const href = m[1];
    const label = decodeEntities(m[2].replace(/<[^>]+>/g, " ")).trim();
    const abs = absolutize(href, currentUrl);
    if (!abs || seen.has(abs)) continue;
    if (!sameStoryFamily(currentUrl, abs)) continue;
    const pageHint =
      /(?:\?|&)page=(\d+)/i.exec(abs) ||
      /(?:page|p)[=\/_-]?(\d+)/i.exec(abs) ||
      /-(\d+)\.html?/i.exec(abs);
    const labelNext =
      /^(next|अगला|अगला पृष्ठ|next page|»|›|>)$/i.test(label) ||
      /\bnext\b/i.test(label);
    const labelNum = /^(\d+)$/.test(label);
    if (labelNext || pageHint || labelNum) {
      found.push({
        url: abs,
        score:
          (labelNext ? 50 : 0) +
          (pageHint ? Number(pageHint[1]) || 0 : labelNum ? Number(label) : 0),
      });
    }
  }
  found.sort((a, b) => a.score - b.score);
  const urls = [];
  for (const item of found) {
    if (!seen.has(item.url) && urls.indexOf(item.url) === -1) urls.push(item.url);
  }
  return urls.slice(0, 6);
}

async function fetchHtml(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; DesiChatStoryImport/1.0; +https://rpdesichat.online)",
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "hi-IN,hi;q=0.9,en;q=0.8",
      },
    });
    if (!res.ok) {
      return { ok: false, error: "Fetch failed (" + res.status + ")" };
    }
    const ctype = String(res.headers.get("content-type") || "");
    if (ctype && !/html|text|xml/i.test(ctype)) {
      return { ok: false, error: "URL is not a web page" };
    }
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_HTML) {
      return { ok: false, error: "Page too large" };
    }
    const html = Buffer.from(buf).toString("utf8");
    return { ok: true, html, finalUrl: res.url || url };
  } catch (e) {
    const msg =
      e && e.name === "AbortError"
        ? "Site timed out"
        : (e && e.message) || "Could not open URL";
    return { ok: false, error: msg };
  } finally {
    clearTimeout(t);
  }
}

/**
 * Crawl start URL + next pages. Returns cleaned story text.
 */
async function importStoryFromUrl(startUrl) {
  const start = String(startUrl || "").trim();
  if (!isHttpUrl(start)) {
    return { ok: false, error: "Enter a valid http(s) story URL" };
  }

  const seen = new Set();
  const pages = [];
  let queue = [start];
  let lastError = null;

  while (queue.length && pages.length < MAX_PAGES) {
    const url = queue.shift();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    const got = await fetchHtml(url);
    if (!got.ok) {
      lastError = got.error;
      continue;
    }
    const text = cleanStoryText(htmlToText(got.html));
    if (text.length > 80) {
      pages.push({ url: got.finalUrl || url, text, chars: text.length });
    }
    const nexts = findNextPageUrls(got.html, got.finalUrl || url, seen);
    for (const n of nexts) {
      if (!seen.has(n) && queue.indexOf(n) === -1) queue.push(n);
    }
    // Prefer sequential page numbers over random related links
    if (pages.length >= MAX_PAGES) break;
    const total = pages.reduce((s, p) => s + p.chars, 0);
    if (total >= MAX_CHARS) break;
  }

  if (!pages.length) {
    return {
      ok: false,
      error: lastError || "Could not read story text from that URL",
    };
  }

  let merged = pages.map((p) => p.text).join("\n\n");
  if (merged.length > MAX_CHARS) merged = merged.slice(0, MAX_CHARS);

  return {
    ok: true,
    text: merged,
    pageCount: pages.length,
    pages: pages.map((p) => ({ url: p.url, chars: p.chars })),
    chars: merged.length,
    truncated: merged.length >= MAX_CHARS,
  };
}

function importStoryFromText(raw) {
  const text = cleanStoryText(String(raw || ""));
  if (text.length < 120) {
    return {
      ok: false,
      error: "Paste more of the story (at least a few paragraphs)",
    };
  }
  return {
    ok: true,
    text: text.slice(0, MAX_CHARS),
    pageCount: 1,
    pages: [],
    chars: Math.min(text.length, MAX_CHARS),
    truncated: text.length > MAX_CHARS,
  };
}

function buildSummarizePrompt(storyText) {
  const clip = String(storyText || "").slice(0, 28000);
  return (
    "You read an adult Hindi/Hinglish sex story. Extract a compact RP scene card for WhatsApp roleplay.\n" +
    "Return ONLY valid JSON (no markdown) with keys:\n" +
    'characterName (AI display name),\n' +
    'botRole (one of: mummy, dad, saas, bahu, bhabhi, wife, girlfriend, sister, custom short),\n' +
    'userRole (one of: beta, beti, son, daughter, devar, jeth, husband, boyfriend, custom short),\n' +
    'botGender (female|male),\n' +
    'userGender (female|male),\n' +
    'brief (1-2 lines: place + situation + heat start — Roman Hinglish/English),\n' +
    'resistance (strict|normal|easy),\n' +
    'vibe (shy and flirty|soft romantic|already heated),\n' +
    'storyCard (4-7 lines: who is who, what already happened, what they want next — do NOT copy long passages),\n' +
    'openingHint (1 line: how first in-character message should feel).\n' +
    "Ignore website comments, ads, and navigation junk.\n" +
    "Adapt roles to the MAIN pair in the story (usually mother/son or similar).\n\n" +
    "STORY TEXT:\n" +
    clip
  );
}

function parseSceneJson(raw) {
  let t = String(raw || "").trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start >= 0 && end > start) t = t.slice(start, end + 1);
  try {
    const obj = JSON.parse(t);
    if (!obj || typeof obj !== "object") return null;
    return {
      characterName: String(obj.characterName || "Maa").slice(0, 40),
      botRole: String(obj.botRole || "mummy").slice(0, 40).toLowerCase(),
      userRole: String(obj.userRole || "beta").slice(0, 40).toLowerCase(),
      botGender: /male/i.test(String(obj.botGender || "")) ? "male" : "female",
      userGender: /female/i.test(String(obj.userGender || ""))
        ? "female"
        : "male",
      brief: String(obj.brief || "").slice(0, 400),
      resistance: /easy|normal|strict/i.test(String(obj.resistance || ""))
        ? String(obj.resistance).toLowerCase()
        : "normal",
      vibe: String(obj.vibe || "shy and flirty").slice(0, 60),
      storyCard: String(obj.storyCard || "").slice(0, 1200),
      openingHint: String(obj.openingHint || "").slice(0, 220),
    };
  } catch (_) {
    return null;
  }
}

module.exports = {
  MAX_PAGES,
  importStoryFromUrl,
  importStoryFromText,
  buildSummarizePrompt,
  parseSceneJson,
  isHttpUrl,
};
