"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Check } from "lucide-react";
import { T } from "@/lib/theme";
import { today, daysSince } from "@/lib/dates";
import { apiFetch } from "@/lib/api-client";
import { Card, Section, Btn, Input, Empty, MiniHeader } from "@/components/ui";

type Task = { id: string; name: string; freqDays: number; lastDone: string | null };
type TaskLog = { id: string; date: string; task: { name: string } };

function status(t: Task) {
  if (!t.lastDone) return { txt: "Jamais fait", late: true, dueIn: 0 };
  const since = daysSince(t.lastDone);
  const dueIn = t.freqDays - since;
  if (dueIn <= 0) return { txt: dueIn === 0 ? "À faire maintenant" : `En retard de ${-dueIn} j`, late: true, dueIn };
  if (dueIn <= 14) return { txt: `Bientôt : dans ${dueIn} j`, late: true, dueIn };
  return { txt: `Dans ${dueIn} j`, late: false, dueIn };
}

export function VehiculeView({ tasks, logs }: { tasks: Task[]; logs: TaskLog[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [freq, setFreq] = useState("180");

  const add = async () => {
    const f = parseInt(freq);
    if (!name.trim() || !f || f <= 0) return;
    await apiFetch("/api/vehicle", { method: "POST", json: { name: name.trim(), freqDays: f } });
    setName(""); setFreq("180");
    router.refresh();
  };

  const markDone = async (id: string) => {
    await apiFetch(`/api/vehicle/${id}/done`, { method: "POST", json: { date: today() } });
    router.refresh();
  };

  const remove = async (id: string) => {
    await apiFetch(`/api/vehicle/${id}`, { method: "DELETE" });
    router.refresh();
  };

  const sorted = [...tasks].sort((a, b) => status(a).dueIn - status(b).dueIn);

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
                    {s.txt} · cycle {t.freqDays} j
                  </div>
                </div>
                <Btn small color={T.vehicule} ghost={!s.late} onClick={() => markDone(t.id)}><Check size={14} />Fait</Btn>
                <button onClick={() => remove(t.id)} aria-label="Supprimer" style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }}><Trash2 size={14} /></button>
              </div>
            );
          })}
        </Card>
      </Section>

      {logs.length > 0 && (
        <Section title="Historique récent">
          <Card>
            {logs.map((l) => (
              <div key={l.id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${T.border}`, fontSize: 13 }}>
                <span>{l.task.name}</span>
                <span style={{ color: T.muted }}>{l.date.slice(8)}/{l.date.slice(5, 7)}</span>
              </div>
            ))}
          </Card>
        </Section>
      )}
    </div>
  );
}
