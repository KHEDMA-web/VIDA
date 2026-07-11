"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { T } from "@/lib/theme";
import { today, lastNDays } from "@/lib/dates";
import { apiFetch } from "@/lib/api-client";
import { Card, Section, Btn, Input, Empty, MiniHeader } from "@/components/ui";

type Book = { id: string; title: string; pages: number; currentPage: number; status: "reading" | "done" };
type ReadingLog = { id: string; bookId: string; pages: number; date: string };

export function BooksView({ books, logs }: { books: Book[]; logs: ReadingLog[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [pages, setPages] = useState("");
  const [readPages, setReadPages] = useState<Record<string, string>>({});

  const add = async () => {
    const p = parseInt(pages);
    if (!title.trim() || !p || p <= 0) return;
    await apiFetch("/api/books", { method: "POST", json: { title: title.trim(), pages: p } });
    setTitle(""); setPages("");
    router.refresh();
  };

  const remove = async (id: string) => {
    await apiFetch(`/api/books/${id}`, { method: "DELETE" });
    router.refresh();
  };

  const logPages = async (b: Book) => {
    const n = parseInt(readPages[b.id]);
    if (!n || n <= 0) return;
    await apiFetch(`/api/books/${b.id}/log`, { method: "POST", json: { pages: n, date: today() } });
    setReadPages({ ...readPages, [b.id]: "" });
    router.refresh();
  };

  const reading = books.filter((b) => b.status === "reading");
  const done = books.filter((b) => b.status === "done");
  const days7 = lastNDays(7);
  const pages7 = logs.filter((l) => days7.includes(l.date)).reduce((s, l) => s + l.pages, 0);

  const BookRow = (b: Book) => {
    const pct = Math.round((b.currentPage / b.pages) * 100);
    return (
      <div key={b.id} style={{ padding: "12px 0", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}>
          <span style={{ fontWeight: 600 }}>{b.title}</span>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ color: T.book, fontWeight: 700 }}>{pct}%</span>
            <button onClick={() => remove(b.id)} aria-label="Supprimer" style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }}><Trash2 size={14} /></button>
          </div>
        </div>
        <div style={{ height: 8, background: T.surface2, borderRadius: 4, marginBottom: 8 }}>
          <div style={{ width: `${pct}%`, height: "100%", background: T.book, borderRadius: 4, transition: "width .3s" }} />
        </div>
        <div style={{ color: T.muted, fontSize: 12, marginBottom: 8 }}>Page {b.currentPage} / {b.pages}</div>
        {b.status === "reading" && (
          <div style={{ display: "flex", gap: 8 }}>
            <Input placeholder="Pages lues aujourd'hui" inputMode="numeric"
              value={readPages[b.id] || ""} onChange={(e) => setReadPages({ ...readPages, [b.id]: e.target.value })} />
            <Btn small color={T.book} onClick={() => logPages(b)}><Plus size={14} />Noter</Btn>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <MiniHeader title="Livres" color={T.book} sub={`${pages7} pages lues sur 7 jours`} />
      <Section title="Ajouter un livre">
        <Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Input placeholder="Titre du livre" value={title} onChange={(e) => setTitle(e.target.value)} />
            <div style={{ display: "flex", gap: 8 }}>
              <Input placeholder="Nb de pages" inputMode="numeric" value={pages} onChange={(e) => setPages(e.target.value)} />
              <Btn color={T.book} onClick={add}><Plus size={16} />OK</Btn>
            </div>
          </div>
        </Card>
      </Section>

      <Section title="En cours">
        <Card>
          {reading.length === 0 && <Empty text="Aucun livre en cours. Lequel t'appelle ? 📖" />}
          {reading.map(BookRow)}
        </Card>
      </Section>

      {done.length > 0 && (
        <Section title={`Terminés (${done.length})`}>
          <Card>
            {done.map((b) => (
              <div key={b.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.border}`, fontSize: 14 }}>
                <span>✅ {b.title}</span>
                <span style={{ color: T.muted, fontSize: 12 }}>{b.pages} p.</span>
              </div>
            ))}
          </Card>
        </Section>
      )}
    </div>
  );
}
