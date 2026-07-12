"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Scale, Clock, Dumbbell } from "lucide-react";
import { T } from "@/lib/theme";
import { today, lastNDays } from "@/lib/dates";
import { apiFetch } from "@/lib/api-client";
import { computeWeightProjection } from "@/lib/projection";
import { Card, Section, Btn, Input, Empty, MiniHeader } from "@/components/ui";

type Session = { id: string; type: string; minutes: number; date: string };
type WeightEntry = { id: string; kg: number; date: string };
type LiftEntry = { id: string; exercise: string; kg: number; date: string };
const TYPES = ["Muscu", "Course", "Vélo", "Natation", "Foot", "Yoga", "Autre"];

export function SportView({
  sessions, weights, lifts, weeklyTarget, weightGoal,
}: { sessions: Session[]; weights: WeightEntry[]; lifts: LiftEntry[]; weeklyTarget: number; weightGoal: number | null }) {
  const router = useRouter();
  const [type, setType] = useState(TYPES[0]);
  const [minutes, setMinutes] = useState("");
  const [kg, setKg] = useState("");
  const [target, setTarget] = useState(String(weeklyTarget));
  const [goalInput, setGoalInput] = useState(weightGoal != null ? String(weightGoal) : "");
  const [exercise, setExercise] = useState("");
  const [liftKg, setLiftKg] = useState("");

  const days7 = lastNDays(7);
  const week = sessions.filter((s) => days7.includes(s.date));

  const add = async () => {
    const m = parseInt(minutes);
    if (!m || m <= 0) return;
    await apiFetch("/api/sport/sessions", { method: "POST", json: { type, minutes: m, date: today() } });
    setMinutes("");
    router.refresh();
  };

  const remove = async (id: string) => {
    await apiFetch(`/api/sport/sessions/${id}`, { method: "DELETE" });
    router.refresh();
  };

  const saveTarget = async () => {
    const t = parseInt(target) || 1;
    await apiFetch("/api/settings", { method: "PATCH", json: { weeklyTarget: t } });
    router.refresh();
  };

  const saveGoal = async () => {
    const g = parseFloat(goalInput.replace(",", "."));
    await apiFetch("/api/settings", { method: "PATCH", json: { weightGoal: g || null } });
    router.refresh();
  };

  const sortedWeights = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  const lastW = sortedWeights[sortedWeights.length - 1];
  const prevW = sortedWeights[sortedWeights.length - 2];
  const delta = lastW && prevW ? +(lastW.kg - prevW.kg).toFixed(1) : null;

  const addWeight = async () => {
    const w = parseFloat(String(kg).replace(",", "."));
    if (!w || w <= 0) return;
    await apiFetch("/api/sport/weights", { method: "POST", json: { kg: w, date: today() } });
    setKg("");
    router.refresh();
  };

  const addLift = async () => {
    const w = parseFloat(String(liftKg).replace(",", "."));
    if (!exercise.trim() || !w || w <= 0) return;
    await apiFetch("/api/sport/lifts", { method: "POST", json: { exercise: exercise.trim(), kg: w, date: today() } });
    setLiftKg("");
    router.refresh();
  };

  const removeLift = async (id: string) => {
    await apiFetch(`/api/sport/lifts/${id}`, { method: "DELETE" });
    router.refresh();
  };

  const projection = computeWeightProjection(sortedWeights, weightGoal);

  const spark = sortedWeights.slice(-12);
  const W = 280, H = 60;
  const allForScale = [...spark.map((w) => w.kg), ...(weightGoal ? [weightGoal] : [])];
  const scaleMin = Math.min(...allForScale);
  const scaleMax = Math.max(...allForScale);
  const scaleRange = scaleMax - scaleMin || 1;
  const yFor = (v: number) => H - ((v - scaleMin) / scaleRange) * (H - 8) - 4;
  const sparkPath = () => {
    if (spark.length < 2) return "";
    return spark.map((w, i) => {
      const x = (i / (spark.length - 1)) * W;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${yFor(w.kg).toFixed(1)}`;
    }).join(" ");
  };
  const projectionPath = () => {
    if (spark.length < 2 || !projection || projection.daysToGoal == null || !weightGoal) return "";
    const lastX = W;
    const lastY = yFor(spark[spark.length - 1].kg);
    const goalY = yFor(weightGoal);
    return `M ${lastX} ${lastY.toFixed(1)} L ${(lastX + 24).toFixed(1)} ${goalY.toFixed(1)}`;
  };

  const liftsByExo = lifts.reduce<Record<string, LiftEntry[]>>((acc, l) => {
    (acc[l.exercise] ||= []).push(l);
    return acc;
  }, {});
  const liftRows = Object.entries(liftsByExo)
    .map(([exo, hist]) => {
      const sorted = [...hist].sort((a, b) => a.date.localeCompare(b.date));
      const first = sorted[0], last = sorted[sorted.length - 1];
      return { exo, n: sorted.length, first: first.kg, last: last.kg, delta: +(last.kg - first.kg).toFixed(1), lastId: last.id };
    })
    .sort((a, b) => b.n - a.n)
    .slice(0, 10);

  return (
    <div>
      <MiniHeader title="Sport & Santé" color={T.sport} sub="Cette semaine" />
      <Card style={{ marginBottom: 16, textAlign: "center" }}>
        <div style={{ fontSize: 40, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", color: T.sport }}>
          {week.length}<span style={{ fontSize: 18, color: T.muted }}> / <input
            value={target} inputMode="numeric"
            onChange={(e) => setTarget(e.target.value)}
            onBlur={saveTarget}
            style={{ width: 28, background: "transparent", border: "none", borderBottom: `1px dashed ${T.sport}`, color: T.sport, fontWeight: 700, textAlign: "center", outline: "none", fontSize: 18 }} /></span>
        </div>
        <div style={{ color: T.muted, fontSize: 13 }}>séances sur 7 jours</div>
        <div style={{ display: "flex", gap: 4, justifyContent: "center", marginTop: 12 }}>
          {days7.map((d) => {
            const done = sessions.some((s) => s.date === d);
            return <div key={d} style={{ width: 26, height: 26, borderRadius: 8, background: done ? T.sport : T.surface2, display: "flex", alignItems: "center", justifyContent: "center" }} />;
          })}
        </div>
      </Card>

      <Section title="Ajouter une séance">
        <Card>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {TYPES.map((t) => <Btn key={t} small color={T.sport} ghost={type !== t} onClick={() => setType(t)}>{t}</Btn>)}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Input placeholder="Durée (min)" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
            <Btn color={T.sport} onClick={add}><Plus size={16} />OK</Btn>
          </div>
        </Card>
      </Section>

      <Section title="Mon poids">
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <Scale size={22} color={T.sport} />
            {lastW ? (
              <div>
                <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 26, fontWeight: 700 }}>{lastW.kg} kg</span>
                {delta !== null && delta !== 0 && (
                  <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 700, color: delta < 0 ? T.rel : T.fin }}>
                    {delta > 0 ? "+" : ""}{delta} kg
                  </span>
                )}
                <div style={{ color: T.muted, fontSize: 12 }}>Dernière pesée : {lastW.date.slice(8)}/{lastW.date.slice(5, 7)}</div>
              </div>
            ) : (
              <span style={{ color: T.muted, fontSize: 14 }}>Aucune pesée enregistrée</span>
            )}
          </div>
          {spark.length >= 2 && (
            <svg width="100%" height="60" viewBox="0 0 280 60" preserveAspectRatio="none" style={{ marginBottom: 12, overflow: "visible" }}>
              <path d={sparkPath()} stroke={T.sport} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              {projectionPath() && (
                <path d={projectionPath()} stroke={T.vehicule} strokeWidth="2" strokeDasharray="4 4" fill="none" strokeLinecap="round" />
              )}
            </svg>
          )}
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <Input placeholder="Poids du jour (kg)" inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value)} />
            <Btn color={T.sport} onClick={addWeight}><Plus size={16} />Noter</Btn>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
            <span style={{ color: T.muted }}>Objectif de poids</span>
            <span style={{ fontWeight: 700, color: T.vehicule }}>
              <input value={goalInput} inputMode="decimal" placeholder="—"
                onChange={(e) => setGoalInput(e.target.value)}
                onBlur={saveGoal}
                style={{ width: 44, background: "transparent", border: "none", borderBottom: `1px dashed ${T.vehicule}`, color: T.vehicule, fontWeight: 700, textAlign: "center", outline: "none", fontSize: 13 }} /> kg
            </span>
          </div>
          {projection && projection.direction !== 0 && (
            <div style={{ color: T.muted, fontSize: 12, marginTop: 8, lineHeight: 1.5 }}>
              Rythme : <b style={{ color: T.text }}>{projection.slopePerMonth > 0 ? "+" : ""}{projection.slopePerMonth} kg/mois</b>
              {projection.daysToGoal != null && weightGoal && (
                <> · objectif {weightGoal} kg atteint dans <b style={{ color: T.text }}>~{projection.daysToGoal} j</b> à ce rythme</>
              )}
            </div>
          )}
        </Card>
      </Section>

      <Section title="Mes charges">
        <Card>
          {liftRows.length === 0 ? (
            <Empty text="Note tes charges par exercice pour voir ta progression." />
          ) : (
            liftRows.map((r) => (
              <div key={r.exo} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: `1px solid ${T.border}`, fontSize: 13 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.exo}</div>
                  <div style={{ color: T.muted, fontSize: 11 }}>{r.n} séance{r.n > 1 ? "s" : ""}</div>
                </div>
                <span style={{ color: T.muted, whiteSpace: "nowrap" }}>{r.first} → <b style={{ color: T.text }}>{r.last} kg</b></span>
                <span style={{ width: 56, textAlign: "right", fontWeight: 700, color: r.delta > 0 ? T.hab : r.delta < 0 ? T.sport : T.muted }}>
                  {r.delta > 0 ? "+" : ""}{r.delta} kg
                </span>
                <button onClick={() => removeLift(r.lastId)} aria-label="Supprimer la dernière entrée" style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }}><Trash2 size={14} /></button>
              </div>
            ))
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <Input placeholder="Exercice (ex : développé couché)" value={exercise} onChange={(e) => setExercise(e.target.value)} style={{ flex: 2 }} />
            <Input placeholder="kg" inputMode="decimal" value={liftKg} onChange={(e) => setLiftKg(e.target.value)} style={{ flex: 1 }} />
            <Btn color={T.sport} onClick={addLift}><Dumbbell size={14} /></Btn>
          </div>
        </Card>
      </Section>

      <Section title="Historique">
        <Card>
          {sessions.length === 0 && <Empty text="Aucune séance. Ta première victoire t'attend 💪" />}
          {sessions.slice(0, 15).map((s) => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${T.border}`, fontSize: 14 }}>
              <div><span style={{ fontWeight: 600 }}>{s.type}</span>
                <span style={{ color: T.muted, fontSize: 12 }}> · {s.date.slice(8)}/{s.date.slice(5, 7)}</span></div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: T.sport, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}><Clock size={13} />{s.minutes} min</span>
                <button onClick={() => remove(s.id)} aria-label="Supprimer" style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }}><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </Card>
      </Section>
    </div>
  );
}
