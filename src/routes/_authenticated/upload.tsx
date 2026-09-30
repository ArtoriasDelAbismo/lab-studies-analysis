import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { FileText, Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { Disclaimer } from "@/components/Disclaimer";
import { DraftTestsTable } from "@/components/DraftTestsTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { DraftTest } from "@/lib/lab-types";
import { analyzeAndSaveReport, extractFromDocument } from "@/lib/labs.functions";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/upload")({
  head: () => ({
    meta: [
      { title: "Upload lab results — Lab Studies Analyzer" },
      {
        name: "description",
        content: "Upload a PDF or photo of your lab report and have every value read and explained.",
      },
      { property: "og:title", content: "Upload lab results — Lab Studies Analyzer" },
      { property: "og:description", content: "Upload a PDF or photo of your lab report." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: UploadPage,
});

const ACCEPTED = ["application/pdf", "image/jpeg", "image/png", "image/tiff", "image/webp"];
const MAX_BYTES = 20 * 1024 * 1024;

function UploadPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const extract = useServerFn(extractFromDocument);
  const analyze = useServerFn(analyzeAndSaveReport);
  const inputRef = useRef<HTMLInputElement>(null);
  const { locale, t } = useI18n();

  const [dragging, setDragging] = useState(false);
  const [stage, setStage] = useState<"idle" | "uploading" | "reading" | "review" | "analyzing">("idle");
  const [fileName, setFileName] = useState("");
  const [sourcePath, setSourcePath] = useState<string | null>(null);
  const [title, setTitle] = useState(t("defaultReportTitle"));
  const [labName, setLabName] = useState("");
  const [testDate, setTestDate] = useState("");
  const [tests, setTests] = useState<DraftTest[]>([]);

  const handleFile = async (file: File) => {
    if (!user) return;
    if (!ACCEPTED.includes(file.type)) {
      toast.error(t("invalidFile"));
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error(t("fileTooLarge"));
      return;
    }

    setFileName(file.name);
    setStage("uploading");

    const extension = file.name.split(".").pop() ?? "pdf";
    const path = `${user.id}/${crypto.randomUUID()}.${extension}`;

    const { error } = await supabase.storage
      .from("lab-documents")
      .upload(path, file, { contentType: file.type });

    if (error) {
      setStage("idle");
      toast.error(t("uploadError"));
      return;
    }

    setSourcePath(path);
    setStage("reading");

    try {
      const result = await extract({ data: { path, mimeType: file.type, locale } });
      setTests(result.tests ?? []);
      setTitle(result.title || t("defaultReportTitle"));
      setLabName(result.lab_name ?? "");
      setTestDate(result.test_date ?? "");
      setStage("review");
      if (!result.tests?.length) {
        toast.warning(t("noValues"));
      }
    } catch (error) {
      setStage("review");
      toast.error(
        error instanceof Error ? error.message : t("readError"),
      );
    }
  };

  const runAnalysis = async () => {
    const filled = tests.filter((t) => t.name.trim() && t.value_text.trim());
    if (!filled.length) {
      toast.error(t("addOneTest"));
      return;
    }
    setStage("analyzing");
    try {
      const { reportId } = await analyze({
        data: {
          title,
          labName: labName || null,
          testDate: testDate || null,
          sourcePath,
          sourceKind: "upload",
          tests: filled,
          locale,
        },
      });
      navigate({ to: "/reports/$id", params: { id: reportId } });
    } catch (error) {
      setStage("review");
      toast.error(error instanceof Error ? error.message : t("analysisError"));
    }
  };

  const busy = stage === "uploading" || stage === "reading" || stage === "analyzing";

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
       <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t("uploadTitle")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
         {t("uploadBody")}
      </p>

      {stage === "idle" || stage === "uploading" || stage === "reading" ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) void handleFile(file);
          }}
          className={`mt-6 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center transition-colors ${
            dragging ? "border-primary bg-primary/5" : "border-border bg-card"
          }`}
        >
          {busy ? (
            <>
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="mt-4 text-sm font-medium text-foreground">
                 {stage === "uploading" ? t("uploading") : t("reading")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{fileName}</p>
              <Progress value={stage === "uploading" ? 35 : 75} className="mt-4 w-56" />
            </>
          ) : (
            <>
              <UploadCloud className="size-9 text-primary" />
              <p className="mt-4 text-sm font-medium text-foreground">
                 {t("dropHere")}
              </p>
               <p className="mt-1 text-xs text-muted-foreground">{t("supported")}</p>
              <Button className="mt-5" onClick={() => inputRef.current?.click()}>
                 {t("chooseFile")}
              </Button>
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED.join(",")}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFile(file);
                  e.target.value = "";
                }}
              />
            </>
          )}
        </div>
      ) : null}

      {stage === "review" || stage === "analyzing" ? (
        <section className="mt-8 space-y-6">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-3 text-sm">
            <FileText className="size-4 text-primary" />
             <span className="text-foreground">{fileName || t("uploadedDocument")}</span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => {
                setStage("idle");
                setTests([]);
                setSourcePath(null);
              }}
            >
               {t("replace")}
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
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

          <div>
             <h2 className="text-base font-semibold text-foreground">{t("checkValues")}</h2>
            <p className="mb-4 text-sm text-muted-foreground">
               {t("checkValuesBody")}
            </p>
            <DraftTestsTable tests={tests} onChange={setTests} />
          </div>

          <Disclaimer />

          <Button size="lg" onClick={runAnalysis} disabled={stage === "analyzing"}>
            {stage === "analyzing" ? (
              <>
                 <Loader2 className="mr-2 size-4 animate-spin" /> {t("analysing")}
              </>
            ) : (
               t("analyseResults")
            )}
          </Button>
        </section>
      ) : (
        <Disclaimer className="mt-6" />
      )}
    </main>
  );
}
