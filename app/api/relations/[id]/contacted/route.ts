import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: contactId } = await params;
  const { date } = await req.json();
  return withAuth(async (userId) => {
    const [contact] = await prisma.$transaction([
      prisma.contact.update({ where: { id: contactId, userId }, data: { lastContact: date } }),
      prisma.contactLog.create({ data: { userId, contactId, date } }),
    ]);
    return contact;
  });
}
