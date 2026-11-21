import type { Located } from "../../shared/locate";
export interface LocateResponse { digitsCount: number; units: Located[]; truncated: boolean }
export async function locateText(text: string): Promise<LocateResponse> {
  const r = await fetch("/api/locate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }) });
  if (!r.ok) throw new Error(r.status === 429 ? "請求太頻繁，請稍後再試" : "查詢失敗，請再試一次");
  return r.json();
}
