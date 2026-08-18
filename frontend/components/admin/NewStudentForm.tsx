'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

/**
 * Admission form for one student.
 *
 * Only name, email and password are required. The office often has a phone
 * number and little else at the counter, and a form that refuses to save until
 * every box is filled just gets worked around with placeholder data.
 */

const DIVISIONS = ['Barishal', 'Chattogram', 'Dhaka', 'Khulna', 'Mymensingh', 'Rajshahi', 'Rangpur', 'Sylhet'];

const input = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none';
const label = 'block text-xs font-semibold text-slate-600 mb-1';

type Form = Record<string, string>;
const EMPTY: Form = {
  name: '', email: '', password: '', phone: '', institution: '', level: '',
  session: '', batchName: '', studentId: '', guardianName: '', guardianPhone: '',
  division: '', district: '', upazila: '', address: '',
};

export default function NewStudentForm({
  batches,
  onCreated,
}: {
  batches: any[];
  onCreated: () => void;
}) {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<Form>(EMPTY);
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });

  /** Six digits from the phone is easier to read out than a random string. */
  const suggestPassword = () =>
    setF({ ...f, password: 'tea' + (f.phone.replace(/\D/g, '').slice(-6) || Math.floor(100000 + Math.random() * 900000)) });

  async function save() {
    setBusy(true);
    setErr('');
    setOk('');
    try {
      const body: any = { batches: picked };
      for (const [k, v] of Object.entries(f)) if (v.trim()) body[k] = v.trim();

      const s = await api<any>('/users/student', {
        method: 'POST',
        token: token || undefined,
        body: JSON.stringify(body),
      });
      setOk(`${s.name} যুক্ত হয়েছে — লগইন: ${s.email}`);
      setF(EMPTY);
      setPicked([]);
      onCreated();
    } catch (e: any) {
      setErr(e.message || 'সংরক্ষণ করা যায়নি');
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button className="btn-primary mb-4" onClick={() => setOpen(true)}>
        + নতুন শিক্ষার্থী
      </button>
    );
  }

  return (
    <div className="card mb-6">
      <div className="flex items-baseline gap-3">
        <h2 className="font-bold text-slate-900">নতুন শিক্ষার্থী ভর্তি</h2>
        <button className="ml-auto text-sm text-slate-500" onClick={() => setOpen(false)}>
          বন্ধ করুন
        </button>
      </div>
      <p className="text-xs text-slate-500 mt-1">
        নাম, ইমেইল ও পাসওয়ার্ড আবশ্যক — বাকিগুলো পরেও পূরণ করা যাবে।
      </p>

      <div className="mt-4 grid sm:grid-cols-3 gap-3">
        <div>
          <label className={label}>নাম *</label>
          <input className={input} value={f.name} onChange={set('name')} />
        </div>
        <div>
          <label className={label}>ইমেইল *</label>
          <input className={input} value={f.email} onChange={set('email')} placeholder="student@example.com" />
        </div>
        <div>
          <label className={label}>ফোন</label>
          <input className={input} value={f.phone} onChange={set('phone')} placeholder="01XXXXXXXXX" />
        </div>

        <div>
          <label className={label}>পাসওয়ার্ড *</label>
          <div className="flex gap-2">
            <input className={input} value={f.password} onChange={set('password')} />
            <button className="btn-secondary whitespace-nowrap text-xs" onClick={suggestPassword} type="button">
              তৈরি
            </button>
          </div>
        </div>
        <div>
          <label className={label}>ক্লাস</label>
          <select className={input} value={f.level} onChange={set('level')}>
            <option value="">— নির্বাচন —</option>
            <option value="SSC">SSC</option>
            <option value="HSC">HSC</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className={label}>সেশন</label>
          <input className={input} value={f.session} onChange={set('session')} placeholder="2025-26" />
        </div>

        <div className="sm:col-span-2">
          <label className={label}>প্রতিষ্ঠান</label>
          <input className={input} value={f.institution} onChange={set('institution')} placeholder="স্কুল / কলেজের নাম" />
        </div>
        <div>
          <label className={label}>রোল / আইডি</label>
          <input className={input} value={f.studentId} onChange={set('studentId')} />
        </div>

        <div>
          <label className={label}>ব্যাচের নাম</label>
          <input className={input} value={f.batchName} onChange={set('batchName')} placeholder="যেমন: HSC-26 সকাল" />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>ব্যাচে যুক্ত করুন</label>
          <div className="flex flex-wrap gap-1.5">
            {batches.map((b) => (
              <button
                key={b._id}
                type="button"
                onClick={() =>
                  setPicked((v) => (v.includes(b._id) ? v.filter((x) => x !== b._id) : [...v, b._id]))
                }
                className={`badge border ${
                  picked.includes(b._id)
                    ? 'bg-brand-600 border-brand-600 text-white'
                    : 'bg-white border-slate-300 text-slate-600'
                }`}
              >
                {b.code}
              </button>
            ))}
            {!batches.length && <span className="text-xs text-slate-400">কোনো ব্যাচ নেই</span>}
          </div>
        </div>

        <div>
          <label className={label}>বিভাগ</label>
          <select className={input} value={f.division} onChange={set('division')}>
            <option value="">— নির্বাচন —</option>
            {DIVISIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>জেলা</label>
          <input className={input} value={f.district} onChange={set('district')} />
        </div>
        <div>
          <label className={label}>উপজেলা / থানা</label>
          <input className={input} value={f.upazila} onChange={set('upazila')} />
        </div>

        <div>
          <label className={label}>অভিভাবকের নাম</label>
          <input className={input} value={f.guardianName} onChange={set('guardianName')} />
        </div>
        <div>
          <label className={label}>অভিভাবকের ফোন</label>
          <input className={input} value={f.guardianPhone} onChange={set('guardianPhone')} />
        </div>
        <div>
          <label className={label}>ঠিকানা</label>
          <input className={input} value={f.address} onChange={set('address')} />
        </div>
      </div>

      {err && <p className="text-sm text-rose-600 mt-3">{err}</p>}
      {ok && <p className="text-sm text-emerald-700 mt-3">{ok}</p>}

      <div className="mt-4 flex gap-2 justify-end">
        <button className="btn-secondary" onClick={() => { setF(EMPTY); setPicked([]); setErr(''); setOk(''); }} disabled={busy}>
          ফাঁকা করুন
        </button>
        <button
          className="btn-primary"
          onClick={save}
          disabled={busy || !f.name.trim() || !f.email.trim() || f.password.length < 6}
        >
          {busy ? 'সংরক্ষণ হচ্ছে…' : 'শিক্ষার্থী যুক্ত করুন'}
        </button>
      </div>
    </div>
  );
}
