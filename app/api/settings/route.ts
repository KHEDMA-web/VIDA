import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";
import { getOrCreateSettings } from "@/lib/user";

const EDITABLE_FIELDS = [
  "name", "currency", "activeDomains",
  "prayerCity", "prayerLat", "prayerLng", "prayerMethod",
  "monthlyBudget", "weeklyTarget", "sleepTarget", "weightGoal",
  "heightCm", "age", "sex", "activityLevel", "nutritionGoal",
] as const;

export async function GET() {
  return withAuth((userId) => getOrCreateSettings(userId));
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const data: Record<string, unknown> = {};
  for (const key of EDITABLE_FIELDS) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  return withAuth((userId) => prisma.settings.update({ where: { userId }, data }));
}
