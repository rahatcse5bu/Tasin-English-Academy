'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { bnNum, bnDateTime } from '@/lib/format';

export default function AdminExamsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>(empty());
  const [resultsExam, setResultsExam] = useState<any | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [marks, setMarks] = useState<Record<string, string>>({});

  function empty() {
    return { batch: '', title: '', titleBn: '', description: '', scheduledAt: '', durationMinutes: 60, totalMarks: 100, googleFormUrl: '', status: 'scheduled' };
  }

  const load = async () => {
    setItems(await api<any[]>('/exams'));
    setBatches(await api<any[]>('/batches?all=1'));
  };
  useEffect(() => { load(); }, []);

  const start = (e?: any) => {
    if (e) {
      const dt = new Date(e.scheduledAt);
      const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setEditing(e);
      setForm({ ...e, batch: e.batch?._id || e.batch, scheduledAt: local });
    } else { setEditing(null); setForm(empty()); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, durationMinutes: Number(form.durationMinutes), totalMarks: Number(form.totalMarks), scheduledAt: new Date(form.scheduledAt).toISOString() };
    if (editing) await api(`/exams/${editing._id}`, { method: 'PATCH', token, body: JSON.stringify(payload) });
    else await api('/exams', { method: 'POST', token, body: JSON.stringify(payload) });
    setEditing(null); setForm(empty()); load();
  };

  const remove = async (id: string) => {
    if (!confirm('মুছবেন?')) return;
    await api(`/exams/${id}`, { method: 'DELETE', token });
    load();
  };

  const openResults = async (exam: any) => {
    setResultsExam(exam);
    const allUsers = await api<any[]>('/users', { token });
    const enrolled = allUsers.filter((s) => (s.enrolledBatches || []).map(String).includes(String(exam.batch?._id || exam.batch)));
    setStudents(enrolled);
    const r = await api<any[]>(`/exams/${exam._id}/results`);
    setResults(r);
    const m: Record<string, string> = {};
    r.forEach((x) => { m[String(x.student?._id || x.student)] = String(x.marks); });
    setMarks(m);
  };

  const saveResults = async () => {
    if (!resultsExam) return;
    const payload = students.map((s) => ({
      student: s._id,
      batch: resultsExam.batch?._id || resultsExam.batch,
      marks: Number(marks[s._id] || 0),
      totalMarks: resultsExam.totalMarks,
    }));
    await api(`/exams/${resultsExam._id}/results/bulk`, { method: 'POST', token, body: JSON.stringify({ results: payload }) });
    await api(`/exams/${resultsExam._id}`, { method: 'PATCH', token, body: JSON.stringify({ status: 'evaluated' }) });
    openResults(resultsExam);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold">পরীক্ষা ব্যবস্থাপনা</h1>
        <button className="btn-primary" onClick={() => start()}>নতুন পরীক্ষা</button>
      </div>

      <div className="card mb-6">
        <h2 className="font-semibold mb-3">{editing ? 'আপডেট' : 'নতুন পরীক্ষা'}</h2>
        <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">ব্যাচ *</label>
            <select className="input" required value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })}>
              <option value="">— নির্বাচন —</option>
              {batches.map((b) => <option key={b._id} value={b._id}>{b.code} — {b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">তারিখ ও সময় *</label>
            <input className="input" required type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} />
          </div>
          <Field label="শিরোনাম *" v={form.title} onChange={(v: string) => setForm({ ...form, title: v })} required />
          <Field label="শিরোনাম (বাংলা)" v={form.titleBn} onChange={(v: string) => setForm({ ...form, titleBn: v })} />
          <Field label="সময়কাল (মিনিট)" type="number" v={form.durationMinutes} onChange={(v: any) => setForm({ ...form, durationMinutes: v })} />
          <Field label="মোট নম্বর" type="number" v={form.totalMarks} onChange={(v: any) => setForm({ ...form, totalMarks: v })} />
          <div className="sm:col-span-2">
            <label className="label">Google Form URL</label>
            <input className="input" value={form.googleFormUrl} onChange={(e) => setForm({ ...form, googleFormUrl: e.target.value })} placeholder="https://forms.gle/..." />
          </div>
          <div>
            <label className="label">স্ট্যাটাস</label>
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="scheduled">scheduled</option>
              <option value="open">open</option>
              <option value="closed">closed</option>
              <option value="evaluated">evaluated</option>
            </select>
          </div>
          <div className="sm:col-span-2 flex gap-2">
            <button className="btn-primary">{editing ? 'আপডেট' : 'যোগ করুন'}</button>
            {editing && <button type="button" className="btn-secondary" onClick={() => start()}>বাতিল</button>}
          </div>
        </form>
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="table">
          <thead><tr><th>শিরোনাম</th><th>ব্যাচ</th><th>সময়</th><th>মোট নম্বর</th><th>স্ট্যাটাস</th><th>অ্যাকশন</th></tr></thead>
          <tbody>
            {items.map((e) => (
              <tr key={e._id}>
                <td>{e.titleBn || e.title}</td>
                <td>{e.batch?.code}</td>
                <td>{bnDateTime(e.scheduledAt)}</td>
                <td>{bnNum(e.totalMarks)}</td>
                <td><span className="badge bg-slate-100 text-slate-700">{e.status}</span></td>
                <td className="space-x-2">
                  <button className="text-brand-700" onClick={() => openResults(e)}>ফলাফল</button>
                  <button className="text-brand-700" onClick={() => start(e)}>সম্পাদনা</button>
                  <button className="text-red-600" onClick={() => remove(e._id)}>মুছুন</button>
                </td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan={6} className="text-center text-slate-500 py-6">কোনও পরীক্ষা নেই।</td></tr>}
          </tbody>
        </table>
      </div>

      {resultsExam && (
        <div className="card mt-6">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div>
              <h2 className="font-semibold">{resultsExam.titleBn || resultsExam.title} — ফলাফল</h2>
              <div className="text-xs text-slate-500">মোট নম্বর: {bnNum(resultsExam.totalMarks)}</div>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary" onClick={() => setResultsExam(null)}>বন্ধ</button>
              <button className="btn-primary" onClick={saveResults}>সংরক্ষণ ও র‍্যাঙ্ক</button>
            </div>
          </div>
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="table">
            <thead><tr><th>শিক্ষার্থী</th><th>প্রাপ্ত</th><th>র‍্যাঙ্ক</th></tr></thead>
            <tbody>
              {students.map((s) => {
                const r = results.find((x) => String(x.student?._id || x.student) === String(s._id));
                return (
                  <tr key={s._id}>
                    <td>{s.name}</td>
                    <td>
                      <input className="input max-w-[120px]" type="number" min={0} max={resultsExam.totalMarks}
                        value={marks[s._id] ?? ''} onChange={(e) => setMarks({ ...marks, [s._id]: e.target.value })} />
                    </td>
                    <td>{r?.rank ? bnNum(r.rank) : '—'}</td>
                  </tr>
                );
              })}
              {!students.length && <tr><td colSpan={3} className="text-center text-slate-500 py-6">কোনও শিক্ষার্থী নেই।</td></tr>}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, v, onChange, type = 'text', required }: any) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" type={type} value={v ?? ''} onChange={(e) => onChange(e.target.value)} required={required} />
    </div>
  );
}
