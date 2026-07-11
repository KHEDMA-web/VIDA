import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";

export async function GET() {
  return withAuth((userId) =>
    prisma.weight.findMany({ where: { userId }, orderBy: { date: "asc" } })
  );
}

export async function POST(req: Request) {
  const body = await req.json();
  return withAuth((userId) =>
    prisma.weight.upsert({
      where: { userId_date: { userId, date: body.date } },
      update: { kg: Number(body.kg) },
      create: { userId, date: body.date, kg: Number(body.kg) },
    })
  );
}
