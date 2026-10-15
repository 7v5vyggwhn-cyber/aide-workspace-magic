import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { LayoutDashboard, Mail, NotebookPen, CalendarClock, Search, MessagesSquare, History, Plug, LogOut } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

const nav = [
  { to: "/dashboard", params: {}, label: "Dashboard", icon: LayoutDashboard },
  { to: "/tools/$tool", params: { tool: "email" }, label: "Email Generator", icon: Mail },
  { to: "/tools/$tool", params: { tool: "notes" }, label: "Meeting Notes", icon: NotebookPen },
  { to: "/tools/$tool", params: { tool: "planner" }, label: "Task Planner", icon: CalendarClock },
  { to: "/tools/$tool", params: { tool: "research" }, label: "Research", icon: Search },
  { to: "/chat", params: {}, label: "Chat", icon: MessagesSquare },
  { to: "/history", params: {}, label: "History", icon: History },
  { to: "/integrations", params: {}, label: "Integrations", icon: Plug },
] as const;

function AppLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 py-6 md:flex">
        <Link to="/dashboard" className="px-3">
          <Logo />
        </Link>
        <nav className="mt-8 flex-1 space-y-0.5">
          {nav.map((n) => (
            <Link
              key={n.label}
              to={n.to}
              params={n.params as never}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
              activeProps={{ className: "bg-sidebar-accent !text-foreground font-medium" }}
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-sidebar-border px-3 pt-4">
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          <button
            className="mt-2 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => supabase.auth.signOut()}
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-1 overflow-x-auto border-b border-border px-4 py-3 md:hidden">
          {nav.map((n) => (
            <Link key={n.label} to={n.to} params={n.params as never} className="btn-ghost h-8 shrink-0 px-2" activeProps={{ className: "bg-accent" }} aria-label={n.label}>
              <n.icon className="h-4 w-4" />
            </Link>
          ))}
        </div>
        <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
