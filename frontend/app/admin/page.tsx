'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { bnNum } from '@/lib/format';

export default function AdminHomePage() {
  const { token } = useAuth();
  const [counts, setCounts] = useState({ teachers: 0, batches: 0, students: 0, payments: 0, pending: 0 });

  useEffect(() => {
    if (!token) return;
    (async () => {
      const [t, b, s, p, pp] = await Promise.all([
        api<any[]>('/teachers').catch(() => []),
        api<any[]>('/batches?all=1').catch(() => []),
        api<any[]>('/users', { token }).catch(() => []),
        api<any[]>('/payments', { token }).catch(() => []),
        api<any[]>('/payments?status=pending', { token }).catch(() => []),
      ]);
      setCounts({ teachers: t.length, batches: b.length, students: s.length, payments: p.length, pending: pp.length });
    })();
  }, [token]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">অ্যাডমিন ড্যাশবোর্ড</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card label="শিক্ষক" value={counts.teachers} href="/admin/teachers" />
        <Card label="ব্যাচ" value={counts.batches} href="/admin/batches" />
        <Card label="শিক্ষার্থী" value={counts.students} href="/admin/students" />
        <Card label="মোট পেমেন্ট" value={counts.payments} href="/admin/payments" />
        <Card label="পেন্ডিং পেমেন্ট" value={counts.pending} href="/admin/payments?status=pending" highlight />
      </div>
    </div>
  );
}

function Card({ label, value, href, highlight }: { label: string; value: number; href: string; highlight?: boolean }) {
  return (
    <Link href={href} className={`card hover:shadow-md transition block ${highlight ? 'ring-2 ring-amber-300' : ''}`}>
      <div className="text-sm text-slate-600">{label}</div>
      <div className="text-3xl font-bold text-brand-700 mt-1">{bnNum(value)}</div>
    </Link>
  );
}
