export type ToolId = "auto" | "email" | "notes" | "planner" | "research";

export const TOOLS: Record<
  Exclude<ToolId, "auto">,
  { name: string; short: string; description: string; placeholder: string }
> = {
  email: {
    name: "Smart Email Generator",
    short: "Email",
    description: "Describe who you're writing to and why. AdelAIde drafts a polished, ready-to-send email.",
    placeholder: "Draft an email to a client confirming the new delivery address for order #4821…",
  },
  notes: {
    name: "Meeting Notes Summarizer",
    short: "Notes",
    description: "Paste raw notes or a transcript. Get a summary, decisions, and action items with owners.",
    placeholder: "Paste meeting notes or a transcript here…",
  },
  planner: {
    name: "Task Planner & Scheduler",
    short: "Planner",
    description: "List what's on your plate. AdelAIde prioritises it and builds a realistic schedule.",
    placeholder: "Finish Q3 report, prep client deck, 3 interviews, review budget — due by Friday…",
  },
  research: {
    name: "Research Assistant",
    short: "Research",
    description: "Ask a question or paste material. Get a structured brief with key findings and next steps.",
    placeholder: "Compare the pros and cons of a 4-day work week for a 50-person agency…",
  },
};

export const TOOL_LABEL: Record<string, string> = {
  auto: "Automation",
  chat: "Chat",
  ...Object.fromEntries(Object.entries(TOOLS).map(([k, v]) => [k, v.short])),
};
