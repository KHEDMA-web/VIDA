"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Moon } from "lucide-react";
import { T } from "@/lib/theme";
import { today, lastNDays } from "@/lib/dates";
import { apiFetch } from "@/lib/api-client";
import { Card, Section, Btn, Input, MiniHeader } from "@/components/ui";

type SleepLog = { date: string; hours: number; quality: number };

export function SommeilView({ logs, target }: { logs: SleepLog[]; target: number }) {
  const router = useRouter();
  const [hours, setHours] = useState("");
  const [quality, setQuality] = useState(3);
  const [targetInput, setTargetInput] = useState(String(target));
  const d = today();
  const days7 = lastNDays(7);
  const byDate = new Map(logs.map((l) => [l.date, l]));
  const todayLog = byDate.get(d);

  const save = async () => {
    const h = parseFloat(String(hours).replace(",", "."));
    if (!h || h <= 0 || h > 24) return;
    await apiFetch("/api/sleep", { method: "POST", json: { date: d, hours: h, quality } });
    setHours("");
    router.refresh();
  };

  const saveTarget = async () => {
    const t = parseFloat(targetInput) || 8;
    await apiFetch("/api/settings", { method: "PATCH", json: { sleepTarget: t } });
    router.refresh();
  };

  const week = days7.map((day) => byDate.get(day));
  const logged = week.filter((l): l is SleepLog => Boolean(l));
  const avg = logged.length ? (logged.reduce((s, l) => s + l.hours, 0) / logged.length).toFixed(1) : null;
  const avgQuality = logged.length ? (logged.reduce((s, l) => s + l.quality, 0) / logged.length).toFixed(1) : null;
  const maxH = Math.max(target || 8, ...logged.map((l) => l.hours), 1);
  const best = logged.length ? logged.reduce((a, b) => (b.hours > a.hours ? b : a)) : null;
  const worst = logged.length ? logged.reduce((a, b) => (b.hours < a.hours ? b : a)) : null;

  return (
    <div>
      <MiniHeader title="Sommeil" color={T.sommeil}
        sub={avg ? `Moyenne 7 jours : ${avg} h` : "Note tes nuits pour voir la tendance"} />

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, fontSize: 13 }}>
          <span style={{ color: T.muted }}>Objectif par nuit</span>
          <span style={{ fontWeight: 700, color: T.sommeil }}>
            <input value={targetInput} inputMode="decimal"
              onChange={(e) => setTargetInput(e.target.value)}
              onBlur={saveTarget}
              style={{ width: 34, background: "transparent", border: "none", borderBottom: `1px dashed ${T.sommeil}`, color: T.sommeil, fontWeight: 700, textAlign: "center", outline: "none", fontSize: 13 }} /> h
          </span>
        </div>
        <div style={{ display: "flex", gap: 5, alignItems: "flex-end", height: 90, position: "relative" }}>
          <div style={{
            position: "absolute", left: 0, right: 0,
            bottom: `${((target || 8) / maxH) * 100}%`,
            borderTop: `1px dashed ${T.sommeil}88`,
          }} />
          {week.map((l, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%", alignItems: "center", gap: 3 }}>
              <div style={{
                width: "100%", borderRadius: 5,
                height: l ? `${(l.hours / maxH) * 100}%` : 3,
                background: l ? (l.hours >= (target || 8) ? T.sommeil : `${T.sommeil}77`) : T.surface2,
                minHeight: 3,
              }} />
              <span style={{ fontSize: 10, color: T.muted }}>{l ? l.hours : "·"}</span>
            </div>
          ))}
        </div>
      </Card>

      {logged.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
          <Card style={{ textAlign: "center", padding: 10 }}>
            <div style={{ color: T.muted, fontSize: 11 }}>Qualité moy.</div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 700, color: T.sommeil }}>{avgQuality}/5</div>
          </Card>
          <Card style={{ textAlign: "center", padding: 10 }}>
            <div style={{ color: T.muted, fontSize: 11 }}>Meilleure nuit</div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 700, color: T.hab }}>{best?.hours} h</div>
          </Card>
          <Card style={{ textAlign: "center", padding: 10 }}>
            <div style={{ color: T.muted, fontSize: 11 }}>Pire nuit</div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 700, color: T.sport }}>{worst?.hours} h</div>
          </Card>
        </div>
      )}

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
