import { statusBar, statusClasses, toCauses, type LabResultRow } from "@/lib/lab-types";
import { labels, useI18n } from "@/lib/i18n";

function barPosition(result: LabResultRow): number | null {
  const { value_num, range_low, range_high } = result;
  if (value_num == null || range_low == null || range_high == null || range_high <= range_low) {
    return null;
  }
  const span = range_high - range_low;
  const padded = (value_num - (range_low - span * 0.4)) / (span * 1.8);
  return Math.min(98, Math.max(2, padded * 100));
}

export function ResultCard({ result }: { result: LabResultRow }) {
  const { locale, t } = useI18n();
  const localized = labels(locale);
  const position = barPosition(result);
  const causes = toCauses(result.common_causes);

  return (
    <article className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">{result.test_name}</h3>
          {result.panel ? (
            <p className="text-xs text-muted-foreground">{result.panel}</p>
          ) : null}
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusClasses(result.status)}`}>
          {localized.status[result.status] ?? result.status}
        </span>
      </header>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="font-mono text-2xl font-semibold text-foreground">{result.value_text ?? "—"}</span>
        {result.unit ? <span className="text-sm text-muted-foreground">{result.unit}</span> : null}
      </div>

      {position != null ? (
        <div className="mt-4">
          <div className="relative h-2 rounded-full bg-muted">
            <div className="absolute inset-y-0 left-[22%] right-[22%] rounded-full bg-success/25" />
            <div
              className={`absolute -top-1 size-4 -translate-x-1/2 rounded-full border-2 border-background ${statusBar(result.status)}`}
              style={{ left: `${position}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between font-mono text-[11px] text-muted-foreground">
            <span>{result.range_low}</span>
            <span>{t("referenceRange").toLowerCase()}</span>
            <span>{result.range_high}</span>
          </div>
        </div>
      ) : result.range_text ? (
        <p className="mt-3 font-mono text-xs text-muted-foreground">{t("reference")}: {result.range_text}</p>
      ) : null}

      {result.what_it_means ? (
        <section className="mt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
             {t("whatMeans")}
          </h4>
          <p className="mt-1 text-sm leading-relaxed text-foreground">{result.what_it_means}</p>
        </section>
      ) : null}

      {result.why_it_matters ? (
        <section className="mt-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
             {t("whyMatters")}
          </h4>
          <p className="mt-1 text-sm leading-relaxed text-foreground">{result.why_it_matters}</p>
        </section>
      ) : null}

      {causes.length ? (
        <section className="mt-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
             {t("commonCauses")}
          </h4>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-relaxed text-foreground">
            {causes.map((cause) => (
              <li key={cause}>{cause}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
