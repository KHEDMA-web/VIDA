import { requireUserId, getOrCreateSettings } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { NutritionView } from "@/components/domains/Nutrition";

export default async function NutritionPage() {
  const userId = await requireUserId();
  const [settings, meals, shopping, lastWeight] = await Promise.all([
    getOrCreateSettings(userId),
    prisma.meal.findMany({ where: { userId }, orderBy: { date: "desc" } }),
    prisma.shoppingItem.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    prisma.weight.findFirst({ where: { userId }, orderBy: { date: "desc" } }),
  ]);
  return (
    <NutritionView
      meals={meals}
      shopping={shopping}
      settings={settings}
      lastWeightKg={lastWeight?.kg ?? null}
    />
  );
}
