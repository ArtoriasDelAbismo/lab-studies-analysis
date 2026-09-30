import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

type Search = { redirect: string | undefined };

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    redirect: typeof search["redirect"] === "string" ? search["redirect"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Lab Studies Analyzer" },
      {
        name: "description",
        content: "Sign in to analyse your lab results and keep a private history of past reports.",
      },
      { property: "og:title", content: "Sign in — Lab Studies Analyzer" },
      { property: "og:description", content: "Sign in to analyse and track your lab results." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function safePath(value: string | undefined): string {
  if (!value) return "/upload";
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  return "/upload";
}

const LOVABLE_HOSTS = ["lovable.app", "lovableproject.com", "lovable.dev"];

function isLovableHost(): boolean {
  const host = window.location.hostname;
  return LOVABLE_HOSTS.some((zone) => host === zone || host.endsWith(`.${zone}`));
}

function AuthPage() {
  const { redirect } = Route.useSearch();
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    if (!loading && session) {
      window.location.href = safePath(redirect);
    }
  }, [loading, session, redirect]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}${safePath(redirect)}` },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success(t("confirmEmail"));
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: safePath(redirect) });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("genericError"));
    } finally {
      setBusy(false);
    }
  };

  const googleSignIn = async () => {
    setBusy(true);
    try {
      sessionStorage.setItem("post-auth-path", safePath(redirect));
      // The Lovable OAuth broker (/~oauth) only exists on Lovable hosting; elsewhere use Supabase directly.
      if (!isLovableHost()) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: window.location.origin },
        });
        if (error) toast.error(t("googleError"));
        return;
      }
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(t("googleError"));
        return;
      }
      if (result.redirected) return;
      navigate({ to: safePath(redirect) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto flex max-w-md flex-col px-4 py-14">
        <h1 className="text-2xl font-semibold text-foreground">
           {mode === "signin" ? t("welcomeBack") : t("createAccount")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
           {t("privateResults")}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="space-y-1.5">
             <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
             <Label htmlFor="password">{t("password")}</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
             {mode === "signin" ? t("signIn") : t("createAccount")}
          </Button>
          <Button type="button" variant="outline" className="w-full" disabled={busy} onClick={googleSignIn}>
             {t("continueGoogle")}
          </Button>
        </form>

        <button
          type="button"
          className="mt-4 text-sm text-primary underline-offset-4 hover:underline"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
           {mode === "signin" ? t("newHere") : t("haveAccount")}
        </button>
      </main>
    </div>
  );
}
