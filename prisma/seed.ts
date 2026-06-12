import "dotenv/config";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { prisma } from "../src/lib/db";
import { seedFileSchema } from "../src/lib/question-schema";
import type { Prisma } from "../src/generated/prisma/client";

// tsx 以 CJS 编译，顶层 await 不被支持，沿用 M0 db-check.ts 的 async main() 包裹模式
async function main() {
  const dir = path.join(process.cwd(), "data/questions");
  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));

  for (const file of files) {
    const data = seedFileSchema.parse(
      JSON.parse(readFileSync(path.join(dir, file), "utf8")),
    );

    const bank = await prisma.questionBank.upsert({
      where: { slug: data.bank.slug },
      update: data.bank,
      create: data.bank,
    });

    let order = 0;
    for (const q of data.questions) {
      const { followUps, ...rest } = q;
      const payload = { ...rest, followUps: followUps as Prisma.InputJsonValue };
      const question = await prisma.question.upsert({
        where: { slug: q.slug },
        update: payload, // 不覆盖 viewCount
        create: { ...payload, viewCount: 100 + ((order * 37) % 900) }, // 确定性伪随机基线，幂等
      });
      await prisma.questionBankItem.upsert({
        where: { bankId_questionId: { bankId: bank.id, questionId: question.id } },
        update: { order },
        create: { bankId: bank.id, questionId: question.id, order },
      });
      order++;
    }
    console.log(`✅ ${data.bank.name}: ${data.questions.length} 题`);
  }

  // 将 ADMIN_EMAIL 白名单中的用户 role 提升为 ADMIN
  const adminEmails = (process.env.ADMIN_EMAIL ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  for (const email of adminEmails) {
    if (!email) continue;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser && existingUser.role !== "ADMIN") {
      await prisma.user.update({
        where: { email },
        data: { role: "ADMIN" },
      });
      console.log(`✅ 用户 ${email} 已升级为 ADMIN`);
    }
  }

  await prisma.$disconnect();
}

main();
