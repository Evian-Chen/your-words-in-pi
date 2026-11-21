import { useEffect, useMemo, useRef, useState } from "react";
import type { Located } from "../../shared/locate";
import { toBase64Url } from "../../shared/encode";
import { renderCard } from "./shareCard";

type Phase = "scan" | "binary" | "char";
const fmt = (n: number) => n.toLocaleString("en-US");

export default function Result({ units, digitsCount, truncated, onAgain }: { units: Located[]; digitsCount: number; truncated: boolean; onAgain: () => void }) {
  const reduce = useMemo(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  const [i, setI] = useState(reduce ? units.length : 0);
  const [phase, setPhase] = useState<Phase>("scan");
  const [counter, setCounter] = useState(0);
  const done = i >= units.length;
  const perUnit = Math.min(2600, Math.max(380, 9000 / units.length));

  useEffect(() => {
    if (done) return;
    setPhase("scan");
    const t1 = setTimeout(() => setPhase("binary"), perUnit * 0.45);
    const t2 = setTimeout(() => setPhase("char"), perUnit * 0.75);
    const t3 = setTimeout(() => setI((x) => x + 1), perUnit);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [i, done, perUnit]);

  const cur = units[Math.min(i, units.length - 1)];
  useEffect(() => {
    if (done || !cur.position) { setCounter(cur.position ?? 0); return; }
    const start = performance.now(), dur = perUnit * 0.45, target = cur.position;
    let raf = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / dur);
      setCounter(Math.round(target * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [i, done]); // eslint-disable-line react-hooks/exhaustive-deps

  const [menu, setMenu] = useState(false);
  const [toast, setToast] = useState("");
  const toastT = useRef<number>();
  const say = (m: string) => { setToast(m); clearTimeout(toastT.current); toastT.current = window.setTimeout(() => setToast(""), 2200); };
  const sentence = units.map((u) => u.char).join("");
  const url = `${location.origin}/r/${toBase64Url(sentence)}`;
  const shareText = `我說的「${sentence.slice(0, 30)}」，每個字都藏在圓周率裡 ✨`;

  const download = async () => {
    try {
      const blob = await renderCard(units);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = "your-words-in-pi.png"; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    } catch { say("圖片產生失敗"); }
  };
  const share = async () => {
    try {
      const blob = await renderCard(units);
      const file = new File([blob], "your-words-in-pi.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], text: shareText, url }); return; }
      if (navigator.share) { await navigator.share({ text: shareText, url }); return; }
    } catch (e) { if ((e as Error).name === "AbortError") return; }
    setMenu((m) => !m);
  };
  const copy = async () => { try { await navigator.clipboard.writeText(url); say("已複製連結"); } catch { say("無法複製，請手動複製網址"); } };
  const q = encodeURIComponent;

  return (
    <main className="result">
      {!done && (
        <section className="stage" aria-live="polite">
          <div className="label">第 <b>{fmt(counter)}</b> 位</div>
          <div className="strip" key={`s${i}`}>
            {cur.context ? (
              <><span className="dim">{cur.context[0]}</span><span className="hit">{cur.context[1]}</span><span className="dim">{cur.context[2]}</span></>
            ) : <span className="dim">未在前 {fmt(digitsCount)} 位找到 {cur.digits}</span>}
          </div>
          <div className={`bin ${phase !== "scan" ? "on" : ""}`}>
            <span className="small">{cur.digits} →</span> {cur.binary.split("").map((b, k) => <span key={k} style={{ animationDelay: `${k * 18}ms` }}>{b}</span>)}
          </div>
          <div className={`bigchar ${phase === "char" ? "on" : ""}`}>{cur.char === " " ? "␣" : cur.char}</div>
          <div className="progress">{i + 1} / {units.length}</div>
        </section>
      )}

      <section className="sentence" aria-label="你的話">
        {units.map((u, k) => <span key={k} className={k < i ? "shown" : ""}>{k < i ? (u.char === " " ? " " : u.char) : "·"}</span>)}
      </section>

      {!done && <button className="ghost" onClick={() => setI(units.length)}>跳過動畫</button>}

      {done && (
        <section className="summary">
          <p className="note">每個字都在圓周率的小數點後，各自散落在不同的位置：</p>
          <ul className="chips">
            {units.map((u, k) => (
              <li key={k}>
                <span className="c">{u.char === " " ? "␣" : u.char}</span>
                <span className="p">{u.position ? `第 ${fmt(u.position)}–${fmt(u.position + u.digits.length - 1)} 位` : `前 ${fmt(digitsCount)} 位內未出現`}</span>
                <span className="d">{u.digits}</span>
              </li>
            ))}
          </ul>
          {truncated && <p className="note small">句子過長，只顯示前 {units.length} 個字。</p>}
          {/* <p className="note small">整句話的位置要走過天文數字般的位數，所以這裡找的是每個字各自第一次出現的地方。</p> */}
          <div className="actions">
            <button onClick={download}>下載成果圖片</button>
            <button onClick={share}>分享到社群</button>
            <button className="ghost" onClick={onAgain}>回到首頁再玩一次</button>
          </div>
          {menu && (
            <div className="menu">
              <a href={`https://twitter.com/intent/tweet?text=${q(shareText)}&url=${q(url)}`} target="_blank" rel="noreferrer">X</a>
              <a href={`https://www.threads.net/intent/post?text=${q(shareText + " " + url)}`} target="_blank" rel="noreferrer">Threads</a>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${q(url)}`} target="_blank" rel="noreferrer">Facebook</a>
              <a href={`https://social-plugins.line.me/lineit/share?url=${q(url)}`} target="_blank" rel="noreferrer">LINE</a>
              <button onClick={copy}>複製連結</button>
            </div>
          )}
        </section>
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}
