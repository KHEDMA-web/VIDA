import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: bookId } = await params;
  const { pages, date } = await req.json();
  const n = Number(pages);
  return withAuth(async (userId) => {
    const book = await prisma.book.findUniqueOrThrow({ where: { id: bookId, userId } });
    const currentPage = Math.min(book.pages, book.currentPage + n);
    const [, log] = await prisma.$transaction([
      prisma.book.update({
        where: { id: bookId, userId },
        data: { currentPage, status: currentPage >= book.pages ? "done" : "reading" },
      }),
      prisma.readingLog.create({ data: { userId, bookId, pages: n, date } }),
    ]);
    return log;
  });
}
