import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";

export async function GET() {
  return withAuth((userId) => prisma.contact.findMany({ where: { userId } }));
}

export async function POST(req: Request) {
  const body = await req.json();
  return withAuth((userId) =>
    prisma.contact.create({
      data: { userId, name: String(body.name).trim(), freqDays: Number(body.freqDays) },
    })
  );
}
