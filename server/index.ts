import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { locate, type PiIndex } from "../shared/locate";
import { fromBase64Url, normalizeText } from "../shared/encode";
import { getCount, incrCount, counterMode } from "./counter";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const p = (...s: string[]) => path.join(root, ...s);

function loadIndex(): PiIndex {
  const bin = readFileSync(p("data", "pi-index.bin"));
  const table = new Uint32Array(bin.buffer, bin.byteOffset, bin.byteLength / 4);
  const meta = JSON.parse(readFileSync(p("data", "pi-index.meta.json"), "utf8"));
  const digits = existsSync(p("data", "pi-digits.txt")) ? readFileSync(p("data", "pi-digits.txt"), "utf8") : undefined;
  return { table, digitsCount: meta.digitsCount, digits };
}
const index = loadIndex();

// naive in-memory rate limit: 30 requests / minute / ip
const hits = new Map<string, number[]>();
function limited(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 30;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

export const app = new Hono();

app.post("/api/locate", async (c) => {
  const ip = c.req.header("x-forwarded-for")?.split(",")[0] ?? "local";
  if (limited(ip)) return c.json({ error: "too_many_requests" }, 429);
  const body = await c.req.json().catch(() => null);
  const text = typeof body?.text === "string" ? normalizeText(body.text) : "";
  if (!text) return c.json({ error: "empty" }, 400);
  if (text.length > 400) return c.json({ error: "too_long" }, 400);
  // Only a real press of the search button counts as a visit (not opening a shared link).
  const count = body?.count === true ? await incrCount() : await getCount();
  return c.json({ digitsCount: index.digitsCount, count, ...locate(text, index) });
});

app.get("/api/count", async (c) => c.json({ count: await getCount() }));

// Health check for uptime pingers.
app.on(["GET", "HEAD"], "/health", (c) => c.json({ ok: true }));

// Share page: serve the SPA shell with OG meta for the encoded sentence.
app.get("/r/:id", (c) => {
  let text = "";
  try { text = normalizeText(fromBase64Url(c.req.param("id"))).slice(0, 60); } catch { /* ignore */ }
  const htmlPath = p("web", "dist", "index.html");
  if (!existsSync(htmlPath)) return c.text("build the web app first (npm run build)", 503);
  const title = text ? `「${text}」藏在圓周率裡` : "Your Words in π";
  const desc = "你說過的每一句話，每個字都早已寫在圓周率裡。輸入一句話，看它散落在 π 的哪些位置。";
  const meta = `<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:type" content="website">`;
  const html = readFileSync(htmlPath, "utf8").replace("</head>", `${meta}</head>`);
  return c.html(html);
});

app.use("/*", serveStatic({ root: "./web/dist" }));

const port = Number(process.env.PORT ?? 8787);
if (process.env.VITEST === undefined) {
  serve({ fetch: app.fetch, port });
  console.log(`server on http://localhost:${port} (pi digits: ${index.digitsCount}, counter: ${counterMode})`);
  if (counterMode === "file") console.warn("UPSTASH_REDIS_REST_URL/TOKEN not set: visit count is stored in a local file and resets on redeploy.");
}
