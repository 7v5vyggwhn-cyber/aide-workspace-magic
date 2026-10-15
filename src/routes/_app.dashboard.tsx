import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2, Circle, CheckCircle2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Composer, Output, useAiRun } from "@/components/AiRunner";
import { PageHeader } from "@/components/PageHeader";
import { TOOL_LABEL } from "@/lib/tools";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — AdelAIde" },
      { name: "description", content: "Your AdelAIde task inbox and AI automation command bar." },
      { property: "og:title", content: "Dashboard — AdelAIde" },
      { property: "og:description", content: "Your AdelAIde task inbox and AI automation command bar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

type Task = { id: string; title: string; priority: string; due_at: string | null; done: boolean };
type Run = { id: string; tool: string; prompt: string; created_at: string };

const SUGGESTIONS = [
  "Draft an email to a client about the updated delivery address",
  "Summarize this report: ",
  "Plan my week: finish budget review, 2 client calls, hiring interviews",
];

function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [due, setDue] = useState("");
  const [seed, setSeed] = useState(0);

  const loadRuns = () =>
    supabase.from("task_runs").select("id,tool,prompt,created_at").order("created_at", { ascending: false }).limit(5)
      .then(({ data }) => setRuns(data ?? []));
  const loadTasks = () =>
    supabase.from("tasks").select("id,title,priority,due_at,done").order("done").order("created_at", { ascending: false })
      .then(({ data }) => setTasks(data ?? []));

  useEffect(() => {
    loadTasks();
    loadRuns();
  }, []);

  const ai = useAiRun("auto", loadRuns);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await supabase.from("tasks").insert({ title: title.trim(), priority, due_at: due ? new Date(due).toISOString() : null });
    setTitle("");
    setDue("");
    loadTasks();
  }
  async function toggle(t: Task) {
    setTasks((ts) => ts.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)));
    await supabase.from("tasks").update({ done: !t.done }).eq("id", t.id);
  }
  async function remove(id: string) {
    setTasks((ts) => ts.filter((x) => x.id !== id));
    await supabase.from("tasks").delete().eq("id", id);
  }

  const open = tasks.filter((t) => !t.done).length;

  return (
    <div className="space-y-12">
      <section>
        <PageHeader eyebrow={new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })} title="What should we get done?" />
        <Composer key={seed} rows={3} autoFocus placeholder="Type a task — e.g. “Summarize this report…” and paste it below" running={ai.running} onSubmit={ai.run} onStop={ai.stop} />
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button key={s} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground" onClick={() => { if (!s.endsWith(": ")) ai.run(s); else setSeed((n) => n + 1); }}>
              {s.replace(": ", "…")}
            </button>
          ))}
        </div>
        <div className="mt-6">
          <Output output={ai.output} running={ai.running} error={ai.error} />
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-lg font-medium">Task inbox</h2>
            <span className="text-xs text-muted-foreground">{open} open</span>
          </div>
          <form onSubmit={addTask} className="panel mb-3 flex flex-wrap items-center gap-2 p-2">
            <input className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground" placeholder="Add a task…" value={title} onChange={(e) => setTitle(e.target.value)} />
            <select className="field w-auto py-1.5 text-xs" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <input type="date" className="field w-auto py-1.5 text-xs" value={due} onChange={(e) => setDue(e.target.value)} />
            <button className="btn-primary h-8 w-8 p-0" aria-label="Add task"><Plus className="h-4 w-4" /></button>
          </form>
          <ul className="panel divide-y divide-border">
            {tasks.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">Your inbox is clear.</li>}
            {tasks.map((t) => (
              <li key={t.id} className="group flex items-center gap-3 px-4 py-3">
                <button onClick={() => toggle(t)} aria-label="Toggle done">
                  {t.done ? <CheckCircle2 className="h-5 w-5 text-brand" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                </button>
                <span className={`flex-1 text-sm ${t.done ? "text-muted-foreground line-through" : ""}`}>{t.title}</span>
                {t.due_at && <span className="text-xs text-muted-foreground">{new Date(t.due_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>}
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${t.priority === "high" ? "bg-destructive/10 text-destructive" : t.priority === "low" ? "bg-muted text-muted-foreground" : "bg-brand-soft text-brand"}`}>{t.priority}</span>
                <button onClick={() => remove(t.id)} className="opacity-0 transition group-hover:opacity-100" aria-label="Delete"><Trash2 className="h-4 w-4 text-muted-foreground" /></button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-lg font-medium">Recent automations</h2>
            <Link to="/history" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">All <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <ul className="space-y-2">
            {runs.length === 0 && <li className="panel p-6 text-center text-sm text-muted-foreground">Nothing yet — try the command bar.</li>}
            {runs.map((r) => (
              <li key={r.id} className="panel p-4">
                <div className="flex items-center justify-between">
                  <span className="eyebrow">{TOOL_LABEL[r.tool] ?? r.tool}</span>
                  <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm">{r.prompt}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
