import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Disclaimer } from "@/components/Disclaimer";
import { Button } from "@/components/ui/button";
import { getTrends, listReports } from "@/lib/labs.functions";
import { labels, useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "Your history — Lab Studies Analyzer" },
      {
        name: "description",
        content: "Every lab report you have analysed, with trend lines showing how each value changes over time.",
      },
      { property: "og:title", content: "Your history — Lab Studies Analyzer" },
      { property: "og:description", content: "Past lab reports and trends over time." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HistoryPage,
});

type TrendRow = {
  test_name: string;
  unit: string | null;
  value_num: number | null;
  lab_reports: { test_date: string | null; created_at: string } | null;
};

function HistoryPage() {
  const { locale, t } = useI18n();
  const localized = labels(locale);
  const fetchReports = useServerFn(listReports);
  const fetchTrends = useServerFn(getTrends);

  const reports = useQuery({ queryKey: ["reports"], queryFn: () => fetchReports({}) });
  const trends = useQuery({ queryKey: ["trends"], queryFn: () => fetchTrends({}) });

  const series = useMemo(() => {
    const rows = (trends.data ?? []) as unknown as TrendRow[];
    const grouped = new Map<string, { date: string; value: number }[]>();
    for (const row of rows) {
      if (row.value_num == null) continue;
      const date = row.lab_reports?.test_date ?? row.lab_reports?.created_at?.slice(0, 10) ?? "";
      const key = row.test_name;
      const list = grouped.get(key) ?? [];
      list.push({ date, value: row.value_num });
      grouped.set(key, list);
    }
    return Array.from(grouped.entries())
      .filter(([, points]) => points.length > 1)
      .map(([name, points]) => ({
        name,
        unit: rows.find((r) => r.test_name === name)?.unit ?? "",
        points: points.sort((a, b) => a.date.localeCompare(b.date)),
      }));
  }, [trends.data]);

  const [selected, setSelected] = useState<string | null>(null);
  const activeSeries = series.find((s) => s.name === selected) ?? series[0];

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
       <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t("historyTitle")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
         {t("historyBody")}
      </p>

      {series.length ? (
        <section className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
           <h2 className="text-base font-semibold text-foreground">{t("trends")}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {series.map((s) => (
              <button
                key={s.name}
                onClick={() => setSelected(s.name)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  activeSeries?.name === s.name
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
          {activeSeries ? (
            <div className="mt-5 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activeSeries.points}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="var(--color-muted-foreground)"
                    unit={activeSeries.unit ? ` ${activeSeries.unit}` : ""}
                    width={70}
                  />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="mt-8">
         <h2 className="text-base font-semibold text-foreground">{t("pastReports")}</h2>
        {reports.isPending ? (
          <div className="mt-6 flex justify-center">
            <Loader2 className="size-5 animate-spin text-primary" />
          </div>
        ) : reports.data?.length ? (
          <ul className="mt-3 space-y-3">
            {reports.data.map((report) => (
              <li
                key={report.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <div>
                  <p className="font-medium text-foreground">{report.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {[report.test_date, report.lab_name].filter(Boolean).join(" • ") ||
                      new Date(report.created_at).toLocaleDateString(locale === "es" ? "es" : "en")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                     {localized.overall[report.overall_status] ?? report.overall_status} •{" "}
                     {localized.urgency[report.urgency] ?? report.urgency}
                  </p>
                </div>
                <Link to="/reports/$id" params={{ id: report.id }}>
                  <Button variant="outline" size="sm">
                     {t("open")}
                  </Button>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-border p-8 text-center">
             <p className="text-sm text-muted-foreground">{t("noReports")}</p>
            <Link to="/upload">
               <Button className="mt-4">{t("firstReport")}</Button>
            </Link>
          </div>
        )}
      </section>

      <Disclaimer className="mt-8" />
    </main>
  );
}
