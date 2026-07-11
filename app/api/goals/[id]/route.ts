import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { delta } = await req.json();
  return withAuth(async (userId) => {
    const goal = await prisma.goal.findUniqueOrThrow({ where: { id, userId } });
    const progress = Math.max(0, Math.min(100, goal.progress + Number(delta)));
    return prisma.goal.update({ where: { id, userId }, data: { progress } });
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withAuth(async (userId) => {
    await prisma.goal.delete({ where: { id, userId } });
    return { ok: true };
  });
}
