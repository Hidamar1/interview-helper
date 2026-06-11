import { formatCount } from "./format";

describe("formatCount", () => {
  it("千以下原样输出", () => {
    expect(formatCount(0)).toBe("0");
    expect(formatCount(986)).toBe("986");
  });
  it("千以上转 k，去掉多余 .0", () => {
    expect(formatCount(1234)).toBe("1.2k");
    expect(formatCount(2000)).toBe("2k");
    expect(formatCount(15600)).toBe("15.6k");
  });
});
