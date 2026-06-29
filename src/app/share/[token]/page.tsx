import { sql, initDB } from "@/lib/db";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function SharePage({ params }: Props) {
  const { token } = await params;
  await initDB();

  const result = await sql`
    SELECT title, content, updated_at
    FROM notes WHERE share_token = ${token} AND is_deleted = false
  `;
  if (result.length === 0) notFound();

  const note = result[0] as any;
  const date = new Date(note.updated_at).toLocaleDateString("zh-CN", {
    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-paper">
      {/* 顶栏 */}
      <header className="h-[72px] glass-header border-b border-[#D8E0D9] flex items-center px-6 lg:px-10 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto w-full flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green flex items-center justify-center">
            <span className="text-white text-sm font-bold" style={{ fontFamily: '"Songti SC", serif' }}>B</span>
          </div>
          <span className="text-ink text-lg font-bold tracking-[0.12em]" style={{ fontFamily: '"Songti SC", serif' }}>BIJI</span>
          <span className="text-muted/40 text-xs font-mono ml-auto">{date}</span>
        </div>
      </header>

      {/* 内容 */}
      <main className="max-w-4xl mx-auto px-6 lg:px-10 py-10">
        <h1 className="text-3xl font-bold text-ink mb-8" style={{ fontFamily: '"Songti SC", serif' }}>
          {note.title || "未命名笔记"}
        </h1>
        <div className="bg-white rounded-2xl border border-line p-8 lg:p-10">
          <div
            className="tiptax prose max-w-none"
            style={{ fontFamily: '"PingFang SC", sans-serif', lineHeight: "1.8" }}
            dangerouslySetInnerHTML={{ __html: note.content || "" }}
          />
        </div>
      </main>

      {/* 底部提示 */}
      <footer className="text-center py-8 text-xs text-muted/40">
        由 BIJI 笔记工作台分享 · 只读预览
      </footer>
    </div>
  );
}
