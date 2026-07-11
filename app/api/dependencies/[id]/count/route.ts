import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";

/** Incrémente/décrémente (delta) le compteur du jour pour une dépendance, plancher à 0. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: itemId } = await params;
  const { date, delta } = await req.json();
  return withAuth(async (userId) => {
    const existing = await prisma.dependencyCount.findUnique({
      where: { itemId_date: { itemId, date } },
    });
    const next = Math.max(0, (existing?.count ?? 0) + Number(delta));
    return prisma.dependencyCount.upsert({
      where: { itemId_date: { itemId, date } },
      update: { count: next },
      create: { userId, itemId, date, count: next },
    });
  });
}
