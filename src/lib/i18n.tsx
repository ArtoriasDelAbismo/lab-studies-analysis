import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Locale = "en" | "es";

const messages = {
  en: {
    testLibrary: "Test library", history: "History", newAnalysis: "New analysis", signOut: "Sign out", signIn: "Sign in",
    privateAccount: "Private to your account", homeTitle: "Understand your lab results", homeBody: "Upload the report from your lab and get a calm, clear breakdown of every number — what it means, what is worth asking about, and how it has changed since last time.", uploadResults: "Upload lab results", enterByHand: "Enter values by hand",
    featureUploadTitle: "Upload a PDF or photo", featureUploadBody: "Drop in the report your lab sent you. Every test name, value and range is read for you.", featureExplainTitle: "Plain-language explanations", featureExplainBody: "What each value means, why it matters, and the common reasons a result sits outside the range.", featureQuestionsTitle: "Questions for your doctor", featureQuestionsBody: "A short, specific list you can print and bring to your next appointment.", featureHistoryTitle: "Your history in one place", featureHistoryBody: "Keep past reports and watch how a single value changes over the months.",
    disclaimer: "This is educational information, not a diagnosis or medical advice. Always review your results with a qualified healthcare provider, and seek urgent care if you feel unwell.",
    welcomeBack: "Welcome back", createAccount: "Create your account", privateResults: "Your results stay private to your account.", email: "Email", password: "Password", continueGoogle: "Continue with Google", newHere: "New here? Create an account", haveAccount: "Already have an account? Sign in", confirmEmail: "Check your inbox to confirm your email address.", genericError: "Something went wrong", googleError: "Google sign-in did not work. Please try again.",
    uploadTitle: "Upload your lab results", uploadBody: "PDF or a clear photo works. Your file is stored privately and you can delete it at any time.", invalidFile: "Please choose a PDF, JPG, PNG or TIFF file.", fileTooLarge: "That file is larger than 20 MB. Try a smaller scan or photo.", uploadError: "The file could not be uploaded. Please try again.", noValues: "No values were recognised. You can type them in below.", readError: "The document could not be read. Add values by hand below.", uploading: "Uploading your file…", reading: "Reading your report…", dropHere: "Drag and drop your report here", supported: "Supported: PDF, JPG, PNG, TIFF — up to 20 MB", chooseFile: "Choose a file", uploadedDocument: "Uploaded document", replace: "Replace", reportTitle: "Report title", laboratory: "Laboratory", testDate: "Test date", checkValues: "Check the values we read", checkValuesBody: "Correct anything that looks wrong before the analysis runs. Rows marked “check” were harder to read.", analysing: "Analysing…", analyseResults: "Analyse my results", addOneTest: "Add at least one test with a value.", analysisError: "The analysis could not be completed.", defaultReportTitle: "Lab results",
    manualTitle: "Enter your values", manualBody: "Type in whatever your report shows. The reference range is optional but makes the explanation more accurate.", testName: "Test name", panel: "Panel", value: "Value", unit: "Unit", referenceRange: "Reference range", check: "check", removeRow: "Remove row", addTest: "Add a test", other: "Other",
    historyTitle: "Your history", historyBody: "Everything you have analysed, kept private to your account.", trends: "Trends over time", pastReports: "Past reports", open: "Open", noReports: "You have not analysed any results yet.", firstReport: "Upload your first report",
    notFoundReport: "That report could not be found", deletedReport: "It may have been deleted.", savedAccount: "Saved to your account", downloadPdf: "Download PDF", normal: "Normal", borderline: "Borderline", abnormal: "Out of range", unknown: "Not assessed", patterns: "Patterns worth noticing", doctorQuestions: "Questions for your doctor", reference: "Reference", whatMeans: "What this means", whyMatters: "Why it matters", commonCauses: "Common causes", summary: "Summary", results: "Results", overall: "Overall", followUp: "Follow-up",
    all_clear: "Everything looks in range", watch: "A few things worth watching", attention: "Some results need attention", pending: "Not analysed yet", routine: "Routine — mention at your next visit", soon: "Worth contacting your doctor soon", urgent: "Contact a healthcare provider promptly",
    askFollowUp: "Ask a follow-up question", chatBody: "Ask about anything in this report. Answers are educational, not medical advice.", chatPlaceholder: "e.g. Why is my cholesterol higher than last time?", answerError: "The answer could not be loaded.", send: "Send",
    learnTitle: "Test library", learnBody: "Short, everyday explanations of the tests that turn up most often on lab reports. Reference ranges differ between labs and between people, so always read your own report alongside these notes.",
    loading: "Loading…", pageNotFound: "Page not found", pageNotFoundBody: "The page you're looking for doesn't exist or has been moved.", goHome: "Go home", pageLoadError: "This page didn't load", pageLoadBody: "Something went wrong on our end. You can try refreshing or head back home.", tryAgain: "Try again",
  },
  es: {
    testLibrary: "Biblioteca de análisis", history: "Historial", newAnalysis: "Nuevo análisis", signOut: "Cerrar sesión", signIn: "Iniciar sesión",
    privateAccount: "Privado en tu cuenta", homeTitle: "Entiende tus análisis de laboratorio", homeBody: "Sube el informe de tu laboratorio y recibe una explicación clara y tranquila de cada valor: qué significa, qué conviene consultar y cómo cambió desde la última vez.", uploadResults: "Subir resultados", enterByHand: "Ingresar valores manualmente",
    featureUploadTitle: "Sube un PDF o una foto", featureUploadBody: "Carga el informe que te envió el laboratorio. Leeremos cada análisis, valor y rango.", featureExplainTitle: "Explicaciones sencillas", featureExplainBody: "Qué significa cada valor, por qué importa y las causas comunes de un resultado fuera de rango.", featureQuestionsTitle: "Preguntas para tu médico", featureQuestionsBody: "Una lista breve y específica que puedes imprimir y llevar a tu próxima consulta.", featureHistoryTitle: "Tu historial en un solo lugar", featureHistoryBody: "Guarda informes anteriores y observa cómo cambia un valor con el tiempo.",
    disclaimer: "Esta información es educativa; no es un diagnóstico ni consejo médico. Revisa siempre tus resultados con un profesional de la salud y busca atención urgente si te sientes mal.",
    welcomeBack: "Te damos la bienvenida", createAccount: "Crea tu cuenta", privateResults: "Tus resultados se mantienen privados en tu cuenta.", email: "Correo electrónico", password: "Contraseña", continueGoogle: "Continuar con Google", newHere: "¿Eres nuevo? Crea una cuenta", haveAccount: "¿Ya tienes una cuenta? Inicia sesión", confirmEmail: "Revisa tu correo para confirmar tu dirección.", genericError: "Algo salió mal", googleError: "No se pudo iniciar sesión con Google. Inténtalo de nuevo.",
    uploadTitle: "Sube tus resultados de laboratorio", uploadBody: "Puedes usar un PDF o una foto clara. Tu archivo se guarda de forma privada y puedes eliminarlo cuando quieras.", invalidFile: "Elige un archivo PDF, JPG, PNG o TIFF.", fileTooLarge: "El archivo supera los 20 MB. Prueba con una imagen más pequeña.", uploadError: "No se pudo subir el archivo. Inténtalo de nuevo.", noValues: "No se reconocieron valores. Puedes ingresarlos abajo.", readError: "No se pudo leer el documento. Ingresa los valores abajo.", uploading: "Subiendo tu archivo…", reading: "Leyendo tu informe…", dropHere: "Arrastra y suelta tu informe aquí", supported: "Formatos: PDF, JPG, PNG, TIFF — hasta 20 MB", chooseFile: "Elegir archivo", uploadedDocument: "Documento subido", replace: "Reemplazar", reportTitle: "Título del informe", laboratory: "Laboratorio", testDate: "Fecha del análisis", checkValues: "Revisa los valores leídos", checkValuesBody: "Corrige cualquier dato incorrecto antes del análisis. Las filas marcadas como “revisar” fueron más difíciles de leer.", analysing: "Analizando…", analyseResults: "Analizar mis resultados", addOneTest: "Agrega al menos un análisis con un valor.", analysisError: "No se pudo completar el análisis.", defaultReportTitle: "Resultados de laboratorio",
    manualTitle: "Ingresa tus valores", manualBody: "Escribe lo que aparece en tu informe. El rango de referencia es opcional, pero mejora la precisión de la explicación.", testName: "Nombre del análisis", panel: "Panel", value: "Valor", unit: "Unidad", referenceRange: "Rango de referencia", check: "revisar", removeRow: "Eliminar fila", addTest: "Agregar análisis", other: "Otro",
    historyTitle: "Tu historial", historyBody: "Todos tus análisis, guardados de forma privada en tu cuenta.", trends: "Tendencias en el tiempo", pastReports: "Informes anteriores", open: "Abrir", noReports: "Todavía no analizaste ningún resultado.", firstReport: "Sube tu primer informe",
    notFoundReport: "No se encontró ese informe", deletedReport: "Es posible que se haya eliminado.", savedAccount: "Guardado en tu cuenta", downloadPdf: "Descargar PDF", normal: "Normal", borderline: "Límite", abnormal: "Fuera de rango", unknown: "Sin evaluar", patterns: "Patrones para tener en cuenta", doctorQuestions: "Preguntas para tu médico", reference: "Referencia", whatMeans: "Qué significa", whyMatters: "Por qué importa", commonCauses: "Causas comunes", summary: "Resumen", results: "Resultados", overall: "Resultado general", followUp: "Seguimiento",
    all_clear: "Todo parece estar dentro del rango", watch: "Hay algunos valores para observar", attention: "Algunos resultados requieren atención", pending: "Aún no analizado", routine: "Rutina — menciónalo en tu próxima consulta", soon: "Conviene contactar pronto a tu médico", urgent: "Contacta pronto a un profesional de la salud",
    askFollowUp: "Haz una pregunta de seguimiento", chatBody: "Pregunta sobre cualquier punto del informe. Las respuestas son educativas, no consejo médico.", chatPlaceholder: "Ej.: ¿Por qué subió mi colesterol desde la última vez?", answerError: "No se pudo cargar la respuesta.", send: "Enviar",
    learnTitle: "Biblioteca de análisis", learnBody: "Explicaciones breves y sencillas de los análisis más frecuentes. Los rangos de referencia varían según el laboratorio y la persona; consulta siempre tu propio informe junto con estas notas.",
    loading: "Cargando…", pageNotFound: "Página no encontrada", pageNotFoundBody: "La página que buscas no existe o fue trasladada.", goHome: "Ir al inicio", pageLoadError: "No se pudo cargar la página", pageLoadBody: "Algo salió mal. Puedes actualizar la página o volver al inicio.", tryAgain: "Intentar de nuevo",
  },
} as const;

export type MessageKey = keyof typeof messages.en;
type I18nValue = { locale: Locale; setLocale: (locale: Locale) => void; t: (key: MessageKey) => string };
const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  useEffect(() => {
    const saved = window.localStorage.getItem("lab-language");
    if (saved === "en" || saved === "es") setLocaleState(saved);
  }, []);
  const setLocale = (next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem("lab-language", next);
    document.documentElement.lang = next;
  };
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  const value = useMemo(() => ({ locale, setLocale, t: (key: MessageKey) => messages[locale][key] }), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}

export function labels(locale: Locale) {
  const t = (key: MessageKey) => messages[locale][key];
  return {
    status: { normal: t("normal"), borderline: t("borderline"), abnormal: t("abnormal"), unknown: t("unknown") } as Record<string, string>,
    overall: { all_clear: t("all_clear"), watch: t("watch"), attention: t("attention"), pending: t("pending") } as Record<string, string>,
    urgency: { routine: t("routine"), soon: t("soon"), urgent: t("urgent") } as Record<string, string>,
  };
}
