import { requireUserId } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { MaisonView } from "@/components/domains/Maison";

export default async function MaisonPage() {
  const userId = await requireUserId();
  const [tasks, logs] = await Promise.all([
    prisma.houseTask.findMany({ where: { userId } }),
    prisma.houseTaskLog.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 10, include: { task: true } }),
  ]);
  return <MaisonView tasks={tasks} logs={logs} />;
}
