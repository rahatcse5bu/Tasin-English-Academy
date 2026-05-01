'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const u = await login(email, password);
      router.push(u.role === 'admin' ? '/admin' : '/dashboard');
    } catch (e: any) {
      setErr(e.message || 'লগইন ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 sm:py-12">
      <div className="card">
        <h1 className="text-2xl font-bold text-center text-slate-900">লগইন করুন</h1>
        <p className="text-center text-slate-600 text-sm mt-1">আপনার তাসিন একাডেমি অ্যাকাউন্টে প্রবেশ করুন</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="label">ইমেইল</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <label className="label">পাসওয়ার্ড</label>
            <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {err && <div className="text-sm text-red-600">{err}</div>}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? 'লগইন হচ্ছে…' : 'লগইন'}
          </button>
        </form>
        <div className="mt-4 text-center text-sm text-slate-600">
          নতুন ছাত্রছাত্রী? <Link href="/register" className="text-brand-700 font-medium">রেজিস্ট্রেশন করুন</Link>
        </div>
      </div>
    </div>
  );
}
