'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { bnNum, bnDateTime, BATCH_TYPE_BN } from '@/lib/format';

export default function DashboardPage() {
  const { user, token } = useAuth();
  const [batches, setBatches] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [classes, setClasses] = useState<any[]>([]);

  useEffect(() => {
    if (!token || !user) return;
    (async () => {
      const ids = user.enrolledBatches || [];
      const bs: any[] = [];
      for (const id of ids) {
        try { bs.push(await api(`/batches/me/${id}`, { token })); } catch {}
      }
      setBatches(bs.filter(Boolean));

      const cls: any[] = [];
      for (const b of bs) {
        try {
          const c = await api<any[]>(`/classes?batch=${b._id}`, { token });
          cls.push(...c.slice(0, 3).map((x) => ({ ...x, batchName: b.nameBn || b.name })));
        } catch {}
      }
      setClasses(cls.sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt)));

      try { setPayments(await api<any[]>('/payments/me', { token })); } catch {}
      try { setStats(await api('/attendance/me/stats', { token })); } catch {}
    })();
  }, [token, user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">স্বাগতম, {user?.name}!</h1>
        <p className="text-slate-600 text-sm">আপনার পড়াশোনার সকল তথ্য এক জায়গায়।</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Stat label="ভর্তি ব্যাচ" value={bnNum(batches.length)} />
        <Stat label="মোট পেমেন্ট" value={bnNum(payments.filter((p) => p.status === 'approved').length)} />
        <Stat label="উপস্থিতি" value={bnNum(stats.present || 0)} />
      </div>

      <div>
        <h2 className="font-semibold mb-3">আমার ব্যাচ ও Google Meet লিঙ্ক</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {batches.map((b) => (
            <div key={b._id} className="card">
              <div className="flex items-center justify-between mb-2">
                <span className={`badge ${b.type === 'premium' ? 'bg-amber-100 text-amber-800' : 'bg-brand-100 text-brand-800'}`}>
                  {BATCH_TYPE_BN[b.type]}
                </span>
                <Link href={`/dashboard/batches/${b._id}`} className="text-sm text-brand-700">বিস্তারিত →</Link>
              </div>
              <div className="font-semibold">{b.nameBn || b.name}</div>
              {b.gmeetLink ? (
                <a href={b.gmeetLink} target="_blank" rel="noreferrer" className="btn-primary mt-3 w-full">
                  📹 Google Meet-এ যোগ দিন
                </a>
              ) : (
                <div className="mt-3 text-sm text-amber-600">পেমেন্ট অনুমোদনের পর লিঙ্ক প্রকাশ পাবে।</div>
              )}
            </div>
          ))}
          {!batches.length && (
            <div className="col-span-full card text-center text-slate-600">
              আপনি এখনও কোনও ব্যাচে ভর্তি হননি।{' '}
              <Link href="/batches" className="text-brand-700 font-medium">ব্যাচ দেখুন</Link>
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="font-semibold mb-3">আসন্ন ক্লাস</h2>
        <div className="card p-0 overflow-x-auto">
          <table className="table">
            <thead><tr><th>ক্লাস</th><th>ব্যাচ</th><th>সময়</th></tr></thead>
            <tbody>
              {classes.length ? classes.slice(0, 8).map((c) => (
                <tr key={c._id}>
                  <td>{c.titleBn || c.title}</td>
                  <td className="text-slate-600">{c.batchName}</td>
                  <td>{bnDateTime(c.scheduledAt)}</td>
                </tr>
              )) : (
                <tr><td colSpan={3} className="text-center text-slate-500 py-6">কোনও ক্লাস নেই।</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card text-center">
      <div className="text-3xl font-bold text-brand-700">{value}</div>
      <div className="text-sm text-slate-600 mt-1">{label}</div>
    </div>
  );
}
