import { toUnits, MAX_UNITS } from "./encode";

/** Index layout: [0, 1e5) = first position of each 5-digit pattern,
 *  [1e5, 1e5+1e6) = first position of each 6-digit pattern. 0 = not found. 1-based. */
export const IDX5 = 100_000;
export const IDX6 = 1_000_000;

export interface PiIndex {
  table: Uint32Array;
  digitsCount: number;
  /** optional: raw pi digits for showing context */
  digits?: string;
}

export interface Located {
  char: string;
  cp: number;
  digits: string;
  binary: string;
  /** 1-based position after the decimal point where the pattern starts; null if not found */
  position: number | null;
  /** pi digits around the match: [before, match, after] */
  context: [string, string, string] | null;
}

export function lookup(index: PiIndex, cp: number): number | null {
  let p = 0;
  if (cp < IDX5) p = index.table[cp];
  else if (cp < IDX6) p = index.table[IDX5 + cp];
  return p > 0 ? p : null;
}

export function locate(text: string, index: PiIndex): { units: Located[]; truncated: boolean } {
  let units = toUnits(text);
  const truncated = units.length > MAX_UNITS;
  units = units.slice(0, MAX_UNITS);
  return {
    truncated,
    units: units.map((u) => {
      const position = lookup(index, u.cp);
      let context: Located["context"] = null;
      if (position && index.digits) {
        const s = position - 1;
        context = [
          index.digits.slice(Math.max(0, s - 16), s),
          index.digits.slice(s, s + u.digits.length),
          index.digits.slice(s + u.digits.length, s + u.digits.length + 16),
        ];
      }
      return { ...u, position, context };
    }),
  };
}
