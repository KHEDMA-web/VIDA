import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";

export async function GET() {
  return withAuth((userId) => prisma.goal.findMany({ where: { userId } }));
}

export async function POST(req: Request) {
  const body = await req.json();
  return withAuth((userId) =>
    prisma.goal.create({ data: { userId, title: String(body.title).trim() } })
  );
}
