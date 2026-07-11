import { requireUserId, getOrCreateSettings } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { PriereView } from "@/components/domains/Priere";

export default async function PrierePage() {
  const userId = await requireUserId();
  const [settings, checks] = await Promise.all([
    getOrCreateSettings(userId),
    prisma.prayerCheck.findMany({ where: { userId } }),
  ]);
  return <PriereView settings={settings} checks={checks} />;
}
