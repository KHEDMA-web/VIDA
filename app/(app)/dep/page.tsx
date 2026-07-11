import { requireUserId, getOrCreateSettings } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { DependenciesView } from "@/components/domains/Dependencies";

export default async function DependenciesPage() {
  const userId = await requireUserId();
  const [settings, items] = await Promise.all([
    getOrCreateSettings(userId),
    prisma.dependencyItem.findMany({ where: { userId }, include: { counts: true } }),
  ]);
  return <DependenciesView items={items} currency={settings.currency} />;
}
