import { createFileRoute } from "@tanstack/react-router";

import { AppHeader } from "@/components/AppHeader";
import { Disclaimer } from "@/components/Disclaimer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      { title: "Test library — Lab Studies Analyzer" },
      {
        name: "description",
        content:
          "Plain-language explanations of common lab tests: cholesterol, blood sugar, kidney and liver markers, blood counts and thyroid.",
      },
      { property: "og:title", content: "Test library — Lab Studies Analyzer" },
      {
        property: "og:description",
        content: "What common lab tests measure, in everyday language.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Learn,
});

const libraryEn = [
  {
    name: "LDL cholesterol",
    panel: "Lipid panel",
    body: "Often called the 'bad' cholesterol. When there is a lot of it circulating, it can build up inside artery walls over many years, which raises the risk of heart disease and stroke.",
  },
  {
    name: "HDL cholesterol",
    panel: "Lipid panel",
    body: "The 'good' cholesterol. It helps carry cholesterol away from the arteries, so higher numbers are usually better.",
  },
  {
    name: "Triglycerides",
    panel: "Lipid panel",
    body: "A type of fat in the blood that rises with sugary food, alcohol and recent meals. Very high levels can also irritate the pancreas.",
  },
  {
    name: "Fasting glucose",
    panel: "Metabolic panel",
    body: "The amount of sugar in your blood after not eating. Persistently raised values are how pre-diabetes and diabetes are spotted.",
  },
  {
    name: "HbA1c",
    panel: "Metabolic panel",
    body: "An average of your blood sugar over roughly the last three months, so it is less affected by what you ate yesterday.",
  },
  {
    name: "Creatinine and eGFR",
    panel: "Kidney",
    body: "Creatinine is a waste product your kidneys clear. eGFR estimates how well they are filtering. Muscle mass, hydration and some medicines affect both.",
  },
  {
    name: "ALT and AST",
    panel: "Liver",
    body: "Enzymes that leak into the blood when liver cells are irritated — by alcohol, fatty liver, infections or certain medications.",
  },
  {
    name: "Haemoglobin",
    panel: "Complete blood count",
    body: "The protein in red blood cells that carries oxygen. Low levels are called anaemia and can cause tiredness and breathlessness.",
  },
  {
    name: "White blood cells",
    panel: "Complete blood count",
    body: "Your immune cells. Counts rise with infection or inflammation and can fall with some infections and medicines.",
  },
  {
    name: "TSH",
    panel: "Thyroid",
    body: "The signal your brain sends to the thyroid. A high TSH usually means an underactive thyroid; a low TSH often means an overactive one.",
  },
  {
    name: "Vitamin D",
    panel: "Vitamins",
    body: "Important for bones and muscles. Low levels are common in winter and in people who get little sunlight.",
  },
  {
    name: "Ferritin",
    panel: "Iron studies",
    body: "A measure of stored iron. Low ferritin points to iron deficiency; high ferritin can also rise with inflammation.",
  },
];

const libraryEs = [
  { name: "Colesterol LDL", panel: "Perfil lipídico", body: "Suele llamarse colesterol 'malo'. Cuando circula en exceso, puede acumularse en las arterias durante años y aumentar el riesgo cardiovascular." },
  { name: "Colesterol HDL", panel: "Perfil lipídico", body: "El colesterol 'bueno'. Ayuda a retirar colesterol de las arterias, por lo que los valores más altos suelen ser mejores." },
  { name: "Triglicéridos", panel: "Perfil lipídico", body: "Un tipo de grasa en la sangre que aumenta con alimentos azucarados, alcohol y comidas recientes. Los valores muy altos pueden irritar el páncreas." },
  { name: "Glucosa en ayunas", panel: "Panel metabólico", body: "La cantidad de azúcar en la sangre después de no comer. Los valores elevados de forma persistente ayudan a detectar prediabetes y diabetes." },
  { name: "HbA1c", panel: "Panel metabólico", body: "Un promedio del azúcar en sangre durante aproximadamente los últimos tres meses, menos afectado por lo que comiste ayer." },
  { name: "Creatinina y eGFR", panel: "Riñón", body: "La creatinina es un desecho que eliminan los riñones. La eGFR estima qué tan bien filtran. La masa muscular, hidratación y algunos medicamentos afectan ambas." },
  { name: "ALT y AST", panel: "Hígado", body: "Enzimas que pasan a la sangre cuando las células del hígado están irritadas por alcohol, hígado graso, infecciones o ciertos medicamentos." },
  { name: "Hemoglobina", panel: "Hemograma completo", body: "La proteína de los glóbulos rojos que transporta oxígeno. Los niveles bajos se llaman anemia y pueden causar cansancio y falta de aire." },
  { name: "Glóbulos blancos", panel: "Hemograma completo", body: "Son las células de defensa. Aumentan con infecciones o inflamación y pueden disminuir por algunas infecciones y medicamentos." },
  { name: "TSH", panel: "Tiroides", body: "La señal que el cerebro envía a la tiroides. Una TSH alta suele indicar una tiroides poco activa; una baja suele indicar una tiroides hiperactiva." },
  { name: "Vitamina D", panel: "Vitaminas", body: "Importante para huesos y músculos. Los niveles bajos son comunes en invierno y en personas con poca exposición al sol." },
  { name: "Ferritina", panel: "Estudios de hierro", body: "Mide el hierro almacenado. Una ferritina baja apunta a deficiencia de hierro; una alta también puede aumentar con inflamación." },
];

function Learn() {
  const { locale, t } = useI18n();
  const library = locale === "es" ? libraryEs : libraryEn;
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-12">
         <h1 className="text-3xl font-semibold tracking-tight text-foreground">{t("learnTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
           {t("learnBody")}
        </p>

        <Accordion type="single" collapsible className="mt-8">
          {library.map((entry) => (
            <AccordionItem key={entry.name} value={entry.name}>
              <AccordionTrigger className="text-left">
                <span>
                  {entry.name}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">{entry.panel}</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {entry.body}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <Disclaimer className="mt-10" />
      </main>
    </div>
  );
}
