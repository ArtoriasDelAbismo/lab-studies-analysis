export type ResultStatus = "normal" | "borderline" | "abnormal" | "unknown";
export type OverallStatus = "all_clear" | "watch" | "attention" | "pending";
export type Urgency = "routine" | "soon" | "urgent";

export type DraftTest = {
  name: string;
  panel: string;
  value_text: string;
  unit: string;
  range_low: number | null;
  range_high: number | null;
  range_text: string;
  confidence: number | null;
};

export type ExtractionResult = {
  title: string;
  lab_name: string | null;
  test_date: string | null;
  tests: DraftTest[];
};

export type LabResultRow = {
  id: string;
  test_name: string;
  panel: string;
  value_text: string | null;
  value_num: number | null;
  unit: string | null;
  range_low: number | null;
  range_high: number | null;
  range_text: string | null;
  status: string;
  what_it_means: string | null;
  why_it_matters: string | null;
  common_causes: unknown;
  sort_order: number;
};

export type LabReportRow = {
  id: string;
  title: string;
  test_date: string | null;
  lab_name: string | null;
  source_kind: string;
  overall_status: string;
  urgency: string;
  summary: string | null;
  correlations: unknown;
  created_at: string;
};

export const STATUS_LABEL: Record<string, string> = {
  normal: "Normal",
  borderline: "Borderline",
  abnormal: "Out of range",
  unknown: "Not assessed",
};

export function statusClasses(status: string): string {
  switch (status) {
    case "normal":
      return "bg-success/10 text-success border-success/30";
    case "borderline":
      return "bg-warning/10 text-warning border-warning/30";
    case "abnormal":
      return "bg-danger/10 text-danger border-danger/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export function statusBar(status: string): string {
  switch (status) {
    case "normal":
      return "bg-success";
    case "borderline":
      return "bg-warning";
    case "abnormal":
      return "bg-danger";
    default:
      return "bg-muted-foreground";
  }
}

export const OVERALL_LABEL: Record<string, string> = {
  all_clear: "Everything looks in range",
  watch: "A few things worth watching",
  attention: "Some results need attention",
  pending: "Not analysed yet",
};

export const URGENCY_LABEL: Record<string, string> = {
  routine: "Routine — mention at your next visit",
  soon: "Worth contacting your doctor soon",
  urgent: "Contact a healthcare provider promptly",
};

export function toCauses(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  return [];
}

export function toCorrelations(value: unknown): { title: string; detail: string }[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (item && typeof item === "object" && "title" in item && "detail" in item) {
      const rec = item as { title: unknown; detail: unknown };
      if (typeof rec.title === "string" && typeof rec.detail === "string") {
        return [{ title: rec.title, detail: rec.detail }];
      }
    }
    return [];
  });
}

export function parseNumber(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = value.replace(",", ".").match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}
