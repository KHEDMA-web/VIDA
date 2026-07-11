import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";
import type { Prayer } from "@prisma/client";

/** Bascule une prière pour une date donnée (créée si absente, supprimée si présente). */
export async function POST(req: Request) {
  const { date, prayer } = (await req.json()) as { date: string; prayer: Prayer };
  return withAuth(async (userId) => {
    const existing = await prisma.prayerCheck.findUnique({
      where: { userId_date_prayer: { userId, date, prayer } },
    });
    if (existing) {
      await prisma.prayerCheck.delete({ where: { id: existing.id } });
      return { checked: false };
    }
    await prisma.prayerCheck.create({ data: { userId, date, prayer } });
    return { checked: true };
  });
}
