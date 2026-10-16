import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { streamText } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CAL_URL = "https://connector-gateway.lovable.dev/google_calendar/calendar/v3/calendars/primary/events";

type Ev = { title: string; start: string; end: string; description?: string };

export const addPlanToCalendar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { plan: string; timeZone: string; now: string }) => {
    if (!d?.plan || d.plan.length > 30000) throw new Error("Invalid plan");
    return { plan: d.plan, timeZone: String(d.timeZone || "UTC").slice(0, 64), now: String(d.now).slice(0, 40) };
  })
  .handler(async ({ data }) => {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const calKey = process.env["GOOGLE_CALENDAR_API_KEY"];
    if (!lovableKey || !calKey) throw new Error("Google Calendar isn't connected.");

    const { createProvider, MODEL } = await import("@/server/ai.server");
    const provider = createProvider(getRequest() ?? new Request("http://localhost"));
    const result = streamText({
      model: provider.responses(MODEL),
      system:
        `Extract calendar events from a schedule. The user's current local time is ${data.now} in time zone ${data.timeZone}. ` +
        `Resolve relative days (e.g. "Monday") to the next upcoming date. Return ONLY a JSON array, no prose, of objects: ` +
        `{"title": string, "start": "YYYY-MM-DDTHH:MM:SS", "end": "YYYY-MM-DDTHH:MM:SS", "description": string} using local time without offset. ` +
        `If a block has no time, pick a sensible working-hours slot. Max 20 events.`,
      messages: [{ role: "user", content: data.plan }],
      providerOptions: {
        openai: { forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] },
      },
    });
    const text = await result.text;
    let events: Ev[] = [];
    try {
      const m = text.match(/\[[\s\S]*\]/);
      events = JSON.parse(m ? m[0] : "[]");
    } catch {
      throw new Error("Couldn't read the schedule. Try generating the plan again.");
    }
    events = events.filter((e) => e?.title && e.start && e.end).slice(0, 20);
    if (!events.length) throw new Error("No schedulable time blocks were found in this plan.");

    const created: { title: string; start: string; link: string }[] = [];
    for (const e of events) {
      const res = await fetch(CAL_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "X-Connection-Api-Key": calKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: e.title,
          description: (e.description ? e.description + "\n\n" : "") + "Scheduled by AdelAIde",
          start: { dateTime: e.start, timeZone: data.timeZone },
          end: { dateTime: e.end, timeZone: data.timeZone },
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        console.error(`Calendar insert failed [${res.status}]: ${body}`);
        throw new Error(`Google Calendar rejected the event (${res.status}). ${created.length} event(s) were added before this.`);
      }
      const j = (await res.json()) as { htmlLink?: string };
      created.push({ title: e.title, start: e.start, link: j.htmlLink ?? "" });
    }
    return { created };
  });
