"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Minus, Trash2 } from "lucide-react";
import { T } from "@/lib/theme";
import { today, lastNDays } from "@/lib/dates";
import { apiFetch } from "@/lib/api-client";
import { Card, Section, Btn, Input, Empty, MiniHeader } from "@/components/ui";

type Goal = { id: string; title: string; progress: number };
type LearningSession = { id: string; topic: string; minutes: number; date: string };

export function GoalsView({ goals, sessions }: { goals: Goal[]; sessions: LearningSession[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [mins, setMins] = useState("");

  const days7 = lastNDays(7);
  const learn7 = sessions.filter((s) => days7.includes(s.date)).reduce((a, s) => a + s.minutes, 0);

  const addGoal = async () => {
    if (!title.trim()) return;
    await apiFetch("/api/goals", { method: "POST", json: { title: title.trim() } });
    setTitle("");
    router.refresh();
  };

  const bump = async (id: string, delta: number) => {
    await apiFetch(`/api/goals/${id}`, { method: "PATCH", json: { delta } });
    router.refresh();
  };

  const removeGoal = async (id: string) => {
    await apiFetch(`/api/goals/${id}`, { method: "DELETE" });
    router.refresh();
  };

  const addSession = async () => {
    const m = parseInt(mins);
    if (!topic.trim() || !m || m <= 0) return;
    await apiFetch("/api/goals/sessions", { method: "POST", json: { topic: topic.trim(), minutes: m, date: today() } });
    setTopic(""); setMins("");
    router.refresh();
  };

  return (
    <div>
      <MiniHeader title="Objectifs & Apprentissage" color={T.goal} sub={`${learn7} min apprises sur 7 jours`} />

      <Section title="Mes objectifs">
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <Input placeholder="Ex : parler espagnol B1" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Btn color={T.goal} onClick={addGoal}><Plus size={16} /></Btn>
        </div>
        <Card>
          {goals.length === 0 && <Empty text="Définis un cap — même petit, c'est un début." />}
          {goals.map((g) => (
            <div key={g.id} style={{ padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 14 }}>
                <span style={{ fontWeight: 600 }}>{g.title}</span>
                <span style={{ color: T.goal, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>{g.progress}%</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => bump(g.id, -5)} aria-label="-5%" style={{ background: T.surface2, border: "none", borderRadius: 8, width: 28, height: 28, color: T.text, cursor: "pointer" }}><Minus size={14} /></button>
                <div style={{ flex: 1, height: 8, background: T.surface2, borderRadius: 4 }}>
                  <div style={{ width: `${g.progress}%`, height: "100%", background: T.goal, borderRadius: 4, transition: "width .3s" }} />
                </div>
                <button onClick={() => bump(g.id, 5)} aria-label="+5%" style={{ background: T.goal, border: "none", borderRadius: 8, width: 28, height: 28, color: "#12151F", cursor: "pointer" }}><Plus size={14} /></button>
                <button onClick={() => removeGoal(g.id)} aria-label="Supprimer" style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </Card>
      </Section>

      <Section title="Session d'apprentissage">
        <Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Input placeholder="Sujet (ex : espagnol, piano, SQL…)" value={topic} onChange={(e) => setTopic(e.target.value)} />
            <div style={{ display: "flex", gap: 8 }}>
              <Input placeholder="Minutes" inputMode="numeric" value={mins} onChange={(e) => setMins(e.target.value)} />
              <Btn color={T.goal} onClick={addSession}><Plus size={16} />OK</Btn>
            </div>
          </div>
        </Card>
      </Section>

      <Section title="Dernières sessions">
        <Card>
          {sessions.length === 0 && <Empty text="Aucune session enregistrée." />}
          {sessions.slice(0, 10).map((s) => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.border}`, fontSize: 14 }}>
              <span>{s.topic}<span style={{ color: T.muted, fontSize: 12 }}> · {s.date.slice(8)}/{s.date.slice(5, 7)}</span></span>
              <span style={{ color: T.goal, fontWeight: 700 }}>{s.minutes} min</span>
            </div>
          ))}
        </Card>
      </Section>
    </div>
  );
}
