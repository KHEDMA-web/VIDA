import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  return withAuth((userId) =>
    prisma.todoTask.update({
      where: { id, userId },
      data: {
        ...(body.important !== undefined ? { important: !!body.important } : {}),
        ...(body.done !== undefined ? { done: !!body.done, doneDate: body.doneDate ?? null } : {}),
      },
    })
  );
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withAuth(async (userId) => {
    await prisma.todoTask.delete({ where: { id, userId } });
    return { ok: true };
  });
}
