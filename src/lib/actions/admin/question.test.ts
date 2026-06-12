import { describe, it, expect } from "vitest";

describe("question admin actions", () => {
  it("模块应正确导出 createQuestion/updateQuestion/deleteQuestion", async () => {
    const mod = await import("./question");
    expect(typeof mod.createQuestion).toBe("function");
    expect(typeof mod.updateQuestion).toBe("function");
    expect(typeof mod.deleteQuestion).toBe("function");
  });
});
