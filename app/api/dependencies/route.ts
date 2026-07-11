import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";

export async function GET() {
  return withAuth((userId) =>
    prisma.dependencyItem.findMany({ where: { userId }, include: { counts: true } })
  );
}

export async function POST(req: Request) {
  const body = await req.json();
  const cost = parseFloat(String(body.costPerDay).replace(",", "."));
  return withAuth((userId) =>
    prisma.dependencyItem.create({
      data: {
        userId,
        name: String(body.name).trim(),
        costPerDay: cost > 0 ? cost : 0,
        createdAt: body.createdAt,
      },
    })
  );
}
