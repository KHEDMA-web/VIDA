"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Wallet, HeartPulse, Target, BookOpen, ShieldCheck, Phone, Moon, Car,
  MoonStar, Check, Star,
} from "lucide-react";
import { T, DOMAINS, PRAYERS, Cog, type PrayerName, type DomainId } from "@/lib/theme";
import { getPrayerTimes, nextPrayer } from "@/lib/prayer-times";
import { formatAmount } from "@/lib/currency";
import { apiFetch } from "@/lib/api-client";
import { today } from "@/lib/dates";
import { Card, Section } from "./ui";
import { Boussole } from "./Boussole";
import { TrendChart } from "./TrendChart";
import type { DashboardData } from "@/lib/dashboard";
import type { TrendData } from "@/lib/trends";

const QUICK_ACCESS: { id: DomainId; txt: string; icon: typeof Wallet; c: string }[] = [
  { id: "fin", txt: "Noter une dépense", icon: Wallet, c: T.fin },
  { id: "sport", txt: "Ajouter une séance", icon: HeartPulse, c: T.sport },
  { id: "goal", txt: "Session d'apprentissage", icon: Target, c: T.goal },
  { id: "book", txt: "Pages lues", icon: BookOpen, c: T.book },
  { id: "dep", txt: "Ma conso du jour", icon: ShieldCheck, c: T.dep },
  { id: "rel", txt: "Prendre des nouvelles", icon: Phone, c: T.rel },
  { id: "sommeil", txt: "Noter ma nuit", icon: Moon, c: T.sommeil },
  { id: "vehicule", txt: "Entretien véhicule", icon: Car, c: T.vehicule },
];

export function HomeView({ data, trend }: { data: DashboardData; trend: TrendData }) {
  const router = useRouter();
  const { settings, active, fractions, habits, todayHabitChecks, todayPrayers, openTasks, bilan } = data;

  const times = useMemo(() => getPrayerTimes(settings), [settings]);
  const next = useMemo(() => nextPrayer(times), [times]);
  const dateStr = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  const togglePrayer = async (p: PrayerName) => {
    await apiFetch("/api/prayer/toggle", { method: "POST", json: { date: today(), prayer: p } });
    router.refresh();
  };
  const toggleHabit = async (habitId: string) => {
    await apiFetch(`/api/habits/${habitId}/check`, { method: "POST", json: { date: today() } });
    router.refresh();
  };
  const toggleTodo = async (id: string, done: boolean) => {
    await apiFetch(`/api/todo/${id}`, { method: "PATCH", json: { done: !done, doneDate: !done ? today() : null } });
    router.refresh();
  };

  return (
    <div>
      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 26, fontWeight: 700 }}>
            {settings.name ? `Salut ${settings.name} 👋` : "Ma vie, en un regard"}
          </div>
          <div style={{ color: T.muted, fontSize: 14, textTransform: "capitalize" }}>{dateStr}</div>
        </div>
        <Link href="/settings" aria-label="Réglages" style={{
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
          width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
          color: T.muted, flexShrink: 0,
        }}>
          <Cog size={20} />
        </Link>
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
            <Link href="/settings" style={{ color: T.priere, fontSize: 12, fontWeight: 700 }}>
              Définir ma ville →
            </Link>
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
          <Link href="/todo" style={{ color: T.todo, fontSize: 12, fontWeight: 700 }}>Tout voir →</Link>
        }>
          <Card>
            {openTasks.map((t) => (
              <button key={t.id} onClick={() => toggleTodo(t.id, t.done)} style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%",
                background: "none", border: "none", color: T.text, cursor: "pointer",
                padding: "10px 0", fontSize: 15, textAlign: "left",
                borderBottom: `1px solid ${T.border}`,
              }}>
                <span style={{ width: 24, height: 24, borderRadius: 12, flexShrink: 0, border: `2px solid ${T.muted}` }} />
                <span style={{ flex: 1 }}>{t.title}</span>
                {t.important && <Star size={15} color={T.fin} fill={T.fin} />}
              </button>
            ))}
          </Card>
        </Section>
      )}

      {active.includes("hab") && habits.length > 0 && (
        <Section title="Habitudes du jour">
          <Card>
            {habits.map((h) => {
              const done = todayHabitChecks.includes(h.id);
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
          {QUICK_ACCESS.filter((q) => active.includes(q.id)).map((q) => {
            const Icon = q.icon;
            return (
              <Link key={q.id} href={`/${q.id}`} style={{
                background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16,
                padding: 14, color: T.text, textAlign: "left",
                display: "flex", flexDirection: "column", gap: 8, fontSize: 13, fontWeight: 600,
              }}>
                <Icon size={20} color={q.c} />
                {q.txt}
              </Link>
            );
          })}
        </div>
      </Section>

      <Section title="Bilan des 7 derniers jours">
        <Card>
          {bilan.map((r, i) => (
            <div key={r.id} style={{
              display: "flex", justifyContent: "space-between", padding: "10px 0",
              borderBottom: i < bilan.length - 1 ? `1px solid ${T.border}` : "none", fontSize: 14,
            }}>
              <span style={{ color: T.muted }}>{r.label}</span>
              <span style={{ fontWeight: 700, color: T[r.id as keyof typeof T] as string, fontFamily: "'Space Grotesk',sans-serif" }}>
                {r.kind === "currency" ? formatAmount(r.value as number, settings.currency) : r.value}
              </span>
            </div>
          ))}
        </Card>
      </Section>

      <TrendChart data={trend} />
    </div>
  );
}
