import type { Located } from "../../shared/locate";
export interface LocateResponse { digitsCount: number; count: number | null; units: Located[]; truncated: boolean }

/** `count: true` marks a real search-button press, which increments the visit counter. */
export async function locateText(text: string, count = false): Promise<LocateResponse> {
  const r = await fetch("/api/locate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text, count }) });
  if (!r.ok) throw new Error(r.status === 429 ? "請求太頻繁，請稍後再試" : "查詢失敗，請再試一次");
  return r.json();
}

export async function fetchCount(): Promise<number | null> {
  try { return ((await (await fetch("/api/count")).json()) as { count: number | null }).count; } catch { return null; }
}
