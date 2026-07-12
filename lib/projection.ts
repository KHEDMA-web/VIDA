/** Régression linéaire simple sur les pesées récentes, pour projeter la tendance vers un objectif. */

type WeightPoint = { kg: number; date: string };

export type WeightProjection = {
  slopePerDay: number; // kg/jour (peut être négatif)
  slopePerMonth: number; // kg/mois, arrondi à 1 décimale
  direction: 1 | -1 | 0;
  daysToGoal: number | null; // null si pas d'objectif atteignable dans un délai raisonnable
};

/** Utilise au plus les 8 dernières pesées : au-delà, le poids d'un point ancien fausse la tendance récente. */
export function computeWeightProjection(weights: WeightPoint[], goalKg: number | null): WeightProjection | null {
  const points = weights.slice(-8);
  if (points.length < 2) return null;

  const t0 = new Date(points[0].date).getTime();
  const xs = points.map((p) => (new Date(p.date).getTime() - t0) / 86400000);
  const ys = points.map((p) => p.kg);
  const n = xs.length;
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((s, x, i) => s + x * ys[i], 0);
  const sumXX = xs.reduce((s, x) => s + x * x, 0);
  const denom = n * sumXX - sumX * sumX;
  const slopePerDay = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;

  const direction = slopePerDay > 0.005 ? 1 : slopePerDay < -0.005 ? -1 : 0;

  let daysToGoal: number | null = null;
  const last = points[points.length - 1].kg;
  if (goalKg && direction !== 0) {
    const remaining = goalKg - last;
    const movingTowardGoal = Math.sign(remaining) === Math.sign(slopePerDay);
    if (movingTowardGoal && Math.abs(slopePerDay) > 0.001) {
      const days = remaining / slopePerDay;
      if (days > 0 && days < 365) daysToGoal = Math.round(days);
    }
  }

  return {
    slopePerDay,
    slopePerMonth: Math.round(slopePerDay * 30 * 10) / 10,
    direction,
    daysToGoal,
  };
}
