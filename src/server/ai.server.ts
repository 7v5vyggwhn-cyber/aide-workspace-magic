import { createOpenAI } from "@ai-sdk/openai";
import { createClient } from "@supabase/supabase-js";

export const MODEL = "openai/gpt-6-astra";
const RUN_ID = "X-Lovable-AIG-Run-ID";

export function createProvider(request: Request) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not set");
  let runId = request.headers.get(RUN_ID)?.trim() || undefined;
  return createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: async (input, init) => {
      const headers = new Headers(init?.headers);
      if (runId && !headers.has(RUN_ID)) headers.set(RUN_ID, runId);
      const res = await fetch(input, { ...init, headers });
      runId ??= res.headers.get(RUN_ID)?.trim() || undefined;
      return res;
    },
  });
}

export const PROVIDER_OPTIONS = {
  openai: {
    forceReasoning: true,
    reasoningEffort: "low",
    reasoningSummary: "auto",
    store: false,
    include: ["reasoning.encrypted_content"],
  },
};

export async function verifyUser(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

const BASE = `You are AdelAIde, a sharp, warm AI productivity assistant for busy professionals. Today is ${new Date().toDateString()}. Write in clean Markdown. Be concise and immediately useful; never mention being an AI model. If details are missing, make sensible placeholders in [brackets].`;

export const SYSTEM_PROMPTS: Record<string, string> = {
  email: `${BASE}\nYou write professional emails. Output: a line "**Subject:** ...", a blank line, then the email body with greeting and sign-off. Match the tone requested (default: friendly-professional).`,
  notes: `${BASE}\nYou summarize meetings. Output sections: ## Summary (3-5 bullets), ## Decisions, ## Action items (table: Task | Owner | Due), ## Open questions.`,
  planner: `${BASE}\nYou plan and schedule work. Output: ## Priorities (ranked, with a one-line reason each, using Eisenhower urgency/importance), ## Schedule (table: Day | Time block | Task), ## Tips (max 3).`,
  research: `${BASE}\nYou are a research analyst. Output: ## TL;DR, ## Key findings (bullets), ## Considerations / risks, ## Recommended next steps. Flag anything that needs verification with fresh sources.`,
  auto: `${BASE}\nYou are an automation engine. The user gives a workplace instruction (e.g. "summarize this report", "draft an email to a client about the delivery address"). Identify the task and execute it fully right away — do not ask clarifying questions. Start with one line: "**Task:** <short description>", then a horizontal rule, then the finished deliverable.`,
  chat: `${BASE}\nYou are a helpful conversational workplace assistant. You can draft emails, summarize, plan and research on request.`,
};
