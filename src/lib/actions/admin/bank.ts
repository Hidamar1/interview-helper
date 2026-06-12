"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { CATEGORIES } from "@/lib/constants";

const bankSchema = z.object({
  name: z.string().min(2),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "slug 须为小写英文连字符"),
  description: z.string().min(4),
  icon: z.string().min(1),
  category: z.enum(CATEGORIES),
  sortOrder: z.number().int().min(0),
});

async function checkAdmin(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    throw new Error("无权访问");
  }
  return session.user.id;
}

export async function createBank(data: z.infer<typeof bankSchema>) {
  await checkAdmin();
  const parsed = bankSchema.parse(data);

  const existing = await prisma.questionBank.findUnique({
    where: { slug: parsed.slug },
  });
  if (existing) throw new Error("slug 已被占用");

  await prisma.questionBank.create({ data: parsed });
  revalidatePath("/admin/banks");
}

export async function updateBank(id: string, data: z.infer<typeof bankSchema>) {
  await checkAdmin();
  const parsed = bankSchema.parse(data);

  const existing = await prisma.questionBank.findUnique({
    where: { slug: parsed.slug },
  });
  if (existing && existing.id !== id) throw new Error("slug 已被占用");

  await prisma.questionBank.update({ where: { id }, data: parsed });
  revalidatePath("/admin/banks");
}

export async function deleteBank(id: string) {
  await checkAdmin();
  const count = await prisma.questionBankItem.count({ where: { bankId: id } });
  if (count > 0) throw new Error("该题库下还有题目，请先删除题目");

  await prisma.questionBank.delete({ where: { id } });
  revalidatePath("/admin/banks");
}
