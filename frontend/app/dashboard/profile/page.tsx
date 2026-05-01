'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

export default function ProfilePage() {
  const { user, token, refresh } = useAuth();
  const [form, setForm] = useState<any>({ name: '', phone: '', institution: '', level: 'HSC', address: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        institution: user.institution || '',
        level: user.level || 'HSC',
        address: (user as any).address || '',
      });
    }
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    try {
      await api('/users/me', { method: 'PATCH', token, body: JSON.stringify(form) });
      await refresh();
      setMsg('প্রোফাইল আপডেট হয়েছে।');
    } catch (e: any) {
      setMsg('ত্রুটি: ' + e.message);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">প্রোফাইল</h1>
      <form onSubmit={submit} className="card grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="label">পূর্ণ নাম</label>
          <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">ইমেইল</label>
          <input className="input" value={user?.email || ''} disabled />
        </div>
        <div>
          <label className="label">মোবাইল</label>
          <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="label">স্তর</label>
          <select className="input" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
            <option value="HSC">এইচএসসি</option>
            <option value="SSC">এসএসসি</option>
            <option value="Other">অন্যান্য</option>
          </select>
        </div>
        <div>
          <label className="label">প্রতিষ্ঠান</label>
          <input className="input" value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">ঠিকানা</label>
          <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        {msg && <div className="sm:col-span-2 text-sm text-brand-700">{msg}</div>}
        <div className="sm:col-span-2">
          <button className="btn-primary">সংরক্ষণ করুন</button>
        </div>
      </form>
    </div>
  );
}
