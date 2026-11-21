import { useEffect, useRef } from "react";

const PI = "31415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679";

/** Starfield + sparse falling pi digits. `warp` accelerates stars into streaks. */
export default function Starfield({ warp }: { warp: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const warpRef = useRef(warp);
  warpRef.current = warp;

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, raf = 0, speed = 1;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const stars = Array.from({ length: 160 }, () => ({ x: Math.random(), y: Math.random(), z: Math.random() * 0.9 + 0.1 }));
    const cols = Array.from({ length: 14 }, () => ({ x: Math.random(), y: Math.random() * -1, v: 0.02 + Math.random() * 0.05, o: Math.floor(Math.random() * 90) }));
    const resize = () => {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    const frame = () => {
      speed += ((warpRef.current ? 14 : 1) - speed) * 0.06;
      ctx.fillStyle = warpRef.current ? "rgba(5,8,20,0.28)" : "rgba(5,8,20,0.55)";
      ctx.fillRect(0, 0, w, h);
      for (const s of stars) {
        s.y += (0.0004 + s.z * 0.0012) * speed;
        if (s.y > 1) { s.y = 0; s.x = Math.random(); }
        const px = s.x * w, py = s.y * h;
        ctx.strokeStyle = `rgba(190,215,255,${0.25 + s.z * 0.6})`;
        ctx.lineWidth = s.z * 1.6;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + 1 + speed * s.z * 2); ctx.stroke();
      }
      ctx.font = "13px 'JetBrains Mono', monospace";
      for (const c of cols) {
        c.y += c.v * 0.016 * (1 + speed * 0.3);
        if (c.y > 1.3) { c.y = -0.3; c.x = Math.random(); }
        for (let i = 0; i < 12; i++) {
          ctx.fillStyle = `rgba(120,200,255,${(0.28 - i * 0.022) * 0.7})`;
          ctx.fillText(PI[(c.o + i) % PI.length], c.x * w, (c.y * h) - i * 16);
        }
      }
      if (!reduce) raf = requestAnimationFrame(frame);
    };
    frame();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={ref} className="starfield" aria-hidden="true" />;
}
