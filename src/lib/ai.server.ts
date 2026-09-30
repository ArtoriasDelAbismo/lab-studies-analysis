// Server-only helpers for calling the Lovable AI Gateway Responses API.

const RESPONSES_URL = "https://ai.gateway.lovable.dev/v1/responses";
const MODEL = "openai/gpt-6-astra";

export type InputPart =
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string }
  | { type: "input_file"; file_url: string; filename?: string };

type RunOptions = {
  system: string;
  parts: InputPart[];
  schema?: { name: string; schema: Record<string, unknown> };
  effort?: "low" | "medium" | "high";
};

function gatewayError(status: number, body: string): Error {
  if (status === 402) {
    return new Error(
      "The AI workspace is out of credits. Add credits in Settings to keep analysing results.",
    );
  }
  if (status === 429) {
    return new Error("The AI service is busy right now. Please try again in a moment.");
  }
  return new Error(`AI service error (${status}): ${body.slice(0, 300)}`);
}

async function buildRequest(options: RunOptions) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

  const body: Record<string, unknown> = {
    model: MODEL,
    stream: true,
    instructions: options.system,
    input: [{ role: "user", content: options.parts }],
    reasoning: { effort: options.effort ?? "low", summary: "auto" },
    include: ["reasoning.encrypted_content"],
    store: false,
  };

  if (options.schema) {
    body["text"] = {
      format: {
        type: "json_schema",
        name: options.schema.name,
        strict: true,
        schema: options.schema.schema,
      },
    };
  }

  const res = await fetch(RESPONSES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    const text = res.body ? await res.text() : "";
    throw gatewayError(res.status, text);
  }

  return res;
}

/** Streams the model response and returns the full concatenated text. */
export async function runAstraText(options: RunOptions): Promise<string> {
  const res = await buildRequest(options);
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let out = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const event = JSON.parse(payload) as {
          type?: string;
          delta?: string;
          response?: { output_text?: string };
        };
        if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
          out += event.delta;
        } else if (event.type === "response.completed" && !out) {
          out = event.response?.output_text ?? "";
        }
      } catch {
        // ignore malformed keep-alive lines
      }
    }
  }

  return out.trim();
}

/** Streams the model response and parses it as JSON matching the given schema. */
export async function runAstraJson<T>(options: RunOptions & { schema: NonNullable<RunOptions["schema"]> }): Promise<T> {
  const text = await runAstraText(options);
  if (!text) throw new Error("The AI returned an empty response. Please try again.");
  try {
    return JSON.parse(text) as T;
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(text.slice(start, end + 1)) as T;
    }
    throw new Error("The AI response could not be read. Please try again.");
  }
}

/** Returns a plain-text stream of the model answer, for chat UIs. */
export async function streamAstraText(options: RunOptions): Promise<ReadableStream<Uint8Array>> {
  const res = await buildRequest(options);
  const upstream = res.body!.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await upstream.read();
      if (done) {
        controller.close();
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const event = JSON.parse(payload) as { type?: string; delta?: string };
          if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
            controller.enqueue(encoder.encode(event.delta));
          }
        } catch {
          // ignore
        }
      }
    },
    cancel(reason) {
      return upstream.cancel(reason);
    },
  });
}

export const MEDICAL_SYSTEM_PROMPT = `You are a careful, friendly medical lab results interpreter writing for patients with no medical training.
Rules you must always follow:
- Explain in plain, everyday language at roughly an 8th-grade reading level.
- Never diagnose, never prescribe, never tell someone to start or stop medication.
- Provide educational information only and always encourage discussing results with a healthcare provider.
- Be calm and non-alarming, but do not hide genuinely concerning findings.
- If information is missing or unclear, say so rather than guessing.`;
