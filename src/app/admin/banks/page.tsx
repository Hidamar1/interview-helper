import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { BankTable } from "@/components/admin/bank-table";

export const dynamic = "force-dynamic";

export default async function AdminBanksPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    redirect("/");
  }

  const banks = await prisma.questionBank.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { items: true } } },
  });

  return (
    <BankTable
      banks={banks.map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        description: b.description,
        icon: b.icon,
        category: b.category,
        sortOrder: b.sortOrder,
        questionCount: b._count.items,
      }))}
    />
  );
}
