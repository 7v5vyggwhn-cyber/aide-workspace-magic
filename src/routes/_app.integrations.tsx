import { createFileRoute } from "@tanstack/react-router";
import { Mail, CalendarDays, Hash } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/_app/integrations")({
  head: () => ({
    meta: [
      { title: "Integrations — AdelAIde" },
      { name: "description", content: "Connect Gmail, Google Calendar and Slack to AdelAIde." },
      { property: "og:title", content: "Integrations — AdelAIde" },
      { property: "og:description", content: "Connect Gmail, Google Calendar and Slack to AdelAIde." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Integrations,
});

const items = [
  { icon: Mail, name: "Gmail", text: "Send generated emails and summarize your inbox." },
  { icon: CalendarDays, name: "Google Calendar", text: "Turn planned tasks into calendar events." },
  { icon: Hash, name: "Slack", text: "Post summaries and updates to your channels." },
];

function Integrations() {
  return (
    <div>
      <PageHeader eyebrow="Connections" title="Integrations" description="Connect your own accounts so AdelAIde can act on your behalf." />
      <ul className="grid gap-3 sm:grid-cols-3">
        {items.map((i) => { const live = i.name === "Google Calendar"; return (
          <li key={i.name} className="panel flex flex-col p-5">
            <i.icon className="h-5 w-5 text-brand" />
            <h3 className="mt-4 font-medium">{i.name}</h3>
            <p className="mt-1 flex-1 text-sm text-muted-foreground">{i.text}</p>
            {live ? <span className="mt-5 rounded-lg bg-brand-soft px-3 py-2 text-center text-sm font-medium text-brand">Connected</span> : <button className="btn-outline mt-5" disabled>Coming soon</button>}
          </li>
        ); })}
      </ul>
    </div>
  );
}
