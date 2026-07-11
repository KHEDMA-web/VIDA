"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Minus, Trash2, Sparkles } from "lucide-react";
import { T } from "@/lib/theme";
import { today, lastNDays } from "@/lib/dates";
import { curSym, formatAmount } from "@/lib/currency";
import { apiFetch } from "@/lib/api-client";
import { Card, Section, Btn, Input, Empty, MiniHeader } from "@/components/ui";

type Count = { date: string; count: number };
type Item = { id: string; name: string; costPerDay: number; createdAt: string; counts: Count[] };

export function DependenciesView({ items, currency = "EUR" }: { items: Item[]; currency?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const d = today();

  const add = async () => {
    if (!name.trim()) return;
    await apiFetch("/api/dependencies", { method: "POST", json: { name: name.trim(), costPerDay: cost, createdAt: d } });
    setName(""); setCost("");
    router.refresh();
  };

  const remove = async (id: string) => {
    await apiFetch(`/api/dependencies/${id}`, { method: "DELETE" });
    router.refresh();
  };

  const setCount = async (id: string, delta: number) => {
    await apiFetch(`/api/dependencies/${id}/count`, { method: "POST", json: { date: d, delta } });
    router.refresh();
  };

  const joursSans = (item: Item) => {
    const byDate = new Map(item.counts.map((c) => [c.date, c.count]));
    let days = 0;
    for (let i = 0; i < 3650; i++) {
      const dt = new Date(); dt.setDate(dt.getDate() - i);
      const y = dt.getFullYear(), m = String(dt.getMonth() + 1).padStart(2, "0"), da = String(dt.getDate()).padStart(2, "0");
      const day = `${y}-${m}-${da}`;
      if (day < item.createdAt) break;
      if ((byDate.get(day) || 0) > 0) break;
      days++;
    }
    return days;
  };

  const bars7 = (item: Item) => {
    const byDate = new Map(item.counts.map((c) => [c.date, c.count]));
    return lastNDays(7).map((day) => byDate.get(day) || 0);
  };

  return (
    <div>
      <MiniHeader title="Dépendances" color={T.dep} sub="Chaque jour sans compte. Un écart n'efface pas le chemin parcouru." />

      <Section title="Suivre une dépendance">
        <Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Input placeholder="Ex : tabac, alcool, sucre, réseaux…" value={name} onChange={(e) => setName(e.target.value)} />
            <div style={{ display: "flex", gap: 8 }}>
              <Input placeholder={`Coût/jour ${curSym(currency)} (optionnel)`} inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} />
              <Btn color={T.dep} onClick={add}><Plus size={16} />Suivre</Btn>
            </div>
          </div>
        </Card>
      </Section>

      <Section title="Mes suivis">
        <Card>
          {items.length === 0 && <Empty text="Ajoute ce que tu veux réduire ou arrêter. On avance un jour à la fois." />}
          {items.map((item) => {
            const js = joursSans(item);
            const count = item.counts.find((c) => c.date === d)?.count || 0;
            const bars = bars7(item);
            const maxBar = Math.max(1, ...bars);
            const saved = item.costPerDay > 0 ? js * item.costPerDay : 0;
            return (
              <div key={item.id} style={{ padding: "12px 0", borderBottom: `1px solid ${T.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{item.name}</span>
                  <button onClick={() => remove(item.id)} aria-label="Supprimer" style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }}><Trash2 size={14} /></button>
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
                      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 26, fontWeight: 700, color: T.hab }}>{formatAmount(saved, currency)}</div>
                      <div style={{ color: T.muted, fontSize: 11 }}>économisés</div>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ color: T.muted, fontSize: 13 }}>Aujourd&apos;hui</span>
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
