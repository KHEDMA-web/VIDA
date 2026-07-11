import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";

export async function GET() {
  return withAuth((userId) => prisma.sleepLog.findMany({ where: { userId } }));
}

export async function POST(req: Request) {
  const body = await req.json();
  return withAuth((userId) =>
    prisma.sleepLog.upsert({
      where: { userId_date: { userId, date: body.date } },
      update: { hours: Number(body.hours), quality: Number(body.quality) },
      create: { userId, date: body.date, hours: Number(body.hours), quality: Number(body.quality) },
    })
  );
}
