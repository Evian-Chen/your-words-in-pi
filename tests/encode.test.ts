import { describe, it, expect } from "vitest";
import { toUnits, encodeCp, decodeDigits, toBase64Url, fromBase64Url } from "../shared/encode";

describe("encode", () => {
  it("encodes CJK", () => {
    const u = toUnits("中")[0];
    expect(u.digits).toBe("20013");
    expect(u.binary).toBe("0100111000101101");
    expect(decodeDigits(u.digits)).toBe(0x4e2d);
  });
  it("pads ASCII to 5 digits", () => expect(encodeCp(65).digits).toBe("00065"));
  it("handles emoji as one unit with 21 bits", () => {
    const u = toUnits("😀");
    expect(u).toHaveLength(1);
    expect(u[0].digits).toBe("128512");
    expect(u[0].binary).toHaveLength(21);
  });
  it("round-trips every BMP code point digits<->binary", () => {
    for (let cp = 0; cp < 0x10000; cp += 97) {
      const e = encodeCp(cp);
      expect(decodeDigits(e.digits)).toBe(cp);
      expect(parseInt(e.binary, 2)).toBe(cp);
    }
  });
  it("empty text gives no units", () => expect(toUnits("   ")).toHaveLength(0));
  it("base64url round-trips unicode", () => {
    const s = "你好 hello 😀";
    expect(fromBase64Url(toBase64Url(s))).toBe(s);
  });
});
