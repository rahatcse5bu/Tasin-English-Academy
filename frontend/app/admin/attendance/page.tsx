'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { bnDateTime } from '@/lib/format';

export default function AdminAttendancePage() {
  const { token } = useAuth();
  const [batches, setBatches] = useState<any[]>([]);
  const [batch, setBatch] = useState('');
  const [classes, setClasses] = useState<any[]>([]);
  const [classId, setClassId] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');

  useEffect(() => { (async () => setBatches(await api<any[]>('/batches?all=1')))(); }, []);

  useEffect(() => {
    if (!batch) { setClasses([]); return; }
    (async () => setClasses(await api<any[]>(`/classes?batch=${batch}`)))();
  }, [batch]);

  useEffect(() => {
    if (!batch) { setStudents([]); return; }
    (async () => {
      const all = await api<any[]>('/users', { token });
      setStudents(all.filter((s) => (s.enrolledBatches || []).map(String).includes(String(batch))));
    })();
  }, [batch, token]);

  useEffect(() => {
    if (!classId) { setMarks({}); return; }
    (async () => {
      const ex = await api<any[]>(`/attendance/class/${classId}`, { token });
      const m: Record<string, string> = {};
      ex.forEach((a) => { m[String(a.student?._id || a.student)] = a.status; });
      setMarks(m);
    })();
  }, [classId, token]);

  const save = async () => {
    if (!classId || !batch) return;
    const records = students.map((s) => ({
      classSession: classId,
      batch,
      student: s._id,
      status: marks[s._id] || 'absent',
    }));
    await api('/attendance/mark', { method: 'POST', token, body: JSON.stringify({ records }) });
    setMsg('উপস্থিতি সংরক্ষিত হয়েছে।');
    setTimeout(() => setMsg(''), 2000);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">উপস্থিতি ব্যবস্থাপনা</h1>
      <div className="card grid sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="label">ব্যাচ</label>
          <select className="input" value={batch} onChange={(e) => { setBatch(e.target.value); setClassId(''); }}>
            <option value="">— নির্বাচন —</option>
            {batches.map((b) => <option key={b._id} value={b._id}>{b.code} — {b.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">ক্লাস</label>
          <select className="input" value={classId} onChange={(e) => setClassId(e.target.value)} disabled={!batch}>
            <option value="">— নির্বাচন —</option>
            {classes.map((c) => <option key={c._id} value={c._id}>{c.title} — {bnDateTime(c.scheduledAt)}</option>)}
          </select>
        </div>
      </div>

      {classId && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">শিক্ষার্থী ({students.length})</h2>
            <button className="btn-primary" onClick={save}>সংরক্ষণ</button>
          </div>
          {msg && <div className="text-sm text-brand-700 mb-2">{msg}</div>}
          <table className="table">
            <thead><tr><th>নাম</th><th>ইমেইল</th><th>স্ট্যাটাস</th></tr></thead>
            <tbody>
              {students.map((s) => (
                <tr key={s._id}>
                  <td>{s.name}</td>
                  <td className="text-xs">{s.email}</td>
                  <td>
                    <select className="input max-w-[140px]" value={marks[s._id] || 'absent'} onChange={(e) => setMarks({ ...marks, [s._id]: e.target.value })}>
                      <option value="present">উপস্থিত</option>
                      <option value="absent">অনুপস্থিত</option>
                      <option value="late">বিলম্বিত</option>
                    </select>
                  </td>
                </tr>
              ))}
              {!students.length && <tr><td colSpan={3} className="text-center text-slate-500 py-6">কোনও শিক্ষার্থী নেই।</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
