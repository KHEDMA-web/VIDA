import { requireUserId } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { VehiculeView } from "@/components/domains/Vehicule";

export default async function VehiculePage() {
  const userId = await requireUserId();
  const [tasks, logs] = await Promise.all([
    prisma.vehicleTask.findMany({ where: { userId } }),
    prisma.vehicleTaskLog.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 10, include: { task: true } }),
  ]);
  return <VehiculeView tasks={tasks} logs={logs} />;
}
