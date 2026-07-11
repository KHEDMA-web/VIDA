import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";

export async function GET() {
  return withAuth((userId) =>
    prisma.learningSession.findMany({ where: { userId }, orderBy: { date: "desc" } })
  );
}

export async function POST(req: Request) {
  const body = await req.json();
  return withAuth((userId) =>
    prisma.learningSession.create({
      data: { userId, topic: String(body.topic).trim(), minutes: Number(body.minutes), date: body.date },
    })
  );
}
