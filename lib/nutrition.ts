/** Cibles caloriques/protéines calculées localement (Mifflin-St Jeor), aucune donnée envoyée nulle part. */

export const ACTIVITY_LEVELS: [number, string, number][] = [
  [0, "Sédentaire (bureau, peu de sport)", 1.2],
  [1, "Légère (1-3 séances/sem.)", 1.375],
  [2, "Modérée (3-5 séances/sem.)", 1.55],
  [3, "Élevée (6-7 séances/sem.)", 1.725],
  [4, "Très élevée (sport intensif quotidien)", 1.9],
];

export const NUTRITION_GOALS: [string, string, number, number][] = [
  // [id, label, delta kcal vs entretien, g de protéines / kg]
  ["perte", "Perte de poids", -350, 2.0],
  ["maintien", "Maintien", 0, 1.8],
  ["prise", "Prise de masse", 300, 1.9],
];

export type NutritionProfile = {
  heightCm: number | null;
  age: number | null;
  sex: string | null;
  activityLevel: number;
  nutritionGoal: string;
};

export type NutritionTargets = {
  bmr: number;
  tdee: number;
  kcal: number;
  protein: number;
};

/** null si le profil (taille/âge/sexe/poids) est incomplet — on ne devine jamais une valeur utilisateur. */
export function computeNutritionTargets(profile: NutritionProfile, weightKg: number | null): NutritionTargets | null {
  const { heightCm, age, sex, activityLevel, nutritionGoal } = profile;
  if (!heightCm || !age || !sex || !weightKg) return null;

  const bmr = sex === "f"
    ? 10 * weightKg + 6.25 * heightCm - 5 * age - 161
    : 10 * weightKg + 6.25 * heightCm - 5 * age + 5;

  const activityFactor = ACTIVITY_LEVELS[activityLevel]?.[2] as number ?? 1.55;
  const tdee = Math.round(bmr * activityFactor);

  const goal = NUTRITION_GOALS.find(([id]) => id === nutritionGoal) ?? NUTRITION_GOALS[1];
  const kcal = Math.max(1200, tdee + (goal[2] as number));
  const protein = Math.round((goal[3] as number) * weightKg);

  return { bmr: Math.round(bmr), tdee, kcal: Math.round(kcal), protein };
}
