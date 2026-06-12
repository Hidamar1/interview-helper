import { describe, it, expect } from "vitest";

describe("interview actions", () => {
  it("模块应正确导出所有 action 函数", async () => {
    const mod = await import("./interview");
    expect(typeof mod.createSession).toBe("function");
    expect(typeof mod.finishSession).toBe("function");
    expect(typeof mod.getInterviewHistory).toBe("function");
    expect(typeof mod.getInterviewDetail).toBe("function");
    expect(typeof mod.getActiveSession).toBe("function");
  });
});
