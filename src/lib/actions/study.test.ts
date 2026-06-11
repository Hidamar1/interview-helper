import { describe, it, expect } from "vitest";

describe("study actions", () => {
  it("模块应正确导出 action 函数", async () => {
    const mod = await import("./study");
    expect(typeof mod.recordStudy).toBe("function");
    expect(typeof mod.getHeatmapData).toBe("function");
    expect(typeof mod.getStudyCount).toBe("function");
  });
});
