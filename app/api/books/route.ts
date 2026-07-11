import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";

export async function GET() {
  return withAuth((userId) =>
    prisma.book.findMany({ where: { userId }, include: { logs: true } })
  );
}

export async function POST(req: Request) {
  const body = await req.json();
  return withAuth((userId) =>
    prisma.book.create({
      data: { userId, title: String(body.title).trim(), pages: Number(body.pages) },
    })
  );
}
