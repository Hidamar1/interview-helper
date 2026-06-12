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
    return Response.json({ error: "面试已结束" }, { status: 400 });
  }

  // 3. 构建系统提示词
  const systemPrompt = buildInterviewerPrompt({
    direction: interview.bank.name,
    difficulty: interview.difficulty as Difficulty,
    targetRounds: interview.targetRounds,
    questions: interview.bank.items.map((i) => i.question),
  });

  // 4. 获取请求中的消息
  const { messages }: { messages: UIMessage[] } = await req.json();

  // 5. mock 模式直接返回固定文本
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
          new TextEncoder().encode(
            '{"type":"finish","id":"mock","reason":"stop"}',
          ),
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
      // 保存面试官消息到数据库
      if (text) {
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

        // 检测 [END_INTERVIEW] 标记
        if (text.includes("[END_INTERVIEW]")) {
          const msgCount = await prisma.interviewMessage.count({
            where: { sessionId: id, role: "INTERVIEWER" },
          });
          await prisma.interviewSession.update({
            where: { id },
            data: { currentRound: msgCount },
          });
        }
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
