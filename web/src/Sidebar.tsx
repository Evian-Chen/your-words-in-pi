import { useEffect, useState } from "react";
import { encodeCp } from "../../shared/encode";

/** Top-right toggle + slide-in panel explaining how a character becomes a position in pi. */
export default function Sidebar({ example }: { example?: string }) {
  const [open, setOpen] = useState(false);
  const char = example ? Array.from(example)[0] : "中";
  const cp = char.codePointAt(0)!;
  const { digits, binary } = encodeCp(cp);
  const hex = "U+" + cp.toString(16).toUpperCase().padStart(4, "0");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button className="side-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="side-panel" aria-label={open ? "關閉說明" : "開啟說明"}>
        {open ? "✕" : "ⓘ"}
      </button>
      <aside id="side-panel" className={`side-panel ${open ? "open" : ""}`} aria-hidden={!open}>
        <h2>字是怎麼變成位置的？</h2>
        <ol>
          <li>
            <b>文字 → 數字</b>
            <p>電腦裡每個字都有一個編號（Unicode 碼位）。我們把它寫成十進位，不足 5 位就在前面補 0。</p>
            <div className="ex"><span className="big">{char === " " ? "␣" : char}</span> = {hex} = <code>{digits}</code></div>
          </li>
          <li>
            <b>數字 → 二進位</b>
            <p>同一個編號用 0 和 1 寫出來，就是電腦真正儲存這個字的樣子。</p>
            <div className="ex"><code>{digits}</code> → <code className="bin-ex">{binary}</code></div>
          </li>
          <li>
            <b>在 π 裡找位置</b>
            <p>在圓周率小數點後的數字裡，找到這串數字第一次出現的地方，那就是這個字的位置。</p>
            <div className="ex"><code>3.14159265…</code> 往後找 <code>{digits}</code></div>
          </li>
        </ol>
        <p className="side-note">每個字各自找位置，所以一句話裡的字會散落在 π 的不同地方。</p>
      </aside>
    </>
  );
}
