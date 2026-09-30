import { jsPDF } from "jspdf";

import {
  toCauses,
  type LabReportRow,
  type LabResultRow,
} from "./lab-types";
import { labels, type Locale } from "./i18n";

export function downloadReportPdf(
  report: LabReportRow,
  results: LabResultRow[],
  questions: { question: string }[],
  locale: Locale,
) {
  const localized = labels(locale);
  const es = locale === "es";
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const width = doc.internal.pageSize.getWidth() - margin * 2;
  let y = margin;

  const newPageIfNeeded = (needed: number) => {
    if (y + needed > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const write = (text: string, size: number, style: "normal" | "bold" = "normal", gap = 6) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, width) as string[];
    newPageIfNeeded(lines.length * (size + 3));
    doc.text(lines, margin, y);
    y += lines.length * (size + 3) + gap;
  };

  write(report.title || (es ? "Resultados de laboratorio" : "Lab results"), 18, "bold", 4);
  const meta = [
    report.test_date ? `${es ? "Fecha" : "Test date"}: ${report.test_date}` : null,
    report.lab_name ? `${es ? "Laboratorio" : "Laboratory"}: ${report.lab_name}` : null,
    `${es ? "Resultado general" : "Overall"}: ${localized.overall[report.overall_status] ?? report.overall_status}`,
    `${es ? "Seguimiento" : "Follow-up"}: ${localized.urgency[report.urgency] ?? report.urgency}`,
  ]
    .filter(Boolean)
    .join("   •   ");
  write(meta, 10, "normal", 12);

  if (report.summary) {
    write(es ? "Resumen" : "Summary", 13, "bold", 4);
    write(report.summary, 11, "normal", 14);
  }

  write(es ? "Resultados" : "Results", 13, "bold", 6);
  for (const result of results) {
    const value = [result.value_text, result.unit].filter(Boolean).join(" ");
    const range = result.range_text ?? [result.range_low, result.range_high].filter((v) => v != null).join(" – ");
    write(
      `${result.test_name} — ${value || "—"}  (${localized.status[result.status] ?? result.status})${
        range ? `  ${es ? "Referencia" : "Reference"}: ${range}` : ""
      }`,
      11,
      "bold",
      2,
    );
    if (result.what_it_means) write(result.what_it_means, 10, "normal", 2);
    if (result.why_it_matters) write(`${es ? "Por qué importa" : "Why it matters"}: ${result.why_it_matters}`, 10, "normal", 2);
    const causes = toCauses(result.common_causes);
    if (causes.length) write(`${es ? "Causas comunes" : "Common causes"}: ${causes.join("; ")}`, 10, "normal", 10);
    else y += 8;
  }

  if (questions.length) {
    write(es ? "Preguntas para tu médico" : "Questions for your doctor", 13, "bold", 6);
    questions.forEach((question, index) => {
      write(`${index + 1}. ${question.question}`, 11, "normal", 4);
    });
  }

  y += 10;
  write(
    es ? "Este informe es educativo y no constituye un diagnóstico. Consulta siempre tus resultados con un profesional de la salud." : "This report is educational and is not a diagnosis. Always discuss your results with a qualified healthcare provider.",
    9,
    "normal",
  );

  const safeTitle = (report.title || (es ? "resultados-laboratorio" : "lab-results")).toLowerCase().replace(/[^a-z0-9]+/g, "-");
  doc.save(`${safeTitle}.pdf`);
}
