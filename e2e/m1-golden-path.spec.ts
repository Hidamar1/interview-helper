import { test, expect } from "@playwright/test";

test("M1 黄金路径：首页→题库→筛选→三层答案→搜索", async ({ page }) => {
  // 首页：分类导航与题库卡片
  await page.goto("/");
  await expect(page.getByRole("link", { name: /热门/ })).toBeVisible();

  // 进入题库列表→某题库详情
  // 首屏 <Link> 点击可能早于 Next App Router 注水完成而丢失（URL 卡在 /），
  // 用 toPass 重试点击直至跳转生效；落到 /banks 列表页后再点卡片，
  // 避免命中首页同名的 a[href^='/banks/'] 卡片造成 SPA 跳转丢失
  await expect(async () => {
    await page.getByRole("link", { name: "题库", exact: true }).click();
    await expect(page).toHaveURL(/\/banks$/, { timeout: 2000 });
  }).toPass();
  await page.locator("a[href^='/banks/']").first().click();
  await expect(page).toHaveURL(/\/banks\/[a-z-]+/);

  // 难度筛选
  await page.getByRole("link", { name: "中等", exact: true }).click();
  await expect(page).toHaveURL(/difficulty=MEDIUM/);

  // 进入题目：三层答案
  await page.locator("a[href^='/questions/']").first().click();
  await expect(page.getByText("30 秒速记")).toBeVisible();
  await page.getByRole("button", { name: /展开详解/ }).click();
  await expect(page.locator(".prose").first()).toBeVisible();
  await page.getByRole("button", { name: /追问 1/ }).click();
  await expect(page.getByText("先自己想一想，点击查看提示")).toHaveCount(
    (await page.getByRole("button", { name: /追问 \d/ }).count()) - 1,
  );

  // 搜索有结果
  await page.goto("/");
  await page.getByPlaceholder(/搜索题目/).fill("索引");
  await page.getByRole("button", { name: "搜索" }).click();
  await expect(page).toHaveURL(/\/search\?q=/);
  await expect(page.locator("a[href^='/questions/']").first()).toBeVisible();
});
