import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { seedFileSchema, type SeedFile } from "./question-schema";

const dir = path.join(process.cwd(), "data/questions");

describe("种子数据质量", () => {
  let parsed: SeedFile[] = [];

  it("存在 8 个分类文件且全部通过 schema 校验", () => {
    const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
    expect(files).toHaveLength(8);
    parsed = files.map((f) => seedFileSchema.parse(JSON.parse(readFileSync(path.join(dir, f), "utf8"))));
  });

  it("总题数 ≥ 280", () => {
    expect(parsed.reduce((s, p) => s + p.questions.length, 0)).toBeGreaterThanOrEqual(280);
  });

  it("题目与题库 slug 全局唯一", () => {
    const slugs = parsed.flatMap((p) => p.questions.map((q) => q.slug));
    expect(new Set(slugs).size).toBe(slugs.length);
    const bankSlugs = parsed.map((p) => p.bank.slug);
    expect(new Set(bankSlugs).size).toBe(bankSlugs.length);
  });

  it("每个文件覆盖三种难度", () => {
    for (const p of parsed) {
      const set = new Set(p.questions.map((q) => q.difficulty));
      expect(set).toEqual(new Set(["EASY", "MEDIUM", "HARD"]));
    }
  });

  it("代码块语言在白名单内", () => {
    for (const p of parsed) {
      for (const q of p.questions) {
        const fences = q.answerDetail.match(/```[a-z]*\n/g) ?? [];
        for (const f of fences) {
          expect(f).toMatch(/```(java|javascript|typescript|python|sql|bash|json)?\n/);
        }
      }
    }
  });
});
