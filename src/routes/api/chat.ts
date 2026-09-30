import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";
import { MEDICAL_SYSTEM_PROMPT, streamAstraText } from "@/lib/ai.server";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get("authorization");
        const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
        if (!token) return new Response("Unauthorized", { status: 401 });

        const url = process.env["SUPABASE_URL"];
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
        if (!url || !key) return new Response("Backend not configured", { status: 500 });

        const supabase = createClient<Database>(url, key, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: {
            fetch: (input, init) => {
              const headers = new Headers(init?.headers);
              if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
                headers.delete("Authorization");
              }
              headers.set("apikey", key);
              headers.set("Authorization", `Bearer ${token}`);
              return fetch(input, { ...init, headers });
            },
          },
        });

        const { data: claims } = await supabase.auth.getClaims(token);
        const userId = claims?.claims?.sub;
        if (!userId) return new Response("Unauthorized", { status: 401 });

        const body = (await request.json()) as { reportId?: string; message?: string; locale?: "en" | "es" };
        if (!body.reportId || !body.message?.trim()) {
          return new Response("Missing message", { status: 400 });
        }

        const { data: report } = await supabase
          .from("lab_reports")
          .select("title, test_date, lab_name, overall_status, urgency, summary")
          .eq("id", body.reportId)
          .maybeSingle();

        if (!report) return new Response("Report not found", { status: 404 });

        const [{ data: results }, { data: history }] = await Promise.all([
          supabase
            .from("lab_results")
            .select("test_name, panel, value_text, unit, range_text, status")
            .eq("report_id", body.reportId)
            .order("sort_order"),
          supabase
            .from("chat_messages")
            .select("role, content")
            .eq("report_id", body.reportId)
            .order("created_at")
            .limit(30),
        ]);

        const resultLines = (results ?? [])
          .map(
            (r) =>
              `- ${r.test_name} (${r.panel}): ${r.value_text ?? ""} ${r.unit ?? ""} | reference ${r.range_text ?? "n/a"} | ${r.status}`,
          )
          .join("\n");

        const transcript = (history ?? [])
          .map((m) => `${m.role === "user" ? "Person" : "Assistant"}: ${m.content}`)
          .join("\n");

        await supabase.from("chat_messages").insert({
          report_id: body.reportId,
          user_id: userId,
          role: "user",
          content: body.message,
        });

        const stream = await streamAstraText({
          system: `${MEDICAL_SYSTEM_PROMPT}
You are answering follow-up questions about one specific set of lab results shown below. Keep answers short (under 150 words), warm and concrete. Use markdown formatting when it helps. Close with a reminder to confirm with their healthcare provider when the question touches on treatment.
Respond entirely in ${body.locale === "es" ? "Spanish" : "English"}.`,
          effort: "low",
          parts: [
            {
              type: "input_text",
              text: `Report: ${report.title} (${report.test_date ?? "date unknown"}, ${report.lab_name ?? "lab unknown"})
Overall status: ${report.overall_status}, urgency: ${report.urgency}
Summary: ${report.summary ?? "none"}

Results:
${resultLines}

${transcript ? `Conversation so far:\n${transcript}\n` : ""}
New question from the person: ${body.message}`,
            },
          ],
        });

        // Tee the stream so the full answer can be stored once it finishes.
        const [toClient, toStore] = stream.tee();
        void (async () => {
          const reader = toStore.getReader();
          const decoder = new TextDecoder();
          let full = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            full += decoder.decode(value, { stream: true });
          }
          if (full.trim()) {
            await supabase.from("chat_messages").insert({
              report_id: body.reportId!,
              user_id: userId,
              role: "assistant",
              content: full,
            });
          }
        })();

        return new Response(toClient, {
          headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
        });
      },
    },
  },
});
