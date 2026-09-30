import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

type Message = { id: string; role: string; content: string };

export function ReportChat({
  reportId,
  initialMessages,
}: {
  reportId: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const { locale, t } = useI18n();

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    const question = input.trim();
    if (!question || busy) return;

    setInput("");
    setBusy(true);
    const localId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { id: localId, role: "user", content: question },
      { id: `${localId}-a`, role: "assistant", content: "" },
    ]);

    try {
      const { data } = await supabase.auth.getSession();
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ reportId, message: question, locale }),
      });

      if (!response.ok || !response.body) {
        throw new Error(await response.text().catch(() => t("answerError")));
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) => (m.id === `${localId}-a` ? { ...m, content: answer } : m)),
        );
      }
    } catch (error) {
      setMessages((prev) => prev.filter((m) => m.id !== `${localId}-a`));
      toast.error(error instanceof Error ? error.message : t("answerError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="no-print rounded-xl border border-border bg-card p-5 shadow-sm">
       <h2 className="text-base font-semibold text-foreground">{t("askFollowUp")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
         {t("chatBody")}
      </p>

      <div className="mt-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={
              message.role === "user"
                ? "ml-auto max-w-[85%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
                : "max-w-[90%] rounded-lg bg-muted px-3 py-2 text-sm text-foreground"
            }
          >
            {message.role === "user" ? (
              message.content
            ) : message.content ? (
              <div className="prose prose-sm max-w-none dark:prose-invert [&_p]:my-1.5">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            ) : (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={send} className="mt-4 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("chatPlaceholder")}
          disabled={busy}
        />
        <Button type="submit" disabled={busy || !input.trim()} aria-label={t("send")}>
          <Send className="size-4" />
        </Button>
      </form>
    </section>
  );
}
