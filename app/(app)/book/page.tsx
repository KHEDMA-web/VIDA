import { requireUserId } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { BooksView } from "@/components/domains/Books";

export default async function BooksPage() {
  const userId = await requireUserId();
  const [books, logs] = await Promise.all([
    prisma.book.findMany({ where: { userId } }),
    prisma.readingLog.findMany({ where: { userId } }),
  ]);
  return <BooksView books={books} logs={logs} />;
}
