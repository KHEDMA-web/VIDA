import { requireUserId } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { GoalsView } from "@/components/domains/Goals";

export default async function GoalsPage() {
  const userId = await requireUserId();
  const [goals, sessions] = await Promise.all([
    prisma.goal.findMany({ where: { userId } }),
    prisma.learningSession.findMany({ where: { userId }, orderBy: { date: "desc" } }),
  ]);
  return <GoalsView goals={goals} sessions={sessions} />;
}
