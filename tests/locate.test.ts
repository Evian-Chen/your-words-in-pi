import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { locate, type PiIndex } from "../shared/locate";

const have = existsSync("data/pi-index.bin") && existsSync("data/pi-digits.txt");
describe.skipIf(!have)("locate against real pi digits", () => {
  const bin = readFileSync("data/pi-index.bin");
  const table = new Uint32Array(bin.buffer, bin.byteOffset, bin.byteLength / 4);
  const digits = readFileSync("data/pi-digits.txt", "utf8");
  const index: PiIndex = { table, digitsCount: digits.length, digits };

  it("known pi prefix", () => expect(digits.slice(0, 10)).toBe("1415926535"));
  it("Feynman point at 762", () => expect(digits.slice(761, 767)).toBe("999999"));
  it("every found position really contains the digits", () => {
    const { units } = locate("你說過的每一句話 hello, world 😀", index);
    for (const u of units) {
      if (u.position === null) continue;
      expect(digits.slice(u.position - 1, u.position - 1 + u.digits.length)).toBe(u.digits);
    }
  });
  it("is the FIRST occurrence", () => {
    const { units } = locate("A", index);
    const p = units[0].position!;
    expect(digits.indexOf(units[0].digits) + 1).toBe(p);
  });
});
