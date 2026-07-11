import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";

export async function GET() {
  return withAuth((userId) => prisma.prayerCheck.findMany({ where: { userId } }));
}
