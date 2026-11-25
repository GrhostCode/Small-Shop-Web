// Small Shop Web: Claude API gateway.
//
// Serves the static site as before, plus:
//
//   POST /api/ai/v1/messages              Claude Messages API (same request/response format)
//   POST /api/ai/v1/messages/count_tokens Token counting (free, not metered)
//   GET  /api/ai/usage                    A site key's spend this month
//   /api/admin/...                        Issue, list and revoke site keys; usage for invoicing
//
// Two ways to authenticate, both through the normal `x-api-key` header, so the official
// Anthropic SDKs work by changing only the base URL:
//
//   ssw_live_...  A Small Shop Web site key. The request goes out with the owner's Anthropic
//                 key (the ANTHROPIC_API_KEY secret), which the customer never sees. Each
//                 request is metered at Anthropic's list price and recorded for invoicing.
//   sk-ant-...    The customer's own Anthropic key. Passed straight through, not metered,
//                 not stored. (They can also call api.anthropic.com directly.)
//
// This is a byte-for-byte pass-through proxy, so it forwards with fetch() instead of
// re-encoding requests through an SDK: streaming, tools, and new API fields all keep working.

const DEFAULT_UPSTREAM = "https://api.anthropic.com";
const PROXIED_PATHS = new Set(["/v1/messages", "/v1/messages/count_tokens"]);
const METERED_PATH = "/v1/messages";

// USD per million tokens, Anthropic first-party list prices (checked 2026-11).
// Verify against https://claude.com/pricing whenever you change this table.
// cacheRead defaults to 10% of input when not listed. Cache writes: 1.25x input (5 min), 2x (1 h).
// Only models listed here can be used with a site key, so nothing goes out unpriced.
const PRICES = {
  "claude-fable-5-2":  { in: 8,    out: 40,   cacheRead: 0.20 },
  "claude-opus-5-5":   { in: 4,    out: 20,   cacheRead: 0.20 },
  "claude-opus-5":     { in: 5,    out: 25,   cacheRead: 0.50 },
  "claude-sonnet-5-5": { in: 2,    out: 10,   cacheRead: 0.10 },
  "claude-sonnet-5":   { in: 2,    out: 10,   cacheRead: 0.20 },
  "claude-haiku-5-5":  { in: 0.10, out: 0.50, long: { above: 100000, in: 0.50, out: 2.50 } },
};
const WEB_SEARCH_USD = 0.01; // $10 per 1,000 searches
const FAST_MODE_MULTIPLIER = 2;

// Headers the client may send that are forwarded upstream.
const FORWARD_REQUEST_HEADERS = ["anthropic-version", "anthropic-beta"];
// Upstream headers returned to the client. Rate-limit headers are dropped for site keys:
// they describe the owner's account.
const RETURN_HEADERS = ["content-type", "request-id", "retry-after"];
const CORS_ALLOW_HEADERS =
  "content-type, x-api-key, authorization, anthropic-version, anthropic-beta, anthropic-dangerous-direct-browser-access, x-stainless-arch, x-stainless-lang, x-stainless-os, x-stainless-package-version, x-stainless-retry-count, x-stainless-runtime, x-stainless-runtime-version, x-stainless-timeout";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith("/api/ai/")) return await handleAi(request, env, ctx, url);
      if (url.pathname.startsWith("/api/admin/")) return await handleAdmin(request, env, url);
    } catch (err) {
      console.error("gateway error", err && err.stack ? err.stack : err);
      return apiError(500, "api_error", "Internal gateway error.", request);
    }
    return env.ASSETS ? env.ASSETS.fetch(request) : new Response("Not found", { status: 404 });
  },
};

// ---------------------------------------------------------------- AI gateway

async function handleAi(request, env, ctx, url) {
  if (request.method === "OPTIONS") return preflight(request);

  const key = readKey(request);
  const path = url.pathname.slice("/api/ai".length);

  if (path === "/usage" && request.method === "GET") return customerUsage(request, env, key);
  if (!PROXIED_PATHS.has(path)) return apiError(404, "not_found_error", "Only /v1/messages and /v1/messages/count_tokens are available.", request);
  if (request.method !== "POST") return apiError(405, "invalid_request_error", "Use POST.", request);
  if (!key) return apiError(401, "authentication_error", "Send your Small Shop Web key (or your own Anthropic key) in the x-api-key header.", request);

  const upstream = (env.ANTHROPIC_UPSTREAM || DEFAULT_UPSTREAM).replace(/\/$/, "") + path;

  // Bring your own key: pass straight through, nothing metered or stored.
  if (key.startsWith("sk-ant-")) {
    const res = await forward(request, upstream, key, await request.text());
    return relay(res, request, { keepRateLimitHeaders: true });
  }

  if (!key.startsWith("ssw_")) return apiError(401, "authentication_error", "Unrecognised key.", request);
  if (!env.DB || !env.ANTHROPIC_API_KEY) return apiError(503, "api_error", "Small Shop Web keys are not set up on this server yet.", request);

  const site = await findKey(env, key);
  if (!site || !site.active) return apiError(401, "authentication_error", "This key is invalid or has been revoked.", request);

  const origin = request.headers.get("origin");
  const allowed = JSON.parse(site.allowed_origins || "[]");
  if (origin && !allowed.includes(origin)) {
    return apiError(403, "permission_error", `Requests from ${origin} are not allowed for this key.`, request);
  }

  const bodyText = await request.text();
  let body;
  try { body = JSON.parse(bodyText); } catch { return apiError(400, "invalid_request_error", "Body must be JSON.", request); }
  if (!PRICES[body.model]) {
    return apiError(400, "invalid_request_error", `Model "${body.model}" is not available with a Small Shop Web key. Available: ${Object.keys(PRICES).join(", ")}.`, request);
  }

  const metered = path === METERED_PATH;
  if (metered && site.monthly_cap_micros != null) {
    const spent = await monthSpend(env, site.id, currentMonth());
    if (spent >= site.monthly_cap_micros) {
      return apiError(402, "billing_error", `Monthly limit of $${micros(site.monthly_cap_micros)} reached for this key.`, request);
    }
  }

  const res = await forward(request, upstream, env.ANTHROPIC_API_KEY, bodyText);
  if (!metered || !res.ok || !res.body) return relay(res, request);

  const record = (usage, model) => recordUsage(env, site.id, model || body.model, usage, res.headers.get("request-id"));

  if ((res.headers.get("content-type") || "").includes("text/event-stream")) {
    const [toClient, toMeter] = res.body.tee();
    ctx.waitUntil(meterStream(toMeter, record));
    return relay(res, request, { body: toClient });
  }

  const copy = res.clone();
  ctx.waitUntil(copy.json().then((msg) => msg && msg.usage && record(msg.usage, msg.model)).catch((e) => console.error("meter", e)));
  return relay(res, request);
}

function readKey(request) {
  const k = request.headers.get("x-api-key");
  if (k) return k.trim();
  const auth = request.headers.get("authorization") || "";
  return auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
}

function forward(request, upstream, apiKey, bodyText) {
  const headers = new Headers({ "content-type": "application/json", "x-api-key": apiKey });
  for (const h of FORWARD_REQUEST_HEADERS) {
    const v = request.headers.get(h);
    if (v) headers.set(h, v);
  }
  if (!headers.has("anthropic-version")) headers.set("anthropic-version", "2023-06-01");
  return fetch(upstream, { method: "POST", headers, body: bodyText });
}

function relay(res, request, { body, keepRateLimitHeaders = false } = {}) {
  const headers = new Headers();
  res.headers.forEach((v, k) => {
    if (RETURN_HEADERS.includes(k) || (keepRateLimitHeaders && k.startsWith("anthropic-ratelimit-"))) headers.set(k, v);
  });
  addCors(headers, request);
  return new Response(body === undefined ? res.body : body, { status: res.status, headers });
}

// Reads the SSE stream to the end (even if the client disconnects) and records final usage.
async function meterStream(stream, record) {
  const reader = stream.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "", usage = null, model = null;
  const take = (line) => {
    if (!line.startsWith("data:")) return;
    let ev;
    try { ev = JSON.parse(line.slice(5).trim()); } catch { return; }
    if (ev.type === "message_start" && ev.message) {
      usage = { ...(ev.message.usage || {}) };
      model = ev.message.model;
    } else if (ev.type === "message_delta" && ev.usage) {
      usage = { ...(usage || {}), ...ev.usage };
    }
  };
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += value;
      let i;
      while ((i = buf.indexOf("\n")) >= 0) { take(buf.slice(0, i).replace(/\r$/, "")); buf = buf.slice(i + 1); }
    }
    take(buf);
  } catch (e) {
    console.error("stream meter", e);
  }
  if (usage) await record(usage, model);
}

// ---------------------------------------------------------------- pricing & usage

export function costMicros(model, u) {
  const p = PRICES[model];
  if (!p) return null;
  const input = u.input_tokens || 0;
  const output = u.output_tokens || 0;
  const cacheRead = u.cache_read_input_tokens || 0;
  let write5m = 0, write1h = 0;
  if (u.cache_creation && typeof u.cache_creation === "object") {
    write5m = u.cache_creation.ephemeral_5m_input_tokens || 0;
    write1h = u.cache_creation.ephemeral_1h_input_tokens || 0;
  } else {
    write5m = u.cache_creation_input_tokens || 0;
  }
  let rin = p.in, rout = p.out, rread = p.cacheRead ?? p.in * 0.1;
  if (p.long && input + cacheRead + write5m + write1h > p.long.above) {
    rin = p.long.in; rout = p.long.out; rread = p.long.in * 0.1;
  }
  const mult = u.speed === "fast" ? FAST_MODE_MULTIPLIER : 1;
  // rates are $/MTok, so tokens * rate is already in micro-dollars
  let total = (input * rin + write5m * rin * 1.25 + write1h * rin * 2 + cacheRead * rread + output * rout) * mult;
  total += ((u.server_tool_use && u.server_tool_use.web_search_requests) || 0) * WEB_SEARCH_USD * 1e6;
  return Math.round(total);
}

async function recordUsage(env, keyId, model, u, requestId) {
  const cost = costMicros(model, u);
  if (cost == null) { console.error("no price for model", model); return; }
  const cacheWrite = u.cache_creation && typeof u.cache_creation === "object"
    ? (u.cache_creation.ephemeral_5m_input_tokens || 0) + (u.cache_creation.ephemeral_1h_input_tokens || 0)
    : u.cache_creation_input_tokens || 0;
  await env.DB.prepare(
    `INSERT INTO usage (key_id, month, model, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, web_searches, cost_micros, request_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    keyId, currentMonth(), model, u.input_tokens || 0, u.output_tokens || 0, u.cache_read_input_tokens || 0,
    cacheWrite, (u.server_tool_use && u.server_tool_use.web_search_requests) || 0, cost, requestId, new Date().toISOString()
  ).run();
}

async function monthSpend(env, keyId, month) {
  const row = await env.DB.prepare("SELECT COALESCE(SUM(cost_micros), 0) AS spent FROM usage WHERE key_id = ? AND month = ?")
    .bind(keyId, month).first();
  return row ? row.spent : 0;
}

async function customerUsage(request, env, key) {
  if (!key || !key.startsWith("ssw_")) return apiError(401, "authentication_error", "Send your Small Shop Web key in the x-api-key header.", request);
  if (!env.DB) return apiError(503, "api_error", "Small Shop Web keys are not set up on this server yet.", request);
  const site = await findKey(env, key);
  if (!site) return apiError(401, "authentication_error", "This key is invalid or has been revoked.", request);
  const month = currentMonth();
  const t = await monthTotals(env, site.id, month);
  return json({
    name: site.name, month, active: !!site.active,
    requests: t.requests, input_tokens: t.input_tokens, output_tokens: t.output_tokens,
    spent_usd: micros(t.cost_micros),
    monthly_cap_usd: site.monthly_cap_micros == null ? null : micros(site.monthly_cap_micros),
  }, 200, request);
}

async function monthTotals(env, keyId, month) {
  return env.DB.prepare(
    `SELECT COUNT(*) AS requests, COALESCE(SUM(input_tokens),0) AS input_tokens, COALESCE(SUM(output_tokens),0) AS output_tokens,
            COALESCE(SUM(cache_read_tokens),0) AS cache_read_tokens, COALESCE(SUM(cache_write_tokens),0) AS cache_write_tokens,
            COALESCE(SUM(web_searches),0) AS web_searches, COALESCE(SUM(cost_micros),0) AS cost_micros
     FROM usage WHERE key_id = ? AND month = ?`
  ).bind(keyId, month).first();
}

// ---------------------------------------------------------------- admin

async function handleAdmin(request, env, url) {
  if (!env.ADMIN_TOKEN || !env.DB) return json({ error: "Admin API is not set up (ADMIN_TOKEN secret and DB binding)." }, 503);
  const auth = request.headers.get("authorization") || "";
  if (!(await sameSecret(auth, `Bearer ${env.ADMIN_TOKEN}`))) return json({ error: "Unauthorized" }, 401);

  const path = url.pathname.slice("/api/admin".length);

  // Create a key: { name, allowed_origins?: ["https://client.com"], monthly_cap_usd?: 20 }
  if (path === "/keys" && request.method === "POST") {
    const b = await request.json().catch(() => ({}));
    if (!b.name) return json({ error: "name is required" }, 400);
    const origins = Array.isArray(b.allowed_origins) ? b.allowed_origins.map(String) : [];
    const cap = b.monthly_cap_usd == null ? null : Math.round(Number(b.monthly_cap_usd) * 1e6);
    if (cap != null && !(cap >= 0)) return json({ error: "monthly_cap_usd must be a number" }, 400);
    const id = "key_" + randomToken(9);
    const key = "ssw_live_" + randomToken(32);
    await env.DB.prepare(
      "INSERT INTO site_keys (id, name, key_hash, key_hint, allowed_origins, monthly_cap_micros, active, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)"
    ).bind(id, String(b.name), await sha256(key), key.slice(-4), JSON.stringify(origins), cap, new Date().toISOString()).run();
    return json({ id, key, name: b.name, allowed_origins: origins, monthly_cap_usd: b.monthly_cap_usd ?? null,
      note: "Save this key now. It is not stored and cannot be shown again." }, 201);
  }

  if (path === "/keys" && request.method === "GET") {
    const month = currentMonth();
    const { results } = await env.DB.prepare(
      `SELECT k.id, k.name, k.key_hint, k.allowed_origins, k.monthly_cap_micros, k.active, k.created_at,
              COALESCE((SELECT SUM(cost_micros) FROM usage u WHERE u.key_id = k.id AND u.month = ?), 0) AS spent
       FROM site_keys k ORDER BY k.created_at DESC`
    ).bind(month).all();
    return json({ month, keys: results.map((k) => ({
      id: k.id, name: k.name, key_hint: "…" + k.key_hint, allowed_origins: JSON.parse(k.allowed_origins),
      monthly_cap_usd: k.monthly_cap_micros == null ? null : micros(k.monthly_cap_micros),
      active: !!k.active, created_at: k.created_at, spent_this_month_usd: micros(k.spent),
    })) });
  }

  // Update: { name?, allowed_origins?, monthly_cap_usd? (null = no cap), active? }
  let m = path.match(/^\/keys\/(key_[\w-]+)$/);
  if (m && request.method === "PATCH") {
    const b = await request.json().catch(() => ({}));
    const sets = [], vals = [];
    if (b.name != null) { sets.push("name = ?"); vals.push(String(b.name)); }
    if (Array.isArray(b.allowed_origins)) { sets.push("allowed_origins = ?"); vals.push(JSON.stringify(b.allowed_origins.map(String))); }
    if ("monthly_cap_usd" in b) { sets.push("monthly_cap_micros = ?"); vals.push(b.monthly_cap_usd == null ? null : Math.round(Number(b.monthly_cap_usd) * 1e6)); }
    if (typeof b.active === "boolean") { sets.push("active = ?"); vals.push(b.active ? 1 : 0); }
    if (!sets.length) return json({ error: "Nothing to update" }, 400);
    const r = await env.DB.prepare(`UPDATE site_keys SET ${sets.join(", ")} WHERE id = ?`).bind(...vals, m[1]).run();
    return r.meta.changes ? json({ ok: true }) : json({ error: "Not found" }, 404);
  }

  m = path.match(/^\/keys\/(key_[\w-]+)\/revoke$/);
  if (m && request.method === "POST") {
    const r = await env.DB.prepare("UPDATE site_keys SET active = 0 WHERE id = ?").bind(m[1]).run();
    return r.meta.changes ? json({ ok: true, id: m[1], active: false }) : json({ error: "Not found" }, 404);
  }

  // Invoicing: GET /api/admin/usage?month=2026-11
  if (path === "/usage" && request.method === "GET") {
    const month = url.searchParams.get("month") || currentMonth();
    if (!/^\d{4}-\d{2}$/.test(month)) return json({ error: "month must be YYYY-MM" }, 400);
    const { results } = await env.DB.prepare(
      `SELECT k.id, k.name, u.model, COUNT(*) AS requests, SUM(u.input_tokens) AS input_tokens, SUM(u.output_tokens) AS output_tokens,
              SUM(u.cache_read_tokens) AS cache_read_tokens, SUM(u.cache_write_tokens) AS cache_write_tokens,
              SUM(u.web_searches) AS web_searches, SUM(u.cost_micros) AS cost_micros
       FROM usage u JOIN site_keys k ON k.id = u.key_id WHERE u.month = ?
       GROUP BY k.id, u.model ORDER BY k.name, u.model`
    ).bind(month).all();
    const byKey = {};
    for (const r of results) {
      const e = (byKey[r.id] ||= { id: r.id, name: r.name, total_usd: 0, models: [] });
      e.models.push({ model: r.model, requests: r.requests, input_tokens: r.input_tokens, output_tokens: r.output_tokens,
        cache_read_tokens: r.cache_read_tokens, cache_write_tokens: r.cache_write_tokens, web_searches: r.web_searches, cost_usd: micros(r.cost_micros) });
      e.total_micros = (e.total_micros || 0) + r.cost_micros;
    }
    const keys = Object.values(byKey).map(({ total_micros, ...e }) => ({ ...e, total_usd: micros(total_micros) }));
    return json({ month, keys });
  }

  return json({ error: "Not found" }, 404);
}

// ---------------------------------------------------------------- helpers

async function findKey(env, key) {
  return env.DB.prepare("SELECT * FROM site_keys WHERE key_hash = ?").bind(await sha256(key)).first();
}

async function sha256(text) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sameSecret(a, b) {
  const [x, y] = await Promise.all([sha256(a), sha256(b)]);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diff === 0;
}

function randomToken(bytes) {
  const b = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function currentMonth() { return new Date().toISOString().slice(0, 7); }
function micros(n) { return Math.round(n) / 1e6; }

function addCors(headers, request) {
  const origin = request && request.headers.get("origin");
  if (origin) { headers.set("access-control-allow-origin", origin); headers.set("vary", "origin"); }
}

function preflight(request) {
  const headers = new Headers({
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": CORS_ALLOW_HEADERS,
    "access-control-max-age": "86400",
  });
  addCors(headers, request);
  return new Response(null, { status: 204, headers });
}

function json(data, status = 200, request) {
  const headers = new Headers({ "content-type": "application/json" });
  if (request) addCors(headers, request);
  return new Response(JSON.stringify(data, null, 2), { status, headers });
}

// Errors in the same shape as the Anthropic API, so SDKs raise their normal exceptions.
function apiError(status, type, message, request) {
  return json({ type: "error", error: { type, message } }, status, request);
}
