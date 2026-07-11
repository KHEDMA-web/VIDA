"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Check } from "lucide-react";
import { T } from "@/lib/theme";
import { today, daysSince } from "@/lib/dates";
import { apiFetch } from "@/lib/api-client";
import { Card, Section, Btn, Input, Empty, MiniHeader } from "@/components/ui";

type Task = { id: string; name: string; freqDays: number; lastDone: string | null };

function status(t: Task) {
  if (!t.lastDone) return { txt: "Jamais fait", late: true, dueIn: 0 };
  const since = daysSince(t.lastDone);
  const dueIn = t.freqDays - since;
  if (dueIn <= 0) return { txt: dueIn === 0 ? "À faire aujourd'hui" : `En retard de ${-dueIn} j`, late: true, dueIn };
  return { txt: `Dans ${dueIn} j`, late: false, dueIn };
}

export function MaisonView({ tasks }: { tasks: Task[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [freq, setFreq] = useState("7");

  const add = async () => {
    const f = parseInt(freq);
    if (!name.trim() || !f || f <= 0) return;
    await apiFetch("/api/house", { method: "POST", json: { name: name.trim(), freqDays: f } });
    setName(""); setFreq("7");
    router.refresh();
  };

  const markDone = async (id: string) => {
    await apiFetch(`/api/house/${id}/done`, { method: "POST", json: { date: today() } });
    router.refresh();
  };

  const remove = async (id: string) => {
    await apiFetch(`/api/house/${id}`, { method: "DELETE" });
    router.refresh();
  };

  const sorted = [...tasks].sort((a, b) => status(a).dueIn - status(b).dueIn);

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
                    {s.txt} · tous les {t.freqDays} j
                  </div>
                </div>
                <Btn small color={T.maison} ghost={!s.late} onClick={() => markDone(t.id)}><Check size={14} />Fait</Btn>
                <button onClick={() => remove(t.id)} aria-label="Supprimer" style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }}><Trash2 size={14} /></button>
              </div>
            );
          })}
        </Card>
      </Section>
    </div>
  );
}
