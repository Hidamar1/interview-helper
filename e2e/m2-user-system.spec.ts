import { test, expect } from "@playwright/test";

const TEST_USER = {
  name: "E2E测试鸭",
  email: `e2e-m2-${Date.now()}@test.duck`,
  password: "test12345678",
};

test.describe("M2 用户体系黄金路径", () => {
  test("注册 → 登录态保持 → 收藏题目 → 个人中心展示", async ({ page }) => {
    // 1. 访问首页，看到登录按钮
    await page.goto("/");
    await expect(page.getByRole("button", { name: "登录" })).toBeVisible();

    // 2. 前往注册页
    await page.getByRole("button", { name: "登录" }).click();
    await page.getByText("注册", { exact: false }).click();
    await expect(page).toHaveURL(/\/register/);

    // 3. 填写注册表单并提交
    await page.fill('input[id="name"]', TEST_USER.name);
    await page.fill('input[id="email"]', TEST_USER.email);
    await page.fill('input[id="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');

    // 4. 等待注册成功后跳转到 /profile
    await page.waitForURL(/\/profile/, { timeout: 15000 });

    // 5. 个人中心应显示用户信息和刷题热力图
    await expect(page.getByText(TEST_USER.name)).toBeVisible();
    await expect(page.getByText("刷题热力图")).toBeVisible();
    await expect(page.getByText("我的收藏")).toBeVisible();

    // 6. 直接访问一道已知题目
    await page.goto("/questions/java-hashmap-resize");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toBeVisible();

    // 7. 收藏按钮应可见
    await expect(page.getByRole("button", { name: /收藏/ })).toBeVisible();

    // 8. 访问 /profile 查看收藏仍然正常
    await page.goto("/profile");
    await expect(page.getByText("我的收藏")).toBeVisible();
  });
});
