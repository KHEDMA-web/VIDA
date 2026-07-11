"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Flame, Check } from "lucide-react";
import { T, PRAYERS, type PrayerName } from "@/lib/theme";
import { getPrayerTimes, nextPrayer } from "@/lib/prayer-times";
import { today, lastNDays, localDate } from "@/lib/dates";
import { apiFetch } from "@/lib/api-client";
import { Card, Section, Btn, MiniHeader } from "@/components/ui";
import Link from "next/link";

type Settings = { prayerCity: string | null; prayerLat: number | null; prayerLng: number | null; prayerMethod: string };
type PrayerCheck = { date: string; prayer: PrayerName };

export function PriereView({ settings, checks }: { settings: Settings; checks: PrayerCheck[] }) {
  const router = useRouter();
  const d = today();
  const days7 = lastNDays(7);
  const todayChecks = checks.filter((c) => c.date === d).map((c) => c.prayer);
  const times = useMemo(() => getPrayerTimes(settings), [settings]);
  const next = useMemo(() => nextPrayer(times), [times]);

  const toggle = async (p: PrayerName, day: string) => {
    await apiFetch("/api/prayer/toggle", { method: "POST", json: { date: day, prayer: p } });
    router.refresh();
  };

  const streak = useMemo(() => {
    const byDate = new Map<string, number>();
    for (const c of checks) byDate.set(c.date, (byDate.get(c.date) || 0) + 1);
    let s = 0;
    for (let i = 0; ; i++) {
      const dt = new Date();
      dt.setDate(dt.getDate() - i);
      const c = byDate.get(localDate(dt)) || 0;
      if (c === PRAYERS.length) s++;
      else if (i === 0) continue;
      else break;
      if (i > 3650) break;
    }
    return s;
  }, [checks]);

  return (
    <div>
      <MiniHeader title="Prière" color={T.priere} sub={`${todayChecks.length} / ${PRAYERS.length} aujourd'hui`} />

      {!times && (
        <Card style={{ marginBottom: 16, border: `1px solid ${T.priere}55` }}>
          <div style={{ fontSize: 14, marginBottom: 10 }}>
            🕌 Choisis ta ville pour afficher les <b>horaires exacts</b> de prière, calculés chaque jour automatiquement.
          </div>
          <Link href="/settings"><Btn color={T.priere} small>Choisir ma ville dans Réglages</Btn></Link>
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
          <Flame size={26} />{streak}
        </div>
        <div style={{ color: T.muted, fontSize: 13 }}>jours complets d&apos;affilée</div>
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
                  const done = checks.some((c) => c.date === day && c.prayer === p);
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
