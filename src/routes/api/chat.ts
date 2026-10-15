import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createProvider, MODEL, PROVIDER_OPTIONS, SYSTEM_PROMPTS, verifyUser } from "@/server/ai.server";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await verifyUser(request);
        if (!user) return Response.json({ error: "Please sign in again." }, { status: 401 });
        const { messages } = (await request.json()) as { messages: UIMessage[] };
        const provider = createProvider(request);
        const result = streamText({
          model: provider.responses(MODEL),
          system: SYSTEM_PROMPTS['chat']!,
          messages: await convertToModelMessages(messages.slice(-40)),
          abortSignal: request.signal,
          providerOptions: PROVIDER_OPTIONS,
        });
        return result.toUIMessageStreamResponse({
          sendReasoning: false,
          onError: (e) => {
            console.error("chat error", e);
            const msg = e instanceof Error ? e.message : String(e);
            if (msg.includes("402")) return "AI credits are used up. Please add credits to continue.";
            if (msg.includes("429")) return "Too many requests right now. Try again in a moment.";
            return "Something went wrong generating a reply.";
          },
        });
      },
    },
  },
});
