// Horaires de prière — calcul astronomique local (algorithme praytimes.org).
// Volontairement sans dépendance réseau : les artifacts/CSP bloquent les API externes,
// et un calcul local fonctionne hors ligne, instantanément, recalculé chaque jour.
import { PRAYERS, type PrayerName } from "./theme";

const DTR = Math.PI / 180;
const fixNum = (a: number, b: number) => {
  a -= b * Math.floor(a / b);
  return a < 0 ? a + b : a;
};
const fixHour = (a: number) => fixNum(a, 24);

export type PrayerTimes = Record<PrayerName, string>;

function computeTimes(
  dateObj: Date,
  lat: number,
  lng: number,
  tz: number,
  fajrAngle: number,
  ishaAngle: number,
  ishaInterval: number
): PrayerTimes {
  const julianDay = (y: number, m: number, d: number) => {
    if (m <= 2) { y -= 1; m += 12; }
    const A = Math.floor(y / 100);
    const B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
  };
  const jd = julianDay(dateObj.getFullYear(), dateObj.getMonth() + 1, dateObj.getDate()) - lng / (15 * 24);

  const sunPos = (t: number) => {
    const D = jd + t - 2451545.0;
    const g = fixNum(357.529 + 0.98560028 * D, 360);
    const q = fixNum(280.459 + 0.98564736 * D, 360);
    const L = fixNum(q + 1.915 * Math.sin(g * DTR) + 0.02 * Math.sin(2 * g * DTR), 360);
    const e = 23.439 - 0.00000036 * D;
    const RA = Math.atan2(Math.cos(e * DTR) * Math.sin(L * DTR), Math.cos(L * DTR)) / DTR / 15;
    return { decl: Math.asin(Math.sin(e * DTR) * Math.sin(L * DTR)) / DTR, eqt: q / 15 - fixHour(RA) };
  };

  const midDay = (t: number) => fixHour(12 - sunPos(t).eqt);
  const sunAngleTime = (angle: number, t: number, ccw: boolean) => {
    const { decl } = sunPos(t);
    const noon = midDay(t);
    const v = (-Math.sin(angle * DTR) - Math.sin(decl * DTR) * Math.sin(lat * DTR)) /
      (Math.cos(decl * DTR) * Math.cos(lat * DTR));
    if (v < -1 || v > 1) return NaN;
    return noon + (ccw ? -1 : 1) * (Math.acos(v) / DTR) / 15;
  };
  const asrTime = (t: number) => {
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

  const adjust = (x: number) => fixHour(x + tz - lng / 15);
  const fmt = (x: number) => {
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

export const METHOD_ANGLES: Record<string, { fajr: number; isha: number; interval?: number }> = {
  "19": { fajr: 18, isha: 17 },               // Algérie
  "3": { fajr: 18, isha: 17 },                // MWL
  "5": { fajr: 19.5, isha: 17.5 },            // Égypte
  "4": { fajr: 18.5, isha: 0, interval: 90 }, // Umm Al-Qura : Isha = Maghrib + 90 min
  "21": { fajr: 19, isha: 17 },               // Maroc
  "2": { fajr: 15, isha: 15 },                // ISNA
  "12": { fajr: 12, isha: 12 },               // France UOIF
};

export const PRAYER_METHODS: [string, string][] = [
  ["19", "Algérie (Ministère des Affaires religieuses)"],
  ["3", "Ligue islamique mondiale (MWL)"],
  ["5", "Égypte (General Authority of Survey)"],
  ["4", "Umm Al-Qura (Makkah)"],
  ["21", "Maroc"],
  ["2", "ISNA (Amérique du Nord)"],
  ["12", "France (UOIF)"],
];

export const CITIES: { n: string; lat: number; lng: number }[] = [
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

export function getPrayerTimes(settings: {
  prayerLat?: number | string | null;
  prayerLng?: number | string | null;
  prayerMethod?: string | null;
}): PrayerTimes | null {
  const lat = parseFloat(String(settings.prayerLat));
  const lng = parseFloat(String(settings.prayerLng));
  if (isNaN(lat) || isNaN(lng)) return null;
  const m = METHOD_ANGLES[settings.prayerMethod || "19"] || METHOD_ANGLES["19"];
  const now = new Date();
  const tz = -now.getTimezoneOffset() / 60;
  return computeTimes(now, lat, lng, tz, m.fajr, m.isha, m.interval || 0);
}

export function nextPrayer(times: PrayerTimes | null): PrayerName | null {
  if (!times) return null;
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  for (const p of PRAYERS) {
    const [h, m] = (times[p] || "0:0").split(":").map(Number);
    if (h * 60 + m > cur) return p;
  }
  return null;
}
