'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { bnDateTime } from '@/lib/format';

export default function AdminClassesPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>(empty());

  function empty() {
    return { batch: '', title: '', titleBn: '', topic: '', topicBn: '', scheduledAt: '', durationMinutes: 90, gmeetLink: '', status: 'scheduled' };
  }

  const load = async () => {
    const url = filter ? `/classes?batch=${filter}` : '/classes';
    setItems(await api<any[]>(url));
    setBatches(await api<any[]>('/batches?all=1'));
  };
  useEffect(() => { load(); }, [filter]);

  const start = (c?: any) => {
    if (c) {
      const dt = new Date(c.scheduledAt);
      const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setEditing(c);
      setForm({ ...c, batch: c.batch?._id || c.batch, scheduledAt: local });
    } else {
      setEditing(null);
      setForm(empty());
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, durationMinutes: Number(form.durationMinutes), scheduledAt: new Date(form.scheduledAt).toISOString() };
    if (editing) await api(`/classes/${editing._id}`, { method: 'PATCH', token, body: JSON.stringify(payload) });
    else await api('/classes', { method: 'POST', token, body: JSON.stringify(payload) });
    setEditing(null); setForm(empty()); load();
  };

  const remove = async (id: string) => {
    if (!confirm('মুছবেন?')) return;
    await api(`/classes/${id}`, { method: 'DELETE', token });
    load();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold">ক্লাস ব্যবস্থাপনা</h1>
        <select className="input w-full sm:max-w-xs" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">— সব ব্যাচ —</option>
          {batches.map((b) => <option key={b._id} value={b._id}>{b.code}</option>)}
        </select>
      </div>

      <div className="card mb-6">
        <h2 className="font-semibold mb-3">{editing ? 'আপডেট' : 'নতুন ক্লাস'}</h2>
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
          <Field label="টপিক" v={form.topic} onChange={(v: string) => setForm({ ...form, topic: v })} />
          <Field label="টপিক (বাংলা)" v={form.topicBn} onChange={(v: string) => setForm({ ...form, topicBn: v })} />
          <Field label="সময়কাল (মিনিট)" type="number" v={form.durationMinutes} onChange={(v: any) => setForm({ ...form, durationMinutes: v })} />
          <div>
            <label className="label">স্ট্যাটাস</label>
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="scheduled">scheduled</option>
              <option value="live">live</option>
              <option value="completed">completed</option>
              <option value="cancelled">cancelled</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Google Meet লিঙ্ক (ব্যাচের লিঙ্ক ওভাররাইড)</label>
            <input className="input" value={form.gmeetLink || ''} onChange={(e) => setForm({ ...form, gmeetLink: e.target.value })} />
          </div>
          <div className="sm:col-span-2 flex gap-2">
            <button className="btn-primary">{editing ? 'আপডেট' : 'যোগ করুন'}</button>
            {editing && <button type="button" className="btn-secondary" onClick={() => start()}>বাতিল</button>}
          </div>
        </form>
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="table">
          <thead><tr><th>শিরোনাম</th><th>সময়</th><th>সময়কাল</th><th>স্ট্যাটাস</th><th>অ্যাকশন</th></tr></thead>
          <tbody>
            {items.map((c) => (
              <tr key={c._id}>
                <td>{c.titleBn || c.title}</td>
                <td>{bnDateTime(c.scheduledAt)}</td>
                <td>{c.durationMinutes}m</td>
                <td><span className="badge bg-slate-100 text-slate-700">{c.status}</span></td>
                <td className="space-x-2">
                  <button className="text-brand-700" onClick={() => start(c)}>সম্পাদনা</button>
                  <button className="text-red-600" onClick={() => remove(c._id)}>মুছুন</button>
                </td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan={5} className="text-center text-slate-500 py-6">কোনও ক্লাস নেই।</td></tr>}
          </tbody>
        </table>
      </div>
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
