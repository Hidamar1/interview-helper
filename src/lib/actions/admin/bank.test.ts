import { describe, it, expect } from "vitest";

describe("bank admin actions", () => {
  it("模块应正确导出 createBank/updateBank/deleteBank", async () => {
    const mod = await import("./bank");
    expect(typeof mod.createBank).toBe("function");
    expect(typeof mod.updateBank).toBe("function");
    expect(typeof mod.deleteBank).toBe("function");
  });
});
