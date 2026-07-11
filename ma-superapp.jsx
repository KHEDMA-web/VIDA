import React, { useState, useEffect, useMemo } from "react";
import {
  LayoutGrid, Wallet, HeartPulse, CheckCircle2, Target, BookOpen,
  Plus, Trash2, TrendingUp, TrendingDown, Flame, ChevronLeft,
  Minus, Check, Clock, Loader2, ShieldCheck, Home as HomeIcon,
  Users, Phone, Sparkles, Settings as Cog, Scale, AlertTriangle,
  MoonStar, Car, Moon, ListTodo, Star, RotateCcw
} from "lucide-react";

/* ============ THÈME ============ */
const T = {
  bg: "#12151F",
  surface: "#1B2030",
  surface2: "#242A3E",
  border: "rgba(255,255,255,0.08)",
  text: "#EEF0F8",
  muted: "#8A90A8",
  fin: "#E9B950",
  sport: "#FF7A6B",
  hab: "#4FD1C5",
  goal: "#7FA3FF",
  book: "#C792EA",
  dep: "#F06595",
  maison: "#FFA94D",
  rel: "#69DB7C",
  priere: "#63E6BE",
  vehicule: "#4DABF7",
  sommeil: "#9775FA",
  todo: "#CED4DA",
};

const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

const DOMAINS = [
  { id: "fin", label: "Finances", color: T.fin, icon: Wallet },
  { id: "sport", label: "Sport", color: T.sport, icon: HeartPulse },
  { id: "hab", label: "Habitudes", color: T.hab, icon: CheckCircle2 },
  { id: "goal", label: "Objectifs", color: T.goal, icon: Target },
  { id: "book", label: "Livres", color: T.book, icon: BookOpen },
  { id: "dep", label: "Sans", color: T.dep, icon: ShieldCheck },
  { id: "maison", label: "Maison", color: T.maison, icon: HomeIcon },
  { id: "rel", label: "Liens", color: T.rel, icon: Users },
  { id: "priere", label: "Prière", color: T.priere, icon: MoonStar },
  { id: "vehicule", label: "Véhicule", color: T.vehicule, icon: Car },
  { id: "sommeil", label: "Sommeil", color: T.sommeil, icon: Moon },
  { id: "todo", label: "To-do", color: T.todo, icon: ListTodo },
];

/* ============ HELPERS ============ */
const uid = () => Math.random().toString(36).slice(2, 10);
const localDate = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const today = () => localDate();
const lastNDays = (n) => {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(localDate(d));
  }
  return out;
};
const monthKey = () => today().slice(0, 7);
let CURRENCY = "EUR";
const CUR_SYMBOLS = { EUR: "€", DZD: "DA", USD: "$", GBP: "£", CHF: "CHF", CAD: "$", MAD: "MAD", XOF: "CFA" };
const curSym = () => CUR_SYMBOLS[CURRENCY] || CURRENCY;
const eur = (n) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: CURRENCY, maximumFractionDigits: 0 }).format(n);

const daysSince = (dateStr) =>
  Math.floor((new Date(today()) - new Date(dateStr)) / 86400000);

const ALL_IDS = ["fin", "sport", "hab", "goal", "book", "dep", "maison", "rel", "priere", "vehicule", "sommeil", "todo"];

const DEFAULTS = {
  fin: { transactions: [], budget: 1000 },
  sport: { sessions: [], weeklyTarget: 3, weights: [] },
  hab: { list: [], checks: {} },
  goal: { goals: [], sessions: [] },
  book: { books: [], logs: [] },
  dep: { items: [], counts: {} },
  maison: { tasks: [], history: [] },
  rel: { contacts: [], history: [] },
  priere: { checks: {} },
  vehicule: { tasks: [], history: [] },
  sommeil: { logs: {}, target: 8 },
  todo: { tasks: [] },
  settings: { name: "", currency: "EUR", active: ALL_IDS, v2: true, v3: true, prayerCity: "", prayerLat: null, prayerLng: null, prayerMethod: "19" },
};

/* ============ STORAGE ============ */
async function loadDomain(key) {
  try {
    const res = await window.storage.get("superapp:" + key);
    if (res && res.value) return { ...DEFAULTS[key], ...JSON.parse(res.value) };
  } catch (e) { /* clé absente = premier lancement */ }
  return DEFAULTS[key];
}
async function saveDomain(key, data) {
  try {
    await window.storage.set("superapp:" + key, JSON.stringify(data));
  } catch (e) {
    console.error("Sauvegarde impossible", e);
  }
}

/* ============ HORAIRES DE PRIÈRE (calcul astronomique local) ============ */
const DTR = Math.PI / 180;
const fixNum = (a, b) => { a -= b * Math.floor(a / b); return a < 0 ? a + b : a; };
const fixHour = (a) => fixNum(a, 24);

function computeTimes(dateObj, lat, lng, tz, fajrAngle, ishaAngle, ishaInterval) {
  const julianDay = (y, m, d) => {
    if (m <= 2) { y -= 1; m += 12; }
    const A = Math.floor(y / 100);
    const B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
  };
  const jd = julianDay(dateObj.getFullYear(), dateObj.getMonth() + 1, dateObj.getDate()) - lng / (15 * 24);

  const sunPos = (t) => {
    const D = jd + t - 2451545.0;
    const g = fixNum(357.529 + 0.98560028 * D, 360);
    const q = fixNum(280.459 + 0.98564736 * D, 360);
    const L = fixNum(q + 1.915 * Math.sin(g * DTR) + 0.020 * Math.sin(2 * g * DTR), 360);
    const e = 23.439 - 0.00000036 * D;
    const RA = Math.atan2(Math.cos(e * DTR) * Math.sin(L * DTR), Math.cos(L * DTR)) / DTR / 15;
    return { decl: Math.asin(Math.sin(e * DTR) * Math.sin(L * DTR)) / DTR, eqt: q / 15 - fixHour(RA) };
  };

  const midDay = (t) => fixHour(12 - sunPos(t).eqt);
  const sunAngleTime = (angle, t, ccw) => {
    const { decl } = sunPos(t);
    const noon = midDay(t);
    const v = (-Math.sin(angle * DTR) - Math.sin(decl * DTR) * Math.sin(lat * DTR)) /
              (Math.cos(decl * DTR) * Math.cos(lat * DTR));
    if (v < -1 || v > 1) return NaN;
    return noon + (ccw ? -1 : 1) * (Math.acos(v) / DTR) / 15;
  };
  const asrTime = (t) => {
    const { decl } = sunPos(t);
    const angle = -Math.atan(1 / (1 + Math.tan(Math.abs(lat - decl) * DTR))) / DTR;
    return sunAngleTime(angle, t, false);
  };

  let t = { fajr: 5, sunrise: 6, dhuhr: 12, asr: 13, maghrib: 18, isha: 18 };
  for (let i = 0; i < 2; i++) {
    t = {
      fajr: sunAngleTime(fajrAngle, t.fajr / 24, true),
      sunrise: sunAngleTime(0.833, t.sunrise / 24, true),
      dhuhr: midDay(t.dhuhr / 24),
      asr: asrTime(t.asr / 24),
      maghrib: sunAngleTime(0.833, t.maghrib / 24, false),
      isha: ishaInterval ? 0 : sunAngleTime(ishaAngle, t.isha / 24, false),
    };
  }
  if (ishaInterval) t.isha = t.maghrib + ishaInterval / 60;

  const adjust = (x) => fixHour(x + tz - lng / 15);
  const fmt = (x) => {
    if (isNaN(x)) return "—";
    x = fixHour(x + 0.5 / 60);
    const h = Math.floor(x), m = Math.floor((x - h) * 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };
  return {
    Fajr: fmt(adjust(t.fajr)), Dhuhr: fmt(adjust(t.dhuhr)), Asr: fmt(adjust(t.asr)),
    Maghrib: fmt(adjust(t.maghrib)), Isha: fmt(adjust(t.isha)),
  };
}

const METHOD_ANGLES = {
  "19": { fajr: 18, isha: 17 },              // Algérie
  "3": { fajr: 18, isha: 17 },               // MWL
  "5": { fajr: 19.5, isha: 17.5 },           // Égypte
  "4": { fajr: 18.5, isha: 0, interval: 90 },// Umm Al-Qura : Isha = Maghrib + 90 min
  "21": { fajr: 19, isha: 17 },              // Maroc
  "2": { fajr: 15, isha: 15 },               // ISNA
  "12": { fajr: 12, isha: 12 },              // France UOIF
};

const CITIES = [
  { n: "Adrar", lat: 27.8742, lng: -0.2939 }, { n: "Aïn Defla", lat: 36.2641, lng: 1.9679 },
  { n: "Aïn Témouchent", lat: 35.2972, lng: -1.1403 }, { n: "Alger", lat: 36.7538, lng: 3.0588 },
  { n: "Annaba", lat: 36.9, lng: 7.7667 }, { n: "Batna", lat: 35.5559, lng: 6.1741 },
  { n: "Béchar", lat: 31.6167, lng: -2.2167 }, { n: "Béjaïa", lat: 36.75, lng: 5.0667 },
  { n: "Biskra", lat: 34.85, lng: 5.7333 }, { n: "Blida", lat: 36.47, lng: 2.8277 },
  { n: "Bordj Bou Arreridj", lat: 36.0731, lng: 4.7608 }, { n: "Bouira", lat: 36.3741, lng: 3.902 },
  { n: "Boumerdès", lat: 36.7664, lng: 3.4772 }, { n: "Chlef", lat: 36.1652, lng: 1.3345 },
  { n: "Constantine", lat: 36.365, lng: 6.6147 }, { n: "Djelfa", lat: 34.6667, lng: 3.25 },
  { n: "El Bayadh", lat: 33.6831, lng: 1.0192 }, { n: "El Oued", lat: 33.3683, lng: 6.8674 },
  { n: "El Tarf", lat: 36.7672, lng: 8.3137 }, { n: "Ghardaïa", lat: 32.4839, lng: 3.6736 },
  { n: "Guelma", lat: 36.4621, lng: 7.4261 }, { n: "Illizi", lat: 26.4833, lng: 8.4667 },
  { n: "Jijel", lat: 36.8206, lng: 5.7667 }, { n: "Khenchela", lat: 35.4361, lng: 7.1433 },
  { n: "Laghouat", lat: 33.8, lng: 2.865 }, { n: "Mascara", lat: 35.3968, lng: 0.1403 },
  { n: "Médéa", lat: 36.2642, lng: 2.7539 }, { n: "Mila", lat: 36.4503, lng: 6.2644 },
  { n: "Mostaganem", lat: 35.9311, lng: 0.0892 }, { n: "M'Sila", lat: 35.7058, lng: 4.5419 },
  { n: "Naâma", lat: 33.2667, lng: -0.3167 }, { n: "Oran", lat: 35.6971, lng: -0.6308 },
  { n: "Ouargla", lat: 31.9527, lng: 5.3335 }, { n: "Oum El Bouaghi", lat: 35.8754, lng: 7.1135 },
  { n: "Relizane", lat: 35.7373, lng: 0.556 }, { n: "Saïda", lat: 34.8303, lng: 0.1517 },
  { n: "Sétif", lat: 36.19, lng: 5.41 }, { n: "Sidi Bel Abbès", lat: 35.1899, lng: -0.6309 },
  { n: "Skikda", lat: 36.8791, lng: 6.9075 }, { n: "Souk Ahras", lat: 36.2864, lng: 7.9511 },
  { n: "Tamanrasset", lat: 22.785, lng: 5.5228 }, { n: "Tébessa", lat: 35.4, lng: 8.1167 },
  { n: "Tiaret", lat: 35.371, lng: 1.3169 }, { n: "Tindouf", lat: 27.6711, lng: -8.1474 },
  { n: "Tipaza", lat: 36.5942, lng: 2.4475 }, { n: "Tissemsilt", lat: 35.6072, lng: 1.8106 },
  { n: "Tizi Ouzou", lat: 36.7117, lng: 4.0458 }, { n: "Tlemcen", lat: 34.8828, lng: -1.3167 },
  { n: "— Paris", lat: 48.8566, lng: 2.3522 }, { n: "— Marseille", lat: 43.2965, lng: 5.3698 },
  { n: "— Lyon", lat: 45.764, lng: 4.8357 }, { n: "— Lille", lat: 50.6292, lng: 3.0573 },
  { n: "— Bruxelles", lat: 50.8503, lng: 4.3517 }, { n: "— Montréal", lat: 45.5017, lng: -73.5673 },
  { n: "— Londres", lat: 51.5074, lng: -0.1278 },
];

function getPrayerTimes(settings) {
  const lat = parseFloat(settings.prayerLat), lng = parseFloat(settings.prayerLng);
  if (isNaN(lat) || isNaN(lng)) return null;
  const m = METHOD_ANGLES[settings.prayerMethod || "19"] || METHOD_ANGLES["19"];
  const now = new Date();
  const tz = -now.getTimezoneOffset() / 60;
  return computeTimes(now, lat, lng, tz, m.fajr, m.isha, m.interval || 0);
}

function nextPrayer(times) {
  if (!times) return null;
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  for (const p of PRAYERS) {
    const [h, m] = (times[p] || "0:0").split(":").map(Number);
    if (h * 60 + m > cur) return p;
  }
  return null;
}

/* ============ UI DE BASE ============ */
const Card = ({ children, style }) => (
  <div style={{
    background: T.surface, border: `1px solid ${T.border}`,
    borderRadius: 18, padding: 16, ...style
  }}>{children}</div>
);

const Section = ({ title, right, children }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted }}>{title}</div>
      {right}
    </div>
    {children}
  </div>
);

const Btn = ({ children, onClick, color = T.goal, ghost, small, style, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: ghost ? "transparent" : color,
    color: ghost ? color : "#12151F",
    border: ghost ? `1px solid ${color}` : "none",
    borderRadius: 12, padding: small ? "6px 10px" : "10px 16px",
    fontWeight: 700, fontSize: small ? 13 : 14, cursor: "pointer",
    fontFamily: "'Space Grotesk',sans-serif", opacity: disabled ? 0.4 : 1,
    display: "inline-flex", alignItems: "center", gap: 6, ...style
  }}>{children}</button>
);

const Input = (props) => (
  <input {...props} style={{
    background: T.surface2, border: `1px solid ${T.border}`, color: T.text,
    borderRadius: 12, padding: "10px 12px", fontSize: 15, width: "100%",
    outline: "none", boxSizing: "border-box", ...props.style
  }} />
);

const Empty = ({ text }) => (
  <div style={{ color: T.muted, fontSize: 14, textAlign: "center", padding: "18px 0" }}>{text}</div>
);

/* ============ BOUSSOLE (signature) ============ */
function Boussole({ fractions, size = 220 }) {
  const cx = size / 2, cy = size / 2, r = size / 2 - 16;
  const seg = 360 / fractions.length, gap = 8;
  const polar = (a) => {
    const rad = ((a - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };
  const arc = (a0, a1) => {
    const [x0, y0] = polar(a0);
    const [x1, y1] = polar(a1);
    const large = a1 - a0 > 180 ? 1 : 0;
    return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
  };
  const global = Math.round((fractions.reduce((s, f) => s + f.value, 0) / fractions.length) * 100);
  return (
    <div style={{ position: "relative", width: size, margin: "0 auto" }}>
      <svg width={size} height={size}>
        {fractions.map((f, i) => {
          const a0 = i * seg + gap / 2;
          const a1 = (i + 1) * seg - gap / 2;
          const fillEnd = a0 + Math.max(0.001, f.value) * (a1 - a0);
          return (
            <g key={f.id}>
              <path d={arc(a0, a1)} stroke={f.color} strokeOpacity="0.18" strokeWidth="10" fill="none" strokeLinecap="round" />
              {f.value > 0 && (
                <path d={arc(a0, fillEnd)} stroke={f.color} strokeWidth="10" fill="none" strokeLinecap="round"
                  style={{ filter: `drop-shadow(0 0 6px ${f.color}55)` }} />
              )}
            </g>
          );
        })}
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", textAlign: "center"
      }}>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 44, fontWeight: 700, lineHeight: 1 }}>{global}<span style={{ fontSize: 20, color: T.muted }}>%</span></div>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 4, letterSpacing: "0.1em", textTransform: "uppercase" }}>Aujourd'hui</div>
      </div>
    </div>
  );
}

/* ============ APP ============ */
export default function App() {
  const [tab, setTab] = useState("home");
  const [loading, setLoading] = useState(true);
  const [fin, setFin] = useState(DEFAULTS.fin);
  const [sport, setSport] = useState(DEFAULTS.sport);
  const [hab, setHab] = useState(DEFAULTS.hab);
  const [goal, setGoal] = useState(DEFAULTS.goal);
  const [book, setBook] = useState(DEFAULTS.book);
  const [dep, setDep] = useState(DEFAULTS.dep);
  const [maison, setMaison] = useState(DEFAULTS.maison);
  const [rel, setRel] = useState(DEFAULTS.rel);
  const [priere, setPriere] = useState(DEFAULTS.priere);
  const [vehicule, setVehicule] = useState(DEFAULTS.vehicule);
  const [sommeil, setSommeil] = useState(DEFAULTS.sommeil);
  const [todo, setTodo] = useState(DEFAULTS.todo);
  const [settings, setSettings] = useState(DEFAULTS.settings);

  useEffect(() => {
    (async () => {
      const [f, s, h, g, b, d2, m2, r2, p2, v2, so2, td2, st0] = await Promise.all(
        ["fin", "sport", "hab", "goal", "book", "dep", "maison", "rel", "priere", "vehicule", "sommeil", "todo", "settings"].map(loadDomain)
      );
      let st = st0;
      // Migrations : activer automatiquement les nouveaux domaines une seule fois
      if (!st.v2) {
        st = { ...st, active: [...new Set([...(st.active || []), "priere", "vehicule", "sommeil"])], v2: true };
      }
      if (!st.v3) {
        st = { ...st, active: [...new Set([...(st.active || []), "todo"])], v3: true };
      }
      // Migration : si une ville avait été tapée à la main, retrouver ses coordonnées
      if (st.prayerCity && (st.prayerLat == null || st.prayerLat === "")) {
        const match = CITIES.find((c) => c.n.toLowerCase().replace("— ", "") === st.prayerCity.trim().toLowerCase());
        st = match
          ? { ...st, prayerCity: match.n, prayerLat: match.lat, prayerLng: match.lng }
          : { ...st, prayerCity: "", prayerLat: null, prayerLng: null };
      }
      if (st !== st0) saveDomain("settings", st);
      setFin(f); setSport(s); setHab(h); setGoal(g); setBook(b);
      setDep(d2); setMaison(m2); setRel(r2);
      setPriere(p2); setVehicule(v2); setSommeil(so2); setTodo(td2); setSettings(st);
      setLoading(false);
    })();
  }, []);

  CURRENCY = settings.currency || "EUR";
  const active = settings.active && settings.active.length ? settings.active : ALL_IDS;

  const update = (key, setter) => (next) => {
    setter(next);
    saveDomain(key, next);
  };
  const setF = update("fin", setFin);
  const setS = update("sport", setSport);
  const setH = update("hab", setHab);
  const setG = update("goal", setGoal);
  const setB = update("book", setBook);
  const setD = update("dep", setDep);
  const setM = update("maison", setMaison);
  const setR = update("rel", setRel);
  const setP = update("priere", setPriere);
  const setV = update("vehicule", setVehicule);
  const setSo = update("sommeil", setSommeil);
  const setTd = update("todo", setTodo);
  const setSt = update("settings", setSettings);

  const resetAll = async () => {
    for (const k of [...ALL_IDS, "settings"]) {
      try { await window.storage.delete("superapp:" + k); } catch (e) { /* clé absente */ }
    }
    setFin(DEFAULTS.fin); setSport(DEFAULTS.sport); setHab(DEFAULTS.hab);
    setGoal(DEFAULTS.goal); setBook(DEFAULTS.book); setDep(DEFAULTS.dep);
    setMaison(DEFAULTS.maison); setRel(DEFAULTS.rel);
    setPriere(DEFAULTS.priere); setVehicule(DEFAULTS.vehicule); setSommeil(DEFAULTS.sommeil);
    setTodo(DEFAULTS.todo);
    setSettings(DEFAULTS.settings);
    setTab("home");
  };

  /* fractions du jour pour la boussole */
  const fractions = useMemo(() => {
    const d = today();
    const finDone = fin.transactions.some((t) => t.date === d) ? 1 : 0;
    const sportDone = sport.sessions.some((s) => s.date === d) ? 1 : 0;
    const checks = hab.checks[d] || [];
    const habFrac = hab.list.length ? checks.length / hab.list.length : 0;
    const goalDone = goal.sessions.some((s) => s.date === d) ? 1 : 0;
    const bookDone = book.logs.some((l) => l.date === d) ? 1 : 0;
    const depFrac = dep.items.length
      ? dep.items.filter((it) => !((dep.counts[d] || {})[it.id] > 0)).length / dep.items.length
      : 0;
    const maisonFrac = maison.tasks.length
      ? maison.tasks.filter((t) => t.lastDone && daysSince(t.lastDone) < t.freq).length / maison.tasks.length
      : 0;
    const relFrac = rel.contacts.length
      ? rel.contacts.filter((c) => c.lastContact && daysSince(c.lastContact) < c.freq).length / rel.contacts.length
      : 0;
    const priereFrac = (priere.checks[d] || []).length / PRAYERS.length;
    const vehiculeFrac = vehicule.tasks.length
      ? vehicule.tasks.filter((t) => t.lastDone && daysSince(t.lastDone) < t.freq).length / vehicule.tasks.length
      : 0;
    const slog = sommeil.logs[d];
    const sommeilFrac = slog ? Math.min(1, slog.hours / (sommeil.target || 8)) : 0;
    const openTodos = todo.tasks.filter((t) => !t.done).length;
    const doneToday = todo.tasks.filter((t) => t.done && t.doneDate === d).length;
    const todoFrac = openTodos + doneToday > 0 ? doneToday / (openTodos + doneToday) : 0;
    return [
      { id: "fin", color: T.fin, value: finDone },
      { id: "sport", color: T.sport, value: sportDone },
      { id: "hab", color: T.hab, value: habFrac },
      { id: "goal", color: T.goal, value: goalDone },
      { id: "book", color: T.book, value: bookDone },
      { id: "dep", color: T.dep, value: depFrac },
      { id: "maison", color: T.maison, value: maisonFrac },
      { id: "rel", color: T.rel, value: relFrac },
      { id: "priere", color: T.priere, value: priereFrac },
      { id: "vehicule", color: T.vehicule, value: vehiculeFrac },
      { id: "sommeil", color: T.sommeil, value: sommeilFrac },
      { id: "todo", color: T.todo, value: todoFrac },
    ].filter((f) => active.includes(f.id));
  }, [fin, sport, hab, goal, book, dep, maison, rel, priere, vehicule, sommeil, todo, settings]);

  if (loading) {
    return (
      <Shell tab={tab} setTab={setTab} hideNav>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "70vh", gap: 12, color: T.muted }}>
          <Loader2 size={28} style={{ animation: "spin 1s linear infinite" }} />
          Chargement de tes données…
        </div>
      </Shell>
    );
  }

  return (
    <Shell tab={tab} setTab={setTab} active={active}>
      {tab === "home" && <Home fractions={fractions} fin={fin} sport={sport} hab={hab} setH={setH} goal={goal} book={book} dep={dep} maison={maison} rel={rel} priere={priere} setP={setP} vehicule={vehicule} sommeil={sommeil} todo={todo} setTd={setTd} go={setTab} active={active} name={settings.name} settings={settings} />}
      {tab === "fin" && <Finances data={fin} set={setF} />}
      {tab === "sport" && <Sport data={sport} set={setS} />}
      {tab === "hab" && <Habits data={hab} set={setH} />}
      {tab === "goal" && <Goals data={goal} set={setG} />}
      {tab === "book" && <Books data={book} set={setB} />}
      {tab === "dep" && <Dependances data={dep} set={setD} />}
      {tab === "maison" && <Maison data={maison} set={setM} />}
      {tab === "rel" && <Relations data={rel} set={setR} />}
      {tab === "priere" && <Priere data={priere} set={setP} settings={settings} go={setTab} />}
      {tab === "vehicule" && <Vehicule data={vehicule} set={setV} />}
      {tab === "sommeil" && <Sommeil data={sommeil} set={setSo} />}
      {tab === "todo" && <Todo data={todo} set={setTd} />}
      {tab === "settings" && <Reglages settings={settings} set={setSt} resetAll={resetAll} />}
    </Shell>
  );
}

/* ============ SHELL + NAV ============ */
function Shell({ children, tab, setTab, hideNav, active = ALL_IDS }) {
  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.text, fontFamily: "'Inter',system-ui,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;600;700&display=swap');
        * { -webkit-tap-highlight-color: transparent; }
        input::placeholder { color: #5A6078; }
        @keyframes spin { to { transform: rotate(360deg); } }
        button:active { transform: scale(0.97); }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
      `}</style>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px 96px" }}>
        {children}
      </div>
      {!hideNav && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "rgba(18,21,31,0.92)", backdropFilter: "blur(12px)",
          borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "flex-start",
          gap: 4, overflowX: "auto", WebkitOverflowScrolling: "touch",
          padding: "10px 8px calc(10px + env(safe-area-inset-bottom))", maxWidth: "100%",
        }}>
          {[
            { id: "home", label: "Vue", color: T.text, icon: LayoutGrid },
            ...DOMAINS.filter((d) => active.includes(d.id)),
            { id: "settings", label: "Réglages", color: T.muted, icon: Cog },
          ].map((d) => {
            const Icon = d.icon;
            const active = tab === d.id;
            return (
              <button key={d.id} onClick={() => setTab(d.id)} aria-label={d.label} style={{
                background: "none", border: "none", cursor: "pointer", flex: "1 0 auto",
                minWidth: 48, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                color: active ? d.color : T.muted, fontSize: 10, fontWeight: 600,
              }}>
                <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
                {d.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============ DASHBOARD ============ */
function Home({ fractions, fin, sport, hab, setH, goal, book, dep, maison, rel, priere, setP, vehicule, sommeil, todo, setTd, go, active, name, settings }) {
  const times = getPrayerTimes(settings);
  const next = nextPrayer(times);
  const d = today();
  const days7 = lastNDays(7);
  const dateStr = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  /* bilan 7 jours */
  const dep7 = fin.transactions.filter((t) => t.type === "expense" && days7.includes(t.date)).reduce((s, t) => s + t.amount, 0);
  const seances7 = sport.sessions.filter((s) => days7.includes(s.date)).length;
  const habRates = days7.map((day) => {
    const c = (hab.checks[day] || []).length;
    return hab.list.length ? c / hab.list.length : 0;
  });
  const habAvg = Math.round((habRates.reduce((a, b) => a + b, 0) / 7) * 100);
  const learn7 = goal.sessions.filter((s) => days7.includes(s.date)).reduce((s2, s) => s2 + s.minutes, 0);
  const pages7 = book.logs.filter((l) => days7.includes(l.date)).reduce((s, l) => s + l.pages, 0);
  const conso7 = days7.reduce((s, day) =>
    s + Object.values(dep.counts[day] || {}).reduce((a, b) => a + b, 0), 0);
  const maison7 = maison.history.filter((h) => days7.includes(h.date)).length;
  const rel7 = rel.history.filter((h) => days7.includes(h.date)).length;
  const priere7 = days7.reduce((s, day) => s + (priere.checks[day] || []).length, 0);
  const vehicule7 = vehicule.history.filter((h) => days7.includes(h.date)).length;
  const sleepDays = days7.map((day) => sommeil.logs[day]).filter(Boolean);
  const sleepAvg = sleepDays.length
    ? (sleepDays.reduce((s, l) => s + l.hours, 0) / sleepDays.length).toFixed(1)
    : null;
  const todo7 = todo.tasks.filter((t) => t.done && days7.includes(t.doneDate)).length;
  const openTasks = todo.tasks.filter((t) => !t.done)
    .sort((a, b) => (b.important ? 1 : 0) - (a.important ? 1 : 0))
    .slice(0, 4);
  const toggleTask = (id) => {
    setTd({
      ...todo,
      tasks: todo.tasks.map((t) => t.id === id ? { ...t, done: !t.done, doneDate: !t.done ? d : null } : t),
    });
  };

  const todayPrayers = priere.checks[d] || [];
  const togglePrayer = (p) => {
    const cur = new Set(todayPrayers);
    cur.has(p) ? cur.delete(p) : cur.add(p);
    setP({ ...priere, checks: { ...priere.checks, [d]: [...cur] } });
  };

  const todayChecks = hab.checks[d] || [];
  const toggleHabit = (id) => {
    const cur = new Set(hab.checks[d] || []);
    cur.has(id) ? cur.delete(id) : cur.add(id);
    setH({ ...hab, checks: { ...hab.checks, [d]: [...cur] } });
  };

  return (
    <div>
      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 26, fontWeight: 700 }}>
            {name ? `Salut ${name} 👋` : "Ma vie, en un regard"}
          </div>
          <div style={{ color: T.muted, fontSize: 14, textTransform: "capitalize" }}>{dateStr}</div>
        </div>
        <button onClick={() => go("settings")} aria-label="Réglages" style={{
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
          width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
          color: T.muted, cursor: "pointer", flexShrink: 0,
        }}>
          <Cog size={20} />
        </button>
      </div>

      <Card style={{ marginBottom: 20, padding: "20px 16px" }}>
        <Boussole fractions={fractions} />
        <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap", marginTop: 14 }}>
          {DOMAINS.filter((dm) => active.includes(dm.id)).map((dm) => (
            <div key={dm.id} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: T.muted }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: dm.color, display: "inline-block" }} />
              {dm.label}
            </div>
          ))}
        </div>
      </Card>

      {active.includes("priere") && (
        <Section title="Prières du jour" right={
          !times ? (
            <button onClick={() => go("settings")} style={{ background: "none", border: "none", color: T.priere, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              Définir ma ville →
            </button>
          ) : null
        }>
          <div style={{ display: "flex", gap: 6 }}>
            {PRAYERS.map((p) => {
              const done = todayPrayers.includes(p);
              const isNext = !done && p === next;
              return (
                <button key={p} onClick={() => togglePrayer(p)} style={{
                  flex: 1, padding: "10px 2px", borderRadius: 12, cursor: "pointer",
                  background: done ? T.priere : T.surface,
                  border: isNext ? `2px solid ${T.priere}` : `1px solid ${done ? T.priere : T.border}`,
                  boxShadow: isNext ? `0 0 10px ${T.priere}44` : "none",
                  color: done ? "#12151F" : isNext ? T.priere : T.muted, fontSize: 11, fontWeight: 700,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                }}>
                  <MoonStar size={15} />
                  {p}
                  {times && <span style={{ fontSize: 10, fontWeight: 600, opacity: done ? 0.7 : 1 }}>{times[p]}</span>}
                </button>
              );
            })}
          </div>
        </Section>
      )}

      {active.includes("todo") && openTasks.length > 0 && (
        <Section title="À faire" right={
          <button onClick={() => go("todo")} style={{ background: "none", border: "none", color: T.todo, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            Tout voir →
          </button>
        }>
          <Card>
            {openTasks.map((t) => (
              <button key={t.id} onClick={() => toggleTask(t.id)} style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%",
                background: "none", border: "none", color: T.text, cursor: "pointer",
                padding: "10px 0", fontSize: 15, textAlign: "left",
                borderBottom: `1px solid ${T.border}`,
              }}>
                <span style={{
                  width: 24, height: 24, borderRadius: 12, flexShrink: 0,
                  border: `2px solid ${T.muted}`,
                }} />
                <span style={{ flex: 1 }}>{t.title}</span>
                {t.important && <Star size={15} color={T.fin} fill={T.fin} />}
              </button>
            ))}
          </Card>
        </Section>
      )}

      {active.includes("hab") && hab.list.length > 0 && (
        <Section title="Habitudes du jour">
          <Card>
            {hab.list.map((h) => {
              const done = todayChecks.includes(h.id);
              return (
                <button key={h.id} onClick={() => toggleHabit(h.id)} style={{
                  display: "flex", alignItems: "center", gap: 12, width: "100%",
                  background: "none", border: "none", color: T.text, cursor: "pointer",
                  padding: "10px 0", fontSize: 15, textAlign: "left",
                  borderBottom: `1px solid ${T.border}`,
                }}>
                  <span style={{
                    width: 24, height: 24, borderRadius: 8, flexShrink: 0,
                    border: `2px solid ${done ? T.hab : T.muted}`,
                    background: done ? T.hab : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{done && <Check size={15} color="#12151F" strokeWidth={3.5} />}</span>
                  <span style={{ textDecoration: done ? "line-through" : "none", opacity: done ? 0.6 : 1 }}>{h.name}</span>
                </button>
              );
            })}
          </Card>
        </Section>
      )}

      <Section title="Accès rapide">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { id: "fin", txt: "Noter une dépense", icon: Wallet, c: T.fin },
            { id: "sport", txt: "Ajouter une séance", icon: HeartPulse, c: T.sport },
            { id: "goal", txt: "Session d'apprentissage", icon: Target, c: T.goal },
            { id: "book", txt: "Pages lues", icon: BookOpen, c: T.book },
            { id: "dep", txt: "Ma conso du jour", icon: ShieldCheck, c: T.dep },
            { id: "rel", txt: "Prendre des nouvelles", icon: Phone, c: T.rel },
            { id: "sommeil", txt: "Noter ma nuit", icon: Moon, c: T.sommeil },
            { id: "vehicule", txt: "Entretien véhicule", icon: Car, c: T.vehicule },
          ].filter((q) => active.includes(q.id)).map((q) => {
            const Icon = q.icon;
            return (
              <button key={q.id} onClick={() => go(q.id)} style={{
                background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16,
                padding: 14, color: T.text, cursor: "pointer", textAlign: "left",
                display: "flex", flexDirection: "column", gap: 8, fontSize: 13, fontWeight: 600,
              }}>
                <Icon size={20} color={q.c} />
                {q.txt}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Bilan des 7 derniers jours">
        <Card>
          {[
            { id: "fin", label: "Dépenses", value: eur(dep7), c: T.fin },
            { id: "sport", label: "Séances de sport", value: `${seances7} / ${sport.weeklyTarget} visées`, c: T.sport },
            { id: "hab", label: "Habitudes tenues", value: hab.list.length ? `${habAvg}%` : "—", c: T.hab },
            { id: "goal", label: "Apprentissage", value: `${learn7} min`, c: T.goal },
            { id: "book", label: "Lecture", value: `${pages7} pages`, c: T.book },
            { id: "dep", label: "Consommations", value: dep.items.length ? `${conso7}` : "—", c: T.dep },
            { id: "maison", label: "Tâches maison faites", value: `${maison7}`, c: T.maison },
            { id: "rel", label: "Contacts pris", value: `${rel7}`, c: T.rel },
            { id: "priere", label: "Prières", value: `${priere7} / 35`, c: T.priere },
            { id: "vehicule", label: "Entretiens véhicule", value: `${vehicule7}`, c: T.vehicule },
            { id: "sommeil", label: "Sommeil moyen", value: sleepAvg ? `${sleepAvg} h` : "—", c: T.sommeil },
            { id: "todo", label: "Tâches terminées", value: `${todo7}`, c: T.todo },
          ].filter((r) => active.includes(r.id)).map((r, i, arr) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", padding: "10px 0",
              borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : "none", fontSize: 14,
            }}>
              <span style={{ color: T.muted }}>{r.label}</span>
              <span style={{ fontWeight: 700, color: r.c, fontFamily: "'Space Grotesk',sans-serif" }}>{r.value}</span>
            </div>
          ))}
        </Card>
      </Section>
    </div>
  );
}

/* ============ EN-TÊTE MINI-APP ============ */
const MiniHeader = ({ title, color, sub }) => (
  <div style={{ marginBottom: 18 }}>
    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 24, fontWeight: 700, color }}>{title}</div>
    {sub && <div style={{ color: T.muted, fontSize: 13 }}>{sub}</div>}
  </div>
);

/* ============ FINANCES ============ */
function Finances({ data, set }) {
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [cat, setCat] = useState("Courses");
  const [type, setType] = useState("expense");
  const cats = ["Courses", "Logement", "Transport", "Loisirs", "Santé", "Autre"];
  const mk = monthKey();
  const monthTx = data.transactions.filter((t) => t.date.startsWith(mk));
  const dep = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const rev = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const budgetPct = Math.min(100, Math.round((dep / (data.budget || 1)) * 100));

  const byCat = cats.map((c) => ({
    cat: c,
    total: monthTx.filter((t) => t.type === "expense" && t.cat === c).reduce((s, t) => s + t.amount, 0),
  })).filter((x) => x.total > 0).sort((a, b) => b.total - a.total);
  const maxCat = Math.max(1, ...byCat.map((x) => x.total));

  const add = () => {
    const a = parseFloat(String(amount).replace(",", "."));
    if (!label.trim() || !a || a <= 0) return;
    set({ ...data, transactions: [{ id: uid(), label: label.trim(), amount: a, cat, type, date: today() }, ...data.transactions] });
    setLabel(""); setAmount("");
  };

  return (
    <div>
      <MiniHeader title="Finances" color={T.fin} sub="Ce mois-ci" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <Card><div style={{ color: T.muted, fontSize: 12 }}>Revenus</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
            <TrendingUp size={18} color={T.hab} />{eur(rev)}</div></Card>
        <Card><div style={{ color: T.muted, fontSize: 12 }}>Dépenses</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
            <TrendingDown size={18} color={T.sport} />{eur(dep)}</div></Card>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
          <span style={{ color: T.muted }}>Budget mensuel</span>
          <span style={{ fontWeight: 700 }}>{eur(dep)} / <input
            value={data.budget}
            onChange={(e) => set({ ...data, budget: parseFloat(e.target.value) || 0 })}
            style={{ width: 60, background: "transparent", border: "none", color: T.fin, fontWeight: 700, fontSize: 13, textAlign: "right", outline: "none", borderBottom: `1px dashed ${T.fin}` }}
          /> {curSym()}</span>
        </div>
        <div style={{ height: 10, background: T.surface2, borderRadius: 6, overflow: "hidden" }}>
          <div style={{ width: `${budgetPct}%`, height: "100%", background: budgetPct >= 90 ? T.sport : T.fin, borderRadius: 6, transition: "width .3s" }} />
        </div>
      </Card>

      <Section title="Ajouter">
        <Card>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            {[["expense", "Dépense"], ["income", "Revenu"]].map(([v, l]) => (
              <Btn key={v} small color={T.fin} ghost={type !== v} onClick={() => setType(v)}>{l}</Btn>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Input placeholder="Libellé (ex : courses Carrefour)" value={label} onChange={(e) => setLabel(e.target.value)} />
            <div style={{ display: "flex", gap: 8 }}>
              <Input placeholder={`Montant ${curSym()}`} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ flex: 1 }} />
              <select value={cat} onChange={(e) => setCat(e.target.value)} style={{
                background: T.surface2, color: T.text, border: `1px solid ${T.border}`,
                borderRadius: 12, padding: "0 10px", fontSize: 14, flex: 1,
              }}>{cats.map((c) => <option key={c}>{c}</option>)}</select>
            </div>
            <Btn color={T.fin} onClick={add}><Plus size={16} />Ajouter</Btn>
          </div>
        </Card>
      </Section>

      {byCat.length > 0 && (
        <Section title="Dépenses par catégorie">
          <Card>
            {byCat.map((x) => (
              <div key={x.cat} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                  <span>{x.cat}</span><span style={{ color: T.fin, fontWeight: 700 }}>{eur(x.total)}</span>
                </div>
                <div style={{ height: 6, background: T.surface2, borderRadius: 4 }}>
                  <div style={{ width: `${(x.total / maxCat) * 100}%`, height: "100%", background: T.fin, borderRadius: 4, opacity: 0.8 }} />
                </div>
              </div>
            ))}
          </Card>
        </Section>
      )}

      <Section title="Dernières opérations">
        <Card>
          {monthTx.length === 0 && <Empty text="Aucune opération ce mois-ci. Ajoute ta première !" />}
          {monthTx.slice(0, 12).map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${T.border}`, fontSize: 14 }}>
              <div>
                <div style={{ fontWeight: 600 }}>{t.label}</div>
                <div style={{ color: T.muted, fontSize: 12 }}>{t.cat} · {t.date.slice(8)}/{t.date.slice(5, 7)}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontWeight: 700, color: t.type === "income" ? T.hab : T.text, fontFamily: "'Space Grotesk',sans-serif" }}>
                  {t.type === "income" ? "+" : "−"}{eur(t.amount)}
                </span>
                <button onClick={() => set({ ...data, transactions: data.transactions.filter((x) => x.id !== t.id) })}
                  aria-label="Supprimer" style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </Card>
      </Section>
    </div>
  );
}

/* ============ SPORT ============ */
function Sport({ data, set }) {
  const [type, setType] = useState("Muscu");
  const [minutes, setMinutes] = useState("");
  const [kg, setKg] = useState("");
  const types = ["Muscu", "Course", "Vélo", "Natation", "Foot", "Yoga", "Autre"];
  const days7 = lastNDays(7);
  const week = data.sessions.filter((s) => days7.includes(s.date));

  const add = () => {
    const m = parseInt(minutes);
    if (!m || m <= 0) return;
    set({ ...data, sessions: [{ id: uid(), type, minutes: m, date: today() }, ...data.sessions] });
    setMinutes("");
  };

  const weights = [...(data.weights || [])].sort((a, b) => a.date.localeCompare(b.date));
  const lastW = weights[weights.length - 1];
  const prevW = weights[weights.length - 2];
  const delta = lastW && prevW ? +(lastW.kg - prevW.kg).toFixed(1) : null;

  const addWeight = () => {
    const w = parseFloat(String(kg).replace(",", "."));
    if (!w || w <= 0) return;
    const rest = (data.weights || []).filter((x) => x.date !== today());
    set({ ...data, weights: [...rest, { id: uid(), kg: w, date: today() }] });
    setKg("");
  };

  const spark = weights.slice(-12);
  const sparkPath = () => {
    if (spark.length < 2) return "";
    const min = Math.min(...spark.map((w) => w.kg));
    const max = Math.max(...spark.map((w) => w.kg));
    const range = max - min || 1;
    const W = 280, H = 60;
    return spark.map((w, i) => {
      const x = (i / (spark.length - 1)) * W;
      const y = H - ((w.kg - min) / range) * (H - 8) - 4;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(" ");
  };

  return (
    <div>
      <MiniHeader title="Sport & Santé" color={T.sport} sub="Cette semaine" />
      <Card style={{ marginBottom: 16, textAlign: "center" }}>
        <div style={{ fontSize: 40, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", color: T.sport }}>
          {week.length}<span style={{ fontSize: 18, color: T.muted }}> / {data.weeklyTarget}</span>
        </div>
        <div style={{ color: T.muted, fontSize: 13 }}>séances sur 7 jours · objectif :
          <input value={data.weeklyTarget} inputMode="numeric"
            onChange={(e) => set({ ...data, weeklyTarget: parseInt(e.target.value) || 1 })}
            style={{ width: 28, background: "transparent", border: "none", borderBottom: `1px dashed ${T.sport}`, color: T.sport, fontWeight: 700, textAlign: "center", outline: "none", fontSize: 13 }} />
        </div>
        <div style={{ display: "flex", gap: 4, justifyContent: "center", marginTop: 12 }}>
          {days7.map((d) => {
            const done = data.sessions.some((s) => s.date === d);
            return <div key={d} style={{ width: 26, height: 26, borderRadius: 8, background: done ? T.sport : T.surface2, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {done && <Check size={14} color="#12151F" strokeWidth={3} />}</div>;
          })}
        </div>
      </Card>

      <Section title="Ajouter une séance">
        <Card>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {types.map((t) => <Btn key={t} small color={T.sport} ghost={type !== t} onClick={() => setType(t)}>{t}</Btn>)}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Input placeholder="Durée (min)" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
            <Btn color={T.sport} onClick={add}><Plus size={16} />OK</Btn>
          </div>
        </Card>
      </Section>

      <Section title="Mon poids">
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <Scale size={22} color={T.sport} />
            {lastW ? (
              <div>
                <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 26, fontWeight: 700 }}>{lastW.kg} kg</span>
                {delta !== null && delta !== 0 && (
                  <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 700, color: delta < 0 ? T.rel : T.fin }}>
                    {delta > 0 ? "+" : ""}{delta} kg
                  </span>
                )}
                <div style={{ color: T.muted, fontSize: 12 }}>Dernière pesée : {lastW.date.slice(8)}/{lastW.date.slice(5, 7)}</div>
              </div>
            ) : (
              <span style={{ color: T.muted, fontSize: 14 }}>Aucune pesée enregistrée</span>
            )}
          </div>
          {spark.length >= 2 && (
            <svg width="100%" height="60" viewBox="0 0 280 60" preserveAspectRatio="none" style={{ marginBottom: 12 }}>
              <path d={sparkPath()} stroke={T.sport} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <Input placeholder="Poids du jour (kg)" inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value)} />
            <Btn color={T.sport} onClick={addWeight}><Plus size={16} />Noter</Btn>
          </div>
        </Card>
      </Section>

      <Section title="Historique">
        <Card>
          {data.sessions.length === 0 && <Empty text="Aucune séance. Ta première victoire t'attend 💪" />}
          {data.sessions.slice(0, 15).map((s) => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${T.border}`, fontSize: 14 }}>
              <div><span style={{ fontWeight: 600 }}>{s.type}</span>
                <span style={{ color: T.muted, fontSize: 12 }}> · {s.date.slice(8)}/{s.date.slice(5, 7)}</span></div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: T.sport, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}><Clock size={13} />{s.minutes} min</span>
                <button onClick={() => set({ ...data, sessions: data.sessions.filter((x) => x.id !== s.id) })}
                  aria-label="Supprimer" style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }}><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </Card>
      </Section>
    </div>
  );
}

/* ============ HABITUDES ============ */
function Habits({ data, set }) {
  const [name, setName] = useState("");
  const d = today();
  const days7 = lastNDays(7);
  const todayChecks = data.checks[d] || [];

  const add = () => {
    if (!name.trim()) return;
    set({ ...data, list: [...data.list, { id: uid(), name: name.trim() }] });
    setName("");
  };
  const toggle = (id, day) => {
    const cur = new Set(data.checks[day] || []);
    cur.has(id) ? cur.delete(id) : cur.add(id);
    set({ ...data, checks: { ...data.checks, [day]: [...cur] } });
  };
  const streak = (id) => {
    let s = 0;
    for (let i = 0; ; i++) {
      const dt = new Date(); dt.setDate(dt.getDate() - i);
      if ((data.checks[localDate(dt)] || []).includes(id)) s++;
      else if (i === 0) continue; // aujourd'hui pas encore fait ne casse pas la série
      else break;
    }
    return s;
  };

  return (
    <div>
      <MiniHeader title="Habitudes" color={T.hab} sub={`${todayChecks.length}/${data.list.length || 0} faites aujourd'hui`} />
      <Section title="Nouvelle habitude">
        <div style={{ display: "flex", gap: 8 }}>
          <Input placeholder="Ex : méditer 10 min" value={name} onChange={(e) => setName(e.target.value)} />
          <Btn color={T.hab} onClick={add}><Plus size={16} /></Btn>
        </div>
      </Section>

      <Section title="7 derniers jours">
        <Card>
          {data.list.length === 0 && <Empty text="Ajoute ta première habitude pour lancer une série 🔥" />}
          {data.list.map((h) => (
            <div key={h.id} style={{ padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{h.name}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: T.fin, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
                    <Flame size={14} />{streak(h.id)}j</span>
                  <button onClick={() => set({ ...data, list: data.list.filter((x) => x.id !== h.id) })}
                    aria-label="Supprimer" style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }}><Trash2 size={14} /></button>
                </div>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {days7.map((day) => {
                  const done = (data.checks[day] || []).includes(h.id);
                  return (
                    <button key={day} onClick={() => toggle(h.id, day)} aria-label={day} style={{
                      flex: 1, height: 30, borderRadius: 8, border: "none", cursor: "pointer",
                      background: done ? T.hab : T.surface2,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>{done && <Check size={14} color="#12151F" strokeWidth={3} />}</button>
                  );
                })}
              </div>
            </div>
          ))}
        </Card>
      </Section>
    </div>
  );
}

/* ============ OBJECTIFS / APPRENTISSAGE ============ */
function Goals({ data, set }) {
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [mins, setMins] = useState("");
  const days7 = lastNDays(7);
  const learn7 = data.sessions.filter((s) => days7.includes(s.date)).reduce((a, s) => a + s.minutes, 0);

  const addGoal = () => {
    if (!title.trim()) return;
    set({ ...data, goals: [...data.goals, { id: uid(), title: title.trim(), progress: 0 }] });
    setTitle("");
  };
  const bump = (id, delta) => {
    set({ ...data, goals: data.goals.map((g) => g.id === id ? { ...g, progress: Math.max(0, Math.min(100, g.progress + delta)) } : g) });
  };
  const addSession = () => {
    const m = parseInt(mins);
    if (!topic.trim() || !m || m <= 0) return;
    set({ ...data, sessions: [{ id: uid(), topic: topic.trim(), minutes: m, date: today() }, ...data.sessions] });
    setTopic(""); setMins("");
  };

  return (
    <div>
      <MiniHeader title="Objectifs & Apprentissage" color={T.goal} sub={`${learn7} min apprises sur 7 jours`} />

      <Section title="Mes objectifs">
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <Input placeholder="Ex : parler espagnol B1" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Btn color={T.goal} onClick={addGoal}><Plus size={16} /></Btn>
        </div>
        <Card>
          {data.goals.length === 0 && <Empty text="Définis un cap — même petit, c'est un début." />}
          {data.goals.map((g) => (
            <div key={g.id} style={{ padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 14 }}>
                <span style={{ fontWeight: 600 }}>{g.title}</span>
                <span style={{ color: T.goal, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>{g.progress}%</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => bump(g.id, -5)} aria-label="-5%" style={{ background: T.surface2, border: "none", borderRadius: 8, width: 28, height: 28, color: T.text, cursor: "pointer" }}><Minus size={14} /></button>
                <div style={{ flex: 1, height: 8, background: T.surface2, borderRadius: 4 }}>
                  <div style={{ width: `${g.progress}%`, height: "100%", background: T.goal, borderRadius: 4, transition: "width .3s" }} />
                </div>
                <button onClick={() => bump(g.id, 5)} aria-label="+5%" style={{ background: T.goal, border: "none", borderRadius: 8, width: 28, height: 28, color: "#12151F", cursor: "pointer" }}><Plus size={14} /></button>
                <button onClick={() => set({ ...data, goals: data.goals.filter((x) => x.id !== g.id) })}
                  aria-label="Supprimer" style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </Card>
      </Section>

      <Section title="Session d'apprentissage">
        <Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Input placeholder="Sujet (ex : espagnol, piano, SQL…)" value={topic} onChange={(e) => setTopic(e.target.value)} />
            <div style={{ display: "flex", gap: 8 }}>
              <Input placeholder="Minutes" inputMode="numeric" value={mins} onChange={(e) => setMins(e.target.value)} />
              <Btn color={T.goal} onClick={addSession}><Plus size={16} />OK</Btn>
            </div>
          </div>
        </Card>
      </Section>

      <Section title="Dernières sessions">
        <Card>
          {data.sessions.length === 0 && <Empty text="Aucune session enregistrée." />}
          {data.sessions.slice(0, 10).map((s) => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.border}`, fontSize: 14 }}>
              <span>{s.topic}<span style={{ color: T.muted, fontSize: 12 }}> · {s.date.slice(8)}/{s.date.slice(5, 7)}</span></span>
              <span style={{ color: T.goal, fontWeight: 700 }}>{s.minutes} min</span>
            </div>
          ))}
        </Card>
      </Section>
    </div>
  );
}

/* ============ LIVRES ============ */
function Books({ data, set }) {
  const [title, setTitle] = useState("");
  const [pages, setPages] = useState("");
  const [readPages, setReadPages] = useState({});

  const add = () => {
    const p = parseInt(pages);
    if (!title.trim() || !p || p <= 0) return;
    set({ ...data, books: [{ id: uid(), title: title.trim(), pages: p, currentPage: 0, status: "reading" }, ...data.books] });
    setTitle(""); setPages("");
  };
  const logPages = (b) => {
    const n = parseInt(readPages[b.id]);
    if (!n || n <= 0) return;
    const cur = Math.min(b.pages, b.currentPage + n);
    set({
      ...data,
      books: data.books.map((x) => x.id === b.id ? { ...x, currentPage: cur, status: cur >= b.pages ? "done" : "reading" } : x),
      logs: [{ id: uid(), bookId: b.id, pages: n, date: today() }, ...data.logs],
    });
    setReadPages({ ...readPages, [b.id]: "" });
  };
  const reading = data.books.filter((b) => b.status === "reading");
  const done = data.books.filter((b) => b.status === "done");
  const days7 = lastNDays(7);
  const pages7 = data.logs.filter((l) => days7.includes(l.date)).reduce((s, l) => s + l.pages, 0);

  const BookRow = (b) => {
    const pct = Math.round((b.currentPage / b.pages) * 100);
    return (
      <div key={b.id} style={{ padding: "12px 0", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}>
          <span style={{ fontWeight: 600 }}>{b.title}</span>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ color: T.book, fontWeight: 700 }}>{pct}%</span>
            <button onClick={() => set({ ...data, books: data.books.filter((x) => x.id !== b.id) })}
              aria-label="Supprimer" style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }}><Trash2 size={14} /></button>
          </div>
        </div>
        <div style={{ height: 8, background: T.surface2, borderRadius: 4, marginBottom: 8 }}>
          <div style={{ width: `${pct}%`, height: "100%", background: T.book, borderRadius: 4, transition: "width .3s" }} />
        </div>
        <div style={{ color: T.muted, fontSize: 12, marginBottom: 8 }}>Page {b.currentPage} / {b.pages}</div>
        {b.status === "reading" && (
          <div style={{ display: "flex", gap: 8 }}>
            <Input placeholder="Pages lues aujourd'hui" inputMode="numeric"
              value={readPages[b.id] || ""} onChange={(e) => setReadPages({ ...readPages, [b.id]: e.target.value })} />
            <Btn small color={T.book} onClick={() => logPages(b)}><Plus size={14} />Noter</Btn>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <MiniHeader title="Livres" color={T.book} sub={`${pages7} pages lues sur 7 jours`} />
      <Section title="Ajouter un livre">
        <Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Input placeholder="Titre du livre" value={title} onChange={(e) => setTitle(e.target.value)} />
            <div style={{ display: "flex", gap: 8 }}>
              <Input placeholder="Nb de pages" inputMode="numeric" value={pages} onChange={(e) => setPages(e.target.value)} />
              <Btn color={T.book} onClick={add}><Plus size={16} />OK</Btn>
            </div>
          </div>
        </Card>
      </Section>

      <Section title="En cours">
        <Card>
          {reading.length === 0 && <Empty text="Aucun livre en cours. Lequel t'appelle ? 📖" />}
          {reading.map(BookRow)}
        </Card>
      </Section>

      {done.length > 0 && (
        <Section title={`Terminés (${done.length})`}>
          <Card>
            {done.map((b) => (
              <div key={b.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.border}`, fontSize: 14 }}>
                <span>✅ {b.title}</span>
                <span style={{ color: T.muted, fontSize: 12 }}>{b.pages} p.</span>
              </div>
            ))}
          </Card>
        </Section>
      )}
    </div>
  );
}

/* ============ DÉPENDANCES ============ */
function Dependances({ data, set }) {
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const d = today();
  const todayCounts = data.counts[d] || {};

  const add = () => {
    if (!name.trim()) return;
    const c = parseFloat(String(cost).replace(",", "."));
    set({
      ...data,
      items: [...data.items, { id: uid(), name: name.trim(), costPerDay: c > 0 ? c : 0, createdAt: today() }],
    });
    setName(""); setCost("");
  };

  const setCount = (id, delta) => {
    const cur = Math.max(0, (todayCounts[id] || 0) + delta);
    set({ ...data, counts: { ...data.counts, [d]: { ...todayCounts, [id]: cur } } });
  };

  const joursSans = (item) => {
    let days = 0;
    for (let i = 0; i < 3650; i++) {
      const dt = new Date(); dt.setDate(dt.getDate() - i);
      const day = localDate(dt);
      if (day < item.createdAt) break;
      if (((data.counts[day] || {})[item.id] || 0) > 0) break;
      days++;
    }
    return days;
  };

  const bars7 = (item) =>
    lastNDays(7).map((day) => (data.counts[day] || {})[item.id] || 0);

  return (
    <div>
      <MiniHeader title="Dépendances" color={T.dep} sub="Chaque jour sans compte. Un écart n'efface pas le chemin parcouru." />

      <Section title="Suivre une dépendance">
        <Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Input placeholder="Ex : tabac, alcool, sucre, réseaux…" value={name} onChange={(e) => setName(e.target.value)} />
            <div style={{ display: "flex", gap: 8 }}>
              <Input placeholder={`Coût/jour ${curSym()} (optionnel)`} inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} />
              <Btn color={T.dep} onClick={add}><Plus size={16} />Suivre</Btn>
            </div>
          </div>
        </Card>
      </Section>

      <Section title="Mes suivis">
        <Card>
          {data.items.length === 0 && <Empty text="Ajoute ce que tu veux réduire ou arrêter. On avance un jour à la fois." />}
          {data.items.map((item) => {
            const js = joursSans(item);
            const count = todayCounts[item.id] || 0;
            const bars = bars7(item);
            const maxBar = Math.max(1, ...bars);
            const saved = item.costPerDay > 0 ? js * item.costPerDay : 0;
            return (
              <div key={item.id} style={{ padding: "12px 0", borderBottom: `1px solid ${T.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{item.name}</span>
                  <button onClick={() => set({ ...data, items: data.items.filter((x) => x.id !== item.id) })}
                    aria-label="Supprimer" style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }}><Trash2 size={14} /></button>
                </div>

                <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <div style={{ flex: 1, background: T.surface2, borderRadius: 12, padding: "10px 12px", textAlign: "center" }}>
                    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 26, fontWeight: 700, color: T.dep, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                      <Sparkles size={16} />{js}
                    </div>
                    <div style={{ color: T.muted, fontSize: 11 }}>jour{js > 1 ? "s" : ""} sans</div>
                  </div>
                  {saved > 0 && (
                    <div style={{ flex: 1, background: T.surface2, borderRadius: 12, padding: "10px 12px", textAlign: "center" }}>
                      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 26, fontWeight: 700, color: T.hab }}>{eur(saved)}</div>
                      <div style={{ color: T.muted, fontSize: 11 }}>économisés</div>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ color: T.muted, fontSize: 13 }}>Aujourd'hui</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button onClick={() => setCount(item.id, -1)} aria-label="-1" style={{ background: T.surface2, border: "none", borderRadius: 10, width: 34, height: 34, color: T.text, cursor: "pointer" }}><Minus size={16} /></button>
                    <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 700, minWidth: 26, textAlign: "center", color: count === 0 ? T.rel : T.text }}>{count}</span>
                    <button onClick={() => setCount(item.id, 1)} aria-label="+1" style={{ background: T.surface2, border: "none", borderRadius: 10, width: 34, height: 34, color: T.text, cursor: "pointer" }}><Plus size={16} /></button>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 34 }}>
                  {bars.map((v, i) => (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }}>
                      <div style={{
                        height: v === 0 ? 4 : `${(v / maxBar) * 100}%`,
                        background: v === 0 ? T.rel : T.dep,
                        borderRadius: 3, opacity: v === 0 ? 0.9 : 0.85, minHeight: 4,
                      }} />
                    </div>
                  ))}
                </div>
                <div style={{ color: T.muted, fontSize: 11, marginTop: 4, textAlign: "center" }}>7 derniers jours (vert = zéro)</div>
              </div>
            );
          })}
        </Card>
      </Section>
    </div>
  );
}

/* ============ MAISON ============ */
function Maison({ data, set }) {
  const [name, setName] = useState("");
  const [freq, setFreq] = useState("7");

  const add = () => {
    const f = parseInt(freq);
    if (!name.trim() || !f || f <= 0) return;
    set({ ...data, tasks: [...data.tasks, { id: uid(), name: name.trim(), freq: f, lastDone: null }] });
    setName(""); setFreq("7");
  };

  const markDone = (t) => {
    set({
      ...data,
      tasks: data.tasks.map((x) => x.id === t.id ? { ...x, lastDone: today() } : x),
      history: [{ id: uid(), taskId: t.id, date: today() }, ...data.history],
    });
  };

  const status = (t) => {
    if (!t.lastDone) return { txt: "Jamais fait", late: true, dueIn: 0 };
    const since = daysSince(t.lastDone);
    const dueIn = t.freq - since;
    if (dueIn <= 0) return { txt: dueIn === 0 ? "À faire aujourd'hui" : `En retard de ${-dueIn} j`, late: true, dueIn };
    return { txt: `Dans ${dueIn} j`, late: false, dueIn };
  };

  const sorted = [...data.tasks].sort((a, b) => status(a).dueIn - status(b).dueIn);

  return (
    <div>
      <MiniHeader title="Maison" color={T.maison} sub="Tâches récurrentes, sans charge mentale" />

      <Section title="Nouvelle tâche">
        <Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Input placeholder="Ex : ménage, arroser les plantes, draps…" value={name} onChange={(e) => setName(e.target.value)} />
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ color: T.muted, fontSize: 13, whiteSpace: "nowrap" }}>Tous les</span>
              <Input placeholder="7" inputMode="numeric" value={freq} onChange={(e) => setFreq(e.target.value)} style={{ width: 70 }} />
              <span style={{ color: T.muted, fontSize: 13 }}>jours</span>
              <Btn color={T.maison} onClick={add} style={{ marginLeft: "auto" }}><Plus size={16} /></Btn>
            </div>
          </div>
        </Card>
      </Section>

      <Section title="Mes tâches">
        <Card>
          {sorted.length === 0 && <Empty text="Ajoute tes tâches récurrentes — l'app te dira quand c'est dû." />}
          {sorted.map((t) => {
            const s = status(t);
            return (
              <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderBottom: `1px solid ${T.border}`, gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: s.late ? T.sport : T.muted, fontWeight: s.late ? 700 : 400 }}>
                    {s.txt} · tous les {t.freq} j
                  </div>
                </div>
                <Btn small color={T.maison} ghost={!s.late} onClick={() => markDone(t)}><Check size={14} />Fait</Btn>
                <button onClick={() => set({ ...data, tasks: data.tasks.filter((x) => x.id !== t.id) })}
                  aria-label="Supprimer" style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }}><Trash2 size={14} /></button>
              </div>
            );
          })}
        </Card>
      </Section>
    </div>
  );
}

/* ============ RELATIONS ============ */
function Relations({ data, set }) {
  const [name, setName] = useState("");
  const [freq, setFreq] = useState("14");

  const add = () => {
    const f = parseInt(freq);
    if (!name.trim() || !f || f <= 0) return;
    set({ ...data, contacts: [...data.contacts, { id: uid(), name: name.trim(), freq: f, lastContact: null }] });
    setName(""); setFreq("14");
  };

  const contacted = (c) => {
    set({
      ...data,
      contacts: data.contacts.map((x) => x.id === c.id ? { ...x, lastContact: today() } : x),
      history: [{ id: uid(), contactId: c.id, date: today() }, ...data.history],
    });
  };

  const status = (c) => {
    if (!c.lastContact) return { txt: "Jamais noté", late: true, dueIn: -999 };
    const since = daysSince(c.lastContact);
    const dueIn = c.freq - since;
    if (dueIn <= 0) return { txt: `Dernier contact il y a ${since} j`, late: true, dueIn };
    return { txt: `Contacté il y a ${since} j`, late: false, dueIn };
  };

  const sorted = [...data.contacts].sort((a, b) => status(a).dueIn - status(b).dueIn);
  const toRecontact = sorted.filter((c) => status(c).late).length;

  return (
    <div>
      <MiniHeader title="Relations" color={T.rel}
        sub={toRecontact > 0 ? `${toRecontact} personne${toRecontact > 1 ? "s" : ""} à recontacter` : "Tout le monde a eu de tes nouvelles ✨"} />

      <Section title="Ajouter une personne">
        <Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Input placeholder="Ex : Maman, Karim, Grand-père…" value={name} onChange={(e) => setName(e.target.value)} />
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ color: T.muted, fontSize: 13, whiteSpace: "nowrap" }}>Contact tous les</span>
              <Input placeholder="14" inputMode="numeric" value={freq} onChange={(e) => setFreq(e.target.value)} style={{ width: 70 }} />
              <span style={{ color: T.muted, fontSize: 13 }}>jours</span>
              <Btn color={T.rel} onClick={add} style={{ marginLeft: "auto" }}><Plus size={16} /></Btn>
            </div>
          </div>
        </Card>
      </Section>

      <Section title="Mes proches">
        <Card>
          {sorted.length === 0 && <Empty text="Ajoute les personnes que tu veux garder proches." />}
          {sorted.map((c) => {
            const s = status(c);
            return (
              <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderBottom: `1px solid ${T.border}`, gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: s.late ? T.sport : T.muted, fontWeight: s.late ? 700 : 400 }}>
                    {s.txt} · rythme : {c.freq} j
                  </div>
                </div>
                <Btn small color={T.rel} ghost={!s.late} onClick={() => contacted(c)}><Phone size={13} />Contacté</Btn>
                <button onClick={() => set({ ...data, contacts: data.contacts.filter((x) => x.id !== c.id) })}
                  aria-label="Supprimer" style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }}><Trash2 size={14} /></button>
              </div>
            );
          })}
        </Card>
      </Section>
    </div>
  );
}

/* ============ RÉGLAGES ============ */
function Reglages({ settings, set, resetAll }) {
  const [confirm, setConfirm] = useState(false);
  const active = settings.active && settings.active.length ? settings.active : ALL_IDS;

  const toggle = (id) => {
    if (active.includes(id)) {
      if (active.length === 1) return; // garder au moins un domaine
      set({ ...settings, active: active.filter((x) => x !== id) });
    } else {
      set({ ...settings, active: ALL_IDS.filter((x) => active.includes(x) || x === id) });
    }
  };

  const currencies = [
    ["EUR", "€ Euro"], ["DZD", "DA Dinar algérien"], ["USD", "$ Dollar US"], ["GBP", "£ Livre"],
    ["CHF", "CHF Franc suisse"], ["CAD", "$ Dollar canadien"], ["MAD", "MAD Dirham"], ["XOF", "CFA Franc CFA"],
  ];

  return (
    <div>
      <MiniHeader title="Réglages" color={T.muted} sub="Personnalise ton app" />

      <Section title="Profil">
        <Card>
          <div style={{ color: T.muted, fontSize: 13, marginBottom: 6 }}>Ton prénom (pour l'accueil)</div>
          <Input placeholder="Ex : Yassine" value={settings.name}
            onChange={(e) => set({ ...settings, name: e.target.value })} />
          <div style={{ color: T.muted, fontSize: 13, margin: "14px 0 6px" }}>Devise</div>
          <select value={settings.currency} onChange={(e) => set({ ...settings, currency: e.target.value })} style={{
            background: T.surface2, color: T.text, border: `1px solid ${T.border}`,
            borderRadius: 12, padding: "10px 12px", fontSize: 14, width: "100%",
          }}>
            {currencies.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Card>
      </Section>

      <Section title="Horaires de prière">
        <Card>
          <div style={{ color: T.muted, fontSize: 13, marginBottom: 6 }}>Ville</div>
          <select
            value={CITIES.some((c) => c.n === settings.prayerCity) ? settings.prayerCity : (settings.prayerCity ? "__manual__" : "")}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "__manual__") {
                set({ ...settings, prayerCity: "Coordonnées manuelles", prayerLat: settings.prayerLat || "", prayerLng: settings.prayerLng || "" });
              } else if (v === "") {
                set({ ...settings, prayerCity: "", prayerLat: null, prayerLng: null });
              } else {
                const c = CITIES.find((x) => x.n === v);
                set({ ...settings, prayerCity: c.n, prayerLat: c.lat, prayerLng: c.lng });
              }
            }}
            style={{
              background: T.surface2, color: T.text, border: `1px solid ${T.border}`,
              borderRadius: 12, padding: "10px 12px", fontSize: 14, width: "100%",
            }}>
            <option value="">— Choisir une ville —</option>
            {CITIES.map((c) => <option key={c.n} value={c.n}>{c.n}</option>)}
            <option value="__manual__">Autre (coordonnées manuelles)</option>
          </select>
          {!CITIES.some((c) => c.n === settings.prayerCity) && settings.prayerCity && (
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <Input placeholder="Latitude (ex : 36.75)" inputMode="decimal" value={settings.prayerLat ?? ""}
                onChange={(e) => set({ ...settings, prayerLat: e.target.value })} />
              <Input placeholder="Longitude (ex : 3.06)" inputMode="decimal" value={settings.prayerLng ?? ""}
                onChange={(e) => set({ ...settings, prayerLng: e.target.value })} />
            </div>
          )}
          <div style={{ color: T.muted, fontSize: 13, margin: "12px 0 6px" }}>Méthode de calcul</div>
          <select value={settings.prayerMethod || "19"} onChange={(e) => set({ ...settings, prayerMethod: e.target.value })} style={{
            background: T.surface2, color: T.text, border: `1px solid ${T.border}`,
            borderRadius: 12, padding: "10px 12px", fontSize: 14, width: "100%",
          }}>
            <option value="19">Algérie (Ministère des Affaires religieuses)</option>
            <option value="3">Ligue islamique mondiale (MWL)</option>
            <option value="5">Égypte (General Authority of Survey)</option>
            <option value="4">Umm Al-Qura (Makkah)</option>
            <option value="21">Maroc</option>
            <option value="2">ISNA (Amérique du Nord)</option>
            <option value="12">France (UOIF)</option>
          </select>
          <div style={{ color: T.muted, fontSize: 12, marginTop: 8 }}>
            Calcul astronomique local, mis à jour chaque jour — fonctionne même hors ligne. Si un écart de 1-3 min persiste avec ta mosquée, essaie une autre méthode.
          </div>
        </Card>
      </Section>

      <Section title="Domaines affichés">
        <Card>
          <div style={{ color: T.muted, fontSize: 13, marginBottom: 10 }}>
            Désactive ce que tu n'utilises pas : la boussole, le bilan et la navigation s'adaptent. Tes données sont conservées.
          </div>
          {DOMAINS.map((d) => {
            const on = active.includes(d.id);
            const Icon = d.icon;
            return (
              <button key={d.id} onClick={() => toggle(d.id)} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                width: "100%", background: "none", border: "none", cursor: "pointer",
                padding: "10px 0", borderBottom: `1px solid ${T.border}`, color: T.text,
              }}>
                <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 600, opacity: on ? 1 : 0.5 }}>
                  <Icon size={18} color={d.color} />{d.label}
                </span>
                <span style={{
                  width: 42, height: 24, borderRadius: 12, position: "relative",
                  background: on ? d.color : T.surface2, transition: "background .2s",
                }}>
                  <span style={{
                    position: "absolute", top: 3, left: on ? 21 : 3, width: 18, height: 18,
                    borderRadius: 9, background: "#12151F", transition: "left .2s",
                  }} />
                </span>
              </button>
            );
          })}
        </Card>
      </Section>

      <Section title="Zone sensible">
        <Card style={{ border: `1px solid ${T.sport}44` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: T.sport, fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
            <AlertTriangle size={16} />Réinitialiser l'application
          </div>
          <div style={{ color: T.muted, fontSize: 13, marginBottom: 12 }}>
            Supprime définitivement toutes tes données (transactions, séances, habitudes, livres…). Irréversible.
          </div>
          {!confirm ? (
            <Btn ghost color={T.sport} onClick={() => setConfirm(true)}>Tout effacer…</Btn>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <Btn color={T.sport} onClick={resetAll}>Oui, tout effacer</Btn>
              <Btn ghost color={T.muted} onClick={() => setConfirm(false)}>Annuler</Btn>
            </div>
          )}
        </Card>
      </Section>
    </div>
  );
}

/* ============ PRIÈRE ============ */
function Priere({ data, set, settings, go }) {
  const d = today();
  const days7 = lastNDays(7);
  const todayChecks = data.checks[d] || [];
  const times = getPrayerTimes(settings);
  const next = nextPrayer(times);

  const toggle = (p, day) => {
    const cur = new Set(data.checks[day] || []);
    cur.has(p) ? cur.delete(p) : cur.add(p);
    set({ ...data, checks: { ...data.checks, [day]: [...cur] } });
  };

  // Série de jours complets (5/5)
  const streak = () => {
    let s = 0;
    for (let i = 0; ; i++) {
      const dt = new Date(); dt.setDate(dt.getDate() - i);
      const c = (data.checks[localDate(dt)] || []).length;
      if (c === PRAYERS.length) s++;
      else if (i === 0) continue; // aujourd'hui incomplet ne casse pas la série
      else break;
      if (i > 3650) break;
    }
    return s;
  };

  return (
    <div>
      <MiniHeader title="Prière" color={T.priere} sub={`${todayChecks.length} / ${PRAYERS.length} aujourd'hui`} />

      {!times && (
        <Card style={{ marginBottom: 16, border: `1px solid ${T.priere}55` }}>
          <div style={{ fontSize: 14, marginBottom: 10 }}>
            🕌 Choisis ta ville pour afficher les <b>horaires exacts</b> de prière, calculés chaque jour automatiquement.
          </div>
          <Btn color={T.priere} small onClick={() => go("settings")}>Choisir ma ville dans Réglages</Btn>
        </Card>
      )}
      {times && next && (
        <Card style={{ marginBottom: 16, border: `1px solid ${T.priere}`, textAlign: "center" }}>
          <div style={{ color: T.muted, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase" }}>Prochaine prière</div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 30, fontWeight: 700, color: T.priere }}>
            {next} · {times[next]}
          </div>
          <div style={{ color: T.muted, fontSize: 12 }}>{settings.prayerCity || "Ma position"} · calcul quotidien automatique</div>
        </Card>
      )}
      {times && !next && (
        <Card style={{ marginBottom: 16, textAlign: "center" }}>
          <div style={{ fontSize: 14, color: T.muted }}>Toutes les prières du jour sont passées. Prochaine : <b style={{ color: T.priere }}>Fajr {times.Fajr}</b> demain.</div>
        </Card>
      )}

      <Card style={{ marginBottom: 16, textAlign: "center" }}>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 36, fontWeight: 700, color: T.priere, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Flame size={26} />{streak()}
        </div>
        <div style={{ color: T.muted, fontSize: 13 }}>jours complets d'affilée</div>
      </Card>

      <Section title="Aujourd'hui">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {PRAYERS.map((p) => {
            const done = todayChecks.includes(p);
            const isNext = !done && p === next;
            return (
              <button key={p} onClick={() => toggle(p, d)} style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%",
                background: done ? `${T.priere}22` : T.surface,
                border: isNext ? `2px solid ${T.priere}` : `1px solid ${done ? T.priere : T.border}`,
                borderRadius: 14, padding: "13px 14px", color: T.text, cursor: "pointer",
                fontSize: 15, fontWeight: 600,
              }}>
                <span style={{
                  width: 24, height: 24, borderRadius: 12, flexShrink: 0,
                  border: `2px solid ${done ? T.priere : T.muted}`,
                  background: done ? T.priere : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>{done && <Check size={15} color="#12151F" strokeWidth={3.5} />}</span>
                {p}
                {times && <span style={{ marginLeft: "auto", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, color: isNext ? T.priere : T.muted, fontSize: 14 }}>{times[p]}</span>}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="7 derniers jours">
        <Card>
          {PRAYERS.map((p) => (
            <div key={p} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
              <span style={{ width: 62, fontSize: 12, color: T.muted, flexShrink: 0 }}>{p}</span>
              <div style={{ display: "flex", gap: 4, flex: 1 }}>
                {days7.map((day) => {
                  const done = (data.checks[day] || []).includes(p);
                  return (
                    <button key={day} onClick={() => toggle(p, day)} aria-label={`${p} ${day}`} style={{
                      flex: 1, height: 24, borderRadius: 6, border: "none", cursor: "pointer",
                      background: done ? T.priere : T.surface2,
                    }} />
                  );
                })}
              </div>
            </div>
          ))}
          <div style={{ color: T.muted, fontSize: 11, marginTop: 6, textAlign: "center" }}>
            Tape une case pour corriger un jour passé
          </div>
        </Card>
      </Section>
    </div>
  );
}

/* ============ VÉHICULE ============ */
function Vehicule({ data, set }) {
  const [name, setName] = useState("");
  const [freq, setFreq] = useState("180");

  const add = () => {
    const f = parseInt(freq);
    if (!name.trim() || !f || f <= 0) return;
    set({ ...data, tasks: [...data.tasks, { id: uid(), name: name.trim(), freq: f, lastDone: null }] });
    setName(""); setFreq("180");
  };

  const markDone = (t) => {
    set({
      ...data,
      tasks: data.tasks.map((x) => x.id === t.id ? { ...x, lastDone: today() } : x),
      history: [{ id: uid(), taskId: t.id, date: today() }, ...data.history],
    });
  };

  const status = (t) => {
    if (!t.lastDone) return { txt: "Jamais fait", late: true, dueIn: 0 };
    const since = daysSince(t.lastDone);
    const dueIn = t.freq - since;
    if (dueIn <= 0) return { txt: dueIn === 0 ? "À faire maintenant" : `En retard de ${-dueIn} j`, late: true, dueIn };
    if (dueIn <= 14) return { txt: `Bientôt : dans ${dueIn} j`, late: true, dueIn };
    return { txt: `Dans ${dueIn} j`, late: false, dueIn };
  };

  const sorted = [...data.tasks].sort((a, b) => status(a).dueIn - status(b).dueIn);

  return (
    <div>
      <MiniHeader title="Véhicule" color={T.vehicule} sub="Entretiens et échéances, sans surprise" />

      <Section title="Nouvel entretien">
        <Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Input placeholder="Ex : vidange, assurance, contrôle technique…" value={name} onChange={(e) => setName(e.target.value)} />
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ color: T.muted, fontSize: 13, whiteSpace: "nowrap" }}>Tous les</span>
              <Input placeholder="180" inputMode="numeric" value={freq} onChange={(e) => setFreq(e.target.value)} style={{ width: 70 }} />
              <span style={{ color: T.muted, fontSize: 13 }}>jours</span>
              <Btn color={T.vehicule} onClick={add} style={{ marginLeft: "auto" }}><Plus size={16} /></Btn>
            </div>
            <div style={{ color: T.muted, fontSize: 12 }}>
              Repères : vidange ≈ 180 j · assurance ≈ 365 j · contrôle technique ≈ 730 j · pneus ≈ 30 j (pression)
            </div>
          </div>
        </Card>
      </Section>

      <Section title="Mes entretiens">
        <Card>
          {sorted.length === 0 && <Empty text="Ajoute tes entretiens — l'app te préviendra à l'approche de l'échéance." />}
          {sorted.map((t) => {
            const s = status(t);
            return (
              <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderBottom: `1px solid ${T.border}`, gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: s.late ? T.sport : T.muted, fontWeight: s.late ? 700 : 400 }}>
                    {s.txt} · cycle {t.freq} j
                  </div>
                </div>
                <Btn small color={T.vehicule} ghost={!s.late} onClick={() => markDone(t)}><Check size={14} />Fait</Btn>
                <button onClick={() => set({ ...data, tasks: data.tasks.filter((x) => x.id !== t.id) })}
                  aria-label="Supprimer" style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }}><Trash2 size={14} /></button>
              </div>
            );
          })}
        </Card>
      </Section>
    </div>
  );
}

/* ============ SOMMEIL ============ */
function Sommeil({ data, set }) {
  const [hours, setHours] = useState("");
  const [quality, setQuality] = useState(3);
  const d = today();
  const days7 = lastNDays(7);
  const todayLog = data.logs[d];

  const save = () => {
    const h = parseFloat(String(hours).replace(",", "."));
    if (!h || h <= 0 || h > 24) return;
    set({ ...data, logs: { ...data.logs, [d]: { hours: h, quality } } });
    setHours("");
  };

  const week = days7.map((day) => data.logs[day]);
  const logged = week.filter(Boolean);
  const avg = logged.length ? (logged.reduce((s, l) => s + l.hours, 0) / logged.length).toFixed(1) : null;
  const maxH = Math.max(data.target || 8, ...logged.map((l) => l.hours), 1);

  return (
    <div>
      <MiniHeader title="Sommeil" color={T.sommeil}
        sub={avg ? `Moyenne 7 jours : ${avg} h` : "Note tes nuits pour voir la tendance"} />

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, fontSize: 13 }}>
          <span style={{ color: T.muted }}>Objectif par nuit</span>
          <span style={{ fontWeight: 700, color: T.sommeil }}>
            <input value={data.target} inputMode="decimal"
              onChange={(e) => set({ ...data, target: parseFloat(e.target.value) || 8 })}
              style={{ width: 34, background: "transparent", border: "none", borderBottom: `1px dashed ${T.sommeil}`, color: T.sommeil, fontWeight: 700, textAlign: "center", outline: "none", fontSize: 13 }} /> h
          </span>
        </div>
        <div style={{ display: "flex", gap: 5, alignItems: "flex-end", height: 90, position: "relative" }}>
          <div style={{
            position: "absolute", left: 0, right: 0,
            bottom: `${((data.target || 8) / maxH) * 100}%`,
            borderTop: `1px dashed ${T.sommeil}88`,
          }} />
          {week.map((l, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%", alignItems: "center", gap: 3 }}>
              <div style={{
                width: "100%", borderRadius: 5,
                height: l ? `${(l.hours / maxH) * 100}%` : 3,
                background: l ? (l.hours >= (data.target || 8) ? T.sommeil : `${T.sommeil}77`) : T.surface2,
                minHeight: 3,
              }} />
              <span style={{ fontSize: 10, color: T.muted }}>{l ? l.hours : "·"}</span>
            </div>
          ))}
        </div>
      </Card>

      <Section title={todayLog ? "Nuit d'hier (modifiable)" : "Noter ma nuit"}>
        <Card>
          {todayLog && (
            <div style={{ color: T.muted, fontSize: 13, marginBottom: 10 }}>
              Enregistré : <span style={{ color: T.sommeil, fontWeight: 700 }}>{todayLog.hours} h</span> · qualité {todayLog.quality}/5
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Input placeholder="Heures dormies (ex : 7.5)" inputMode="decimal" value={hours} onChange={(e) => setHours(e.target.value)} />
            <div>
              <div style={{ color: T.muted, fontSize: 13, marginBottom: 6 }}>Qualité</div>
              <div style={{ display: "flex", gap: 6 }}>
                {[1, 2, 3, 4, 5].map((q) => (
                  <button key={q} onClick={() => setQuality(q)} aria-label={`Qualité ${q}`} style={{
                    flex: 1, padding: "9px 0", borderRadius: 10, cursor: "pointer",
                    background: quality >= q ? T.sommeil : T.surface2,
                    border: "none", color: quality >= q ? "#12151F" : T.muted, fontWeight: 700,
                  }}>{q}</button>
                ))}
              </div>
            </div>
            <Btn color={T.sommeil} onClick={save}><Moon size={15} />Enregistrer</Btn>
          </div>
        </Card>
      </Section>
    </div>
  );
}

/* ============ TO-DO ============ */
function Todo({ data, set }) {
  const [title, setTitle] = useState("");
  const [important, setImportant] = useState(false);
  const d = today();

  const add = () => {
    if (!title.trim()) return;
    set({ ...data, tasks: [{ id: uid(), title: title.trim(), important, done: false, doneDate: null, createdAt: d }, ...data.tasks] });
    setTitle(""); setImportant(false);
  };

  const toggle = (id) => {
    set({
      ...data,
      tasks: data.tasks.map((t) => t.id === id ? { ...t, done: !t.done, doneDate: !t.done ? d : null } : t),
    });
  };

  const toggleStar = (id) => {
    set({ ...data, tasks: data.tasks.map((t) => t.id === id ? { ...t, important: !t.important } : t) });
  };

  const remove = (id) => set({ ...data, tasks: data.tasks.filter((t) => t.id !== id) });

  const open = data.tasks.filter((t) => !t.done)
    .sort((a, b) => (b.important ? 1 : 0) - (a.important ? 1 : 0));
  const done = data.tasks.filter((t) => t.done)
    .sort((a, b) => (b.doneDate || "").localeCompare(a.doneDate || ""))
    .slice(0, 15);

  return (
    <div>
      <MiniHeader title="To-do" color={T.todo}
        sub={open.length ? `${open.length} tâche${open.length > 1 ? "s" : ""} en attente` : "Tout est fait ✨"} />

      <Section title="Nouvelle tâche">
        <Card>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Input placeholder="Ex : appeler la banque" value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") add(); }} />
            <button onClick={() => setImportant(!important)} aria-label="Important" style={{
              background: important ? `${T.fin}22` : T.surface2, border: `1px solid ${important ? T.fin : T.border}`,
              borderRadius: 12, width: 42, height: 42, cursor: "pointer", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Star size={18} color={T.fin} fill={important ? T.fin : "none"} />
            </button>
            <Btn color={T.todo} onClick={add} style={{ flexShrink: 0 }}><Plus size={16} /></Btn>
          </div>
        </Card>
      </Section>

      <Section title="À faire">
        <Card>
          {open.length === 0 && <Empty text="Rien en attente. Profite ou ajoute la prochaine étape !" />}
          {open.map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
              <button onClick={() => toggle(t.id)} aria-label="Terminer" style={{
                width: 24, height: 24, borderRadius: 12, flexShrink: 0, cursor: "pointer",
                border: `2px solid ${T.muted}`, background: "transparent",
              }} />
              <span style={{ flex: 1, fontSize: 15 }}>{t.title}</span>
              <button onClick={() => toggleStar(t.id)} aria-label="Important" style={{ background: "none", border: "none", cursor: "pointer" }}>
                <Star size={16} color={T.fin} fill={t.important ? T.fin : "none"} />
              </button>
              <button onClick={() => remove(t.id)} aria-label="Supprimer" style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }}>
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </Card>
      </Section>

      {done.length > 0 && (
        <Section title="Terminées">
          <Card>
            {done.map((t) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: `1px solid ${T.border}` }}>
                <span style={{
                  width: 22, height: 22, borderRadius: 11, flexShrink: 0,
                  background: T.todo, display: "flex", alignItems: "center", justifyContent: "center",
                }}><Check size={13} color="#12151F" strokeWidth={3.5} /></span>
                <span style={{ flex: 1, fontSize: 14, textDecoration: "line-through", opacity: 0.5 }}>{t.title}</span>
                <button onClick={() => toggle(t.id)} aria-label="Restaurer" style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }}>
                  <RotateCcw size={14} />
                </button>
                <button onClick={() => remove(t.id)} aria-label="Supprimer" style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </Card>
        </Section>
      )}
    </div>
  );
}
