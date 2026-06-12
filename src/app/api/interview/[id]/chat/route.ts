import {
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai";
import { getModel, isMock } from "@/lib/ai";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildInterviewerPrompt } from "@/lib/prompts/interviewer";
import type { Difficulty } from "@/lib/question-schema";

const END_MARKER = "[END_INTERVIEW]";

export const maxDuration = 60;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // 1. 鉴权
  const session = await auth.api.getSession({
    headers: req.headers,
  });
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }

  // 2. 获取面试会话 + 题库数据
  const interview = await prisma.interviewSession.findUnique({
    where: { id },
    include: {
      bank: {
        include: {
          items: {
            orderBy: { order: "asc" },
            take: 30,
            select: {
              question: { select: { id: true, title: true, answerBrief: true } },
            },
          },
        },
      },
    },
  });

  if (!interview || interview.userId !== session.user.id) {
    return Response.json({ error: "无权访问" }, { status: 403 });
  }

  if (interview.status !== "ACTIVE") {
    // 面试已结束，返回提示
    const endedStream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            JSON.stringify({
              type: "text-delta",
              id: "ended",
              text: "面试已结束，请查看评分报告。",
            }),
          ),
        );
        controller.enqueue(new TextEncoder().encode("\n"));
        controller.enqueue(
          new TextEncoder().encode(
            JSON.stringify({ type: "finish", id: "ended", reason: "stop" }),
          ),
        );
        controller.close();
      },
    });
    return new Response(endedStream, {
      headers: { "Content-Type": "text/plain" },
    });
  }

  // 3. 获取请求中的消息
  const { messages }: { messages: UIMessage[] } = await req.json();

  // 检查历史消息是否已包含 [END_INTERVIEW]（防止 AI 重复输出）
  const allParts = messages
    .flatMap((m) => m.parts)
    .filter((p): p is { type: "text"; text: string } => p?.type === "text")
    .map((p) => p.text);

  if (allParts.some((t: string) => t.includes(END_MARKER))) {
    // 对话已包含结束标记，直接返回结束提示
    const endedStream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            JSON.stringify({
              type: "text-delta",
              id: "ended",
              text: "面试已结束。",
            }),
          ),
        );
        controller.enqueue(new TextEncoder().encode("\n"));
        controller.enqueue(
          new TextEncoder().encode(
            JSON.stringify({ type: "finish", id: "ended", reason: "stop" }),
          ),
        );
        controller.close();
      },
    });
    return new Response(endedStream, {
      headers: { "Content-Type": "text/plain" },
    });
  }

  // 4. 构建系统提示词
  const systemPrompt = buildInterviewerPrompt({
    direction: interview.bank.name,
    difficulty: interview.difficulty as Difficulty,
    targetRounds: interview.targetRounds,
    questions: interview.bank.items.map((i) => i.question),
  });

  // 5. mock 模式
  if (isMock()) {
    const mockStream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            '{"type":"text-delta","id":"mock","text":"面试官：你好！我是面试官，今天我们来聊聊 Java 基础（mock 模式）。\\n\\n先来第一题：请解释一下 HashMap 的底层实现原理？"}',
          ),
        );
        controller.enqueue(new TextEncoder().encode("\n"));
        controller.enqueue(
          new TextEncoder().encode('{"type":"finish","id":"mock","reason":"stop"}'),
        );
        controller.close();
      },
    });
    return new Response(mockStream, {
      headers: { "Content-Type": "text/plain" },
    });
  }

  // 6. 流式响应
  const model = getModel()!;
  const result = streamText({
    model,
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    onFinish: async ({ text }) => {
      if (!text) return;

      // 保存面试官消息到数据库
      const existingCount = await prisma.interviewMessage.count({
        where: { sessionId: id },
      });
      await prisma.interviewMessage.create({
        data: {
          sessionId: id,
          role: "INTERVIEWER",
          content: text,
          order: existingCount + 1,
        },
      });

      // 检测 [END_INTERVIEW] 标记 → 结束会话
      if (text.includes(END_MARKER)) {
        await prisma.interviewSession.update({
          where: { id },
          data: { status: "FINISHED" },
        });
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
