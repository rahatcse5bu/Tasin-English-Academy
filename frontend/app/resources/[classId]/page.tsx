'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { bnNum } from '@/lib/format';

interface SubjectSummary {
  id: string;
  name: string;
  nameBn: string;
  book: string;
  unitCount: number;
  lessonCount: number;
}
interface ClassData {
  id: string;
  name: string;
  nameBn: string;
  subjects: SubjectSummary[];
}

const SUBJECT_EMOJI: Record<string, string> = {
  english: '📚',
  math: '🔢',
  science: '🔬',
  ict: '💻',
  bangla: '🇧🇩',
};

export default function ClassPage() {
  const { classId } = useParams<{ classId: string }>();
  const [data, setData] = useState<ClassData | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    api<ClassData>(`/learn/${classId}`)
      .then(setData)
      .catch(() => setErr(true));
  }, [classId]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
      <Link href="/resources" className="text-sm text-brand-700 hover:underline">← সব শ্রেণি</Link>

      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
        {data ? data.nameBn : err ? 'পাওয়া যায়নি' : '...'}
      </h1>
      <p className="text-slate-600 mt-1">বিষয় নির্বাচন করো</p>

      {err && <div className="card mt-6 text-center text-slate-500">কন্টেন্ট লোড করা যায়নি।</div>}

      <div className="mt-6 grid sm:grid-cols-2 gap-4">
        {!data && !err &&
          [0, 1].map((i) => <div key={i} className="card h-32 animate-pulse bg-slate-100" />)}

        {data?.subjects.map((s) => (
          <Link
            key={s.id}
            href={`/resources/${classId}/${s.id}`}
            className="card group hover:border-brand-400 hover:shadow-md transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-brand-50 grid place-items-center text-2xl flex-shrink-0">
                {SUBJECT_EMOJI[s.id] || '📖'}
              </div>
              <div>
                <div className="text-lg font-bold text-slate-900">{s.nameBn}</div>
                <div className="text-sm text-slate-500">{s.book}</div>
              </div>
            </div>
            <div className="mt-4 flex gap-2 text-sm text-slate-600">
              <span className="badge bg-slate-100 text-slate-700">{bnNum(s.unitCount)} অধ্যায়</span>
              <span className="badge bg-slate-100 text-slate-700">{bnNum(s.lessonCount)} পাঠ</span>
            </div>
            <div className="mt-3 text-sm text-brand-700 font-medium group-hover:translate-x-1 transition">
              অধ্যায় দেখো →
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
