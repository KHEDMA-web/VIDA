import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: taskId } = await params;
  const { date } = await req.json();
  return withAuth(async (userId) => {
    const [task] = await prisma.$transaction([
      prisma.vehicleTask.update({ where: { id: taskId, userId }, data: { lastDone: date } }),
      prisma.vehicleTaskLog.create({ data: { userId, taskId, date } }),
    ]);
    return task;
  });
}
