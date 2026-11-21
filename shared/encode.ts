// Encoding between characters, decimal digit strings and binary.
// A code point is written as its decimal value padded to at least 5 digits
// (e.g. 中 U+4E2D = 20013 -> "20013", 'A' = 65 -> "00065", 😀 U+1F600 = 128512 -> "128512").
// The binary form is 16 bits for BMP code points and 21 bits otherwise.

export const MAX_UNITS = 60;

export interface Unit {
  char: string;
  cp: number;
  digits: string;
  binary: string;
}

export function encodeCp(cp: number): { digits: string; binary: string } {
  const digits = String(cp).padStart(5, "0");
  const bits = cp < 0x10000 ? 16 : 21;
  return { digits, binary: cp.toString(2).padStart(bits, "0") };
}

export function decodeDigits(digits: string): number {
  return parseInt(digits, 10);
}

export function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Split into code point units (surrogate pairs kept whole). */
export function toUnits(text: string): Unit[] {
  const out: Unit[] = [];
  for (const char of normalizeText(text)) {
    const cp = char.codePointAt(0)!;
    out.push({ char, cp, ...encodeCp(cp) });
  }
  return out;
}

export function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function fromBase64Url(id: string): string {
  const b64 = id.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
