import { test, expect } from "@playwright/test";

const TEST_USER = {
  name: "E2E测试鸭",
  email: `e2e-m2-${Date.now()}@test.duck`,
  password: "test12345678",
};

test.describe("M2 用户体系黄金路径", () => {
  test("注册 → 浏览题目自动记录 → 收藏 → 个人中心查看 → 登出", async ({ page }) => {
    // 1. 访问首页，看到登录按钮
    await page.goto("/");
    await expect(page.getByRole("button", { name: "登录" })).toBeVisible();

    // 2. 前往注册页
    await page.getByRole("button", { name: "登录" }).click();
    await page.getByText("注册", { exact: false }).click();
    await expect(page).toHaveURL(/\/register/);

    // 3. 填写注册表单
    await page.fill('input[id="name"]', TEST_USER.name);
    await page.fill('input[id="email"]', TEST_USER.email);
    await page.fill('input[id="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');

    // 4. 注册成功后应跳转到个人中心
    await expect(page).toHaveURL(/\/profile/);

    // 5. 回到首页浏览一道题
    await page.goto("/");
    await page.click('a[href^="/banks"]');
    // 点第一个题库
    await page.click("a[href^='/banks/']");
    // 点第一道题
    await page.click("a[href^='/questions/']");
    await expect(page.locator("h1")).toBeVisible();

    // 6. 收藏这道题
    const favBtn = page.getByRole("button", { name: /收藏/ });
    await favBtn.click();

    // 7. 前往个人中心检查
    await page.goto("/profile");
    await expect(page.getByText(TEST_USER.name)).toBeVisible();
    // 热力图应显示
    await expect(page.getByText("刷题热力图")).toBeVisible();
    // 收藏列表应显示
    await expect(page.getByText("我的收藏")).toBeVisible();

    // 8. 打开用户菜单并登出
    await page.click(`text=${TEST_USER.name}`);
    await page.click("text=退出登录");

    // 9. 登出后应看到登录按钮
    await expect(page.getByRole("button", { name: "登录" })).toBeVisible();

    // 10. 访问 /profile 应被重定向
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/login/);
  });
});
