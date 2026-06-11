import { test, expect } from "@playwright/test";

// 回归：三层答案不依赖 JS 水合（原生 details/summary，水合前点击即生效）
// 手段：延迟所有 JS chunk 1.5s，模拟慢网络下「按钮可见但未水合」的窗口期。
// 修复后原生 details 由浏览器直接处理 summary 点击，无需等待 React 水合，
// 因此延迟 JS 下点击「详解版」必须立即展开详解（本用例必须 PASS）。
test("回归：水合完成前点击详解 summary 立即展开（不依赖 JS）", async ({ page }) => {
  await page.route("**/*.js*", async (route) => {
    await new Promise((r) => setTimeout(r, 1500));
    await route.continue();
  });

  await page.goto("/questions/java-hashmap-resize", { waitUntil: "commit" });

  // summary 一可见立刻点击（不等水合）
  const summary = page.locator("summary", { hasText: "详解版" });
  await summary.waitFor({ state: "visible" });
  await summary.click();

  // 不重试：原生 details 应在水合前即展开详解
  await expect(page.locator(".prose").first()).toBeVisible({ timeout: 2500 });
});
