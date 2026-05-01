'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { bnNum, bnDateTime, ATTENDANCE_STATUS_BN } from '@/lib/format';

export default function AttendancePage() {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    if (!token) return;
    (async () => {
      try { setItems(await api<any[]>('/attendance/me', { token })); } catch {}
      try { setStats(await api('/attendance/me/stats', { token })); } catch {}
    })();
  }, [token]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">আমার উপস্থিতি</h1>
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Stat label="উপস্থিত" value={bnNum(stats.present || 0)} color="text-green-600" />
        <Stat label="অনুপস্থিত" value={bnNum(stats.absent || 0)} color="text-red-600" />
        <Stat label="বিলম্বিত" value={bnNum(stats.late || 0)} color="text-amber-600" />
      </div>
      <div className="card p-0 overflow-x-auto">
        <table className="table">
          <thead><tr><th>ক্লাস</th><th>সময়</th><th>স্ট্যাটাস</th></tr></thead>
          <tbody>
            {items.map((a) => (
              <tr key={a._id}>
                <td>{a.classSession?.title}</td>
                <td>{bnDateTime(a.classSession?.scheduledAt)}</td>
                <td>
                  <span className={`badge ${
                    a.status === 'present' ? 'bg-green-100 text-green-700' :
                    a.status === 'late' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>{ATTENDANCE_STATUS_BN[a.status]}</span>
                </td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan={3} className="text-center text-slate-500 py-6">কোনও তথ্য নেই।</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="card text-center">
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-sm text-slate-600 mt-1">{label}</div>
    </div>
  );
}
