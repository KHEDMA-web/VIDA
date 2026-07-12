"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, LogOut } from "lucide-react";
import { T, DOMAINS, ALL_IDS, type DomainId } from "@/lib/theme";
import { CURRENCIES } from "@/lib/currency";
import { CITIES, PRAYER_METHODS } from "@/lib/prayer-times";
import { ACTIVITY_LEVELS, NUTRITION_GOALS } from "@/lib/nutrition";
import { apiFetch } from "@/lib/api-client";
import { Card, Section, Btn, Input, Select, MiniHeader } from "@/components/ui";
import { signOut } from "@/app/auth/actions";

type SettingsData = {
  name: string; currency: string; activeDomains: string[];
  prayerCity: string | null; prayerLat: number | null; prayerLng: number | null; prayerMethod: string;
  heightCm: number | null; age: number | null; sex: string | null;
  activityLevel: number; nutritionGoal: string;
};

export function SettingsView({ settings }: { settings: SettingsData }) {
  const router = useRouter();
  const [name, setName] = useState(settings.name);
  const [confirm, setConfirm] = useState(false);
  const active = settings.activeDomains.length ? settings.activeDomains : ALL_IDS;

  const patch = async (data: Record<string, unknown>) => {
    await apiFetch("/api/settings", { method: "PATCH", json: data });
    router.refresh();
  };

  const toggleDomain = (id: DomainId) => {
    if (active.includes(id)) {
      if (active.length === 1) return;
      patch({ activeDomains: active.filter((x) => x !== id) });
    } else {
      patch({ activeDomains: ALL_IDS.filter((x) => active.includes(x) || x === id) });
    }
  };

  const resetAll = async () => {
    await apiFetch("/api/reset", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  const isManualCity = settings.prayerCity && !CITIES.some((c) => c.n === settings.prayerCity);

  return (
    <div>
      <MiniHeader title="Réglages" color={T.muted} sub="Personnalise ton app" />

      <Section title="Profil">
        <Card>
          <div style={{ color: T.muted, fontSize: 13, marginBottom: 6 }}>Ton prénom (pour l&apos;accueil)</div>
          <Input placeholder="Ex : Yassine" value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => patch({ name })} />
          <div style={{ color: T.muted, fontSize: 13, margin: "14px 0 6px" }}>Devise</div>
          <Select value={settings.currency} onChange={(e) => patch({ currency: e.target.value })}>
            {CURRENCIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </Card>
      </Section>

      <Section title="Profil physique (nutrition)">
        <Card>
          <div style={{ color: T.muted, fontSize: 12, marginBottom: 10 }}>
            Sert uniquement à calculer tes cibles caloriques/protéiques dans Nutrition. Rien n&apos;est envoyé nulle part.
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: T.muted, fontSize: 12, marginBottom: 6 }}>Taille (cm)</div>
              <Input placeholder="175" inputMode="numeric" defaultValue={settings.heightCm ?? ""}
                onBlur={(e) => patch({ heightCm: parseInt(e.target.value) || null })} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: T.muted, fontSize: 12, marginBottom: 6 }}>Âge</div>
              <Input placeholder="30" inputMode="numeric" defaultValue={settings.age ?? ""}
                onBlur={(e) => patch({ age: parseInt(e.target.value) || null })} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: T.muted, fontSize: 12, marginBottom: 6 }}>Sexe</div>
              <Select value={settings.sex ?? ""} onChange={(e) => patch({ sex: e.target.value || null })}>
                <option value="">—</option>
                <option value="h">Homme</option>
                <option value="f">Femme</option>
              </Select>
            </div>
          </div>
          <div style={{ color: T.muted, fontSize: 13, margin: "4px 0 6px" }}>Niveau d&apos;activité</div>
          <Select value={settings.activityLevel} onChange={(e) => patch({ activityLevel: parseInt(e.target.value) })} style={{ marginBottom: 10 }}>
            {ACTIVITY_LEVELS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
          <div style={{ color: T.muted, fontSize: 13, margin: "4px 0 6px" }}>Objectif</div>
          <Select value={settings.nutritionGoal} onChange={(e) => patch({ nutritionGoal: e.target.value })}>
            {NUTRITION_GOALS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
          <div style={{ color: T.muted, fontSize: 12, marginTop: 8 }}>
            Le poids utilisé pour le calcul est ta dernière pesée notée dans Sport.
          </div>
        </Card>
      </Section>

      <Section title="Horaires de prière">
        <Card>
          <div style={{ color: T.muted, fontSize: 13, marginBottom: 6 }}>Ville</div>
          <Select
            value={CITIES.some((c) => c.n === settings.prayerCity) ? settings.prayerCity! : (settings.prayerCity ? "__manual__" : "")}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "__manual__") {
                patch({ prayerCity: "Coordonnées manuelles", prayerLat: settings.prayerLat || 0, prayerLng: settings.prayerLng || 0 });
              } else if (v === "") {
                patch({ prayerCity: null, prayerLat: null, prayerLng: null });
              } else {
                const c = CITIES.find((x) => x.n === v)!;
                patch({ prayerCity: c.n, prayerLat: c.lat, prayerLng: c.lng });
              }
            }}>
            <option value="">— Choisir une ville —</option>
            {CITIES.map((c) => <option key={c.n} value={c.n}>{c.n}</option>)}
            <option value="__manual__">Autre (coordonnées manuelles)</option>
          </Select>
          {isManualCity && (
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <Input placeholder="Latitude (ex : 36.75)" inputMode="decimal" defaultValue={settings.prayerLat ?? ""}
                onBlur={(e) => patch({ prayerLat: parseFloat(e.target.value) || 0 })} />
              <Input placeholder="Longitude (ex : 3.06)" inputMode="decimal" defaultValue={settings.prayerLng ?? ""}
                onBlur={(e) => patch({ prayerLng: parseFloat(e.target.value) || 0 })} />
            </div>
          )}
          <div style={{ color: T.muted, fontSize: 13, margin: "12px 0 6px" }}>Méthode de calcul</div>
          <Select value={settings.prayerMethod || "19"} onChange={(e) => patch({ prayerMethod: e.target.value })}>
            {PRAYER_METHODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
          <div style={{ color: T.muted, fontSize: 12, marginTop: 8 }}>
            Calcul astronomique local, mis à jour chaque jour — fonctionne même hors ligne. Si un écart de 1-3 min persiste avec ta mosquée, essaie une autre méthode.
          </div>
        </Card>
      </Section>

      <Section title="Domaines affichés">
        <Card>
          <div style={{ color: T.muted, fontSize: 13, marginBottom: 10 }}>
            Désactive ce que tu n&apos;utilises pas : la boussole, le bilan et la navigation s&apos;adaptent. Tes données sont conservées.
          </div>
          {DOMAINS.map((d) => {
            const on = active.includes(d.id);
            const Icon = d.icon;
            return (
              <button key={d.id} onClick={() => toggleDomain(d.id)} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                width: "100%", background: "none", border: "none", cursor: "pointer",
                padding: "10px 0", borderBottom: `1px solid ${T.border}`, color: T.text,
              }}>
                <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 600, opacity: on ? 1 : 0.5 }}>
                  <Icon size={18} color={d.color} />{d.label}
                </span>
                <span style={{
                  width: 42, height: 24, borderRadius: 12, position: "relative",
                  background: on ? d.color : T.surface2, transition: "background .2s",
                }}>
                  <span style={{
                    position: "absolute", top: 3, left: on ? 21 : 3, width: 18, height: 18,
                    borderRadius: 9, background: "#12151F", transition: "left .2s",
                  }} />
                </span>
              </button>
            );
          })}
        </Card>
      </Section>

      <Section title="Compte">
        <Card>
          <Btn ghost color={T.muted} onClick={() => signOut()}><LogOut size={15} />Se déconnecter</Btn>
        </Card>
      </Section>

      <Section title="Zone sensible">
        <Card style={{ border: `1px solid ${T.sport}44` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: T.sport, fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
            <AlertTriangle size={16} />Réinitialiser l&apos;application
          </div>
          <div style={{ color: T.muted, fontSize: 13, marginBottom: 12 }}>
            Supprime définitivement toutes tes données (transactions, séances, habitudes, livres…). Irréversible.
          </div>
          {!confirm ? (
            <Btn ghost color={T.sport} onClick={() => setConfirm(true)}>Tout effacer…</Btn>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <Btn color={T.sport} onClick={resetAll}>Oui, tout effacer</Btn>
              <Btn ghost color={T.muted} onClick={() => setConfirm(false)}>Annuler</Btn>
            </div>
          )}
        </Card>
      </Section>
    </div>
  );
}
