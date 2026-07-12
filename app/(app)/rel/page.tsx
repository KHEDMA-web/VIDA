import { requireUserId } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { RelationsView } from "@/components/domains/Relations";

export default async function RelationsPage() {
  const userId = await requireUserId();
  const [contacts, logs] = await Promise.all([
    prisma.contact.findMany({ where: { userId } }),
    prisma.contactLog.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 10, include: { contact: true } }),
  ]);
  return <RelationsView contacts={contacts} logs={logs} />;
}
