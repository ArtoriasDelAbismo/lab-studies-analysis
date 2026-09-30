import { ShieldAlert } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function Disclaimer({ className = "" }: { className?: string }) {
  const { t } = useI18n();
  return (
    <p
      className={`flex items-start gap-2 rounded-lg border border-border bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground ${className}`}
    >
      <ShieldAlert className="mt-0.5 size-4 shrink-0" />
      <span>
        {t("disclaimer")}
      </span>
    </p>
  );
}
