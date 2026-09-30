import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { DraftTest, ExtractionResult } from "./lab-types";
import { parseNumber } from "./lab-types";
import type { Locale } from "./i18n";

const EXTRACTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "lab_name", "test_date", "tests"],
  properties: {
    title: { type: "string" },
    lab_name: { type: ["string", "null"] },
    test_date: { type: ["string", "null"], description: "ISO date YYYY-MM-DD if present" },
    tests: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "name",
          "panel",
          "value_text",
          "unit",
          "range_low",
          "range_high",
          "range_text",
          "confidence",
        ],
        properties: {
          name: { type: "string" },
          panel: { type: "string" },
          value_text: { type: "string" },
          unit: { type: "string" },
          range_low: { type: ["number", "null"] },
          range_high: { type: ["number", "null"] },
          range_text: { type: "string" },
          confidence: { type: "number" },
        },
      },
    },
  },
} as const;

const ANALYSIS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["overall_status", "urgency", "summary", "correlations", "results", "questions"],
  properties: {
    overall_status: { type: "string", enum: ["all_clear", "watch", "attention"] },
    urgency: { type: "string", enum: ["routine", "soon", "urgent"] },
    summary: { type: "string" },
    correlations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "detail"],
        properties: { title: { type: "string" }, detail: { type: "string" } },
      },
    },
    results: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "status", "what_it_means", "why_it_matters", "common_causes"],
        properties: {
          name: { type: "string" },
          status: { type: "string", enum: ["normal", "borderline", "abnormal", "unknown"] },
          what_it_means: { type: "string" },
          why_it_matters: { type: "string" },
          common_causes: { type: "array", items: { type: "string" } },
        },
      },
    },
    questions: { type: "array", items: { type: "string" } },
  },
} as const;

type AnalysisResponse = {
  overall_status: string;
  urgency: string;
  summary: string;
  correlations: { title: string; detail: string }[];
  results: {
    name: string;
    status: string;
    what_it_means: string;
    why_it_matters: string;
    common_causes: string[];
  }[];
  questions: string[];
};

/** Reads an uploaded lab document (PDF or photo) and extracts the values. */
export const extractFromDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { path: string; mimeType: string; locale: Locale }) => input)
  .handler(async ({ data, context }): Promise<ExtractionResult> => {
    const { runAstraJson, MEDICAL_SYSTEM_PROMPT } = await import("./ai.server");

    const { data: signed, error } = await context.supabase.storage
      .from("lab-documents")
      .createSignedUrl(data.path, 60 * 10);

    if (error || !signed?.signedUrl) {
      throw new Error("The uploaded file could not be opened. Please try uploading it again.");
    }

    const isPdf = data.mimeType.includes("pdf");
    const filePart = isPdf
      ? ({ type: "input_file", file_url: signed.signedUrl, filename: "lab-report.pdf" } as const)
      : ({ type: "input_image", image_url: signed.signedUrl } as const);

    return runAstraJson<ExtractionResult>({
      system: `${MEDICAL_SYSTEM_PROMPT}\nWrite all descriptive text in ${data.locale === "es" ? "Spanish" : "English"}. Keep test names exactly as printed.`,
      effort: "medium",
      parts: [
        {
          type: "input_text",
          text: `Read this laboratory report and extract every test result you can find.
For each test give: the test name exactly as printed, the panel/category it belongs to (e.g. "Lipid panel", "Complete blood count", "Metabolic panel", "Thyroid", "Other"), the measured value as text, the unit, the numeric reference range low and high when printed (null when not numeric), the printed reference range as text, and a confidence between 0 and 1 for how sure you are of the reading.
Also give the laboratory name, the collection or test date as YYYY-MM-DD, and a short title for the report in ${data.locale === "es" ? "Spanish" : "English"}.
Do not invent tests that are not in the document.`,
        },
        filePart,
      ],
      schema: { name: "lab_extraction", schema: EXTRACTION_SCHEMA as unknown as Record<string, unknown> },
    });
  });

/** Analyses a set of lab values and stores the report, explanations and questions. */
export const analyzeAndSaveReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      title: string;
      labName: string | null;
      testDate: string | null;
      sourcePath: string | null;
      sourceKind: string;
      tests: DraftTest[];
      locale: Locale;
    }) => input,
  )
  .handler(async ({ data, context }): Promise<{ reportId: string }> => {
    const { runAstraJson, MEDICAL_SYSTEM_PROMPT } = await import("./ai.server");
    const { supabase, userId } = context;

    if (!data.tests.length) {
      throw new Error("Add at least one test value before running the analysis.");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("birth_year, sex, medications")
      .eq("user_id", userId)
      .maybeSingle();

    const contextLines: string[] = [];
    if (profile?.birth_year) contextLines.push(`Born in ${profile.birth_year}.`);
    if (profile?.sex) contextLines.push(`Sex: ${profile.sex}.`);
    if (profile?.medications) contextLines.push(`Medications / notes: ${profile.medications}`);

    const testLines = data.tests
      .map(
        (t) =>
          `- ${t.name} (${t.panel || "Other"}): ${t.value_text} ${t.unit ?? ""} | reference: ${
            t.range_text || (t.range_low !== null || t.range_high !== null ? `${t.range_low ?? ""}-${t.range_high ?? ""}` : "not given")
          }`,
      )
      .join("\n");

    const analysis = await runAstraJson<AnalysisResponse>({
      system: `${MEDICAL_SYSTEM_PROMPT}\nRespond entirely in ${data.locale === "es" ? "Spanish" : "English"}, except for test names and units.`,
      effort: "medium",
      parts: [
        {
          type: "input_text",
          text: `Analyse these laboratory results.
${contextLines.length ? `Person context: ${contextLines.join(" ")}` : "No personal context provided."}
Test date: ${data.testDate ?? "unknown"}

${testLines}

For every test listed above, in the same order and with the same name, give a status (normal, borderline, abnormal, or unknown when there is no reference range), a short "what this means" in plain language, a "why it matters" sentence, and up to four common causes when the value is not normal (empty list when normal).
Also give: an overall status (all_clear, watch, attention), an urgency (routine, soon, urgent), a two to four sentence plain-language summary, any correlated findings worth noting, and five or fewer specific questions the person could ask their doctor.
Remember: educational information only, no diagnosis, always encourage speaking with a healthcare provider.`,
        },
      ],
      schema: { name: "lab_analysis", schema: ANALYSIS_SCHEMA as unknown as Record<string, unknown> },
    });

    const { data: report, error: reportError } = await supabase
      .from("lab_reports")
      .insert({
        user_id: userId,
        title: data.title || "Lab results",
        test_date: data.testDate,
        lab_name: data.labName,
        source_path: data.sourcePath,
        source_kind: data.sourceKind,
        overall_status: analysis.overall_status,
        urgency: analysis.urgency,
        summary: analysis.summary,
        correlations: analysis.correlations,
      })
      .select("id")
      .single();

    if (reportError || !report) {
      throw new Error("The analysis could not be saved. Please try again.");
    }

    const byName = new Map(analysis.results.map((r) => [r.name.toLowerCase().trim(), r]));

    const rows = data.tests.map((t, index) => {
      const match = byName.get(t.name.toLowerCase().trim()) ?? analysis.results[index];
      return {
        report_id: report.id,
        user_id: userId,
        test_name: t.name,
        panel: t.panel || "Other",
        value_text: t.value_text,
        value_num: parseNumber(t.value_text),
        unit: t.unit || null,
        range_low: t.range_low,
        range_high: t.range_high,
        range_text: t.range_text || null,
        status: match?.status ?? "unknown",
        what_it_means: match?.what_it_means ?? null,
        why_it_matters: match?.why_it_matters ?? null,
        common_causes: match?.common_causes ?? [],
        sort_order: index,
      };
    });

    const { error: resultsError } = await supabase.from("lab_results").insert(rows);
    if (resultsError) throw new Error("The individual results could not be saved.");

    if (analysis.questions.length) {
      await supabase.from("report_questions").insert(
        analysis.questions.map((question, i) => ({
          report_id: report.id,
          user_id: userId,
          question,
          sort_order: i,
        })),
      );
    }

    return { reportId: report.id };
  });

/** Loads one saved report with its results and doctor questions. */
export const getReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: report, error } = await supabase
      .from("lab_reports")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();

    if (error || !report) throw new Error("That report could not be found.");

    const [{ data: results }, { data: questions }, { data: messages }] = await Promise.all([
      supabase.from("lab_results").select("*").eq("report_id", data.id).order("sort_order"),
      supabase.from("report_questions").select("*").eq("report_id", data.id).order("sort_order"),
      supabase
        .from("chat_messages")
        .select("id, role, content, created_at")
        .eq("report_id", data.id)
        .order("created_at"),
    ]);

    return {
      report,
      results: results ?? [],
      questions: questions ?? [],
      messages: messages ?? [],
    };
  });

/** Lists every saved report for the signed-in person. */
export const listReports = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("lab_reports")
      .select("id, title, test_date, lab_name, overall_status, urgency, summary, created_at")
      .order("created_at", { ascending: false });
    return data ?? [];
  });

/** Values over time for tests measured more than once. */
export const getTrends = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("lab_results")
      .select("test_name, unit, value_num, status, lab_reports(test_date, created_at)")
      .not("value_num", "is", null);
    return data ?? [];
  });

/** Deletes a report, its results and the uploaded file. */
export const deleteReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: report } = await supabase
      .from("lab_reports")
      .select("source_path")
      .eq("id", data.id)
      .maybeSingle();

    if (report?.source_path) {
      await supabase.storage.from("lab-documents").remove([report.source_path]);
    }
    await supabase.from("lab_reports").delete().eq("id", data.id);
    return { ok: true };
  });

/** Reads and saves the person's profile context. */
export const getProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    return data;
  });

export const saveProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      display_name: string | null;
      birth_year: number | null;
      sex: string | null;
      medications: string | null;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .upsert({ user_id: context.userId, ...data }, { onConflict: "user_id" });
    if (error) throw new Error("Your details could not be saved.");
    return { ok: true };
  });
