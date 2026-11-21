// Build data/pi-index.bin from a text file of pi digits (digits after the decimal point).
// Usage: node scripts/build-index.mjs [data/pi-digits.txt]
import { readFileSync, writeFileSync } from "node:fs";
const src = process.argv[2] ?? "data/pi-digits.txt";
const buf = readFileSync(src);
const IDX5 = 100_000, IDX6 = 1_000_000;
const table = new Uint32Array(IDX5 + IDX6);
let v5 = 0, v6 = 0;
for (let i = 0; i < buf.length; i++) {
  const d = buf[i] - 48;
  if (d < 0 || d > 9) throw new Error(`non-digit at ${i}`);
  v5 = (v5 * 10 + d) % IDX5;
  v6 = (v6 * 10 + d) % IDX6;
  if (i >= 4 && table[v5] === 0) table[v5] = i - 3; // 1-based start
  if (i >= 5 && table[IDX5 + v6] === 0) table[IDX5 + v6] = i - 4;
}
let miss5 = 0;
for (let c = 0; c < IDX5; c++) if (table[c] === 0) miss5++;
// emoji / symbols block (6-digit code points) U+1F000..U+1FAFF
let miss6 = 0, total6 = 0;
for (let c = 0x1f000; c <= 0x1faff; c++) { total6++; if (table[IDX5 + c] === 0) miss6++; }
writeFileSync("data/pi-index.bin", Buffer.from(table.buffer));
writeFileSync("data/pi-index.meta.json", JSON.stringify({ digitsCount: buf.length }));
console.log(`digits=${buf.length}`);
console.log(`5-digit patterns missing: ${miss5} / ${IDX5}`);
console.log(`emoji-block 6-digit patterns missing: ${miss6} / ${total6}`);
