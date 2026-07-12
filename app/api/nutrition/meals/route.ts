import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";

export async function GET() {
  return withAuth((userId) =>
    prisma.meal.findMany({ where: { userId }, orderBy: { date: "desc" } })
  );
}

export async function POST(req: Request) {
  const body = await req.json();
  return withAuth((userId) =>
    prisma.meal.create({
      data: {
        userId,
        label: String(body.label),
        kcal: Number(body.kcal),
        protein: Number.isFinite(Number(body.protein)) ? Number(body.protein) : 0,
        date: body.date,
      },
    })
  );
}
