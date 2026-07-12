"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ShoppingCart, RotateCcw, Flame } from "lucide-react";
import { T } from "@/lib/theme";
import { today, lastNDays } from "@/lib/dates";
import { apiFetch } from "@/lib/api-client";
import { computeNutritionTargets } from "@/lib/nutrition";
import { Card, Section, Btn, Input, Select, Empty, MiniHeader } from "@/components/ui";
import Link from "next/link";

type Meal = { id: string; label: string; kcal: number; protein: number; date: string };
type ShoppingItem = { id: string; name: string; cat: string; checked: boolean; createdAt: string };
type Settings = {
  heightCm: number | null; age: number | null; sex: string | null;
  activityLevel: number; nutritionGoal: string;
};

const SHOP_CATS = ["Fruits & légumes", "Protéines", "Féculents", "Produits laitiers", "Épicerie", "Autre"];

export function NutritionView({
  meals, shopping, settings, lastWeightKg,
}: { meals: Meal[]; shopping: ShoppingItem[]; settings: Settings; lastWeightKg: number | null }) {
  const router = useRouter();
  const [view, setView] = useState<"repas" | "courses">("repas");
  const [label, setLabel] = useState("");
  const [kcal, setKcal] = useState("");
  const [protein, setProtein] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemCat, setItemCat] = useState(SHOP_CATS[0]);

  const d = today();
  const days7 = lastNDays(7);
  const todayMeals = meals.filter((m) => m.date === d);
  const kcalToday = todayMeals.reduce((s, m) => s + m.kcal, 0);
  const proteinToday = todayMeals.reduce((s, m) => s + m.protein, 0);

  const targets = computeNutritionTargets(settings, lastWeightKg);

  const addMeal = async () => {
    const k = parseInt(kcal);
    if (!label.trim() || !k || k <= 0) return;
    await apiFetch("/api/nutrition/meals", {
      method: "POST",
      json: { label: label.trim(), kcal: k, protein: parseInt(protein) || 0, date: d },
    });
    setLabel(""); setKcal(""); setProtein("");
    router.refresh();
  };

  const removeMeal = async (id: string) => {
    await apiFetch(`/api/nutrition/meals/${id}`, { method: "DELETE" });
    router.refresh();
  };

  const addItem = async () => {
    if (!itemName.trim()) return;
    await apiFetch("/api/nutrition/shopping", { method: "POST", json: { name: itemName.trim(), cat: itemCat } });
    setItemName("");
    router.refresh();
  };

  const toggleItem = async (item: ShoppingItem) => {
    await apiFetch(`/api/nutrition/shopping/${item.id}`, { method: "PATCH", json: { checked: !item.checked } });
    router.refresh();
  };

  const removeItem = async (id: string) => {
    await apiFetch(`/api/nutrition/shopping/${id}`, { method: "DELETE" });
    router.refresh();
  };

  const resetShopping = async () => {
    await apiFetch("/api/nutrition/shopping/reset", { method: "POST" });
    router.refresh();
  };

  const shopDone = shopping.filter((i) => i.checked).length;
  const byCat = SHOP_CATS.map((c) => ({ cat: c, items: shopping.filter((i) => i.cat === c) })).filter((c) => c.items.length > 0);

  const week7 = days7.map((day) => meals.filter((m) => m.date === day).reduce((s, m) => s + m.kcal, 0));

  return (
    <div>
      <MiniHeader title="Nutrition & Courses" color={T.nutrition} sub={`${kcalToday} kcal aujourd'hui`} />

      <div style={{ display: "flex", gap: 4, background: T.surface, borderRadius: 14, padding: 4, marginBottom: 16 }}>
        {([["repas", "🍽️ Repas"], ["courses", "🛒 Courses"]] as const).map(([id, l]) => (
          <button key={id} onClick={() => setView(id)} style={{
            flex: 1, padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer",
            fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, fontWeight: 700,
            background: view === id ? T.nutrition : "transparent",
            color: view === id ? "#12151F" : T.muted,
          }}>{l}</button>
        ))}
      </div>

      {view === "repas" ? (
        <>
          {targets ? (
            <Card style={{ marginBottom: 16 }}>
              <div style={{ color: T.muted, fontSize: 12, marginBottom: 10 }}>
                Cibles du jour · BMR {targets.bmr} kcal × activité → {targets.tdee} kcal d&apos;entretien
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: T.muted }}>Calories</span>
                    <span style={{ fontWeight: 700 }}>{kcalToday} / {targets.kcal}</span>
                  </div>
                  <div style={{ height: 8, background: T.surface2, borderRadius: 4 }}>
                    <div style={{ width: `${Math.min(100, (kcalToday / targets.kcal) * 100)}%`, height: "100%", background: T.nutrition, borderRadius: 4, transition: "width .3s" }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: T.muted }}>Protéines</span>
                    <span style={{ fontWeight: 700 }}>{proteinToday} / {targets.protein} g</span>
                  </div>
                  <div style={{ height: 8, background: T.surface2, borderRadius: 4 }}>
                    <div style={{ width: `${Math.min(100, (proteinToday / targets.protein) * 100)}%`, height: "100%", background: T.hab, borderRadius: 4, transition: "width .3s" }} />
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card style={{ marginBottom: 16, border: `1px solid ${T.nutrition}55` }}>
              <div style={{ fontSize: 14, marginBottom: 10 }}>
                🥗 Renseigne ta taille, ton âge, ton sexe (et une pesée dans Sport) pour calculer tes cibles caloriques et protéiques personnalisées.
              </div>
              <Link href="/settings"><Btn color={T.nutrition} small>Compléter mon profil dans Réglages</Btn></Link>
            </Card>
          )}

          <Section title="Noter un repas">
            <Card>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Input placeholder="Ex : poulet-riz-brocolis" value={label} onChange={(e) => setLabel(e.target.value)} />
                <div style={{ display: "flex", gap: 8 }}>
                  <Input placeholder="kcal" inputMode="numeric" value={kcal} onChange={(e) => setKcal(e.target.value)} />
                  <Input placeholder="Protéines (g)" inputMode="numeric" value={protein} onChange={(e) => setProtein(e.target.value)} />
                  <Btn color={T.nutrition} onClick={addMeal}><Plus size={16} /></Btn>
                </div>
              </div>
            </Card>
          </Section>

          <Section title="Repas d'aujourd'hui">
            <Card>
              {todayMeals.length === 0 && <Empty text="Aucun repas noté aujourd'hui." />}
              {todayMeals.map((m) => (
                <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${T.border}`, fontSize: 14 }}>
                  <span style={{ fontWeight: 600 }}>{m.label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ color: T.nutrition, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}><Flame size={13} />{m.kcal} kcal</span>
                    {m.protein > 0 && <span style={{ color: T.muted, fontSize: 12 }}>{m.protein} g P</span>}
                    <button onClick={() => removeMeal(m.id)} aria-label="Supprimer" style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }}><Trash2 size={15} /></button>
                  </div>
                </div>
              ))}
            </Card>
          </Section>

          <Section title="7 derniers jours">
            <Card>
              <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 70 }}>
                {week7.map((k, i) => {
                  const maxK = Math.max(1, targets?.kcal || 0, ...week7);
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%", alignItems: "center", gap: 3 }}>
                      <div style={{ width: "100%", borderRadius: 5, height: k ? `${(k / maxK) * 100}%` : 3, background: k ? T.nutrition : T.surface2, minHeight: 3, opacity: 0.85 }} />
                      <span style={{ fontSize: 9, color: T.muted }}>{k || "·"}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </Section>
        </>
      ) : (
        <>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}><ShoppingCart size={16} color={T.nutrition} />Liste de courses</span>
              <span style={{ color: shopDone === shopping.length && shopping.length > 0 ? T.hab : T.muted, fontSize: 13, fontWeight: 700 }}>{shopDone}/{shopping.length}</span>
            </div>
            <div style={{ height: 8, background: T.surface2, borderRadius: 4, marginBottom: 10 }}>
              <div style={{ width: `${shopping.length ? (shopDone / shopping.length) * 100 : 0}%`, height: "100%", background: T.nutrition, borderRadius: 4, transition: "width .3s" }} />
            </div>
            <Btn ghost small color={T.muted} onClick={resetShopping}><RotateCcw size={13} />Nouvelle semaine (tout décocher)</Btn>
          </Card>

          <Section title="Ajouter un article">
            <Card>
              <div style={{ display: "flex", gap: 8 }}>
                <Input placeholder="Ex : poulet, riz, épinards…" value={itemName} onChange={(e) => setItemName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addItem(); }} style={{ flex: 2 }} />
                <Select value={itemCat} onChange={(e) => setItemCat(e.target.value)} style={{ flex: 1 }}>
                  {SHOP_CATS.map((c) => <option key={c}>{c}</option>)}
                </Select>
                <Btn color={T.nutrition} onClick={addItem}><Plus size={16} /></Btn>
              </div>
            </Card>
          </Section>

          {byCat.length === 0 && <Empty text="Ta liste est vide. Ajoute ce qu'il te faut pour la semaine." />}
          {byCat.map(({ cat, items }) => (
            <Section key={cat} title={cat}>
              <Card>
                {items.map((item) => (
                  <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: `1px solid ${T.border}` }}>
                    <button onClick={() => toggleItem(item)} aria-label={item.name} style={{
                      width: 22, height: 22, borderRadius: 7, flexShrink: 0, cursor: "pointer",
                      border: `2px solid ${item.checked ? T.nutrition : T.muted}`,
                      background: item.checked ? T.nutrition : "transparent",
                    }} />
                    <span style={{ flex: 1, fontSize: 14, textDecoration: item.checked ? "line-through" : "none", opacity: item.checked ? 0.55 : 1 }}>{item.name}</span>
                    <button onClick={() => removeItem(item.id)} aria-label="Supprimer" style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }}><Trash2 size={14} /></button>
                  </div>
                ))}
              </Card>
            </Section>
          ))}
        </>
      )}
    </div>
  );
}
