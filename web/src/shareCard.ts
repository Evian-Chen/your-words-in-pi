import type { Located } from "../../shared/locate";

export async function renderCard(units: Located[]): Promise<Blob> {
  const W = 1080, H = 1350;
  try {
    await Promise.all([
      document.fonts.load("600 64px 'Noto Serif TC'"),
      document.fonts.load("400 26px 'JetBrains Mono'"),
    ]);
  } catch { /* fall back to system fonts */ }
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d")!;
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#050814"); bg.addColorStop(1, "#0b1330");
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 220; i++) {
    g.fillStyle = `rgba(190,215,255,${0.15 + rnd() * 0.6})`;
    g.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 2, 1 + rnd() * 2);
  }

  g.textAlign = "center";
  g.fillStyle = "rgba(140,200,255,.9)"; g.font = "400 30px 'JetBrains Mono', monospace";
  g.fillText("π = 3.14159265358979…", W / 2, 120);
  g.fillStyle = "#e8efff"; g.font = "300 38px 'Noto Serif TC', serif";
  g.fillText("你說過的每一句話，早已寫在圓周率裡", W / 2, 200);

  const sentence = units.map((u) => u.char).join("");
  g.font = "600 76px 'Noto Serif TC', serif"; g.fillStyle = "#ffffff";
  const lines: string[] = [];
  let cur = "";
  for (const ch of sentence) {
    if (g.measureText(cur + ch).width > W - 200) { lines.push(cur); cur = ch; } else cur += ch;
  }
  if (cur) lines.push(cur);
  const shown = lines.slice(0, 4);
  if (lines.length > 4) shown[3] = shown[3].slice(0, -1) + "…";
  let y = 360;
  for (const l of shown) { g.fillText(l, W / 2, y); y += 100; }

  y = Math.max(y + 40, 700);
  g.textAlign = "left";
  const seen = new Set<string>();
  const rows: Located[] = [];
  for (const u of units) {
    if (!seen.has(u.char) && u.char.trim()) { seen.add(u.char); rows.push(u); if (rows.length >= 18) break; }
  }
  rows.forEach((u, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 110 + col * 480, yy = y + row * 56;
    g.fillStyle = "#ffffff"; g.font = "600 34px 'Noto Serif TC', serif"; g.fillText(u.char, x, yy);
    g.fillStyle = "rgba(140,200,255,.95)"; g.font = "400 26px 'JetBrains Mono', monospace";
    g.fillText(u.position ? `第 ${u.position.toLocaleString()} 位` : "—", x + 70, yy);
  });
  g.textAlign = "center"; g.fillStyle = "rgba(190,215,255,.55)"; g.font = "400 24px 'JetBrains Mono', monospace";
  g.fillText("your words in π", W / 2, H - 70);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/png"));
}
