'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { bnNum } from '@/lib/format';

interface ClassItem {
  id: string;
  name: string;
  nameBn: string;
  subjects: { id: string; name: string; nameBn: string; unitCount: number; lessonCount: number }[];
}

const COMING_SOON = [
  { nameBn: 'ষষ্ঠ শ্রেণি', name: 'Class 6' },
  { nameBn: 'সপ্তম শ্রেণি', name: 'Class 7' },
  { nameBn: 'নবম-দশম শ্রেণি', name: 'Class 9–10' },
];

export default function ResourcesHub() {
  const [classes, setClasses] = useState<ClassItem[] | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    api<ClassItem[]>('/learn/classes')
      .then(setClasses)
      .catch(() => setErr(true));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-700 text-white p-6 sm:p-9">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, transparent 0 14px, #fff 14px 15px)',
          }}
        />
        <div className="relative">
          <div className="text-xs font-semibold tracking-widest uppercase text-brand-200">
            একাডেমিক রিসোর্স · ফ্রি
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold mt-2 leading-tight">শেখার রিসোর্স</h1>
          <p className="text-brand-100 mt-2 max-w-xl">
            শ্রেণি বেছে নাও → বিষয় → অধ্যায়। প্রতিটি পাঠ পড়ো, শব্দ মুখস্থ করো, কুইজ খেলো — সম্পূর্ণ ইন্টারঅ্যাকটিভ।
          </p>
        </div>
      </div>

      {/* Tips link */}
      <Link
        href="/resources/tips"
        className="mt-5 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-brand-300 transition"
      >
        <span className="font-medium text-slate-800">💡 টিপস, হ্যাকস ও সাজেশন</span>
        <span className="text-brand-700 text-sm">দেখুন →</span>
      </Link>

      <h2 className="mt-9 mb-3 text-lg font-bold text-slate-900">শ্রেণি নির্বাচন করো</h2>

      {err && (
        <div className="card text-center text-slate-500">কন্টেন্ট লোড করা যায়নি। পরে আবার চেষ্টা করুন।</div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {!classes && !err &&
          [0, 1].map((i) => <div key={i} className="card h-28 animate-pulse bg-slate-100" />)}

        {classes?.map((c) => (
          <Link
            key={c.id}
            href={`/resources/${c.id}`}
            className="card group hover:border-brand-400 hover:shadow-md transition relative overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xl font-bold text-slate-900">{c.nameBn}</div>
                <div className="text-sm text-slate-500">{c.name}</div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-brand-600 text-white grid place-items-center text-lg font-bold flex-shrink-0">
                {c.nameBn.charAt(0)}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {c.subjects.map((s) => (
                <span key={s.id} className="badge bg-brand-50 text-brand-700 border border-brand-100">
                  {s.nameBn} · {bnNum(s.unitCount)} অধ্যায়
                </span>
              ))}
            </div>
            <div className="mt-3 text-sm text-brand-700 font-medium group-hover:translate-x-1 transition">
              শুরু করো →
            </div>
          </Link>
        ))}

        {COMING_SOON.map((c) => (
          <div key={c.name} className="card opacity-60 cursor-not-allowed">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xl font-bold text-slate-700">{c.nameBn}</div>
                <div className="text-sm text-slate-400">{c.name}</div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-200 text-slate-500 grid place-items-center text-lg font-bold">
                {c.nameBn.charAt(0)}
              </div>
            </div>
            <span className="badge bg-slate-100 text-slate-500 mt-4">শীঘ্রই আসছে</span>
          </div>
        ))}
      </div>
    </div>
  );
}
