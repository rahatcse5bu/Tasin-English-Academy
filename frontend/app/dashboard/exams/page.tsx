'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { bnNum, bnDateTime } from '@/lib/format';

export default function ExamsPage() {
  const { user, token } = useAuth();
  const [results, setResults] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);

  useEffect(() => {
    if (!token || !user) return;
    (async () => {
      try { setResults(await api<any[]>('/exams/me/results', { token })); } catch {}
      const ex: any[] = [];
      for (const id of user.enrolledBatches || []) {
        try {
          const e = await api<any[]>(`/exams?batch=${id}`, { token });
          ex.push(...e);
        } catch {}
      }
      setExams(ex);
    })();
  }, [token, user]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">পরীক্ষা ও ফলাফল</h1>

      <h2 className="font-semibold mb-2">আসন্ন/সম্প্রতি পরীক্ষা</h2>
      <div className="card p-0 overflow-x-auto mb-6">
        <table className="table">
          <thead><tr><th>পরীক্ষা</th><th>সময়</th><th>মোট নম্বর</th><th>স্ট্যাটাস</th><th>ফর্ম</th></tr></thead>
          <tbody>
            {exams.map((e) => (
              <tr key={e._id}>
                <td>{e.titleBn || e.title}</td>
                <td>{bnDateTime(e.scheduledAt)}</td>
                <td>{bnNum(e.totalMarks)}</td>
                <td><span className="badge bg-slate-100 text-slate-700">{e.status}</span></td>
                <td>
                  {e.googleFormUrl ? (
                    <a href={e.googleFormUrl} target="_blank" rel="noreferrer" className="text-brand-700">যোগ দিন</a>
                  ) : <span className="text-slate-400">—</span>}
                </td>
              </tr>
            ))}
            {!exams.length && <tr><td colSpan={5} className="text-center text-slate-500 py-6">কোনও পরীক্ষা নেই।</td></tr>}
          </tbody>
        </table>
      </div>

      <h2 className="font-semibold mb-2">আমার ফলাফল</h2>
      <div className="card p-0 overflow-x-auto">
        <table className="table">
          <thead><tr><th>পরীক্ষা</th><th>ব্যাচ</th><th>প্রাপ্ত নম্বর</th><th>র‍্যাঙ্ক</th></tr></thead>
          <tbody>
            {results.map((r) => (
              <tr key={r._id}>
                <td>{r.exam?.title}</td>
                <td>{r.batch?.name}</td>
                <td>{bnNum(r.marks)}/{bnNum(r.totalMarks)}</td>
                <td>{r.rank ? bnNum(r.rank) : '—'}</td>
              </tr>
            ))}
            {!results.length && <tr><td colSpan={4} className="text-center text-slate-500 py-6">এখনও কোনও ফলাফল নেই।</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
