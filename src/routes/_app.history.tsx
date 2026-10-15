import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Trash2, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { TOOL_LABEL } from "@/lib/tools";

export const Route = createFileRoute("/_app/history")({
  head: () => ({
    meta: [
      { title: "History — AdelAIde" },
      { name: "description", content: "A log of every task AdelAIde has automated for you." },
      { property: "og:title", content: "History — AdelAIde" },
      { property: "og:description", content: "A log of every task AdelAIde has automated for you." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HistoryPage,
});

type Run = { id: string; tool: string; prompt: string; output: string; created_at: string };

function HistoryPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("task_runs").select("*").order("created_at", { ascending: false }).limit(200).then(({ data }) => setRuns(data ?? []));
  }, []);

  const shown = filter === "all" ? runs : runs.filter((r) => r.tool === filter);

  return (
    <div>
      <PageHeader eyebrow="Log" title="History" description="Every task AdelAIde has completed for you." />
      <div className="mb-4 flex flex-wrap gap-2">
        {["all", "auto", "email", "notes", "planner", "research"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full border px-3 py-1 text-xs ${filter === f ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-accent"}`}>
            {f === "all" ? "All" : TOOL_LABEL[f]}
          </button>
        ))}
      </div>
      <ul className="panel divide-y divide-border">
        {shown.length === 0 && <li className="p-8 text-center text-sm text-muted-foreground">No automated tasks yet.</li>}
        {shown.map((r) => (
          <li key={r.id}>
            <div className="flex items-center gap-4 px-5 py-4">
              <button className="flex min-w-0 flex-1 items-center gap-4 text-left" onClick={() => setOpen(open === r.id ? null : r.id)}>
                <span className="eyebrow w-20 shrink-0">{TOOL_LABEL[r.tool] ?? r.tool}</span>
                <span className="flex-1 truncate text-sm">{r.prompt}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>
                <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition ${open === r.id ? "rotate-180" : ""}`} />
              </button>
              <button aria-label="Delete" onClick={async () => { setRuns((x) => x.filter((y) => y.id !== r.id)); await supabase.from("task_runs").delete().eq("id", r.id); }}>
                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
            {open === r.id && (
              <div className="prose-ai border-t border-border bg-muted/40 px-6 py-4">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{r.output}</ReactMarkdown>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
