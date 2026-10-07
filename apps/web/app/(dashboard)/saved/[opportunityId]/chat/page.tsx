"use client";
import { API_URL } from "../../../../../lib/api";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { authClient } from "../../../../../lib/auth-client";
import { cachedFetch } from "../../../../../lib/cache";
import { ArrowLeft, Send, Sparkles, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function OpportunityChatPage() {
  const { opportunityId } = useParams();
  const { data: session } = authClient.useSession();

  const [isLoading, setIsLoading] = useState(true);
  const [opportunity, setOpportunity] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);

  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  useEffect(() => {
    async function loadChat() {
      try {
        const apiUrl = API_URL;
        const json = await cachedFetch<any>(
          `${apiUrl}/api/opportunities/${opportunityId}/chat`,
          {
            credentials: "include",
            ttl: 0,
          },
        );

        if (json.error) {
          setError(json.error.message || "Failed to load chat.");
        } else {
          setOpportunity(json.data.opportunity);
          setMessages(json.data.messages || []);
        }
      } catch {
        setError("Unable to connect to chat.");
      } finally {
        setIsLoading(false);
      }
    }

    if (opportunityId) {
      loadChat();
    }
  }, [opportunityId]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isSending) return;

    const userContent = input.trim();
    setInput("");
    setIsSending(true);
    setError(null);

    const tempUserMsg = {
      id: Date.now().toString(),
      role: "user",
      content: userContent,
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const apiUrl = API_URL;
      const response = await fetch(
        `${apiUrl}/api/opportunities/${opportunityId}/chat/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ content: userContent }),
        },
      );

      const json = (await response.json()) as any;

      if (!response.ok || json.error) {
        setMessages((prev) => prev.slice(0, -1));
        setError(
          json.error?.message || "Failed to get a response. Please try again.",
        );
        return;
      }

      const message: string | undefined = json.data?.message;
      if (message) {
        const assistantMsg = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: message,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        setMessages((prev) => prev.slice(0, -1));
        setError("The assistant returned an empty response. Please try again.");
      }
    } catch {
      setMessages((prev) => prev.slice(0, -1));
      setError(
        "Unable to reach the server. Please check your connection and try again.",
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 h-full py-12">
        <Sparkles className="animate-pulse text-muted-foreground" size={24} />
        <p className="text-sm text-muted-foreground">Preparing workspace...</p>
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <div className="rounded-4xl p-8 text-center flex flex-col items-center justify-center gap-4">
          <AlertCircle className="text-red-500" size={32} />
          <div className="space-y-1">
            <h2 className="text-lg font-medium text-foreground">
              Access Denied
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {error || "You can only chat about opportunities you have saved."}
            </p>
          </div>
          <Link
            href="/saved"
            className="mt-4 px-6 py-2.5 bg-foreground text-background font-medium text-sm rounded-full hover:bg-foreground/90 transition-colors"
          >
            Back to Saved
          </Link>
        </div>
      </div>
    );
  }

  return (
    // The chat page owns its own height and scroll. It stretches to fill the
    // remaining space inside <main>, then divides into three flex rows:
    //   1. chat header  — shrinks to content
    //   2. messages     — flex-1, overflow-y-auto (scrolls independently)
    //   3. input bar    — shrinks to content, always pinned at bottom
    // This avoids position:fixed which breaks inside overflow-y-auto containers.
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
      {/* ── Header ── */}
      <div className="shrink-0 py-3 px-2 sm:px-0 flex items-center justify-between border-b border-border/40">
        <div className="flex items-center gap-3">
          <Link
            href="/saved"
            className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="font-display text-base font-medium text-foreground leading-tight truncate">
              {opportunity.title}
            </h1>
            <span className="shrink-0 text-xs text-muted-foreground py-0.5 px-2 bg-muted/40 backdrop-blur-2xl rounded-full capitalize">
              {opportunity.type}
            </span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 shrink-0 ml-4">
          <span className="text-[11px] font-medium text-muted-foreground capitalize">
            {opportunity.organization}
          </span>
        </div>
      </div>

      {/* ── Messages ── */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-2 sm:px-4 py-6 space-y-6"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-muted-foreground py-16">
            <div className="p-4 bg-muted/50 backdrop-blur-2xl rounded-full">
              <Sparkles size={24} className="text-foreground/70" />
            </div>
            <div className="max-w-xs space-y-1">
              <h3 className="font-medium text-foreground">How can I help?</h3>
              <p className="text-sm leading-relaxed">
                Ask me about requirements, fit, or how to prepare your
                application for this opportunity.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={msg.id || idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-4xl px-5 py-3.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-foreground text-background"
                    : "bg-muted/60 backdrop-blur-2xl text-foreground"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-background/50 prose-pre:border prose-pre:border-border prose-a:text-foreground prose-a:underline-offset-4 hover:prose-a:text-emerald-500">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                )}
              </div>
            </div>
          ))
        )}

        {isSending && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-4xl px-5 py-3.5 bg-muted/60 backdrop-blur-2xl flex items-center gap-2 text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-pulse" />
              <div className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-pulse delay-150" />
              <div className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-pulse delay-300" />
            </div>
          </div>
        )}

        {error && !isSending && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-4xl px-5 py-3.5 bg-red-500/10 border border-red-500/20 flex items-start gap-2">
              <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ── */}
      <div className="shrink-0 px-2 sm:px-0 pb-4 pt-2">
        <form
          onSubmit={handleSend}
          className="relative flex items-end gap-2 bg-card/50 backdrop-blur-2xl border border-border/50 rounded-full p-1.5 shadow-sm focus-within:border-foreground/40 focus-within:ring-1 focus-within:ring-foreground/40 transition-all"
        >
          <textarea
            className="flex-1 max-h-32 w-full resize-none bg-transparent px-4 py-3 text-sm focus:outline-none scrollbar-hide text-foreground placeholder:text-muted-foreground leading-relaxed"
            placeholder="Ask a question..."
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (error) setError(null);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
            }}
            onKeyDown={handleKeyDown}
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className="p-3 bg-foreground text-background rounded-full shrink-0 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-foreground/90 transition-colors h-[44px] w-[44px] flex items-center justify-center self-end"
          >
            <Send size={16} strokeWidth={2} />
          </button>
        </form>
        <p className="text-center mt-2 text-[10px] text-muted-foreground">
          Arch AI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}
