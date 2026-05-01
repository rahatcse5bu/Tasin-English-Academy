import Link from 'next/link';
import { api } from '@/lib/api';
import { bnNum, bnDay, bnTime, bnDateTime, SUBJECT_BN, BATCH_TYPE_BN } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function BatchDetailPage({ params }: { params: { id: string } }) {
  const [batch, classes] = await Promise.all([
    api<any>(`/batches/${params.id}`).catch(() => null),
    api<any[]>(`/classes?batch=${params.id}`).catch(() => []),
  ]);
  if (!batch) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">ব্যাচ পাওয়া যায়নি</h1>
        <Link href="/batches" className="btn-primary mt-4">ফিরে যান</Link>
      </div>
    );
  }
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-12">
      <Link href="/batches" className="text-sm text-brand-700">← সব ব্যাচ</Link>
      <div className="mt-4 card">
        <div className="flex flex-wrap items-start gap-3 justify-between">
          <div className="min-w-0 flex-1">
            <span className={`badge ${batch.type === 'premium' ? 'bg-amber-100 text-amber-800' : 'bg-brand-100 text-brand-800'}`}>
              {BATCH_TYPE_BN[batch.type]}
            </span>
            <h1 className="mt-2 text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 break-words">{batch.nameBn || batch.name}</h1>
            <div className="text-slate-600 mt-1 text-sm sm:text-base">{SUBJECT_BN[batch.subject] || batch.subject} · {batch.code}</div>
          </div>
          <div className="text-right">
            <div className="text-xs sm:text-sm text-slate-500">মাসিক ফি</div>
            <div className="text-xl sm:text-2xl font-bold text-brand-700">৳{bnNum(batch.monthlyFee)}</div>
          </div>
        </div>

        {batch.descriptionBn && (
          <p className="mt-5 text-slate-700">{batch.descriptionBn}</p>
        )}

        <div className="mt-6 grid sm:grid-cols-3 gap-4">
          <Info label="মোট সিট" value={bnNum(batch.maxStudents)} />
          <Info label="ভর্তি হয়েছে" value={bnNum(batch.enrolledCount || 0)} />
          <Info label="বিনামূল্যে ক্লাস" value={`প্রথম ${bnNum(batch.freeClassCount || 3)}টি`} />
        </div>

        {batch.schedule?.length ? (
          <div className="mt-6">
            <h3 className="font-semibold text-slate-800 mb-2">সাপ্তাহিক সময়সূচি</h3>
            <ul className="grid sm:grid-cols-2 gap-2">
              {batch.schedule.map((s: any, i: number) => (
                <li key={i} className="rounded-lg bg-brand-50 px-3 py-2 text-sm">
                  <span className="font-medium">{bnDay(s.day)}</span>{' '}
                  <span className="text-slate-600">{bnTime(s.startTime)} – {bnTime(s.endTime)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {batch.teachers?.length ? (
          <div className="mt-6">
            <h3 className="font-semibold text-slate-800 mb-2">শিক্ষক</h3>
            <div className="flex flex-wrap gap-3">
              {batch.teachers.map((t: any) => (
                <div key={t._id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50">
                  <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 grid place-items-center font-bold">
                    {(t.name || '').slice(0, 1)}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{t.nameBn || t.name}</div>
                    <div className="text-xs text-slate-500">{t.designationBn || t.designation}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-6 rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
          🔒 <strong>ক্লাসের Google Meet লিঙ্ক</strong> শুধু নিবন্ধিত ও ভর্তি হওয়া শিক্ষার্থীরা ড্যাশবোর্ডে দেখতে পাবেন।
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/register" className="btn-primary">এই ব্যাচে ভর্তি হোন</Link>
          <Link href="/login" className="btn-secondary">ইতিমধ্যে অ্যাকাউন্ট আছে? লগইন</Link>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold text-slate-900 mb-3">আসন্ন ক্লাসসমূহ</h2>
        <div className="card p-0 overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>ক্লাস</th><th>তারিখ ও সময়</th><th>স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody>
              {classes.length ? classes.map((c: any) => (
                <tr key={c._id}>
                  <td>
                    <div className="font-medium">{c.titleBn || c.title}</div>
                    {c.topicBn && <div className="text-xs text-slate-500">{c.topicBn}</div>}
                  </td>
                  <td>{bnDateTime(c.scheduledAt)}</td>
                  <td><span className="badge bg-slate-100 text-slate-700">{c.status}</span></td>
                </tr>
              )) : (
                <tr><td colSpan={3} className="text-center text-slate-500 py-8">এখনও কোনও ক্লাস নির্ধারণ করা হয়নি।</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-semibold text-slate-900 mt-0.5">{value}</div>
    </div>
  );
}
