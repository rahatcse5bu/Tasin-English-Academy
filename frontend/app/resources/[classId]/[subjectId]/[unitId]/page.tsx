'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { bnNum } from '@/lib/format';
import LessonStudio, { Lesson } from '@/components/learn/LessonStudio';

interface UnitData {
  class: { id: string; nameBn: string };
  subject: { id: string; nameBn: string; book: string };
  id: string;
  number: number;
  title: string;
  banglaTitle: string;
  lessons: Lesson[];
  poems: any[];
}

export default function UnitPage() {
  const { classId, subjectId, unitId } = useParams<{ classId: string; subjectId: string; unitId: string }>();
  const [data, setData] = useState<UnitData | null>(null);
  const [err, setErr] = useState(false);
  const [sel, setSel] = useState(0);

  useEffect(() => {
    api<UnitData>(`/learn/${classId}/${subjectId}/${unitId}`)
      .then(setData)
      .catch(() => setErr(true));
  }, [classId, subjectId, unitId]);

  // poems are appended as extra "lessons" after the regular lessons
  const items: Lesson[] = useMemo(() => {
    if (!data) return [];
    const poemLessons: Lesson[] = (data.poems || []).map((p, idx) => ({
      id: p.id || `poem-${idx}`,
      number: `কবিতা`,
      title: p.title,
      is_poem: true,
      poet: p.poet,
      keywords: (p.key_words || []).map((k: any) => k.word).filter(Boolean),
      reading: { summary_en: p.central_idea || p.theme, gist_bn: p.gist_bn },
      qa: p.qa,
      vocab: (p.key_words || []).map((k: any) => ({ word: k.word, bangla: k.bangla })),
    }));
    return [...data.lessons, ...poemLessons];
  }, [data]);

  if (err) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-500">অধ্যায়টি পাওয়া যায়নি।</p>
        <Link href={`/resources/${classId}/${subjectId}`} className="btn-secondary mt-4">← অধ্যায় তালিকা</Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="h-8 w-48 bg-slate-100 rounded animate-pulse" />
        <div className="h-40 mt-6 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  const lesson = items[sel];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
      <Link href={`/resources/${classId}/${subjectId}`} className="text-sm text-brand-700 hover:underline">
        ← {data.subject.nameBn} অধ্যায়সমূহ
      </Link>

      {/* unit header */}
      <div className="mt-3 mb-5">
        <div className="text-xs font-semibold uppercase tracking-widest text-brand-500">
          {data.class.nameBn} · {data.subject.nameBn} · Unit {bnNum(data.number)}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight mt-1">{data.title}</h1>
        {data.banglaTitle && <p className="text-slate-500">{data.banglaTitle}</p>}
      </div>

      {/* lesson picker */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar-x">
        {items.map((l, i) => {
          const on = i === sel;
          return (
            <button
              key={l.id}
              onClick={() => setSel(i)}
              className={`flex-shrink-0 rounded-xl px-3.5 py-2 text-sm font-semibold transition border ${
                on ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'
              }`}
            >
              <span className={`mr-1.5 font-bold ${on ? 'text-amber-300' : 'text-brand-600'}`}>
                {l.is_poem ? '🪶' : `L${bnNum(Number(l.number))}`}
              </span>
              {l.title}
            </button>
          );
        })}
      </div>

      {/* learn line */}
      {lesson?.learn_line && (
        <div className="mt-4 rounded-xl bg-brand-50 border border-brand-100 px-4 py-3 text-sm text-brand-800">
          🎯 {lesson.learn_line}
          {lesson.poet && <span className="block text-xs text-slate-500 mt-1">— {lesson.poet}</span>}
        </div>
      )}
      {lesson?.is_poem && lesson?.poet && (
        <div className="mt-4 text-sm text-slate-500">✍️ কবি: <b className="text-slate-700">{lesson.poet}</b></div>
      )}

      {/* the interactive studio */}
      <div className="mt-5">{lesson && <LessonStudio lesson={lesson} />}</div>

      <div className="mt-10 text-center text-xs text-slate-400">
        তাসিন ইংলিশ একাডেমি · NCTB English For Today অনুসারে · ফ্রি স্টাডি কন্টেন্ট
      </div>

      <style jsx global>{`
        .no-scrollbar-x::-webkit-scrollbar { display: none; }
        .no-scrollbar-x { scrollbar-width: none; }
      `}</style>
    </div>
  );
}
