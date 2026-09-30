import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Disclaimer } from "@/components/Disclaimer";
import { DraftTestsTable, emptyTest } from "@/components/DraftTestsTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DraftTest } from "@/lib/lab-types";
import { analyzeAndSaveReport } from "@/lib/labs.functions";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/manual")({
  head: () => ({
    meta: [
      { title: "Enter lab values — Lab Studies Analyzer" },
      {
        name: "description",
        content: "Type your lab values in by hand and get a plain-language explanation of each one.",
      },
      { property: "og:title", content: "Enter lab values — Lab Studies Analyzer" },
      { property: "og:description", content: "Type your lab values in by hand and get them explained." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ManualPage,
});

function ManualPage() {
  const navigate = useNavigate();
  const analyze = useServerFn(analyzeAndSaveReport);
  const { locale, t } = useI18n();
  const [title, setTitle] = useState(t("defaultReportTitle"));
  const [labName, setLabName] = useState("");
  const [testDate, setTestDate] = useState("");
  const [tests, setTests] = useState<DraftTest[]>([{ ...emptyTest }, { ...emptyTest }, { ...emptyTest }]);
  const [busy, setBusy] = useState(false);

  const runAnalysis = async () => {
    const filled = tests.filter((t) => t.name.trim() && t.value_text.trim());
    if (!filled.length) {
      toast.error(t("addOneTest"));
      return;
    }
    setBusy(true);
    try {
      const { reportId } = await analyze({
        data: {
          title,
          labName: labName || null,
          testDate: testDate || null,
          sourcePath: null,
          sourceKind: "manual",
          tests: filled,
          locale,
        },
      });
      navigate({ to: "/reports/$id", params: { id: reportId } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("analysisError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
       <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t("manualTitle")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
         {t("manualBody")}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
           <Label htmlFor="title">{t("reportTitle")}</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-1.5">
           <Label htmlFor="lab">{t("laboratory")}</Label>
          <Input id="lab" value={labName} onChange={(e) => setLabName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
           <Label htmlFor="date">{t("testDate")}</Label>
          <Input id="date" type="date" value={testDate} onChange={(e) => setTestDate(e.target.value)} />
        </div>
      </div>

      <div className="mt-8">
        <DraftTestsTable tests={tests} onChange={setTests} />
      </div>

      <Disclaimer className="mt-8" />

      <Button size="lg" className="mt-6" onClick={runAnalysis} disabled={busy}>
        {busy ? (
          <>
             <Loader2 className="mr-2 size-4 animate-spin" /> {t("analysing")}
          </>
        ) : (
           t("analyseResults")
        )}
      </Button>
    </main>
  );
}
