import { requireUserId, getOrCreateSettings } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { SommeilView } from "@/components/domains/Sommeil";

export default async function SommeilPage() {
  const userId = await requireUserId();
  const [settings, logs] = await Promise.all([
    getOrCreateSettings(userId),
    prisma.sleepLog.findMany({ where: { userId } }),
  ]);
  return <SommeilView logs={logs} target={settings.sleepTarget} />;
}
