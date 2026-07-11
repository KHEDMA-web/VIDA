import { requireUserId } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { HabitsView } from "@/components/domains/Habits";

export default async function HabitsPage() {
  const userId = await requireUserId();
  const habits = await prisma.habit.findMany({
    where: { userId },
    include: { checks: true },
    orderBy: { id: "asc" },
  });
  return <HabitsView habits={habits} />;
}
