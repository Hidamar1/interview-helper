import { describe, it, expect } from "vitest";

describe("favorite actions", () => {
  it("模块应正确导出 action 函数", async () => {
    const mod = await import("./favorite");
    expect(typeof mod.toggleFavorite).toBe("function");
    expect(typeof mod.isFavorited).toBe("function");
    expect(typeof mod.getFavorites).toBe("function");
  });
});
