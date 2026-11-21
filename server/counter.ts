import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

// Visit counter. Persists in Upstash Redis (REST) when configured, because
// free hosts such as Render have an ephemeral disk. Falls back to a local
// file for development.
const URL_ = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = "your-words-in-pi:visits";
const FILE = path.resolve("data", "counter.json");

export const counterMode = URL_ && TOKEN ? "upstash" : "file";

async function upstash(cmd: string): Promise<number> {
  const r = await fetch(`${URL_}/${cmd}`, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (!r.ok) throw new Error(`upstash ${r.status}`);
  const j = (await r.json()) as { result: number | string | null };
  return Number(j.result ?? 0);
}

let fileCount: number | null = null;
function readFile(): number {
  if (fileCount === null) {
    try { fileCount = existsSync(FILE) ? Number(JSON.parse(readFileSync(FILE, "utf8")).count) || 0 : 0; } catch { fileCount = 0; }
  }
  return fileCount;
}

export async function getCount(): Promise<number | null> {
  try { return counterMode === "upstash" ? await upstash(`get/${KEY}`) : readFile(); } catch { return null; }
}

export async function incrCount(): Promise<number | null> {
  try {
    if (counterMode === "upstash") return await upstash(`incr/${KEY}`);
    fileCount = readFile() + 1;
    mkdirSync(path.dirname(FILE), { recursive: true });
    writeFileSync(FILE, JSON.stringify({ count: fileCount }));
    return fileCount;
  } catch { return null; }
}
