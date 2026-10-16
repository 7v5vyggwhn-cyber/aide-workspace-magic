import { useState } from "react";
import { CalendarPlus, ExternalLink } from "lucide-react";
import { addPlanToCalendar } from "@/server/calendar.functions";
import { supabase } from "@/integrations/supabase/client";

export function AddToCalendar({ plan }: { plan: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ title: string; start: string; link: string }[] | null>(null);

  async function go() {
    setBusy(true);
    setError(null);
    try {
      const now = new Date();
      const r = await addPlanToCalendar({
        data: {
          plan,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          now: now.toLocaleString("sv-SE").replace(" ", "T") + ` (${now.toLocaleDateString(undefined, { weekday: "long" })})`,
        },
      });
      setCreated(r.created);
      await supabase.from("task_runs").insert({
        tool: "calendar",
        prompt: `Added ${r.created.length} event(s) to Google Calendar`,
        output: r.created.map((c) => `- **${c.title}** — ${c.start.replace("T", " ").slice(0, 16)}`).join("\n"),
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel mt-4 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-medium">Put this schedule on your calendar</h3>
          <p className="text-xs text-muted-foreground">Each time block becomes a Google Calendar event.</p>
        </div>
        <button className="btn-brand shrink-0" onClick={go} disabled={busy || !!created}>
          <CalendarPlus className="h-4 w-4" /> {busy ? "Scheduling…" : created ? "Added" : "Add to calendar"}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      {created && (
        <ul className="mt-4 divide-y divide-border border-t border-border text-sm">
          {created.map((c, i) => (
            <li key={i} className="flex items-center justify-between py-2">
              <span>{c.title}</span>
              <span className="flex items-center gap-3 text-xs text-muted-foreground">
                {new Date(c.start).toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" })}
                {c.link && <a href={c.link} target="_blank" rel="noreferrer" aria-label="Open in Google Calendar"><ExternalLink className="h-3.5 w-3.5" /></a>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
