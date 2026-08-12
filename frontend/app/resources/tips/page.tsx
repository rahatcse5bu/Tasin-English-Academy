import Link from 'next/link';
import { api } from '@/lib/api';
import { RESOURCE_KIND_BN } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function TipsPage() {
  const items = await api<any[]>('/resources/public').catch(() => []);
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-12">
      <Link href="/resources" className="text-sm text-brand-700 hover:underline">← রিসোর্স</Link>
      <h1 className="text-3xl font-bold text-slate-900 mt-2">টিপস, হ্যাকস ও সাজেশন</h1>
      <p className="text-slate-600 mt-2">
        এইচএসসি ও এসএসসি'র জন্য লেকচার শিট, টিপস, হ্যাকস, নোট ও সেরা অনুশীলন। বিনামূল্যে — সবার জন্য।
      </p>
      <div className="mt-8 grid sm:grid-cols-2 gap-5">
        {items.map((r: any) => (
          <article key={r._id} className="card">
            <div className="flex items-center gap-2">
              <span className="badge bg-brand-100 text-brand-700">{RESOURCE_KIND_BN[r.kind] || r.kind}</span>
              <span className="text-xs text-slate-500">{r.level}</span>
            </div>
            <h2 className="mt-2 font-semibold text-lg">{r.titleBn || r.title}</h2>
            <p className="mt-2 text-sm text-slate-700 whitespace-pre-line">{r.bodyBn || r.body}</p>
            {r.fileUrl && (
              <a href={r.fileUrl} target="_blank" rel="noreferrer" className="btn-secondary mt-3 text-sm">
                ফাইল ডাউনলোড
              </a>
            )}
            {r.tags?.length ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {r.tags.map((t: string) => (
                  <span key={t} className="badge bg-slate-100 text-slate-700">#{t}</span>
                ))}
              </div>
            ) : null}
          </article>
        ))}
        {!items.length && (
          <div className="col-span-full text-center text-slate-500 py-8">এখনও কোনও রিসোর্স যোগ করা হয়নি।</div>
        )}
      </div>
    </div>
  );
}
