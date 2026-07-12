"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Star, RotateCcw, Check } from "lucide-react";
import { T } from "@/lib/theme";
import { today, lastNDays } from "@/lib/dates";
import { apiFetch } from "@/lib/api-client";
import { Card, Section, Btn, Input, Empty, MiniHeader } from "@/components/ui";

type Task = { id: string; title: string; important: boolean; done: boolean; doneDate: string | null };

export function TodoView({ tasks }: { tasks: Task[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [important, setImportant] = useState(false);

  const add = async () => {
    if (!title.trim()) return;
    await apiFetch("/api/todo", { method: "POST", json: { title: title.trim(), important, createdAt: today() } });
    setTitle(""); setImportant(false);
    router.refresh();
  };

  const toggle = async (t: Task) => {
    await apiFetch(`/api/todo/${t.id}`, { method: "PATCH", json: { done: !t.done, doneDate: !t.done ? today() : null } });
    router.refresh();
  };

  const toggleStar = async (t: Task) => {
    await apiFetch(`/api/todo/${t.id}`, { method: "PATCH", json: { important: !t.important } });
    router.refresh();
  };

  const remove = async (id: string) => {
    await apiFetch(`/api/todo/${id}`, { method: "DELETE" });
    router.refresh();
  };

  const open = tasks.filter((t) => !t.done).sort((a, b) => (b.important ? 1 : 0) - (a.important ? 1 : 0));
  const done = tasks.filter((t) => t.done)
    .sort((a, b) => (b.doneDate || "").localeCompare(a.doneDate || ""))
    .slice(0, 15);
  const days7 = lastNDays(7);
  const done7 = tasks.filter((t) => t.done && t.doneDate && days7.includes(t.doneDate)).length;

  return (
    <div>
      <MiniHeader title="To-do" color={T.todo}
        sub={`${open.length ? `${open.length} tâche${open.length > 1 ? "s" : ""} en attente` : "Tout est fait ✨"} · ${done7} terminée${done7 > 1 ? "s" : ""} sur 7 jours`} />

      <Section title="Nouvelle tâche">
        <Card>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Input placeholder="Ex : appeler la banque" value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") add(); }} />
            <button onClick={() => setImportant(!important)} aria-label="Important" style={{
              background: important ? `${T.fin}22` : T.surface2, border: `1px solid ${important ? T.fin : T.border}`,
              borderRadius: 12, width: 42, height: 42, cursor: "pointer", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Star size={18} color={T.fin} fill={important ? T.fin : "none"} />
            </button>
            <Btn color={T.todo} onClick={add} style={{ flexShrink: 0 }}><Plus size={16} /></Btn>
          </div>
        </Card>
      </Section>

      <Section title="À faire">
        <Card>
          {open.length === 0 && <Empty text="Rien en attente. Profite ou ajoute la prochaine étape !" />}
          {open.map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
              <button onClick={() => toggle(t)} aria-label="Terminer" style={{
                width: 24, height: 24, borderRadius: 12, flexShrink: 0, cursor: "pointer",
                border: `2px solid ${T.muted}`, background: "transparent",
              }} />
              <span style={{ flex: 1, fontSize: 15 }}>{t.title}</span>
              <button onClick={() => toggleStar(t)} aria-label="Important" style={{ background: "none", border: "none", cursor: "pointer" }}>
                <Star size={16} color={T.fin} fill={t.important ? T.fin : "none"} />
              </button>
              <button onClick={() => remove(t.id)} aria-label="Supprimer" style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }}>
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </Card>
      </Section>

      {done.length > 0 && (
        <Section title="Terminées">
          <Card>
            {done.map((t) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: `1px solid ${T.border}` }}>
                <span style={{
                  width: 22, height: 22, borderRadius: 11, flexShrink: 0,
                  background: T.todo, display: "flex", alignItems: "center", justifyContent: "center",
                }}><Check size={13} color="#12151F" strokeWidth={3.5} /></span>
                <span style={{ flex: 1, fontSize: 14, textDecoration: "line-through", opacity: 0.5 }}>{t.title}</span>
                <button onClick={() => toggle(t)} aria-label="Restaurer" style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }}>
                  <RotateCcw size={14} />
                </button>
                <button onClick={() => remove(t.id)} aria-label="Supprimer" style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </Card>
        </Section>
      )}
    </div>
  );
}
