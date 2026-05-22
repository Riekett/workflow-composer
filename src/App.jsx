import { useState, useRef } from "react";
import {
  Database, FileSpreadsheet, Brain, Mail, Play, RotateCcw,
  TrendingUp, Building2, Scale, Zap, Truck, CheckCircle2, Loader2,
  ArrowRight, Sparkles, Settings, Radio, AlertCircle, ShieldCheck
} from "lucide-react";

const CATEGORIES = [
  {
    id: "insurance",
    label: "Versicherer-Controlling",
    icon: ShieldCheck,
    sources: [
      { id: "bund10y", name: "Zinsumfeld 10Y AAA", provider: "EZB Yield Curve", desc: "Solvency-II Risk-Free Rate, daily aktualisiert", live: true, webhook: "bund10y" },
      { id: "inflation-de", name: "Inflation Deutschland", provider: "EZB HICP", desc: "HICP YoY — Schadeninflation & Reservierungsbasis", live: true, webhook: "inflation-de" },
      { id: "konsumklima-de", name: "Konsumklima Deutschland", provider: "Eurostat CCI", desc: "Verbrauchervertrauen — Frühindikator für Neugeschäft & Storno", live: true, webhook: "konsumklima-de" },
    ],
  },
  {
    id: "finance",
    label: "Finanzen",
    icon: TrendingUp,
    sources: [
      { id: "gold", name: "Goldpreis", provider: "metals.dev", desc: "Edelmetall-Spotpreise in Echtzeit", live: true, webhook: "gold" },
      { id: "eurusd", name: "EUR/USD Wechselkurs", provider: "Alpha Vantage", desc: "Live-Devisenkurs Euro zu US-Dollar", live: true, webhook: "eurusd" },
      { id: "news", name: "Marktnews & Sentiment", provider: "Alpha Vantage", desc: "Aktuelle Finanznews mit KI-Sentiment-Score", live: true, webhook: "news" },
      { id: "stocks", name: "Aktienkurse DAX", provider: "Alpha Vantage", desc: "Global Quote für DAX-Werte (SAP, Siemens, Allianz)", live: true, webhook: "stocks" },
    ],
  },
  {
    id: "construction",
    label: "Baubranche",
    icon: Building2,
    sources: [
      { id: "ibau", name: "Baustoffpreise", provider: "IBAU Index", desc: "Stahl, Beton, Holz — monatlich" },
      { id: "tender", name: "Ausschreibungen", provider: "TED EU", desc: "Öffentliche Vergaben EU-weit" },
      { id: "permits", name: "Baugenehmigungen", provider: "Destatis", desc: "Statistik genehmigter Bauvorhaben" },
    ],
  },
  {
    id: "legal",
    label: "Recht & Compliance",
    icon: Scale,
    sources: [
      { id: "bafin", name: "BaFin-Mitteilungen", provider: "BaFin RSS", desc: "Aufsichtsmitteilungen & Warnungen" },
      { id: "gesetze", name: "Gesetzesänderungen", provider: "gesetze-im-internet.de", desc: "Neue & geänderte Normen" },
      { id: "eur-lex", name: "EU-Rechtsakte", provider: "EUR-Lex API", desc: "Neue Verordnungen & Richtlinien" },
    ],
  },
  {
    id: "energy",
    label: "Energie & Rohstoffe",
    icon: Zap,
    sources: [
      { id: "wti", name: "Rohöl WTI", provider: "Alpha Vantage", desc: "Spotpreis WTI Crude Oil (USD/Barrel)", live: true, webhook: "wti" },
      { id: "gas", name: "Erdgas (Natural Gas)", provider: "Alpha Vantage", desc: "Henry Hub Spotpreis (USD/MMBtu)", live: true, webhook: "gas" },
      { id: "wheat", name: "Weizen (Agrar)", provider: "Alpha Vantage", desc: "Globaler Weizen-Spotpreis (USD/Bushel)", live: true, webhook: "wheat" },
      { id: "eex", name: "Strom-Spotpreis", provider: "EEX", desc: "Day-Ahead-Auktionen DE/AT" },
      { id: "co2", name: "CO₂-Zertifikate", provider: "EEX EUA", desc: "Emissionshandelspreise" },
    ],
  },
  {
    id: "logistics",
    label: "Logistik",
    icon: Truck,
    sources: [
      { id: "diesel", name: "Diesel-Index", provider: "BfG", desc: "Bundesdurchschnitt Großhandel" },
      { id: "freight", name: "Frachtraten", provider: "Drewry", desc: "Container-Spotraten weltweit" },
      { id: "traffic", name: "Verkehrsmeldungen", provider: "Bundesverkehrs­API", desc: "Baustellen & Sperrungen" },
    ],
  },
];

const SOURCE_OUTPUTS = {
  bund10y: {
    excelHeaders: ["Datum", "Rendite", "Δ Vortag", "ISO-Datum"],
    excelRows: [
      ["21.05.2026", "3,14 %", "-5 bp", "2026-05-21"],
      ["20.05.2026", "3,19 %", "-3 bp", "2026-05-20"],
      ["19.05.2026", "3,22 %", "+5 bp", "2026-05-19"],
    ],
    analysis: "Mock-Daten — Live-Backend liefert echte Versicherer-Analyse via EZB Yield Curve und KI (Solvency-II Risk-Free Rate, ALM-Empfehlungen).",
    subject: "Zinsumfeld-Briefing Euro AAA 10Y — Mai 2026",
  },
  "inflation-de": {
    excelHeaders: ["Monat", "Inflation YoY", "Δ Vormonat", "ISO-Monat"],
    excelRows: [
      ["April 2026", "2,9 %", "+0,1 pp", "2026-04"],
      ["März 2026", "2,8 %", "+0,8 pp", "2026-03"],
      ["Februar 2026", "2,0 %", "-0,1 pp", "2026-02"],
    ],
    analysis: "Mock-Daten — Live-Backend liefert echte Versicherer-Analyse via EZB HICP-API und KI (Schadeninflation, Reservierungsrisiko, Beitragsanpassung).",
    subject: "Inflations-Briefing Deutschland — Stand April 2026 (2,9 %)",
  },
  "konsumklima-de": {
    excelHeaders: ["Monat", "CCI", "Δ Vormonat", "ISO-Monat"],
    excelRows: [
      ["April 2026", "-18,0", "-4,1 Pkt", "2026-04"],
      ["März 2026", "-13,9", "-2,7 Pkt", "2026-03"],
      ["Februar 2026", "-11,2", "-1,1 Pkt", "2026-02"],
    ],
    analysis: "Mock-Daten — Live-Backend liefert echte Versicherer-Vertriebs-Analyse via Eurostat Consumer Confidence Indicator und KI (Storno-Risiko, Neugeschäft, Vertriebssteuerung).",
    subject: "Konsumklima-Briefing Deutschland — Stand April 2026 (-18,0 Pkt)",
  },
  gold: {
    excelHeaders: ["Datum", "Gold USD/oz", "Δ Vortag", "30T-Trend"],
    excelRows: [
      ["22.05.2026", "2.418,55", "+0,82 %", "↗ +3,1 %"],
      ["21.05.2026", "2.398,82", "-0,14 %", "↗ +2,9 %"],
      ["20.05.2026", "2.402,18", "+1,21 %", "↗ +3,0 %"],
    ],
    analysis: "Mock-Daten — Live-Backend liefert echte Analyse via metals.dev und KI.",
    subject: "Marktreport Edelmetalle — KW 21/2026",
  },
  eurusd: {
    excelHeaders: ["Datum", "EUR/USD", "Δ Vortag", "Δ Monat"],
    excelRows: [
      ["22.05.2026", "1,0842", "-0,12 %", "-1,4 %"],
      ["21.05.2026", "1,0855", "+0,18 %", "-1,2 %"],
      ["20.05.2026", "1,0836", "-0,24 %", "-1,5 %"],
    ],
    analysis: "Mock-Daten — Live-Backend liefert echte Analyse via Alpha Vantage und KI.",
    subject: "EUR/USD Wechselkurs — Tagesreport",
  },
  news: {
    excelHeaders: ["Datum", "Headline", "Sentiment", "Tickers"],
    excelRows: [
      ["22.05.2026", "Fed signalisiert Zinspause bis Q3", "Bullish (0.42)", "SPY, QQQ"],
      ["22.05.2026", "ASML übertrifft Q1-Erwartungen", "Bullish (0.61)", "ASML, SOX"],
      ["22.05.2026", "Ölmarkt nervös vor OPEC-Treffen", "Bearish (-0.28)", "WTI, XOM"],
    ],
    analysis: "Mock-Daten — Live-Backend liefert echte Analyse via Alpha Vantage News-Sentiment und KI.",
    subject: "Marktnews-Sentiment-Report — 22.05.2026",
  },
  stocks: {
    excelHeaders: ["Wert", "Kurs", "Δ Tag", "Δ YTD"],
    excelRows: [
      ["SAP", "212,40", "+1,2 %", "+18,4 %"],
      ["Siemens", "198,15", "-0,4 %", "+12,1 %"],
      ["Allianz", "284,90", "+0,8 %", "+9,7 %"],
    ],
    analysis: "Mock-Daten — Live-Backend liefert echte Analyse via Alpha Vantage Global Quote und KI.",
    subject: "DAX-Marktbericht — 22.05.2026",
  },
  ibau: {
    excelHeaders: ["Material", "Preis €/t", "Δ Vormonat", "Δ Vorjahr"],
    excelRows: [
      ["Betonstahl", "742", "+1,8 %", "-4,2 %"],
      ["Bauholz Fichte", "385", "-0,9 %", "+2,1 %"],
      ["Zement CEM I", "128", "+0,4 %", "+3,8 %"],
    ],
    analysis: "Betonstahlpreise ziehen weiter an (+1,8 % MoM). Hauptverantwortlich sind gestiegene Schrottpreise und höhere Energiekosten der Stahlwerke. Bauholz zeigt erste Entspannung. Für Kalkulationen in Q3-Projekten sollten Stahlpreis-Puffer von mindestens 5 % einkalkuliert werden.",
    subject: "Baustoff-Marktreport Mai 2026",
  },
  tender: {
    excelHeaders: ["Vergabestelle", "Auftragswert", "Frist", "CPV-Code"],
    excelRows: [
      ["BImA Berlin", "8,4 Mio €", "12.06.2026", "45210000"],
      ["LH München", "3,2 Mio €", "28.05.2026", "45233140"],
      ["Stadt Köln", "1,9 Mio €", "05.06.2026", "45262300"],
    ],
    analysis: "Aktuell 47 neue Ausschreibungen über 1 Mio € im DACH-Raum. Schwerpunkt: Hochbau öffentliche Hand (62 %) und Straßenbau (24 %). Die BImA-Ausschreibung in Berlin ist aufgrund Größe und Profil besonders relevant.",
    subject: "Ausschreibungs-Alert KW 21",
  },
  permits: {
    excelHeaders: ["Region", "Genehmigungen", "Δ Vormonat", "Δ Vorjahr"],
    excelRows: [
      ["NRW", "4.218", "+3,2 %", "-8,1 %"],
      ["Bayern", "5.142", "+1,8 %", "-5,4 %"],
      ["BaWü", "3.987", "+2,1 %", "-6,9 %"],
    ],
    analysis: "Baugenehmigungen zeigen erstmals seit 14 Monaten eine leichte Erholung auf Monatssicht. Im Jahresvergleich bleibt das Niveau jedoch deutlich unter dem Vorjahr.",
    subject: "Baugenehmigungen — Monatsreport",
  },
  bafin: {
    excelHeaders: ["Datum", "Typ", "Betreff", "Relevanz"],
    excelRows: [
      ["21.05.2026", "Warnung", "Unerlaubte Anlageberatung X-Invest", "Hoch"],
      ["20.05.2026", "Mitteilung", "MaRisk-Novelle Konsultation", "Hoch"],
      ["19.05.2026", "Pressemitteilung", "Stresstest Versicherer 2026", "Mittel"],
    ],
    analysis: "Die wichtigste Mitteilung der Woche ist die Konsultation zur MaRisk-Novelle. Insbesondere die geplanten Anpassungen im Bereich IT-Risikomanagement (AT 7.2) sind unmittelbar relevant. Stellungnahmefrist endet am 30.06.2026.",
    subject: "BaFin-Wochenreport KW 21",
  },
  gesetze: {
    excelHeaders: ["Gesetz", "Status", "Inkrafttreten", "Bereich"],
    excelRows: [
      ["LkSG-Novelle", "Bundestag", "01.01.2027", "Compliance"],
      ["GEG §71", "in Kraft", "01.07.2026", "Energie"],
      ["AMG-Änderung", "Bundesrat", "Q3/2026", "Pharma"],
    ],
    analysis: "Die GEG-Änderung tritt zum 01.07.2026 in Kraft und verschärft die Heizungsanforderungen in Neubauten. Die LkSG-Novelle senkt die Schwelle auf 500 Mitarbeitende — damit fallen rund 4.000 zusätzliche Unternehmen unter die Berichtspflicht.",
    subject: "Legal Update KW 21/2026",
  },
  "eur-lex": {
    excelHeaders: ["Rechtsakt", "Typ", "Veröffentlicht", "Umsetzung bis"],
    excelRows: [
      ["AI Act DA 4", "Delegated Act", "18.05.2026", "01.02.2027"],
      ["NIS-3", "Richtlinie", "15.05.2026", "Q4/2027"],
      ["CRR III Update", "Verordnung", "12.05.2026", "direkt"],
    ],
    analysis: "Mit dem AI Act Delegated Act 4 werden technische Standards für Hochrisiko-KI-Systeme konkretisiert. NIS-3 weitet den Anwendungsbereich der Cybersicherheits-Richtlinie aus.",
    subject: "EU-Legal-Briefing — 22.05.2026",
  },
  wti: {
    excelHeaders: ["Monat", "WTI USD/bbl", "Δ Vormonat", "Δ Vorjahr"],
    excelRows: [
      ["Mai 2026", "78,42", "+2,1 %", "+8,4 %"],
      ["Apr 2026", "76,80", "+1,4 %", "+6,8 %"],
      ["Mär 2026", "75,72", "-0,8 %", "+5,2 %"],
    ],
    analysis: "Mock-Daten — Live-Backend liefert echte Analyse via Alpha Vantage und KI.",
    subject: "Rohöl-Marktreport WTI — Mai 2026",
  },
  gas: {
    excelHeaders: ["Monat", "Henry Hub USD/MMBtu", "Δ Vormonat", "Δ Vorjahr"],
    excelRows: [
      ["Mai 2026", "3,24", "+4,2 %", "+18,7 %"],
      ["Apr 2026", "3,11", "+2,8 %", "+14,2 %"],
      ["Mär 2026", "3,02", "-1,4 %", "+11,8 %"],
    ],
    analysis: "Mock-Daten — Live-Backend liefert echte Analyse via Alpha Vantage und KI.",
    subject: "Erdgas-Markt-Briefing — Mai 2026",
  },
  wheat: {
    excelHeaders: ["Monat", "Weizen USD/Bushel", "Δ Vormonat", "Δ Vorjahr"],
    excelRows: [
      ["Mai 2026", "6,42", "-1,8 %", "-12,4 %"],
      ["Apr 2026", "6,54", "-0,9 %", "-10,8 %"],
      ["Mär 2026", "6,60", "+0,4 %", "-9,2 %"],
    ],
    analysis: "Mock-Daten — Live-Backend liefert echte Analyse via Alpha Vantage und KI.",
    subject: "Agrarrohstoffe Weizen — Marktreport Mai 2026",
  },
  eex: {
    excelHeaders: ["Lieferung", "Preis €/MWh", "Δ Vortag", "Δ 7T"],
    excelRows: [
      ["Day-Ahead", "82,40", "-3,2 %", "-8,1 %"],
      ["Base 2027", "94,50", "+0,4 %", "+1,2 %"],
      ["Peak 2027", "112,80", "+0,8 %", "+2,1 %"],
    ],
    analysis: "Day-Ahead-Preise geben deutlich nach (-8,1 % auf Wochensicht) — Hauptgrund ist die hohe Wind- und Solareinspeisung. Für energieintensive Verbraucher ergibt sich aktuell ein günstiges Einkaufsfenster.",
    subject: "Strommarkt-Bericht — 22.05.2026",
  },
  co2: {
    excelHeaders: ["Datum", "EUA €/t", "Δ Vortag", "Δ YTD"],
    excelRows: [
      ["22.05.2026", "78,40", "+2,1 %", "+12,8 %"],
      ["21.05.2026", "76,80", "-0,8 %", "+10,5 %"],
      ["20.05.2026", "77,42", "+1,2 %", "+11,4 %"],
    ],
    analysis: "EUA-Preise setzen ihren Aufwärtstrend fort (+12,8 % YTD). Treiber sind die schrittweise Reduktion der freien Zuteilungen und gestiegene industrielle Nachfrage.",
    subject: "CO₂-Markt-Briefing KW 21",
  },
  diesel: {
    excelHeaders: ["Region", "€/Liter", "Δ Vorwoche", "Δ Monat"],
    excelRows: [
      ["Bundesdurchschnitt", "1,524", "-0,8 %", "-2,1 %"],
      ["Großhandel Rotterdam", "0,948", "-1,2 %", "-3,4 %"],
      ["Tankstelle DE Ø", "1,684", "-0,4 %", "-1,2 %"],
    ],
    analysis: "Dieselpreise im Bundesdurchschnitt geben weiter nach (-2,1 % MoM). Hauptgrund ist die saisonale Schwäche der Rohölpreise und höhere Raffineriemargen.",
    subject: "Treibstoff-Marktreport KW 21",
  },
  freight: {
    excelHeaders: ["Route", "USD/FEU", "Δ Vorwoche", "Δ YTD"],
    excelRows: [
      ["Shanghai → Rotterdam", "3.420", "+4,2 %", "+18,4 %"],
      ["Shanghai → LA", "5.180", "+2,1 %", "+24,1 %"],
      ["Shanghai → New York", "6.420", "+1,8 %", "+21,2 %"],
    ],
    analysis: "Container-Spotraten ziehen weiter an, insbesondere auf der Transpazifik-Route (+24 % YTD). Hintergrund sind Umleitungen über das Kap der Guten Hoffnung und vorgezogene Bestellungen vor der US-Sommersaison.",
    subject: "Frachtraten-Briefing — 22.05.2026",
  },
  traffic: {
    excelHeaders: ["Autobahn", "Sperrung", "Zeitraum", "Umleitung"],
    excelRows: [
      ["A1 Köln-Leverkusen", "Fahrbahnerneuerung", "24.05.–18.07.", "U3 / A59"],
      ["A3 Frankfurt-Würzburg", "Brückenbau", "01.06.–30.09.", "B26"],
      ["A8 Stuttgart-Ulm", "Wartung Tunnel", "27.05.–29.05.", "B10"],
    ],
    analysis: "In den nächsten 8 Wochen sind 3 verkehrsrelevante Großbaustellen im Logistikkorridor West-Süd zu erwarten. Insbesondere die A1-Sperrung Leverkusen erhöht die Fahrzeit auf der Nord-Süd-Achse durchschnittlich um 35 Min.",
    subject: "Verkehrslage-Report KW 21",
  },
};

const NODE_STEPS = [
  { id: "source", label: "Datenquelle", icon: Database, desc: "API-Abruf" },
  { id: "process", label: "Verarbeitung", icon: Sparkles, desc: "Daten normalisieren" },
  { id: "excel", label: "Excel", icon: FileSpreadsheet, desc: "In Datei schreiben" },
  { id: "ai", label: "KI-Analyse", icon: Brain, desc: "Azure OpenAI" },
  { id: "mail", label: "Report", icon: Mail, desc: "E-Mail versenden" },
];

export default function App() {
  const [activeCategory, setActiveCategory] = useState("insurance");
  const [droppedSource, setDroppedSource] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [running, setRunning] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [showOutput, setShowOutput] = useState(false);
  const [liveData, setLiveData] = useState(null);
  const [liveError, setLiveError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [n8nBaseUrl, setN8nBaseUrl] = useState(() => {
    try { return localStorage.getItem("n8nBaseUrl") || ""; } catch { return ""; }
  });
  const [n8nUrlInput, setN8nUrlInput] = useState("");
  const dragData = useRef(null);

  const activeCat = CATEGORIES.find(c => c.id === activeCategory);

  const handleDragStart = (e, source) => {
    dragData.current = source;
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (dragData.current) {
      setDroppedSource(dragData.current);
      setShowOutput(false);
      setCompletedSteps([]);
      setActiveStep(-1);
      setLiveData(null);
      setLiveError(null);
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  const fetchLiveData = async (source) => {
    if (!n8nBaseUrl || !source.live || !source.webhook) return null;
    try {
      const cleanBase = n8nBaseUrl.replace(/\/$/, "");
      const url = `${cleanBase}/${source.webhook}`;
      const response = await fetch(url, { method: "GET", headers: { "Accept": "application/json" } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error("Live-Fetch fehlgeschlagen:", err);
      return null;
    }
  };

  const runWorkflow = async () => {
    if (!droppedSource || running) return;
    setRunning(true);
    setShowOutput(false);
    setCompletedSteps([]);
    setActiveStep(0);
    setLiveData(null);
    setLiveError(null);

    const livePromise = droppedSource.live && n8nBaseUrl
      ? fetchLiveData(droppedSource)
      : Promise.resolve(null);

    for (let idx = 0; idx < NODE_STEPS.length; idx++) {
      setActiveStep(idx);
      await new Promise(r => setTimeout(r, 900));
      setCompletedSteps(prev => [...prev, idx]);
    }

    const result = await livePromise;
    if (droppedSource.live && n8nBaseUrl) {
      if (result) setLiveData(result);
      else setLiveError("Live-Backend nicht erreichbar — zeige Mock-Daten");
    }

    setRunning(false);
    setShowOutput(true);
    setActiveStep(-1);
  };

  const reset = () => {
    setDroppedSource(null);
    setShowOutput(false);
    setCompletedSteps([]);
    setActiveStep(-1);
    setRunning(false);
    setLiveData(null);
    setLiveError(null);
  };

  const saveSettings = () => {
    const url = n8nUrlInput.trim();
    setN8nBaseUrl(url);
    try { localStorage.setItem("n8nBaseUrl", url); } catch {}
    setShowSettings(false);
  };

  const mockOutput = droppedSource ? SOURCE_OUTPUTS[droppedSource.id] : null;
  const output = liveData || mockOutput;
  const isLiveResult = !!liveData;

  return (
    <div className="min-h-screen text-slate-900" style={{ backgroundColor: "#FAF3D8" }}>
      <header className="border-b px-6 py-4" style={{ backgroundColor: "#FFFBEC", borderColor: "#EADFB0" }}>
        <div className="flex items-center justify-between max-w-[1600px] mx-auto">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Workflow Composer</h1>
            <p className="text-sm text-slate-500 mt-0.5">Automatisierte Marktstudien & externe Datenreports</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className={`w-2 h-2 rounded-full ${n8nBaseUrl ? "bg-emerald-500" : "bg-amber-500"}`}></span>
              {n8nBaseUrl ? "Backend verbunden" : "Demo-Modus"}
            </div>
            <button
              onClick={() => { setN8nUrlInput(n8nBaseUrl); setShowSettings(true); }}
              className="p-2 rounded-md hover:bg-yellow-100 transition"
              title="Backend-Einstellungen"
            >
              <Settings size={16} className="text-slate-600" />
            </button>
          </div>
        </div>
      </header>

      {showSettings && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowSettings(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-1">n8n-Backend verbinden</h3>
            <p className="text-sm text-slate-600 mb-4">
              Trage die Basis-URL deiner n8n-Webhooks ein. Live-Quellen rufen dann <code className="text-xs bg-slate-100 px-1 rounded">{`{URL}/{webhook-name}`}</code> auf.
            </p>
            <label className="block text-xs font-medium text-slate-700 mb-1">Webhook Basis-URL</label>
            <input
              type="text"
              value={n8nUrlInput}
              onChange={(e) => setN8nUrlInput(e.target.value)}
              placeholder="https://dein-n8n.com/webhook"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <p className="text-xs text-slate-500 mt-2">Leer lassen, um den reinen Demo-Modus mit Mock-Daten zu nutzen.</p>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowSettings(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md transition">Abbrechen</button>
              <button onClick={saveSettings} className="px-4 py-2 text-sm bg-slate-900 text-white rounded-md hover:bg-slate-800 transition">Speichern</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto grid grid-cols-12 gap-4 p-4">
        <aside className="col-span-4 rounded-lg border overflow-hidden" style={{ backgroundColor: "#FFFBEC", borderColor: "#EADFB0" }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: "#EADFB0" }}>
            <h2 className="font-semibold text-sm">Datenquellen-Bibliothek</h2>
            <p className="text-xs text-slate-600 mt-0.5">Per Drag & Drop in den Workflow ziehen</p>
          </div>
          <div className="px-2 pt-2 flex flex-wrap gap-1 border-b" style={{ borderColor: "#F0E7BE" }}>
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isActive = cat.id === activeCategory;
              return (
                <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-yellow-100"}`}>
                  <Icon size={13} />
                  {cat.label}
                </button>
              );
            })}
          </div>
          <div className="p-3 space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto">
            {activeCat.sources.map(source => (
              <div key={source.id} draggable onDragStart={(e) => handleDragStart(e, source)}
                className="group p-3 border rounded-md cursor-grab active:cursor-grabbing hover:shadow-md transition relative"
                style={{ backgroundColor: "#FFFEF7", borderColor: "#E8DCA8" }}>
                {source.live && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    <Radio size={8} />LIVE
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded group-hover:bg-slate-900 group-hover:text-white transition flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#F5EBC3" }}>
                    <Database size={15} />
                  </div>
                  <div className="min-w-0 flex-1 pr-8">
                    <div className="text-sm font-semibold leading-tight">{source.name}</div>
                    <div className="text-xs text-slate-600 mt-0.5">{source.provider}</div>
                    <div className="text-xs text-slate-500 mt-1.5 leading-snug">{source.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="col-span-5 rounded-lg border flex flex-col" style={{ backgroundColor: "#FFFBEC", borderColor: "#EADFB0" }}>
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "#EADFB0" }}>
            <div>
              <h2 className="font-semibold text-sm">Workflow Canvas</h2>
              <p className="text-xs text-slate-500 mt-0.5">{droppedSource ? `Quelle: ${droppedSource.name}` : "Datenquelle hier ablegen"}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={reset} disabled={!droppedSource || running}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md disabled:opacity-40 disabled:cursor-not-allowed transition">
                <RotateCcw size={13} />Reset
              </button>
              <button onClick={runWorkflow} disabled={!droppedSource || running}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition">
                {running ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                {running ? "Läuft..." : "Workflow starten"}
              </button>
            </div>
          </div>
          <div className="flex-1 p-8" style={{ backgroundColor: "#FFFEF7", backgroundImage: "radial-gradient(circle, #E8DCA8 1px, transparent 1px)", backgroundSize: "16px 16px" }}>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <div onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
                className={`relative w-32 h-28 rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition ${dragOver ? "border-slate-900 bg-slate-100 scale-105" : droppedSource ? "border-solid border-slate-300 bg-white" : "border-slate-300 bg-white hover:border-slate-400"}`}>
                {droppedSource ? (
                  <>
                    <div className={`w-10 h-10 rounded-md flex items-center justify-center mb-1.5 transition ${completedSteps.includes(0) ? "bg-emerald-100 text-emerald-700" : activeStep === 0 ? "bg-blue-100 text-blue-700" : "bg-slate-900 text-white"}`}>
                      {completedSteps.includes(0) ? <CheckCircle2 size={18} /> : activeStep === 0 ? <Loader2 size={18} className="animate-spin" /> : <Database size={18} />}
                    </div>
                    <div className="text-xs font-medium text-center px-1 leading-tight">{droppedSource.name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{droppedSource.provider}</div>
                  </>
                ) : (
                  <>
                    <Database size={20} className="text-slate-400 mb-1.5" />
                    <div className="text-xs text-slate-500 text-center px-2 leading-tight">Quelle hier<br />ablegen</div>
                  </>
                )}
              </div>
              {NODE_STEPS.slice(1).map((step, idx) => {
                const realIdx = idx + 1;
                const Icon = step.icon;
                const isActive = activeStep === realIdx;
                const isDone = completedSteps.includes(realIdx);
                return (
                  <div key={step.id} className="flex items-center gap-2">
                    <ArrowRight size={16} className={`transition ${isDone || isActive ? "text-slate-900" : "text-slate-300"}`} />
                    <div className={`w-32 h-28 rounded-lg border bg-white flex flex-col items-center justify-center transition ${isActive ? "border-blue-400 shadow-md scale-105" : isDone ? "border-emerald-300" : "border-slate-200"}`}>
                      <div className={`w-10 h-10 rounded-md flex items-center justify-center mb-1.5 transition ${isDone ? "bg-emerald-100 text-emerald-700" : isActive ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                        {isDone ? <CheckCircle2 size={18} /> : isActive ? <Loader2 size={18} className="animate-spin" /> : <Icon size={18} />}
                      </div>
                      <div className="text-xs font-medium">{step.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{step.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            {!droppedSource && (
              <div className="mt-12 text-center text-sm text-slate-400">← Wählen Sie links eine Datenquelle und ziehen Sie diese in den Workflow</div>
            )}
          </div>
        </main>

        <aside className="col-span-3 rounded-lg border overflow-hidden flex flex-col" style={{ backgroundColor: "#FFFBEC", borderColor: "#EADFB0" }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: "#EADFB0" }}>
            <h2 className="font-semibold text-sm">Output</h2>
            <p className="text-xs text-slate-500 mt-0.5">Ergebnis & generierter Report</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {!showOutput ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <FileSpreadsheet size={32} className="mb-2 text-slate-300" />
                <div className="text-sm">Noch kein Output</div>
                <div className="text-xs mt-1">Workflow ausführen, um Ergebnisse zu sehen</div>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {isLiveResult && (
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                    <Radio size={11} />
                    <span className="font-medium">Live-Daten</span>
                    <span className="text-emerald-600">· direkt aus n8n-Backend</span>
                  </div>
                )}
                {liveError && (
                  <div className="flex items-start gap-2 px-2.5 py-1.5 rounded bg-amber-50 border border-amber-200 text-xs text-amber-800">
                    <AlertCircle size={11} className="mt-0.5 flex-shrink-0" />
                    <span>{liveError}</span>
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileSpreadsheet size={14} className="text-emerald-600" />
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">Excel-Update</h3>
                  </div>
                  <div className="border border-slate-200 rounded overflow-hidden text-xs">
                    <table className="w-full">
                      <thead className="bg-slate-100">
                        <tr>
                          {output.excelHeaders.map((h, i) => (
                            <th key={i} className="px-2 py-1.5 text-left font-medium text-slate-700 text-[10px]">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {output.excelRows.map((row, i) => (
                          <tr key={i} className="border-t border-slate-100">
                            {row.map((cell, j) => (
                              <td key={j} className="px-2 py-1.5 text-slate-700 text-[10px]">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Mail size={14} className="text-blue-600" />
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">E-Mail-Report</h3>
                  </div>
                  <div className="border border-slate-200 rounded p-3 bg-slate-50/50">
                    <div className="text-[10px] text-slate-500 mb-1">Betreff</div>
                    <div className="text-xs font-medium mb-3">{output.subject}</div>
                    <div className="text-[10px] text-slate-500 mb-1">Analyse (KI-generiert)</div>
                    <div className="text-xs text-slate-700 leading-relaxed">{output.analysis}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                  <CheckCircle2 size={11} className="text-emerald-500" />
                  Report erfolgreich versendet · {new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
