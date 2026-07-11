import { requireUserId } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { RelationsView } from "@/components/domains/Relations";

export default async function RelationsPage() {
  const userId = await requireUserId();
  const contacts = await prisma.contact.findMany({ where: { userId } });
  return <RelationsView contacts={contacts} />;
}
