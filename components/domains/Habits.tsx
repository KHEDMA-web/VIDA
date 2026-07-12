"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Flame, Check } from "lucide-react";
import { T } from "@/lib/theme";
import { today, lastNDays, localDate } from "@/lib/dates";
import { apiFetch } from "@/lib/api-client";
import { Card, Section, Btn, Input, Empty, MiniHeader } from "@/components/ui";

type HabitCheck = { habitId: string; date: string };
type Habit = { id: string; name: string; checks: HabitCheck[] };

export function HabitsView({ habits }: { habits: Habit[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const d = today();
  const days7 = lastNDays(7);
  const todayCount = habits.filter((h) => h.checks.some((c) => c.date === d)).length;

  const add = async () => {
    if (!name.trim()) return;
    await apiFetch("/api/habits", { method: "POST", json: { name: name.trim() } });
    setName("");
    router.refresh();
  };

  const toggle = async (habitId: string, day: string) => {
    await apiFetch(`/api/habits/${habitId}/check`, { method: "POST", json: { date: day } });
    router.refresh();
  };

  const remove = async (id: string) => {
    await apiFetch(`/api/habits/${id}`, { method: "DELETE" });
    router.refresh();
  };

  const streak = (h: Habit) => {
    const dates = new Set(h.checks.map((c) => c.date));
    let s = 0;
    for (let i = 0; ; i++) {
      const dt = new Date();
      dt.setDate(dt.getDate() - i);
      if (dates.has(localDate(dt))) s++;
      else if (i === 0) continue;
      else break;
      if (i > 3650) break;
    }
    return s;
  };

  /** Plus longue série jamais réalisée (pas seulement la série en cours). */
  const bestStreak = (h: Habit) => {
    const sorted = [...new Set(h.checks.map((c) => c.date))].sort();
    let best = 0, cur = 0, prev: Date | null = null;
    for (const day of sorted) {
      const dt = new Date(day);
      cur = prev && (dt.getTime() - prev.getTime()) / 86400000 === 1 ? cur + 1 : 1;
      best = Math.max(best, cur);
      prev = dt;
    }
    return best;
  };

  return (
    <div>
      <MiniHeader title="Habitudes" color={T.hab} sub={`${todayCount}/${habits.length || 0} faites aujourd'hui`} />
      <Section title="Nouvelle habitude">
        <div style={{ display: "flex", gap: 8 }}>
          <Input placeholder="Ex : méditer 10 min" value={name} onChange={(e) => setName(e.target.value)} />
          <Btn color={T.hab} onClick={add}><Plus size={16} /></Btn>
        </div>
      </Section>

      <Section title="7 derniers jours">
        <Card>
          {habits.length === 0 && <Empty text="Ajoute ta première habitude pour lancer une série 🔥" />}
          {habits.map((h) => {
            const dates = new Set(h.checks.map((c) => c.date));
            return (
              <div key={h.id} style={{ padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{h.name}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ color: T.fin, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
                      <Flame size={14} />{streak(h)}j
                    </span>
                    <span style={{ color: T.muted, fontSize: 11 }}>record {bestStreak(h)}j</span>
                    <button onClick={() => remove(h.id)} aria-label="Supprimer" style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {days7.map((day) => {
                    const done = dates.has(day);
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
            );
          })}
        </Card>
      </Section>
    </div>
  );
}
