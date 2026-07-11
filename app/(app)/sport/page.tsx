import { requireUserId, getOrCreateSettings } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { SportView } from "@/components/domains/Sport";

export default async function SportPage() {
  const userId = await requireUserId();
  const [settings, sessions, weights] = await Promise.all([
    getOrCreateSettings(userId),
    prisma.sportSession.findMany({ where: { userId }, orderBy: { date: "desc" } }),
    prisma.weight.findMany({ where: { userId }, orderBy: { date: "asc" } }),
  ]);
  return <SportView sessions={sessions} weights={weights} weeklyTarget={settings.weeklyTarget} />;
}
