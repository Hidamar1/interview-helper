"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

/** 切换收藏状态：已收藏→取消，未收藏→添加。返回新状态 */
export async function toggleFavorite(questionId: string): Promise<{ favorited: boolean }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) throw new Error("请先登录");

  const userId = session.user.id;

  const existing = await prisma.favorite.findUnique({
    where: { userId_questionId: { userId, questionId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    revalidatePath("/profile");
    return { favorited: false };
  }

  await prisma.favorite.create({ data: { userId, questionId } });
  revalidatePath("/profile");
  return { favorited: true };
}

/** 检查某题是否已收藏 */
export async function isFavorited(questionId: string): Promise<boolean> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return false;

  const fav = await prisma.favorite.findUnique({
    where: { userId_questionId: { userId: session.user.id, questionId } },
  });
  return fav !== null;
}

/** 获取用户收藏列表 */
export async function getFavorites() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return [];

  return prisma.favorite.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      question: {
        select: { id: true, title: true, slug: true, difficulty: true, tags: true },
      },
    },
  });
}
