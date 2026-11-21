import { useEffect, useState } from "react";
import Starfield from "./Starfield";
import Result from "./Result";
import { locateText, type LocateResponse } from "./api";
import { fromBase64Url, toBase64Url, MAX_UNITS } from "../../shared/encode";

const TITLE = "你知道圓周率涵蓋了你說過的所有言語嗎？";

export default function App() {
  const [text, setText] = useState("");
  const [warp, setWarp] = useState(false);
  const [data, setData] = useState<LocateResponse | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (t: string, push: boolean) => {
    setBusy(true); setError(""); setWarp(true);
    try {
      const [res] = await Promise.all([locateText(t), new Promise((r) => setTimeout(r, 900))]);
      if (!res.units.length) throw new Error("請輸入一句話");
      setData(res);
      if (push) history.pushState(null, "", `/r/${toBase64Url(t)}`);
    } catch (e) { setError((e as Error).message); }
    setWarp(false); setBusy(false);
  };

  useEffect(() => {
    const m = location.pathname.match(/^\/r\/(.+)$/);
    if (m) { try { const t = fromBase64Url(m[1]); setText(t); run(t, false); } catch { /* ignore */ } }
    const onPop = () => { if (!location.pathname.startsWith("/r/")) setData(null); };
    addEventListener("popstate", onPop);
    return () => removeEventListener("popstate", onPop);
  }, []);

  const again = () => { setData(null); setText(""); history.pushState(null, "", "/"); };
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (text.trim() && !busy) run(text.trim(), true); };

  return (
    <>
      <Starfield warp={warp} />
      {data ? (
        <Result key={data.units.map((u) => u.cp).join(",")} units={data.units} digitsCount={data.digitsCount} truncated={data.truncated} onAgain={again} />
      ) : (
        <main className={`home ${warp ? "leaving" : ""}`}>
          <p className="pi">π = 3.14159265358979323846…</p>
          <h1 aria-label={TITLE}>{TITLE.split("").map((c, i) => <span key={i} style={{ animationDelay: `${300 + i * 70}ms` }} aria-hidden="true">{c}</span>)}</h1>
          <p className="sub">一個無限的數字裡，藏著你寫過、說過，以及還沒說出口的每一個字。<br />來看看它們散落在哪裡。</p>
          <form onSubmit={submit}>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="輸入任何一句話" maxLength={MAX_UNITS} aria-label="輸入任何一句話" autoFocus />
            <button type="submit" disabled={busy || !text.trim()}>{busy ? "尋找中…" : "尋找"}</button>
          </form>
          {error && <p className="err" role="alert">{error}</p>}
        </main>
      )}
    </>
  );
}
