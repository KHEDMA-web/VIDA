import { requireUserId } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { MaisonView } from "@/components/domains/Maison";

export default async function MaisonPage() {
  const userId = await requireUserId();
  const tasks = await prisma.houseTask.findMany({ where: { userId } });
  return <MaisonView tasks={tasks} />;
}
