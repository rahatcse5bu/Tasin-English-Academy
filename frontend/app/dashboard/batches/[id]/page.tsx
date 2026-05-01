'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { bnNum, bnDay, bnTime, bnDateTime, SUBJECT_BN, BATCH_TYPE_BN } from '@/lib/format';

export default function MyBatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const [batch, setBatch] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);

  useEffect(() => {
    if (!token || !id) return;
    (async () => {
      try { setBatch(await api(`/batches/me/${id}`, { token })); } catch {}
      try { setClasses(await api<any[]>(`/classes?batch=${id}`, { token })); } catch {}
    })();
  }, [token, id]);

  if (!batch) return <div className="text-slate-500">লোড হচ্ছে…</div>;

  return (
    <div>
      <div className="card">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div>
            <span className={`badge ${batch.type === 'premium' ? 'bg-amber-100 text-amber-800' : 'bg-brand-100 text-brand-800'}`}>
              {BATCH_TYPE_BN[batch.type]}
            </span>
            <h1 className="mt-2 text-2xl font-bold">{batch.nameBn || batch.name}</h1>
            <div className="text-slate-600 text-sm">{SUBJECT_BN[batch.subject]} · {batch.code}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">মাসিক ফি</div>
            <div className="text-xl font-bold text-brand-700">৳{bnNum(batch.monthlyFee)}</div>
          </div>
        </div>

        {batch.descriptionBn && <p className="mt-3 text-slate-700">{batch.descriptionBn}</p>}

        {batch.schedule?.length ? (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">সময়সূচি</h3>
            <ul className="grid sm:grid-cols-2 gap-2">
              {batch.schedule.map((s: any, i: number) => (
                <li key={i} className="rounded-lg bg-brand-50 px-3 py-2 text-sm">
                  {bnDay(s.day)} — {bnTime(s.startTime)} থেকে {bnTime(s.endTime)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {batch.gmeetLink ? (
          <a href={batch.gmeetLink} target="_blank" rel="noreferrer" className="btn-primary mt-4 w-full">
            📹 Google Meet-এ যোগ দিন
          </a>
        ) : (
          <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
            🔒 Google Meet লিঙ্ক দেখতে পেমেন্ট অনুমোদিত হতে হবে।
          </div>
        )}
      </div>

      <h2 className="text-xl font-bold mt-6 mb-3">ক্লাসসমূহ</h2>
      <div className="card p-0 overflow-x-auto">
        <table className="table">
          <thead><tr><th>শিরোনাম</th><th>সময়</th><th>লিঙ্ক</th><th>স্ট্যাটাস</th></tr></thead>
          <tbody>
            {classes.map((c) => (
              <tr key={c._id}>
                <td>
                  <div className="font-medium">{c.titleBn || c.title}</div>
                  {c.topicBn && <div className="text-xs text-slate-500">{c.topicBn}</div>}
                </td>
                <td>{bnDateTime(c.scheduledAt)}</td>
                <td>
                  {c.gmeetLink ? (
                    <a href={c.gmeetLink} target="_blank" rel="noreferrer" className="text-brand-700">যোগ দিন</a>
                  ) : <span className="text-slate-400">—</span>}
                </td>
                <td><span className="badge bg-slate-100 text-slate-700">{c.status}</span></td>
              </tr>
            ))}
            {!classes.length && <tr><td colSpan={4} className="text-center text-slate-500 py-6">কোনও ক্লাস নেই।</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
