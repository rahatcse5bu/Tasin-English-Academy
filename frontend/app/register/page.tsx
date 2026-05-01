'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', institution: '', level: 'HSC', address: '',
  });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (k: string, v: string) => setForm((s) => ({ ...s, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await register(form);
      router.push('/dashboard');
    } catch (e: any) {
      setErr(e.message || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-12">
      <div className="card">
        <h1 className="text-2xl font-bold text-center text-slate-900">শিক্ষার্থী রেজিস্ট্রেশন</h1>
        <p className="text-center text-slate-600 text-sm mt-1">আপনার তথ্য দিয়ে অ্যাকাউন্ট তৈরি করুন</p>
        <form onSubmit={submit} className="mt-6 grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">পূর্ণ নাম *</label>
            <input className="input" required value={form.name} onChange={(e) => update('name', e.target.value)} />
          </div>
          <div>
            <label className="label">ইমেইল *</label>
            <input className="input" type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} />
          </div>
          <div>
            <label className="label">মোবাইল</label>
            <input className="input" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="01XXXXXXXXX" />
          </div>
          <div>
            <label className="label">পাসওয়ার্ড *</label>
            <input className="input" type="password" required minLength={6} value={form.password} onChange={(e) => update('password', e.target.value)} />
          </div>
          <div>
            <label className="label">স্তর</label>
            <select className="input" value={form.level} onChange={(e) => update('level', e.target.value)}>
              <option value="HSC">এইচএসসি</option>
              <option value="SSC">এসএসসি</option>
              <option value="Other">অন্যান্য</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">প্রতিষ্ঠান (স্কুল/কলেজ)</label>
            <input className="input" value={form.institution} onChange={(e) => update('institution', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">ঠিকানা</label>
            <input className="input" value={form.address} onChange={(e) => update('address', e.target.value)} />
          </div>
          {err && <div className="sm:col-span-2 text-sm text-red-600">{err}</div>}
          <div className="sm:col-span-2">
            <button className="btn-primary w-full" disabled={loading}>
              {loading ? 'রেজিস্ট্রেশন হচ্ছে…' : 'রেজিস্ট্রেশন সম্পন্ন করুন'}
            </button>
          </div>
        </form>
        <div className="mt-4 text-center text-sm text-slate-600">
          ইতিমধ্যে অ্যাকাউন্ট আছে? <Link href="/login" className="text-brand-700 font-medium">লগইন</Link>
        </div>
      </div>
    </div>
  );
}
