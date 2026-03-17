"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { markdownToHtml } from "@/lib/markdown";
import { cn } from "@/lib/utils";
import { Loader2, Send, Sparkles, User } from "lucide-react";

type ChatRole = "assistant" | "user";

type LessonChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

function MessageBubble({ message }: { message: LessonChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex w-full gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
          isUser
            ? "bg-gradient-to-br from-cyan-500 to-cyan-600 text-white border-cyan-500/30 shadow-md shadow-cyan-500/20"
            : "bg-slate-900/40 text-cyan-300 border-slate-700/60"
        )}
        aria-hidden="true"
      >
        {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      </div>

      <div className={cn("flex max-w-[85%] flex-col", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed border",
            isUser
              ? "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white border-cyan-500/30 rounded-tr-sm"
              : "bg-slate-900/40 text-slate-200 border-slate-700/60 rounded-tl-sm"
          )}
        >
          {isUser ? (
            <span className="whitespace-pre-wrap">{message.content}</span>
          ) : (
            <div
              className="chat-markdown"
              dangerouslySetInnerHTML={{ __html: markdownToHtml(message.content) }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export function LessonChatPanel({
  lessonId,
  className,
}: {
  lessonId: string;
  className?: string;
}) {
  const [messages, setMessages] = React.useState<LessonChatMessage[]>(() => [
    {
      id: "hello",
      role: "assistant",
      content:
        "我是你的 AI 教练。你可以问我：本章知识点解释、代码示例怎么改、遇到报错怎么排查、实战练习怎么做。",
    },
  ]);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  React.useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMessage: LessonChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const history = messages
        .slice(-12)
        .map((msg) => ({ role: msg.role, content: msg.content }));

      const res = await fetch(`/api/lessons/${lessonId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history }),
      });

      const data = (await res.json()) as { success?: boolean; reply?: string; error?: string };
      const replyText =
        res.ok && data.success && typeof data.reply === "string" && data.reply.trim()
          ? data.reply.trim()
          : data.error || "对话失败，请稍后重试。";

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: replyText,
        },
      ]);
    } catch (error) {
      console.error("Lesson chat failed:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: "对话失败，请检查网络或稍后重试。",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  return (
    <div
      className={cn(
        "glass-dark rounded-2xl border border-slate-700/60 overflow-hidden flex flex-col h-full",
        className
      )}
      aria-label="AI 对话"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/60 bg-slate-900/20">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <MessageCircleIcon />
          </div>
          <h3 className="text-sm font-semibold text-slate-200">AI 对话</h3>
        </div>
        <span className="text-xs text-slate-500">随问随答</span>
      </div>

      <div className="flex-1 min-h-0 p-4 space-y-4 overflow-y-auto">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isLoading && (
          <div className="flex w-full gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border bg-slate-900/40 text-cyan-300 border-slate-700/60"
              aria-hidden="true"
            >
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-slate-900/40 border border-slate-700/60 px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
              <span className="text-sm text-slate-400">思考中...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={onSubmit} className="border-t border-slate-700/60 p-4">
        <div className="flex gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="问我本章内容、练习题、报错排查…"
            disabled={isLoading}
            rows={2}
            className="resize-none rounded-xl bg-slate-900/40 border-slate-700/60 text-slate-200 placeholder:text-slate-500 focus-visible:ring-cyan-500/40"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendMessage(input);
              }
            }}
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="h-auto rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white shadow-md shadow-cyan-500/20"
            aria-label="发送"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Enter 发送，Shift+Enter 换行
        </p>
      </form>
    </div>
  );
}

function MessageCircleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M20 12c0 4.418-3.582 8-8 8a8.01 8.01 0 0 1-3.873-.995L4 20l1.02-3.06A7.96 7.96 0 0 1 4 12c0-4.418 3.582-8 8-8s8 3.582 8 8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M8 12h.01M12 12h.01M16 12h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
