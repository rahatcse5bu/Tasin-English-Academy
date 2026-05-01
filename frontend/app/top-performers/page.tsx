import { api } from '@/lib/api';
import { bnNum, BATCH_TYPE_BN } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function TopPerformersPage() {
  const groups = await api<any[]>('/exams/top-performers?limit=5').catch(() => []);
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-12">
      <h1 className="text-3xl font-bold text-slate-900">সেরা পারফর্মার</h1>
      <p className="text-slate-600 mt-2">প্রতিটি ব্যাচের সর্বশেষ মূল্যায়িত পরীক্ষার শীর্ষ পারফর্মাররা।</p>

      <div className="mt-8 grid lg:grid-cols-2 gap-6">
        {groups.map((g: any, i: number) => (
          <div key={i} className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-lg font-semibold">{g.batch?.name}</div>
                <div className="text-sm text-slate-500">{g.top?.[0]?.exam?.title}</div>
              </div>
              <span className={`badge ${g.batch?.type === 'premium' ? 'bg-amber-100 text-amber-800' : 'bg-brand-100 text-brand-800'}`}>
                {BATCH_TYPE_BN[g.batch?.type]}
              </span>
            </div>
            <ol className="space-y-2">
              {g.top.map((r: any) => (
                <li key={r._id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                  <span className={`w-9 h-9 grid place-items-center rounded-full font-bold text-white
                    ${r.rank === 1 ? 'bg-amber-500' : r.rank === 2 ? 'bg-slate-400' : 'bg-amber-700'}`}>
                    {bnNum(r.rank)}
                  </span>
                  <div className="flex-1">
                    <div className="font-medium">{r.student?.name}</div>
                    <div className="text-xs text-slate-500">{r.student?.institution || '—'} · {r.student?.level}</div>
                  </div>
                  <div className="font-bold text-brand-700">{bnNum(r.marks)}/{bnNum(r.totalMarks)}</div>
                </li>
              ))}
            </ol>
          </div>
        ))}
        {!groups.length && (
          <div className="col-span-full text-center text-slate-500 py-8">এখনও পরীক্ষার ফলাফল প্রকাশ হয়নি।</div>
        )}
      </div>
    </div>
  );
}
