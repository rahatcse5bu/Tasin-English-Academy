'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { bnNum } from '@/lib/format';

interface LessonSummary {
  id: string;
  number: number;
  title: string;
  isPoem: boolean;
  activities: number;
}
interface UnitSummary {
  id: string;
  number: number;
  title: string;
  banglaTitle: string;
  lessonCount: number;
  poemCount: number;
  minutes: number;
  lessons: LessonSummary[];
}
interface SubjectData {
  class: { id: string; nameBn: string };
  id: string;
  nameBn: string;
  book: string;
  units: UnitSummary[];
}

export default function SubjectPage() {
  const { classId, subjectId } = useParams<{ classId: string; subjectId: string }>();
  const [data, setData] = useState<SubjectData | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    api<SubjectData>(`/learn/${classId}/${subjectId}`)
      .then(setData)
      .catch(() => setErr(true));
  }, [classId, subjectId]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
      <Link href={`/resources/${classId}`} className="text-sm text-brand-700 hover:underline">
        ← {data?.class.nameBn || 'পিছনে'}
      </Link>

      <div className="mt-2 flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {data ? data.nameBn : err ? 'পাওয়া যায়নি' : '...'}
          </h1>
          {data && <p className="text-slate-600 mt-1">{data.book}</p>}
        </div>
        {data && (
          <span className="badge bg-brand-50 text-brand-700 border border-brand-100">
            {bnNum(data.units.length)} অধ্যায়
          </span>
        )}
      </div>

      {err && <div className="card mt-6 text-center text-slate-500">কন্টেন্ট লোড করা যায়নি।</div>}

      <div className="mt-6 space-y-4">
        {!data && !err &&
          [0, 1, 2].map((i) => <div key={i} className="card h-28 animate-pulse bg-slate-100" />)}

        {data?.units.map((u) => (
          <Link
            key={u.id}
            href={`/resources/${classId}/${subjectId}/${u.id}`}
            className="card group flex items-start gap-4 hover:border-brand-400 hover:shadow-md transition"
          >
            <div className="w-12 h-12 rounded-xl bg-brand-600 text-white grid place-items-center font-bold text-lg flex-shrink-0">
              {bnNum(u.number)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                Unit {u.number}
              </div>
              <div className="text-lg font-bold text-slate-900 leading-tight">{u.title}</div>
              {u.banglaTitle && <div className="text-sm text-slate-500">{u.banglaTitle}</div>}
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="badge bg-slate-100 text-slate-700">{bnNum(u.lessonCount)} পাঠ</span>
                {u.poemCount > 0 && (
                  <span className="badge bg-rose-50 text-rose-600">{bnNum(u.poemCount)} কবিতা</span>
                )}
                {u.minutes > 0 && (
                  <span className="badge bg-amber-50 text-amber-700">~{bnNum(u.minutes)} মিনিট</span>
                )}
              </div>
            </div>
            <div className="self-center text-brand-700 group-hover:translate-x-1 transition">→</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
