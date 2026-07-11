import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withAuth(async (userId) => {
    await prisma.habit.delete({ where: { id, userId } });
    return { ok: true };
  });
}
