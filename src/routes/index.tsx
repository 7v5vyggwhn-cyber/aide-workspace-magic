import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Mail, NotebookPen, CalendarClock, Search, MessagesSquare } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AdelAIde — Automate your workday with AI" },
      { name: "description", content: "Type what you need. AdelAIde drafts emails, summarizes meetings, plans your week and researches for you." },
      { property: "og:title", content: "AdelAIde — Automate your workday with AI" },
      { property: "og:description", content: "Type what you need. AdelAIde drafts emails, summarizes meetings, plans your week and researches for you." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Mail, title: "Smart emails", text: "From one line to a polished draft." },
  { icon: NotebookPen, title: "Meeting notes", text: "Decisions and action items, instantly." },
  { icon: CalendarClock, title: "Task planner", text: "Priorities and a realistic schedule." },
  { icon: Search, title: "Research", text: "Structured briefs from any question." },
  { icon: MessagesSquare, title: "Chat", text: "An assistant that knows your work." },
];

function Landing() {
  const { user } = useAuth();
  const cta = user ? "/dashboard" : "/auth";
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <Link to={cta} className="btn-outline">
          {user ? "Open dashboard" : "Sign in"}
        </Link>
      </header>
      <main className="mx-auto max-w-6xl px-6">
        <section className="py-24 text-center md:py-32">
          <p className="eyebrow mb-6">Your AI chief of staff</p>
          <h1 className="font-display mx-auto max-w-3xl text-5xl leading-[1.05] tracking-tight md:text-7xl">
            Say what needs doing. <span className="italic text-brand">Consider it done.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            AdelAIde turns plain instructions into finished work — emails, summaries, schedules and research.
          </p>
          <div className="mx-auto mt-10 max-w-xl panel flex items-center gap-3 p-2 pl-5 text-left shadow-sm">
            <span className="flex-1 truncate text-sm text-muted-foreground">
              “Draft an email to a client about the new delivery address”
            </span>
            <Link to={cta} className="btn-primary">
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
        <section className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border pb-px sm:grid-cols-2 lg:grid-cols-5">
          {features.map((f) => (
            <div key={f.title} className="bg-background p-6">
              <f.icon className="h-5 w-5 text-brand" />
              <h3 className="mt-4 font-medium">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </section>
        <footer className="py-16 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} AdelAIde</footer>
      </main>
    </div>
  );
}
