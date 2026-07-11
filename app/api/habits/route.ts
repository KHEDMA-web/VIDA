import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";

export async function GET() {
  return withAuth((userId) =>
    prisma.habit.findMany({ where: { userId }, include: { checks: true } })
  );
}

export async function POST(req: Request) {
  const body = await req.json();
  return withAuth((userId) =>
    prisma.habit.create({ data: { userId, name: String(body.name).trim() } })
  );
}
