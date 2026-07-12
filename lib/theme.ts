import {
  LayoutGrid, Wallet, HeartPulse, CheckCircle2, Target, BookOpen,
  ShieldCheck, Home as HomeIcon, Users, MoonStar, Car, Moon, ListTodo,
  Apple, Settings as Cog, type LucideIcon,
} from "lucide-react";

export const T = {
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
  nutrition: "#A9E34B",
} as const;

export type DomainId =
  | "fin" | "sport" | "hab" | "goal" | "book" | "dep"
  | "maison" | "rel" | "priere" | "vehicule" | "sommeil" | "todo" | "nutrition";

export const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;
export type PrayerName = (typeof PRAYERS)[number];

export const DOMAINS: { id: DomainId; label: string; color: string; icon: LucideIcon }[] = [
  { id: "fin", label: "Finances", color: T.fin, icon: Wallet },
  { id: "sport", label: "Sport", color: T.sport, icon: HeartPulse },
  { id: "nutrition", label: "Nutrition", color: T.nutrition, icon: Apple },
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

export const ALL_IDS: DomainId[] = DOMAINS.map((d) => d.id);
export { LayoutGrid, Cog };
