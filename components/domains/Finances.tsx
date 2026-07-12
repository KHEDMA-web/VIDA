"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { T } from "@/lib/theme";
import { today, monthKey, previousMonthKey } from "@/lib/dates";
import { curSym, formatAmount } from "@/lib/currency";
import { apiFetch } from "@/lib/api-client";
import { Card, Section, Btn, Input, Select, Empty, MiniHeader } from "@/components/ui";

type Transaction = { id: string; label: string; amount: number; cat: string; type: "expense" | "income"; date: string };
const CATS = ["Courses", "Logement", "Transport", "Loisirs", "Santé", "Autre"];

export function FinancesView({
  transactions, currency, monthlyBudget,
}: { transactions: Transaction[]; currency: string; monthlyBudget: number }) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [cat, setCat] = useState(CATS[0]);
  const [type, setType] = useState<"expense" | "income">("expense");
  const [budgetInput, setBudgetInput] = useState(String(monthlyBudget));

  const mk = monthKey();
  const monthTx = transactions.filter((t) => t.date.startsWith(mk));
  const dep = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const rev = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const budgetPct = Math.min(100, Math.round((dep / (monthlyBudget || 1)) * 100));

  const prevMk = previousMonthKey();
  const prevDep = transactions.filter((t) => t.date.startsWith(prevMk) && t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const depDeltaPct = prevDep > 0 ? Math.round(((dep - prevDep) / prevDep) * 100) : null;

  const byCat = CATS.map((c) => ({
    cat: c,
    total: monthTx.filter((t) => t.type === "expense" && t.cat === c).reduce((s, t) => s + t.amount, 0),
  })).filter((x) => x.total > 0).sort((a, b) => b.total - a.total);
  const maxCat = Math.max(1, ...byCat.map((x) => x.total));

  const add = async () => {
    const a = parseFloat(String(amount).replace(",", "."));
    if (!label.trim() || !a || a <= 0) return;
    await apiFetch("/api/finances/transactions", {
      method: "POST",
      json: { label: label.trim(), amount: a, cat, type, date: today() },
    });
    setLabel(""); setAmount("");
    router.refresh();
  };

  const remove = async (id: string) => {
    await apiFetch(`/api/finances/transactions/${id}`, { method: "DELETE" });
    router.refresh();
  };

  const saveBudget = async () => {
    const b = parseFloat(budgetInput) || 0;
    await apiFetch("/api/settings", { method: "PATCH", json: { monthlyBudget: b } });
    router.refresh();
  };

  return (
    <div>
      <MiniHeader title="Finances" color={T.fin} sub="Ce mois-ci" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <Card><div style={{ color: T.muted, fontSize: 12 }}>Revenus</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
            <TrendingUp size={18} color={T.hab} />{formatAmount(rev, currency)}</div></Card>
        <Card><div style={{ color: T.muted, fontSize: 12 }}>Dépenses</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
            <TrendingDown size={18} color={T.sport} />{formatAmount(dep, currency)}</div></Card>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
          <span style={{ color: T.muted }}>Budget mensuel</span>
          <span style={{ fontWeight: 700 }}>{formatAmount(dep, currency)} / <input
            value={budgetInput}
            onChange={(e) => setBudgetInput(e.target.value)}
            onBlur={saveBudget}
            style={{ width: 60, background: "transparent", border: "none", color: T.fin, fontWeight: 700, fontSize: 13, textAlign: "right", outline: "none", borderBottom: `1px dashed ${T.fin}` }}
          /> {curSym(currency)}</span>
        </div>
        <div style={{ height: 10, background: T.surface2, borderRadius: 6, overflow: "hidden" }}>
          <div style={{ width: `${budgetPct}%`, height: "100%", background: budgetPct >= 90 ? T.sport : T.fin, borderRadius: 6, transition: "width .3s" }} />
        </div>
        {depDeltaPct !== null && (
          <div style={{ marginTop: 8, fontSize: 12, color: T.muted }}>
            vs mois dernier ({formatAmount(prevDep, currency)}) :{" "}
            <span style={{ fontWeight: 700, color: depDeltaPct > 0 ? T.sport : T.hab }}>
              {depDeltaPct > 0 ? "+" : ""}{depDeltaPct}%
            </span>
          </div>
        )}
      </Card>

      <Section title="Ajouter">
        <Card>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            {([["expense", "Dépense"], ["income", "Revenu"]] as const).map(([v, l]) => (
              <Btn key={v} small color={T.fin} ghost={type !== v} onClick={() => setType(v)}>{l}</Btn>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Input placeholder="Libellé (ex : courses Carrefour)" value={label} onChange={(e) => setLabel(e.target.value)} />
            <div style={{ display: "flex", gap: 8 }}>
              <Input placeholder={`Montant ${curSym(currency)}`} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ flex: 1 }} />
              <Select value={cat} onChange={(e) => setCat(e.target.value)} style={{ flex: 1 }}>
                {CATS.map((c) => <option key={c}>{c}</option>)}
              </Select>
            </div>
            <Btn color={T.fin} onClick={add}><Plus size={16} />Ajouter</Btn>
          </div>
        </Card>
      </Section>

      {byCat.length > 0 && (
        <Section title="Dépenses par catégorie">
          <Card>
            {byCat.map((x) => (
              <div key={x.cat} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                  <span>{x.cat}</span><span style={{ color: T.fin, fontWeight: 700 }}>{formatAmount(x.total, currency)}</span>
                </div>
                <div style={{ height: 6, background: T.surface2, borderRadius: 4 }}>
                  <div style={{ width: `${(x.total / maxCat) * 100}%`, height: "100%", background: T.fin, borderRadius: 4, opacity: 0.8 }} />
                </div>
              </div>
            ))}
          </Card>
        </Section>
      )}

      <Section title="Dernières opérations">
        <Card>
          {monthTx.length === 0 && <Empty text="Aucune opération ce mois-ci. Ajoute ta première !" />}
          {monthTx.slice(0, 12).map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${T.border}`, fontSize: 14 }}>
              <div>
                <div style={{ fontWeight: 600 }}>{t.label}</div>
                <div style={{ color: T.muted, fontSize: 12 }}>{t.cat} · {t.date.slice(8)}/{t.date.slice(5, 7)}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontWeight: 700, color: t.type === "income" ? T.hab : T.text, fontFamily: "'Space Grotesk',sans-serif" }}>
                  {t.type === "income" ? "+" : "−"}{formatAmount(t.amount, currency)}
                </span>
                <button onClick={() => remove(t.id)} aria-label="Supprimer" style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </Card>
      </Section>
    </div>
  );
}
