import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";

export async function GET() {
  return withAuth((userId) =>
    prisma.transaction.findMany({ where: { userId }, orderBy: { date: "desc" } })
  );
}

export async function POST(req: Request) {
  const body = await req.json();
  return withAuth((userId) =>
    prisma.transaction.create({
      data: {
        userId,
        label: String(body.label).trim(),
        amount: Number(body.amount),
        cat: String(body.cat),
        type: body.type === "income" ? "income" : "expense",
        date: body.date,
      },
    })
  );
}
