'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { RESOURCE_KIND_BN } from '@/lib/format';

export default function AdminResourcesPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>(empty());

  function empty() {
    return { title: '', titleBn: '', kind: 'tips', level: 'BOTH', subject: '', body: '', bodyBn: '', fileUrl: '', batch: '', isPublic: true, tags: '' };
  }

  const load = async () => {
    setItems(await api<any[]>('/resources', { token }));
    setBatches(await api<any[]>('/batches?all=1'));
  };
  useEffect(() => { load(); }, [token]);

  const start = (r?: any) => {
    if (r) {
      setEditing(r);
      setForm({ ...r, batch: r.batch || '', tags: (r.tags || []).join(', ') });
    } else { setEditing(null); setForm(empty()); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { ...form, tags: String(form.tags || '').split(',').map((s: string) => s.trim()).filter(Boolean) };
    if (!payload.batch) delete payload.batch;
    if (editing) await api(`/resources/${editing._id}`, { method: 'PATCH', token, body: JSON.stringify(payload) });
    else await api('/resources', { method: 'POST', token, body: JSON.stringify(payload) });
    setEditing(null); setForm(empty()); load();
  };

  const remove = async (id: string) => {
    if (!confirm('মুছবেন?')) return;
    await api(`/resources/${id}`, { method: 'DELETE', token });
    load();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold">রিসোর্স ব্যবস্থাপনা</h1>
        <button className="btn-primary" onClick={() => start()}>নতুন রিসোর্স</button>
      </div>

      <div className="card mb-6">
        <h2 className="font-semibold mb-3">{editing ? 'আপডেট' : 'নতুন রিসোর্স'}</h2>
        <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3">
          <Field label="শিরোনাম *" v={form.title} onChange={(v: string) => setForm({ ...form, title: v })} required />
          <Field label="শিরোনাম (বাংলা)" v={form.titleBn} onChange={(v: string) => setForm({ ...form, titleBn: v })} />
          <div>
            <label className="label">ধরন</label>
            <select className="input" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
              {Object.entries(RESOURCE_KIND_BN).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="label">স্তর</label>
            <select className="input" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
              <option value="BOTH">উভয়</option>
              <option value="HSC">এইচএসসি</option>
              <option value="SSC">এসএসসি</option>
            </select>
          </div>
          <Field label="বিষয়" v={form.subject} onChange={(v: string) => setForm({ ...form, subject: v })} />
          <Field label="ফাইল URL" v={form.fileUrl} onChange={(v: string) => setForm({ ...form, fileUrl: v })} />
          <div>
            <label className="label">ব্যাচ-স্কোপ (ঐচ্ছিক)</label>
            <select className="input" value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })}>
              <option value="">— পাবলিক/সব —</option>
              {batches.map((b) => <option key={b._id} value={b._id}>{b.code}</option>)}
            </select>
          </div>
          <Field label="ট্যাগ (কমা দিয়ে)" v={form.tags} onChange={(v: string) => setForm({ ...form, tags: v })} />
          <div className="sm:col-span-2">
            <label className="label">বিবরণ (বাংলা)</label>
            <textarea className="input" rows={4} value={form.bodyBn} onChange={(e) => setForm({ ...form, bodyBn: e.target.value })} />
          </div>
          <div className="flex items-center gap-2 pt-7">
            <input type="checkbox" id="r-public" checked={!!form.isPublic} onChange={(e) => setForm({ ...form, isPublic: e.target.checked })} />
            <label htmlFor="r-public">পাবলিক (visitor রা দেখতে পাবেন)</label>
          </div>
          <div className="sm:col-span-2 flex gap-2">
            <button className="btn-primary">{editing ? 'আপডেট' : 'যোগ করুন'}</button>
            {editing && <button type="button" className="btn-secondary" onClick={() => start()}>বাতিল</button>}
          </div>
        </form>
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="table">
          <thead><tr><th>শিরোনাম</th><th>ধরন</th><th>স্তর</th><th>পাবলিক</th><th>অ্যাকশন</th></tr></thead>
          <tbody>
            {items.map((r) => (
              <tr key={r._id}>
                <td>{r.titleBn || r.title}</td>
                <td>{RESOURCE_KIND_BN[r.kind]}</td>
                <td>{r.level}</td>
                <td>{r.isPublic ? '✓' : '✗'}</td>
                <td className="space-x-2">
                  <button className="text-brand-700" onClick={() => start(r)}>সম্পাদনা</button>
                  <button className="text-red-600" onClick={() => remove(r._id)}>মুছুন</button>
                </td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan={5} className="text-center text-slate-500 py-6">কোনও রিসোর্স নেই।</td></tr>}
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
