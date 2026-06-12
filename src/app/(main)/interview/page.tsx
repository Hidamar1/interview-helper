import { prisma } from "@/lib/db";
import { PrepForm } from "@/components/interview/prep-form";
import { getActiveSession } from "@/lib/actions/interview";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function InterviewPrepPage() {
  const banks = await prisma.questionBank.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, icon: true, description: true },
  });

  const activeSession = await getActiveSession();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {activeSession && (
        <div className="mb-6 rounded-lg border border-primary bg-primary/5 p-4 text-sm">
          {"🦆"} 你有一个进行中的面试，{" "}
          <Link
            href={`/interview/${activeSession.id}`}
            className="font-semibold text-primary underline"
          >
            继续面试
          </Link>
        </div>
      )}
      <PrepForm banks={banks} />
    </div>
  );
}
