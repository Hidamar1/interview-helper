import { test, expect } from "@playwright/test";

test("首页冒烟：标题、导航、暖橙主题", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/面试突击鸭/);
  await expect(page.getByRole("link", { name: "题库" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("肌肉记忆");
  // Hero 渐变存在（反 AI 味验证：暖色渐变而非紫蓝）
  const hero = page.locator("section").first();
  await expect(hero).toHaveCSS("background-image", /linear-gradient/);
});
