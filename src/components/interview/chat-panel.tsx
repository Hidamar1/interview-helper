"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useRef, useEffect, useState } from "react";

const END_MARKER = "[END_INTERVIEW]";

/** 提取消息中所有文本内容 */
function getMessageText(msg: UIMessage): string {
  return (msg.parts ?? [])
    .filter((p) => p.type === "text")
    .map((p) => (p as { text: string }).text)
    .join("");
}

export function ChatPanel({ sessionId }: { sessionId: string }) {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: `/api/interview/${sessionId}/chat`,
    }),
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);
  const [interviewEnded, setInterviewEnded] = useState(false);

  // 自动滚动到底部
  useEffect(() => {
    listRef.current?.scrollTo(0, listRef.current.scrollHeight);
  }, [messages]);

  // 挂载时自动发送初始消息，触发 AI 第一个问题
  useEffect(() => {
    if (!hasStarted.current && messages.length === 0 && status === "ready") {
      hasStarted.current = true;
      sendMessage({ text: "开始面试" });
    }
  }, [status, messages, sendMessage]);

  // 检测最后一条 AI 消息是否包含结束标记
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role !== "user") {
      const text = getMessageText(lastMsg);
      if (text.includes(END_MARKER)) {
        // 使用 setTimeout 避免直接在 effect 中 setState 触发的 cascading render 警告
        setTimeout(() => setInterviewEnded(true), 0);
      }
    }
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input = inputRef.current;
    if (!input || !input.value.trim() || status !== "ready" || interviewEnded)
      return;
    sendMessage({ text: input.value.trim() });
    input.value = "";
  }

  const isStreaming = status === "streaming" || status === "submitted";

  return (
    <div className="flex h-[calc(100vh-140px)] flex-col">
      {/* 消息列表 */}
      <div ref={listRef} className="flex-1 overflow-y-auto space-y-4 py-4">
        {messages.length === 0 && (
          <div className="rounded-lg border border-border-warm bg-cream/50 p-6 text-center text-sm text-muted-foreground">
            <p className="text-lg">{"🦆"}</p>
            <p className="mt-2">AI 面试官正在准备面试...</p>
          </div>
        )}
        {messages.map((m) => {
          const msgText = getMessageText(m);
          // 隐藏 [END_INTERVIEW] 标记消息
          if (m.role !== "user" && msgText.includes(END_MARKER)) return null;
          // 隐藏初始触发消息"开始面试"
          if (m.role === "user" && msgText === "开始面试") return null;
          return (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                  m.role === "user"
                    ? "bg-primary text-white"
                    : "border border-border-warm bg-cream text-ink"
                }`}
              >
                {m.parts.map((part, i) =>
                  part.type === "text" ? (
                    <span key={i} className="whitespace-pre-wrap">
                      {part.text}
                    </span>
                  ) : null,
                )}
              </div>
            </div>
          );
        })}
        {!interviewEnded &&
          isStreaming &&
          messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-border-warm bg-cream px-4 py-3 text-sm text-muted-foreground">
                AI 面试官正在输入...
              </div>
            </div>
          )}
      </div>

      {/* 面试结束状态 */}
      {interviewEnded ? (
        <div className="border-t border-border-warm pt-3 text-center">
          <p className="mb-2 text-sm text-muted-foreground">
            🎉 面试已结束，正在生成报告...
          </p>
          <a
            href={`/interview/${sessionId}/report`}
            className="inline-block rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white"
          >
            查看评分报告
          </a>
        </div>
      ) : (
        /* 输入框 */
        <form
          onSubmit={handleSubmit}
          className="flex gap-2 border-t border-border-warm pt-3"
        >
          <input
            ref={inputRef}
            name="message"
            disabled={status !== "ready"}
            placeholder={
              isStreaming ? "面试官正在说话..." : "输入你的回答..."
            }
            className="flex-1 rounded-full border border-border-warm px-4 py-2 text-sm outline-none focus:border-primary disabled:bg-muted"
          />
          <button
            type="submit"
            disabled={status !== "ready"}
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            发送
          </button>
        </form>
      )}
    </div>
  );
}
