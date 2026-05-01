import Link from 'next/link';
import { api } from '@/lib/api';
import { bnNum, bnDay, bnTime, SUBJECT_BN, BATCH_TYPE_BN } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function BatchesPage() {
  const batches = await api<any[]>('/batches').catch(() => []);
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-12">
      <h1 className="text-3xl font-bold text-slate-900">ব্যাচসমূহ</h1>
      <p className="text-slate-600 mt-2">আপনার পছন্দের ব্যাচে ভর্তি হোন। প্রিমিয়াম ব্যাচে সর্বোচ্চ ১০ জন, জেনারেল ব্যাচে ২৫+ জন।</p>
      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {batches.map((b: any) => (
          <Link key={b._id} href={`/batches/${b._id}`} className="card hover:shadow-md transition block">
            <div className="flex items-center justify-between mb-2">
              <span className={`badge ${b.type === 'premium' ? 'bg-amber-100 text-amber-800' : 'bg-brand-100 text-brand-800'}`}>
                {BATCH_TYPE_BN[b.type]}
              </span>
              <span className="text-xs text-slate-500">{b.code}</span>
            </div>
            <div className="text-lg font-semibold">{b.nameBn || b.name}</div>
            <div className="text-sm text-slate-600 mt-1">{SUBJECT_BN[b.subject] || b.subject}</div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span><span className="font-medium">ফি:</span> ৳{bnNum(b.monthlyFee)}/মাস</span>
              <span>সিট: {bnNum(b.maxStudents - (b.enrolledCount || 0))}/{bnNum(b.maxStudents)}</span>
            </div>
            {b.schedule?.length ? (
              <div className="mt-3 text-xs text-slate-500">
                {b.schedule.map((s: any) => `${bnDay(s.day)} ${bnTime(s.startTime)}–${bnTime(s.endTime)}`).join(' • ')}
              </div>
            ) : null}
            {b.teachers?.length ? (
              <div className="mt-3 text-xs text-slate-600">
                শিক্ষক: {b.teachers.map((t: any) => t.nameBn || t.name).join(', ')}
              </div>
            ) : null}
          </Link>
        ))}
        {!batches.length && (
          <div className="col-span-full text-center text-slate-500 py-8">এখনও কোনও ব্যাচ যোগ করা হয়নি।</div>
        )}
      </div>
    </div>
  );
}
