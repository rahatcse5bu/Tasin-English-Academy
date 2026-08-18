'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import NewStudentForm from '@/components/admin/NewStudentForm';

export default function AdminStudentsPage() {
  const { token } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);

  const load = async () => {
    setStudents(await api<any[]>('/users', { token }));
    setBatches(await api<any[]>('/batches?all=1'));
  };
  useEffect(() => { load(); }, [token]);

  const enroll = async (id: string, batchId: string) => {
    if (!batchId) return;
    await api(`/users/${id}/enroll/${batchId}`, { method: 'PATCH', token });
    load();
  };
  const unenroll = async (id: string, batchId: string) => {
    await api(`/users/${id}/unenroll/${batchId}`, { method: 'PATCH', token });
    load();
  };
  const remove = async (id: string) => {
    if (!confirm('শিক্ষার্থী মুছবেন?')) return;
    await api(`/users/${id}`, { method: 'DELETE', token });
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">শিক্ষার্থী ব্যবস্থাপনা ({students.length})</h1>

      <NewStudentForm batches={batches} onCreated={load} />
      <div className="card p-0 overflow-x-auto">
        <table className="table">
          <thead><tr><th>নাম</th><th>ইমেইল</th><th>ফোন</th><th>ক্লাস</th><th>সেশন</th><th>প্রতিষ্ঠান</th><th>জেলা</th><th>ব্যাচ</th><th>অ্যাকশন</th></tr></thead>
          <tbody>
            {students.map((s) => {
              const enrolledIds = (s.enrolledBatches || []).map(String);
              return (
                <tr key={s._id}>
                  <td>{s.name}</td>
                  <td className="text-xs">{s.email}</td>
                  <td>{s.phone || '—'}</td>
                  <td>{s.level || '—'}</td>
                  <td>{s.session || '—'}</td>
                  <td className="text-xs">{s.institution || '—'}</td>
                  <td className="text-xs">{[s.district, s.division].filter(Boolean).join(', ') || '—'}</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {batches.filter((b) => enrolledIds.includes(String(b._id))).map((b) => (
                        <span key={b._id} className="badge bg-brand-100 text-brand-700 cursor-pointer" onClick={() => unenroll(s._id, b._id)} title="ক্লিক করে আনএনরোল">
                          {b.code} ×
                        </span>
                      ))}
                    </div>
                    <select className="input mt-1 text-xs" onChange={(e) => { enroll(s._id, e.target.value); e.target.value = ''; }}>
                      <option value="">+ ব্যাচে যোগ</option>
                      {batches.filter((b) => !enrolledIds.includes(String(b._id))).map((b) => (
                        <option key={b._id} value={b._id}>{b.code} — {b.name}</option>
                      ))}
                    </select>
                  </td>
                  <td><button className="text-red-600" onClick={() => remove(s._id)}>মুছুন</button></td>
                </tr>
              );
            })}
            {!students.length && <tr><td colSpan={9} className="text-center text-slate-500 py-6">কোনও শিক্ষার্থী নেই।</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
