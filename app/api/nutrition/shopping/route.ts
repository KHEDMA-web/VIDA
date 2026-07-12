import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";
import { today } from "@/lib/dates";

export async function GET() {
  return withAuth((userId) =>
    prisma.shoppingItem.findMany({ where: { userId }, orderBy: { createdAt: "asc" } })
  );
}

export async function POST(req: Request) {
  const body = await req.json();
  return withAuth((userId) =>
    prisma.shoppingItem.create({
      data: {
        userId,
        name: String(body.name),
        cat: body.cat ? String(body.cat) : "Autre",
        createdAt: today(),
      },
    })
  );
}
