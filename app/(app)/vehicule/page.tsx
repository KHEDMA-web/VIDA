import { requireUserId } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { VehiculeView } from "@/components/domains/Vehicule";

export default async function VehiculePage() {
  const userId = await requireUserId();
  const tasks = await prisma.vehicleTask.findMany({ where: { userId } });
  return <VehiculeView tasks={tasks} />;
}
