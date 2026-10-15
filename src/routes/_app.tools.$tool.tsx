import { createFileRoute, notFound } from "@tanstack/react-router";
import { Composer, Output, useAiRun } from "@/components/AiRunner";
import { PageHeader } from "@/components/PageHeader";
import { TOOLS } from "@/lib/tools";

export const Route = createFileRoute("/_app/tools/$tool")({
  loader: ({ params }) => {
    const t = TOOLS[params.tool as keyof typeof TOOLS];
    if (!t) throw notFound();
    return { name: t.name, description: t.description };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Tool"} — AdelAIde` },
      { name: "description", content: loaderData?.description ?? "" },
      { property: "og:title", content: `${loaderData?.name ?? "Tool"} — AdelAIde` },
      { property: "og:description", content: loaderData?.description ?? "" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ToolPage,
});

function ToolPage() {
  const { tool } = Route.useParams();
  return <ToolView key={tool} id={tool as keyof typeof TOOLS} />;
}

function ToolView({ id }: { id: keyof typeof TOOLS }) {
  const t = TOOLS[id];
  const ai = useAiRun(id);
  return (
    <div>
      <PageHeader eyebrow="AI tool" title={t.name} description={t.description} />
      <Composer rows={id === "notes" ? 10 : 5} autoFocus placeholder={t.placeholder} running={ai.running} onSubmit={ai.run} onStop={ai.stop} />
      <div className="mt-6">
        <Output output={ai.output} running={ai.running} error={ai.error} />
      </div>
    </div>
  );
}
