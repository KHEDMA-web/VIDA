"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Phone } from "lucide-react";
import { T } from "@/lib/theme";
import { today, daysSince } from "@/lib/dates";
import { apiFetch } from "@/lib/api-client";
import { Card, Section, Btn, Input, Empty, MiniHeader } from "@/components/ui";

type Contact = { id: string; name: string; freqDays: number; lastContact: string | null };

function status(c: Contact) {
  if (!c.lastContact) return { txt: "Jamais noté", late: true, dueIn: -999 };
  const since = daysSince(c.lastContact);
  const dueIn = c.freqDays - since;
  if (dueIn <= 0) return { txt: `Dernier contact il y a ${since} j`, late: true, dueIn };
  return { txt: `Contacté il y a ${since} j`, late: false, dueIn };
}

export function RelationsView({ contacts }: { contacts: Contact[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [freq, setFreq] = useState("14");

  const add = async () => {
    const f = parseInt(freq);
    if (!name.trim() || !f || f <= 0) return;
    await apiFetch("/api/relations", { method: "POST", json: { name: name.trim(), freqDays: f } });
    setName(""); setFreq("14");
    router.refresh();
  };

  const contacted = async (id: string) => {
    await apiFetch(`/api/relations/${id}/contacted`, { method: "POST", json: { date: today() } });
    router.refresh();
  };

  const remove = async (id: string) => {
    await apiFetch(`/api/relations/${id}`, { method: "DELETE" });
    router.refresh();
  };

  const sorted = [...contacts].sort((a, b) => status(a).dueIn - status(b).dueIn);
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
                    {s.txt} · rythme : {c.freqDays} j
                  </div>
                </div>
                <Btn small color={T.rel} ghost={!s.late} onClick={() => contacted(c.id)}><Phone size={13} />Contacté</Btn>
                <button onClick={() => remove(c.id)} aria-label="Supprimer" style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }}><Trash2 size={14} /></button>
              </div>
            );
          })}
        </Card>
      </Section>
    </div>
  );
}
