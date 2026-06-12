"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRef, useEffect } from "react";

export function ChatPanel({ sessionId }: { sessionId: string }) {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: `/api/interview/${sessionId}/chat`,
    }),
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    listRef.current?.scrollTo(0, listRef.current.scrollHeight);
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input = inputRef.current;
    if (!input || !input.value.trim() || status !== "ready") return;
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
        {messages.map((m) => (
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
        ))}
        {isStreaming && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-border-warm bg-cream px-4 py-3 text-sm text-muted-foreground">
              AI 面试官正在输入...
            </div>
          </div>
        )}
      </div>

      {/* 输入框 */}
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 border-t border-border-warm pt-3"
      >
        <input
          ref={inputRef}
          name="message"
          disabled={status !== "ready"}
          placeholder={isStreaming ? "面试官正在说话..." : "输入你的回答..."}
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
    </div>
  );
}
