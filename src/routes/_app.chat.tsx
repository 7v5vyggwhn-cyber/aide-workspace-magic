import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { authHeader, useAuth } from "@/hooks/useAuth";
import { Composer } from "@/components/AiRunner";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/_app/chat")({
  head: () => ({
    meta: [
      { title: "Chat — AdelAIde" },
      { name: "description", content: "Chat with AdelAIde about anything on your plate." },
      { property: "og:title", content: "Chat — AdelAIde" },
      { property: "og:description", content: "Chat with AdelAIde about anything on your plate." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  const [initial, setInitial] = useState<UIMessage[] | null>(null);
  const [key, setKey] = useState(0);
  useEffect(() => {
    supabase.from("chat_conversations").select("messages").maybeSingle().then(({ data }) => {
      setInitial((data?.messages as unknown as UIMessage[]) ?? []);
    });
  }, []);
  if (!initial) return <p className="text-sm text-muted-foreground">Loading conversation…</p>;
  return (
    <ChatWindow
      key={key}
      initial={initial}
      onReset={async () => {
        await supabase.from("chat_conversations").delete().not("user_id", "is", null);
        setInitial([]);
        setKey((k) => k + 1);
      }}
    />
  );
}

function ChatWindow({ initial, onReset }: { initial: UIMessage[]; onReset: () => void }) {
  const { user } = useAuth();
  const bottom = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, status, stop, error } = useChat({
    messages: initial,
    transport: new DefaultChatTransport({ api: "/api/chat", headers: authHeader }),
  });

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (status === "ready" && messages.length && user) {
      supabase.from("chat_conversations").upsert({ user_id: user.id, messages: messages as never, updated_at: new Date().toISOString() })
        .then(({ error }) => error && console.error("save chat failed", error));
    }
  }, [status, messages, user]);

  const busy = status === "submitted" || status === "streaming";

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-4xl tracking-tight">Chat</h1>
        {messages.length > 0 && (
          <button className="btn-ghost text-xs" onClick={onReset}><RotateCcw className="h-3.5 w-3.5" /> New conversation</button>
        )}
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto pb-6">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Logo className="text-5xl" />
            <p className="mt-3 text-sm text-muted-foreground">Ask me to draft, summarize, plan or research anything.</p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "flex justify-end" : ""}>
            {m.role === "user" ? (
              <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                {m.parts.map((p, i) => (p.type === "text" ? <span key={i}>{p.text}</span> : null))}
              </div>
            ) : (
              <div className="flex gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft font-display text-sm italic text-brand">A</span>
                <div className="prose-ai min-w-0 flex-1">
                  {m.parts.map((p, i) => (p.type === "text" ? <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>{p.text}</ReactMarkdown> : null))}
                </div>
              </div>
            )}
          </div>
        ))}
        {status === "submitted" && (
          <div className="flex gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-soft font-display text-sm italic text-brand">A</span>
            <span className="flex items-center gap-1 pt-2">
              {[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground" style={{ animationDelay: `${i * 150}ms` }} />)}
            </span>
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error.message}</p>}
        <div ref={bottom} />
      </div>
      <Composer clearOnSubmit rows={2} autoFocus placeholder="Message AdelAIde…" running={busy} onStop={stop} onSubmit={(text) => sendMessage({ text })} />
    </div>
  );
}
