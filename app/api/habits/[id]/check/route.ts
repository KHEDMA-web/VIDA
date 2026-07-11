import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";

/** Bascule le check d'une habitude pour une date donnée (créé si absent, supprimé si présent). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: habitId } = await params;
  const { date } = await req.json();
  return withAuth(async (userId) => {
    const existing = await prisma.habitCheck.findUnique({
      where: { habitId_date: { habitId, date } },
    });
    if (existing) {
      await prisma.habitCheck.delete({ where: { id: existing.id } });
      return { checked: false };
    }
    await prisma.habitCheck.create({ data: { userId, habitId, date } });
    return { checked: true };
  });
}
