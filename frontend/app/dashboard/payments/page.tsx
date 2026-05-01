'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { bnNum, bnDate, PAYMENT_STATUS_BN } from '@/lib/format';

export default function PaymentsPage() {
  const { user, token } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [form, setForm] = useState({
    batch: '', amount: '', month: '', method: 'bkash', transactionId: '', senderNumber: '',
  });
  const [msg, setMsg] = useState('');

  const load = async () => {
    if (!token || !user) return;
    setPayments(await api<any[]>('/payments/me', { token }));
    const ids = user.enrolledBatches || [];
    const bs: any[] = [];
    for (const id of ids) {
      try { bs.push(await api(`/batches/me/${id}`, { token })); } catch {}
    }
    setBatches(bs.filter(Boolean));
    if (bs.length && !form.batch) {
      const now = new Date();
      const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      setForm((s) => ({ ...s, batch: bs[0]._id, amount: String(bs[0].monthlyFee), month: ym }));
    }
  };

  useEffect(() => { load(); }, [token, user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    try {
      await api('/payments', {
        method: 'POST',
        token,
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
        }),
      });
      setMsg('পেমেন্ট জমা হয়েছে। অ্যাডমিন অনুমোদনের অপেক্ষায়।');
      setForm({ ...form, transactionId: '', senderNumber: '' });
      load();
    } catch (e: any) {
      setMsg('ত্রুটি: ' + e.message);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">পেমেন্ট</h1>

      <div className="card mb-6">
        <h2 className="font-semibold mb-1">নতুন পেমেন্ট জমা দিন</h2>
        <p className="text-sm text-slate-600 mb-4">
          📱 bKash সেন্ড মানি/পেমেন্ট করুন <strong>01XXXXXXXXX</strong>{' '}
          নম্বরে, তারপর Transaction ID ও আপনার নম্বর দিয়ে নিচের ফর্ম পূরণ করুন। অ্যাডমিন ম্যানুয়ালি অনুমোদন করবেন।
        </p>
        <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">ব্যাচ</label>
            <select className="input" required value={form.batch} onChange={(e) => {
              const b = batches.find((x) => x._id === e.target.value);
              setForm((s) => ({ ...s, batch: e.target.value, amount: b ? String(b.monthlyFee) : s.amount }));
            }}>
              <option value="">— ব্যাচ নির্বাচন —</option>
              {batches.map((b) => <option key={b._id} value={b._id}>{b.nameBn || b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">মাস (YYYY-MM)</label>
            <input className="input" required placeholder="2026-05" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} />
          </div>
          <div>
            <label className="label">পেমেন্ট পদ্ধতি</label>
            <select className="input" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
              <option value="bkash">bKash</option>
              <option value="nagad">Nagad</option>
              <option value="rocket">Rocket</option>
              <option value="cash">Cash</option>
            </select>
          </div>
          <div>
            <label className="label">টাকার পরিমাণ</label>
            <input className="input" required type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div>
            <label className="label">Transaction ID *</label>
            <input className="input" required value={form.transactionId} onChange={(e) => setForm({ ...form, transactionId: e.target.value })} />
          </div>
          <div>
            <label className="label">প্রেরকের নম্বর *</label>
            <input className="input" required value={form.senderNumber} onChange={(e) => setForm({ ...form, senderNumber: e.target.value })} placeholder="01XXXXXXXXX" />
          </div>
          {msg && <div className="sm:col-span-2 text-sm text-brand-700">{msg}</div>}
          <div className="sm:col-span-2">
            <button className="btn-primary w-full" type="submit">পেমেন্ট জমা দিন</button>
          </div>
        </form>
      </div>

      <h2 className="font-semibold mb-2">আমার পেমেন্ট ইতিহাস</h2>
      <div className="card p-0 overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>মাস</th><th>ব্যাচ</th><th>পরিমাণ</th><th>মাধ্যম</th><th>TrxID</th><th>স্ট্যাটাস</th><th>তারিখ</th></tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p._id}>
                <td>{p.month}</td>
                <td>{p.batch?.name || '—'}</td>
                <td>৳{bnNum(p.amount)}</td>
                <td>{p.method}</td>
                <td className="font-mono text-xs">{p.transactionId}</td>
                <td>
                  <span className={`badge ${
                    p.status === 'approved' ? 'bg-green-100 text-green-700' :
                    p.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>{PAYMENT_STATUS_BN[p.status]}</span>
                </td>
                <td>{bnDate(p.createdAt)}</td>
              </tr>
            ))}
            {!payments.length && <tr><td colSpan={7} className="text-center text-slate-500 py-6">কোনও পেমেন্ট নেই।</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
