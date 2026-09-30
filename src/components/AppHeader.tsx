import { Link, useNavigate } from "@tanstack/react-router";
import { Activity, Languages, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export function AppHeader() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { locale, setLocale, t } = useI18n();

  return (
    <header className="no-print sticky top-0 z-30 border-b border-border/70 bg-card/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="size-4" />
          </span>
          <span className="hidden sm:inline">Lab Studies Analyzer</span>
        </Link>

        <nav className="ml-auto flex items-center gap-1 text-sm">
          <Link
            to="/learn"
            className="rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {t("testLibrary")}
          </Link>
          {session ? (
            <>
              <Link
                to="/history"
                className="rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {t("history")}
              </Link>
              <Link to="/upload">
                <Button size="sm">{t("newAnalysis")}</Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("signOut")}
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate({ to: "/" });
                }}
              >
                <LogOut className="size-4" />
              </Button>
            </>
          ) : (
            <Link to="/auth" search={{ redirect: undefined }}>
              <Button size="sm">{t("signIn")}</Button>
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-1 border-l border-border pl-2">
          <Languages className="size-4 text-muted-foreground" aria-hidden="true" />
          <select
            aria-label="Language / Idioma"
            value={locale}
            onChange={(event) => setLocale(event.target.value === "es" ? "es" : "en")}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium text-foreground"
          >
            <option value="en">EN</option>
            <option value="es">ES</option>
          </select>
        </div>
      </div>
    </header>
  );
}
