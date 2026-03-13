"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChatMessage, QuestionOption } from "@/types/questionnaire";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onOptionSelect: (option: QuestionOption) => void;
  placeholder?: string;
}

function MessageBubble({
  message,
  onOptionSelect,
}: {
  message: ChatMessage;
  onOptionSelect?: (option: QuestionOption) => void;
}) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex w-full gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          isUser
            ? "bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-md shadow-cyan-200/50"
            : "bg-slate-100 text-slate-600"
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      </div>
      <div
        className={cn(
          "flex max-w-[80%] flex-col gap-2",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-tr-sm shadow-md shadow-cyan-200/30"
              : "bg-slate-100 text-slate-700 rounded-tl-sm"
          )}
        >
          {message.content}
        </div>
        {message.options && message.options.length > 0 && !isUser && (
          <div className="flex flex-col gap-2 w-full mt-1">
            {message.options.map((option) => (
              <Button
                key={option.id}
                variant="outline"
                size="sm"
                className="justify-start text-left h-auto py-2.5 px-4 w-full rounded-xl border-cyan-200 hover:bg-cyan-50 hover:border-cyan-300 transition-all"
                onClick={() => onOptionSelect?.(option)}
              >
                {option.text}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ChatInterface({
  messages,
  isLoading,
  onSendMessage,
  onOptionSelect,
  placeholder = "输入你的回答...",
}: ChatInterfaceProps) {
  const [input, setInput] = React.useState("");
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  React.useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const lastMessage = messages[messages.length - 1];
  const hasOptions =
    lastMessage &&
    lastMessage.role === "assistant" &&
    lastMessage.options &&
    lastMessage.options.length > 0;

  return (
    <Card className="flex flex-col h-full border-0 shadow-none bg-transparent">
      <CardContent className="flex-1 overflow-y-auto p-5 space-y-5">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center mb-4 shadow-lg shadow-cyan-200/50">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">AI 学习助手</h3>
            <p className="text-sm text-slate-500 max-w-xs">
              我是你的专属学习助手，将帮助你制定个性化的学习计划
            </p>
          </div>
        )}
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onOptionSelect={onOptionSelect}
          />
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-cyan-600" />
              <span className="text-sm text-slate-500">思考中...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </CardContent>
      <div className="border-t border-slate-100 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={hasOptions ? "或直接输入自定义回答..." : placeholder}
            disabled={isLoading}
            className="flex-1 rounded-xl border-slate-200 focus:border-cyan-300 focus:ring-cyan-200"
          />
          <Button 
            type="submit" 
            disabled={isLoading || !input.trim()} 
            size="icon"
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 shadow-md shadow-cyan-200/50"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
}
