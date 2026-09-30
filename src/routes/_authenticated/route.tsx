import { Outlet, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.href });
  const { t } = useI18n();

  useEffect(() => {
    if (!loading && !session) {
      navigate({ to: "/auth", search: { redirect: pathname } });
    }
  }, [loading, session, navigate, pathname]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      {loading || !session ? (
        <div className="mx-auto max-w-6xl px-4 py-16 text-sm text-muted-foreground">{t("loading")}</div>
      ) : (
        <Outlet />
      )}
    </div>
  );
}
