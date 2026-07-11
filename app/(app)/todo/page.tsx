import { requireUserId } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { TodoView } from "@/components/domains/Todo";

export default async function TodoPage() {
  const userId = await requireUserId();
  const tasks = await prisma.todoTask.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return <TodoView tasks={tasks} />;
}
