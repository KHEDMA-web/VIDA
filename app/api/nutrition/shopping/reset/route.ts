import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";

/** Décoche tous les articles pour repartir sur une nouvelle semaine de courses. */
export async function POST() {
  return withAuth(async (userId) => {
    await prisma.shoppingItem.updateMany({ where: { userId }, data: { checked: false } });
    return { ok: true };
  });
}
