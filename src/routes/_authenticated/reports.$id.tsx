import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Download, Loader2 } from "lucide-react";

import { Disclaimer } from "@/components/Disclaimer";
import { ReportChat } from "@/components/ReportChat";
import { ResultCard } from "@/components/ResultCard";
import { Button } from "@/components/ui/button";
import {
  toCorrelations,
  type LabReportRow,
  type LabResultRow,
} from "@/lib/lab-types";
import { getReport } from "@/lib/labs.functions";
import { downloadReportPdf } from "@/lib/report-pdf";
import { labels, useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/reports/$id")({
  head: () => ({
    meta: [
      { title: "Your results explained — Lab Studies Analyzer" },
      {
        name: "description",
        content:
          "A plain-language breakdown of your lab report: every value, what it means, and questions to bring to your doctor.",
      },
      { property: "og:title", content: "Your results explained — Lab Studies Analyzer" },
      { property: "og:description", content: "A plain-language breakdown of your lab report." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReportPage,
});

const urgencyStyles: Record<string, string> = {
  routine: "bg-success/10 text-success border-success/30",
  soon: "bg-warning/10 text-warning border-warning/30",
  urgent: "bg-danger/10 text-danger border-danger/30",
};

const urgencyDot: Record<string, string> = {
  routine: "🟢",
  soon: "🟡",
  urgent: "🔴",
};

function ReportPage() {
  const { locale, t } = useI18n();
  const localized = labels(locale);
  const { id } = Route.useParams();
  const fetchReport = useServerFn(getReport);

  const { data, isPending, isError } = useQuery({
    queryKey: ["report", id],
    queryFn: () => fetchReport({ data: { id } }),
  });

  if (isPending) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
         <h1 className="text-xl font-semibold text-foreground">{t("notFoundReport")}</h1>
         <p className="mt-2 text-sm text-muted-foreground">{t("deletedReport")}</p>
      </main>
    );
  }

  const report = data.report as unknown as LabReportRow;
  const results = data.results as unknown as LabResultRow[];
  const questions = data.questions as unknown as { id: string; question: string }[];
  const correlations = toCorrelations(report.correlations);

  const counts = {
    normal: results.filter((r) => r.status === "normal").length,
    borderline: results.filter((r) => r.status === "borderline").length,
    abnormal: results.filter((r) => r.status === "abnormal").length,
  };

  const panels = Array.from(new Set(results.map((r) => r.panel || "Other")));

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{report.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
             {[report.test_date, report.lab_name].filter(Boolean).join(" • ") || t("savedAccount")}
          </p>
        </div>
        <Button
          variant="outline"
          className="no-print"
           onClick={() => downloadReportPdf(report, results, questions, locale)}
        >
           <Download className="mr-2 size-4" /> {t("downloadPdf")}
        </Button>
      </div>

      <section className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-lg font-semibold text-foreground">
             {localized.overall[report.overall_status] ?? report.overall_status}
          </span>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              urgencyStyles[report.urgency] ?? urgencyStyles["routine"]
            }`}
          >
             {urgencyDot[report.urgency] ?? "🟢"} {localized.urgency[report.urgency] ?? report.urgency}
          </span>
        </div>
        {report.summary ? (
          <p className="mt-3 text-sm leading-relaxed text-foreground">{report.summary}</p>
        ) : null}

        <div className="mt-4 grid grid-cols-3 gap-3">
           <Stat label={t("normal")} value={counts.normal} tone="text-success" />
           <Stat label={t("borderline")} value={counts.borderline} tone="text-warning" />
           <Stat label={t("abnormal")} value={counts.abnormal} tone="text-danger" />
        </div>
      </section>

      {correlations.length ? (
        <section className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
           <h2 className="text-base font-semibold text-foreground">{t("patterns")}</h2>
          <ul className="mt-3 space-y-3">
            {correlations.map((item) => (
              <li key={item.title}>
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {panels.map((panel) => (
        <section key={panel} className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{panel}</h2>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {results
              .filter((r) => (r.panel || "Other") === panel)
              .map((result) => (
                <ResultCard key={result.id} result={result} />
              ))}
          </div>
        </section>
      ))}

      {questions.length ? (
        <section className="mt-8 rounded-xl border border-border bg-card p-5 shadow-sm">
           <h2 className="text-base font-semibold text-foreground">{t("doctorQuestions")}</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-foreground">
            {questions.map((question) => (
              <li key={question.id}>{question.question}</li>
            ))}
          </ol>
        </section>
      ) : null}

      <div className="mt-8">
        <ReportChat reportId={id} initialMessages={data.messages as unknown as { id: string; role: string; content: string }[]} />
      </div>

      <Disclaimer className="mt-8" />
    </main>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3 text-center">
      <p className={`font-mono text-2xl font-semibold ${tone}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
