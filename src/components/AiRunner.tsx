import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ArrowUp, Copy, Check, Square } from "lucide-react";
import { authHeader } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { ToolId } from "@/lib/tools";

export function useAiRun(tool: ToolId, onSaved?: () => void) {
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ctrl = useRef<AbortController | null>(null);

  async function run(input: string) {
    setOutput("");
    setError(null);
    setRunning(true);
    ctrl.current = new AbortController();
    let text = "";
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({ tool, input }),
        signal: ctrl.current.signal,
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `Request failed (${res.status})`);
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += dec.decode(value, { stream: true });
        setOutput(text);
      }
      if (!text.trim()) throw new Error("No response was generated. Please try again.");
      await supabase.from("task_runs").insert({ tool, prompt: input.slice(0, 4000), output: text });
      onSaved?.();
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
    } finally {
      setRunning(false);
    }
  }
  return { output, running, error, run, stop: () => ctrl.current?.abort() };
}

export function Composer({
  placeholder,
  running,
  onSubmit,
  onStop,
  rows = 4,
  autoFocus,
}: {
  placeholder: string;
  running: boolean;
  onSubmit: (v: string) => void;
  onStop?: () => void;
  rows?: number;
  autoFocus?: boolean;
}) {
  const [value, setValue] = useState("");
  const submit = () => {
    if (!value.trim() || running) return;
    onSubmit(value.trim());
  };
  return (
    <div className="panel p-2 shadow-sm focus-within:border-ring transition">
      <textarea
        autoFocus={autoFocus}
        rows={rows}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey || (!e.shiftKey && rows <= 2))) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        className="w-full resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
      />
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-muted-foreground">{rows > 2 ? "⌘ + Enter to run" : "Enter to run"}</span>
        {running ? (
          <button type="button" onClick={onStop} className="btn-outline h-9 w-9 p-0" aria-label="Stop">
            <Square className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button type="button" onClick={submit} disabled={!value.trim()} className="btn-primary h-9 w-9 p-0" aria-label="Run">
            <ArrowUp className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function Output({ output, running, error }: { output: string; running: boolean; error: string | null }) {
  const [copied, setCopied] = useState(false);
  if (error) return <div className="panel border-destructive/30 p-4 text-sm text-destructive">{error}</div>;
  if (!output && !running) return null;
  return (
    <div className="panel p-6">
      <div className="mb-2 flex items-center justify-between">
        <span className="eyebrow flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full bg-brand ${running ? "animate-pulse" : ""}`} />
          {running ? "Working…" : "Done"}
        </span>
        {!running && (
          <button
            className="btn-ghost h-8 px-2 text-xs"
            onClick={() => {
              navigator.clipboard.writeText(output);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied" : "Copy"}
          </button>
        )}
      </div>
      {output ? (
        <div className="prose-ai">
          <ReactMarkdown>{output}</ReactMarkdown>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      )}
    </div>
  );
}
