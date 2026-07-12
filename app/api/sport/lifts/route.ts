import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";

export async function GET() {
  return withAuth((userId) =>
    prisma.liftLog.findMany({ where: { userId }, orderBy: { date: "asc" } })
  );
}

export async function POST(req: Request) {
  const body = await req.json();
  return withAuth((userId) =>
    prisma.liftLog.create({
      data: { userId, exercise: String(body.exercise), kg: Number(body.kg), date: body.date },
    })
  );
}
