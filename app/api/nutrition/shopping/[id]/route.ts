import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  return withAuth((userId) =>
    prisma.shoppingItem.update({ where: { id, userId }, data: { checked: Boolean(body.checked) } })
  );
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withAuth(async (userId) => {
    await prisma.shoppingItem.delete({ where: { id, userId } });
    return { ok: true };
  });
}
