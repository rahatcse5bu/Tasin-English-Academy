'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { bnNum, SUBJECT_BN, BATCH_TYPE_BN } from '@/lib/format';

const DAYS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export default function AdminBatchesPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>(empty());

  function empty() {
    return {
      name: '', nameBn: '', code: '', type: 'general', subject: 'HSC_ENGLISH_1ST',
      description: '', descriptionBn: '', monthlyFee: 350, maxStudents: 30,
      teachers: [], schedule: [{ day: 'Sat', startTime: '20:00', endTime: '21:30' }],
      gmeetLink: '', freeClassCount: 3, active: true,
    };
  }

  const load = async () => {
    setItems(await api<any[]>('/batches?all=1'));
    setTeachers(await api<any[]>('/teachers'));
  };
  useEffect(() => { load(); }, []);

  const start = (b?: any) => {
    if (b) {
      setEditing(b);
      setForm({ ...b, teachers: (b.teachers || []).map((t: any) => t._id || t), schedule: b.schedule || [] });
    } else {
      setEditing(null);
      setForm(empty());
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, monthlyFee: Number(form.monthlyFee), maxStudents: Number(form.maxStudents), freeClassCount: Number(form.freeClassCount) };
    if (editing) await api(`/batches/${editing._id}`, { method: 'PATCH', token, body: JSON.stringify(payload) });
    else await api('/batches', { method: 'POST', token, body: JSON.stringify(payload) });
    setEditing(null); setForm(empty()); load();
  };

  const remove = async (id: string) => {
    if (!confirm('মুছবেন?')) return;
    await api(`/batches/${id}`, { method: 'DELETE', token });
    load();
  };

  const updateSchedule = (i: number, k: string, v: string) => {
    const sch = [...form.schedule];
    sch[i] = { ...sch[i], [k]: v };
    setForm({ ...form, schedule: sch });
  };
  const addSlot = () => setForm({ ...form, schedule: [...form.schedule, { day: 'Sat', startTime: '20:00', endTime: '21:30' }] });
  const removeSlot = (i: number) => setForm({ ...form, schedule: form.schedule.filter((_: any, idx: number) => idx !== i) });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold">ব্যাচ ব্যবস্থাপনা</h1>
        <button className="btn-primary" onClick={() => start()}>নতুন ব্যাচ</button>
      </div>

      <div className="card mb-6">
        <h2 className="font-semibold mb-3">{editing ? 'আপডেট' : 'নতুন ব্যাচ'}</h2>
        <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3">
          <Field label="নাম *" v={form.name} onChange={(v: string) => setForm({ ...form, name: v })} required />
          <Field label="নাম (বাংলা)" v={form.nameBn} onChange={(v: string) => setForm({ ...form, nameBn: v })} />
          <Field label="কোড *" v={form.code} onChange={(v: string) => setForm({ ...form, code: v })} required />
          <div>
            <label className="label">ধরন</label>
            <select className="input" value={form.type} onChange={(e) => {
              const t = e.target.value;
              setForm({ ...form, type: t, maxStudents: t === 'premium' ? 10 : 30 });
            }}>
              <option value="general">জেনারেল (২৫+)</option>
              <option value="premium">প্রিমিয়াম (১০)</option>
            </select>
          </div>
          <div>
            <label className="label">বিষয়</label>
            <select className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
              {Object.entries(SUBJECT_BN).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <Field label="মাসিক ফি" type="number" v={form.monthlyFee} onChange={(v: any) => setForm({ ...form, monthlyFee: v })} />
          <Field label="সর্বোচ্চ ছাত্র" type="number" v={form.maxStudents} onChange={(v: any) => setForm({ ...form, maxStudents: v })} />
          <Field label="ফ্রি ক্লাস (প্রথম N)" type="number" v={form.freeClassCount} onChange={(v: any) => setForm({ ...form, freeClassCount: v })} />
          <div className="sm:col-span-2">
            <label className="label">Google Meet লিঙ্ক</label>
            <input className="input" value={form.gmeetLink} onChange={(e) => setForm({ ...form, gmeetLink: e.target.value })} placeholder="https://meet.google.com/abc-defg-hij" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">বিবরণ (বাংলা)</label>
            <textarea className="input" rows={2} value={form.descriptionBn} onChange={(e) => setForm({ ...form, descriptionBn: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">শিক্ষক</label>
            <select multiple className="input min-h-[100px]" value={form.teachers} onChange={(e) => {
              const opts = Array.from(e.target.selectedOptions).map((o) => o.value);
              setForm({ ...form, teachers: opts });
            }}>
              {teachers.map((t) => <option key={t._id} value={t._id}>{t.nameBn || t.name}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">সাপ্তাহিক সময়সূচি</label>
            <div className="space-y-2">
              {form.schedule.map((s: any, i: number) => (
                <div key={i} className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2">
                  <select className="input" value={s.day} onChange={(e) => updateSchedule(i, 'day', e.target.value)}>
                    {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <button type="button" className="btn-danger text-sm sm:order-last" onClick={() => removeSlot(i)} aria-label="remove slot">× মুছুন</button>
                  <input className="input" type="time" value={s.startTime} onChange={(e) => updateSchedule(i, 'startTime', e.target.value)} />
                  <input className="input" type="time" value={s.endTime} onChange={(e) => updateSchedule(i, 'endTime', e.target.value)} />
                </div>
              ))}
              <button type="button" className="btn-secondary text-sm" onClick={addSlot}>+ স্লট যোগ</button>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-7">
            <input type="checkbox" id="b-active" checked={!!form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            <label htmlFor="b-active">সক্রিয়</label>
          </div>
          <div className="sm:col-span-2 flex gap-2">
            <button className="btn-primary">{editing ? 'আপডেট' : 'যোগ করুন'}</button>
            {editing && <button type="button" className="btn-secondary" onClick={() => start()}>বাতিল</button>}
          </div>
        </form>
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="table">
          <thead><tr><th>নাম</th><th>কোড</th><th>ধরন</th><th>বিষয়</th><th>ফি</th><th>সিট</th><th>অ্যাকশন</th></tr></thead>
          <tbody>
            {items.map((b) => (
              <tr key={b._id}>
                <td>{b.nameBn || b.name}</td>
                <td className="font-mono text-xs">{b.code}</td>
                <td>{BATCH_TYPE_BN[b.type]}</td>
                <td className="text-xs">{SUBJECT_BN[b.subject]}</td>
                <td>৳{bnNum(b.monthlyFee)}</td>
                <td>{bnNum(b.enrolledCount || 0)}/{bnNum(b.maxStudents)}</td>
                <td className="space-x-2">
                  <button className="text-brand-700" onClick={() => start(b)}>সম্পাদনা</button>
                  <button className="text-red-600" onClick={() => remove(b._id)}>মুছুন</button>
                </td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan={7} className="text-center text-slate-500 py-6">কোনও ব্যাচ নেই।</td></tr>}
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
