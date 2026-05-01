'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

export default function AdminTeachersPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>(empty());

  function empty() {
    return { name: '', nameBn: '', designation: '', designationBn: '', subjects: '', qualification: '', qualificationBn: '', experienceYears: 0, bioBn: '', active: true, displayOrder: 0 };
  }

  const load = async () => setItems(await api<any[]>('/teachers'));
  useEffect(() => { load(); }, []);

  const start = (t?: any) => {
    if (t) {
      setEditing(t);
      setForm({ ...t, subjects: (t.subjects || []).join(', ') });
    } else {
      setEditing(null);
      setForm(empty());
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { ...form, subjects: String(form.subjects).split(',').map((s: string) => s.trim()).filter(Boolean), experienceYears: Number(form.experienceYears) || 0, displayOrder: Number(form.displayOrder) || 0 };
    if (editing) await api(`/teachers/${editing._id}`, { method: 'PATCH', token, body: JSON.stringify(payload) });
    else await api('/teachers', { method: 'POST', token, body: JSON.stringify(payload) });
    setEditing(null); setForm(empty()); load();
  };

  const remove = async (id: string) => {
    if (!confirm('মুছে ফেলবেন?')) return;
    await api(`/teachers/${id}`, { method: 'DELETE', token });
    load();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold">শিক্ষক ব্যবস্থাপনা</h1>
        <button className="btn-primary" onClick={() => start()}>নতুন শিক্ষক</button>
      </div>

      <div className="card mb-6">
        <h2 className="font-semibold mb-3">{editing ? 'আপডেট' : 'নতুন শিক্ষক'}</h2>
        <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3">
          <Field label="নাম *" v={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Field label="নাম (বাংলা)" v={form.nameBn} onChange={(v) => setForm({ ...form, nameBn: v })} />
          <Field label="পদবি *" v={form.designation} onChange={(v) => setForm({ ...form, designation: v })} required />
          <Field label="পদবি (বাংলা)" v={form.designationBn} onChange={(v) => setForm({ ...form, designationBn: v })} />
          <Field label="বিষয় (কমা দিয়ে)" v={form.subjects} onChange={(v) => setForm({ ...form, subjects: v })} />
          <Field label="অভিজ্ঞতা (বছর)" type="number" v={form.experienceYears} onChange={(v) => setForm({ ...form, experienceYears: v })} />
          <Field label="যোগ্যতা" v={form.qualification} onChange={(v) => setForm({ ...form, qualification: v })} />
          <Field label="যোগ্যতা (বাংলা)" v={form.qualificationBn} onChange={(v) => setForm({ ...form, qualificationBn: v })} />
          <div className="sm:col-span-2">
            <label className="label">পরিচিতি (বাংলা)</label>
            <textarea className="input" rows={3} value={form.bioBn} onChange={(e) => setForm({ ...form, bioBn: e.target.value })} />
          </div>
          <Field label="ডিসপ্লে অর্ডার" type="number" v={form.displayOrder} onChange={(v) => setForm({ ...form, displayOrder: v })} />
          <div className="flex items-center gap-2 pt-7">
            <input type="checkbox" id="active" checked={!!form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            <label htmlFor="active">সক্রিয়</label>
          </div>
          <div className="sm:col-span-2 flex gap-2">
            <button className="btn-primary">{editing ? 'আপডেট' : 'যোগ করুন'}</button>
            {editing && <button type="button" className="btn-secondary" onClick={() => start()}>বাতিল</button>}
          </div>
        </form>
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="table">
          <thead><tr><th>নাম</th><th>পদবি</th><th>বিষয়</th><th>সক্রিয়</th><th>অ্যাকশন</th></tr></thead>
          <tbody>
            {items.map((t) => (
              <tr key={t._id}>
                <td>{t.nameBn || t.name}</td>
                <td>{t.designationBn || t.designation}</td>
                <td className="text-xs">{t.subjects?.join(', ')}</td>
                <td>{t.active ? '✓' : '✗'}</td>
                <td className="space-x-2">
                  <button className="text-brand-700" onClick={() => start(t)}>সম্পাদনা</button>
                  <button className="text-red-600" onClick={() => remove(t._id)}>মুছুন</button>
                </td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan={5} className="text-center text-slate-500 py-6">কোনও শিক্ষক নেই।</td></tr>}
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
