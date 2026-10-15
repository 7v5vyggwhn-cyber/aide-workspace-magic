import { createFileRoute } from "@tanstack/react-router";
import { streamText } from "ai";
import { createProvider, MODEL, PROVIDER_OPTIONS, SYSTEM_PROMPTS, verifyUser } from "@/server/ai.server";

export const Route = createFileRoute("/api/ai")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await verifyUser(request);
        if (!user) return Response.json({ error: "Please sign in again." }, { status: 401 });
        const body = (await request.json().catch(() => null)) as { tool?: string; input?: string } | null;
        const tool = body?.tool ?? "auto";
        const input = body?.input?.trim();
        if (!input || !SYSTEM_PROMPTS[tool] || input.length > 60000) {
          return Response.json({ error: "Invalid request" }, { status: 400 });
        }
        const provider = createProvider(request);
        const result = streamText({
          model: provider.responses(MODEL),
          system: SYSTEM_PROMPTS[tool]!,
          messages: [{ role: "user", content: input }],
          abortSignal: request.signal,
          providerOptions: PROVIDER_OPTIONS,
          onError: ({ error }) => console.error("AI error", error),
        });
        return result.toTextStreamResponse();
      },
    },
  },
});
