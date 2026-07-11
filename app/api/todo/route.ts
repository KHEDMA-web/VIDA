import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";

export async function GET() {
  return withAuth((userId) =>
    prisma.todoTask.findMany({ where: { userId }, orderBy: { createdAt: "desc" } })
  );
}

export async function POST(req: Request) {
  const body = await req.json();
  return withAuth((userId) =>
    prisma.todoTask.create({
      data: {
        userId,
        title: String(body.title).trim(),
        important: !!body.important,
        createdAt: body.createdAt,
      },
    })
  );
}
