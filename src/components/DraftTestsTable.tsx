import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DraftTest } from "@/lib/lab-types";
import { useI18n } from "@/lib/i18n";

export const emptyTest: DraftTest = {
  name: "",
  panel: "Other",
  value_text: "",
  unit: "",
  range_low: null,
  range_high: null,
  range_text: "",
  confidence: null,
};

export function DraftTestsTable({
  tests,
  onChange,
}: {
  tests: DraftTest[];
  onChange: (tests: DraftTest[]) => void;
}) {
  const { locale, t } = useI18n();
  const update = (index: number, patch: Partial<DraftTest>) => {
    onChange(tests.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  };

  return (
    <div className="space-y-3">
      <div className="hidden gap-2 px-1 text-xs font-medium text-muted-foreground md:grid md:grid-cols-[2fr_1.2fr_1fr_0.8fr_1.2fr_auto]">
        <span>{t("testName")}</span>
        <span>{t("panel")}</span>
        <span>{t("value")}</span>
        <span>{t("unit")}</span>
        <span>{t("referenceRange")}</span>
        <span className="w-9" />
      </div>

      {tests.map((test, index) => (
        <div
          key={index}
          className="grid gap-2 rounded-lg border border-border bg-card p-3 md:grid-cols-[2fr_1.2fr_1fr_0.8fr_1.2fr_auto] md:items-center md:border-0 md:bg-transparent md:p-0"
        >
          <Input
            aria-label={t("testName")}
            placeholder={locale === "es" ? "Ej.: colesterol LDL" : "e.g. LDL cholesterol"}
            value={test.name}
            onChange={(e) => update(index, { name: e.target.value })}
          />
          <Input
            aria-label={t("panel")}
            placeholder="Lipid panel"
            value={test.panel}
            onChange={(e) => update(index, { panel: e.target.value })}
          />
          <Input
            aria-label={t("value")}
            className="font-mono"
            placeholder="142"
            value={test.value_text}
            onChange={(e) => update(index, { value_text: e.target.value })}
          />
          <Input
            aria-label={t("unit")}
            placeholder="mg/dL"
            value={test.unit}
            onChange={(e) => update(index, { unit: e.target.value })}
          />
          <Input
            aria-label={t("referenceRange")}
            placeholder="< 100"
            value={test.range_text}
            onChange={(e) => update(index, { range_text: e.target.value })}
          />
          <div className="flex items-center justify-between gap-2">
            {test.confidence !== null && test.confidence < 0.7 ? (
              <span className="rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-medium text-warning">
                {t("check")}
              </span>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`${t("removeRow")}: ${test.name || t("testName")}`}
              onClick={() => onChange(tests.filter((_, i) => i !== index))}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...tests, { ...emptyTest }])}>
        <Plus className="mr-1 size-4" /> {t("addTest")}
      </Button>
    </div>
  );
}
