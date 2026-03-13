"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChatMessage, QuestionOption } from "@/types/questionnaire";
import { Send, Bot, User, Loader2 } from "lucide-react";

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
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div
        className={cn(
          "flex max-w-[80%] flex-col gap-2",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-muted rounded-tl-sm"
          )}
        >
          {message.content}
        </div>
        {message.options && message.options.length > 0 && !isUser && (
          <div className="flex flex-col gap-2 w-full">
            {message.options.map((option) => (
              <Button
                key={option.id}
                variant="outline"
                size="sm"
                className="justify-start text-left h-auto py-2 px-3 w-full"
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
    <Card className="flex flex-col h-full border-0 shadow-none">
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onOptionSelect={onOptionSelect}
          />
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">思考中...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </CardContent>
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={hasOptions ? "或直接输入自定义回答..." : placeholder}
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
}
