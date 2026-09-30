import { Link, createFileRoute } from "@tanstack/react-router";
import { FileUp, Keyboard, LineChart, MessageCircleQuestion, ShieldCheck, Sparkles } from "lucide-react";

import { AppHeader } from "@/components/AppHeader";
import { Disclaimer } from "@/components/Disclaimer";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lab Studies Analyzer — Understand your lab results" },
      {
        name: "description",
        content:
          "Upload a lab report and get a clear, plain-language explanation of every value, questions for your doctor, and your results tracked over time.",
      },
      { property: "og:title", content: "Lab Studies Analyzer — Understand your lab results" },
      {
        property: "og:description",
        content:
          "Upload a lab report and get a clear, plain-language explanation of every value, plus questions for your doctor.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { t } = useI18n();
  const features = [
    { icon: FileUp, title: t("featureUploadTitle"), body: t("featureUploadBody") },
    { icon: Sparkles, title: t("featureExplainTitle"), body: t("featureExplainBody") },
    { icon: MessageCircleQuestion, title: t("featureQuestionsTitle"), body: t("featureQuestionsBody") },
    { icon: LineChart, title: t("featureHistoryTitle"), body: t("featureHistoryBody") },
  ];
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main>
        <section className="mx-auto max-w-6xl px-4 pt-16 pb-12 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <ShieldCheck className="size-3.5" /> {t("privateAccount")}
          </span>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {t("homeTitle")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            {t("homeBody")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/upload">
              <Button size="lg">
                <FileUp className="mr-2 size-4" /> {t("uploadResults")}
              </Button>
            </Link>
            <Link to="/manual">
              <Button size="lg" variant="outline">
                <Keyboard className="mr-2 size-4" /> {t("enterByHand")}
              </Button>
            </Link>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-12 sm:grid-cols-2">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <feature.icon className="size-5 text-primary" />
              <h2 className="mt-3 text-base font-semibold text-foreground">{feature.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
            </div>
          ))}
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20">
          <Disclaimer />
        </section>
      </main>
    </div>
  );
}
