'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { bnNum, bnDay, bnTime, SUBJECT_BN, BATCH_TYPE_BN } from '@/lib/format';

export default function MyBatchesPage() {
  const { user, token } = useAuth();
  const [batches, setBatches] = useState<any[]>([]);

  useEffect(() => {
    if (!token || !user) return;
    (async () => {
      const ids = user.enrolledBatches || [];
      const bs: any[] = [];
      for (const id of ids) {
        try { bs.push(await api(`/batches/me/${id}`, { token })); } catch {}
      }
      setBatches(bs.filter(Boolean));
    })();
  }, [token, user]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">আমার ব্যাচ</h1>
      <div className="grid sm:grid-cols-2 gap-4">
        {batches.map((b) => (
          <div key={b._id} className="card">
            <div className="flex items-center justify-between mb-2">
              <span className={`badge ${b.type === 'premium' ? 'bg-amber-100 text-amber-800' : 'bg-brand-100 text-brand-800'}`}>
                {BATCH_TYPE_BN[b.type]}
              </span>
              <span className="text-xs text-slate-500">{b.code}</span>
            </div>
            <div className="font-semibold text-lg">{b.nameBn || b.name}</div>
            <div className="text-sm text-slate-600">{SUBJECT_BN[b.subject]}</div>
            <div className="mt-3 text-sm">
              <span className="font-medium">মাসিক ফি:</span> ৳{bnNum(b.monthlyFee)}
            </div>
            {b.schedule?.length ? (
              <div className="mt-2 text-xs text-slate-500">
                {b.schedule.map((s: any) => `${bnDay(s.day)} ${bnTime(s.startTime)}–${bnTime(s.endTime)}`).join(' • ')}
              </div>
            ) : null}
            {b.gmeetLink ? (
              <a href={b.gmeetLink} target="_blank" rel="noreferrer" className="btn-primary mt-3 w-full text-sm">
                📹 Google Meet-এ যোগ দিন
              </a>
            ) : (
              <div className="mt-3 text-sm text-amber-600">পেমেন্ট অনুমোদনের পর লিঙ্ক প্রকাশ পাবে।</div>
            )}
            <Link href={`/dashboard/batches/${b._id}`} className="btn-secondary mt-2 w-full text-sm">বিস্তারিত</Link>
          </div>
        ))}
        {!batches.length && (
          <div className="card text-center text-slate-600">
            আপনি এখনও কোনও ব্যাচে ভর্তি হননি।
          </div>
        )}
      </div>
    </div>
  );
}
