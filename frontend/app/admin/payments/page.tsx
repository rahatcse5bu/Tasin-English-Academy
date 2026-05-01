'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { bnNum, bnDate, PAYMENT_STATUS_BN } from '@/lib/format';

export default function AdminPaymentsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [status, setStatus] = useState('');
  const [batch, setBatch] = useState('');

  const load = async () => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (batch) params.set('batch', batch);
    setItems(await api<any[]>(`/payments?${params.toString()}`, { token }));
    setBatches(await api<any[]>('/batches?all=1'));
  };
  useEffect(() => { load(); }, [token, status, batch]);

  const approve = async (id: string) => {
    await api(`/payments/${id}/approve`, { method: 'PATCH', token });
    load();
  };
  const reject = async (id: string) => {
    const note = prompt('বাতিলের কারণ?') || '';
    await api(`/payments/${id}/reject`, { method: 'PATCH', token, body: JSON.stringify({ note }) });
    load();
  };
  const remove = async (id: string) => {
    if (!confirm('মুছবেন?')) return;
    await api(`/payments/${id}`, { method: 'DELETE', token });
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">পেমেন্ট ব্যবস্থাপনা</h1>
      <div className="card mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="label">স্ট্যাটাস</label>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">সব</option>
            <option value="pending">পেন্ডিং</option>
            <option value="approved">অনুমোদিত</option>
            <option value="rejected">বাতিল</option>
          </select>
        </div>
        <div>
          <label className="label">ব্যাচ</label>
          <select className="input" value={batch} onChange={(e) => setBatch(e.target.value)}>
            <option value="">সব</option>
            {batches.map((b) => <option key={b._id} value={b._id}>{b.code}</option>)}
          </select>
        </div>
      </div>
      <div className="card p-0 overflow-x-auto">
        <table className="table">
          <thead><tr><th>শিক্ষার্থী</th><th>ব্যাচ</th><th>মাস</th><th>পরিমাণ</th><th>মাধ্যম</th><th>TrxID</th><th>প্রেরক</th><th>স্ট্যাটাস</th><th>তারিখ</th><th>অ্যাকশন</th></tr></thead>
          <tbody>
            {items.map((p) => (
              <tr key={p._id}>
                <td>
                  <div className="font-medium">{p.student?.name}</div>
                  <div className="text-xs text-slate-500">{p.student?.email}</div>
                </td>
                <td>{p.batch?.code}</td>
                <td>{p.month}</td>
                <td>৳{bnNum(p.amount)}</td>
                <td>{p.method}</td>
                <td className="font-mono text-xs">{p.transactionId}</td>
                <td>{p.senderNumber}</td>
                <td>
                  <span className={`badge ${
                    p.status === 'approved' ? 'bg-green-100 text-green-700' :
                    p.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>{PAYMENT_STATUS_BN[p.status]}</span>
                </td>
                <td>{bnDate(p.createdAt)}</td>
                <td className="space-x-2">
                  {p.status === 'pending' && (
                    <>
                      <button className="text-green-700" onClick={() => approve(p._id)}>অনুমোদন</button>
                      <button className="text-red-600" onClick={() => reject(p._id)}>বাতিল</button>
                    </>
                  )}
                  <button className="text-slate-500" onClick={() => remove(p._id)}>মুছুন</button>
                </td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan={10} className="text-center text-slate-500 py-6">কোনও পেমেন্ট নেই।</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
