'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { bnNum } from '@/lib/format';
import { plain } from '@/lib/deck/text';
import type { DeckCatalogue } from '@/lib/deck/types';

const LEVEL_BN: Record<string, string> = { Easy: 'সহজ', Medium: 'মাঝারি', Hard: 'কঠিন' };
const LEVEL_CLASS: Record<string, string> = {
  Easy: 'bg-emerald-50 text-emerald-700',
  Medium: 'bg-amber-50 text-amber-700',
  Hard: 'bg-rose-50 text-rose-700',
};

export default function DecksPage() {
  const [data, setData] = useState<DeckCatalogue | null>(null);
  const [err, setErr] = useState(false);
  const [paper, setPaper] = useState(0);
  const [q, setQ] = useState('');

  useEffect(() => {
    api<DeckCatalogue>('/decks').then(setData).catch(() => setErr(true));
  }, []);

  const active = data?.papers[paper];

  const units = useMemo(() => {
    if (!active) return [];
    const needle = q.trim().toLowerCase();
    if (!needle) return active.units;
    return active.units
      .map((u) => ({
        ...u,
        chapters: u.chapters.filter((c) =>
          [c.title, c.titleBn, c.tag, u.name, u.nameBn].join(' ').toLowerCase().includes(needle),
        ),
      }))
      .filter((u) => u.chapters.length);
  }, [active, q]);

  if (err) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-500">স্লাইড লাইব্রেরি লোড করা যায়নি।</p>
      </div>
    );
  }

  if (!data || !active) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="h-9 w-64 bg-slate-100 rounded animate-pulse" />
        <div className="h-32 mt-6 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  const totalChapters = data.papers.reduce((n, p) => n + p.chapterCount, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10">
      <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 text-amber-700 px-3 py-1 text-xs font-bold tracking-wide">
        HSC · স্লাইড ক্লাস
      </div>
      <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
        ইউনিট ও অধ্যায়ভিত্তিক <span className="text-brand-600">স্লাইড ক্লাস</span>
      </h1>
      <p className="mt-3 text-slate-600 max-w-3xl leading-relaxed">
        প্রতিটি প্যাসেজের মূল ইংরেজি টেক্সট, বাক্যভিত্তিক বাংলা অর্থ, শব্দার্থ, Summary, MCQ ও
        Short Question-এর উত্তর, টেবিল ও ফ্লো-চার্ট — আর ২য় পত্রে নিয়ম, অনুশীলন ও বোর্ড প্রশ্নের
        সমাধান। প্রজেক্টরে চালানোর জন্য তৈরি; উত্তর একটি একটি করে দেখানো যায়।
      </p>

      <div className="mt-5 flex flex-wrap gap-2 text-xs">
        <span className="badge bg-slate-100 text-slate-700">
          মোট {bnNum(totalChapters)} অধ্যায়
        </span>
        <span className="badge bg-slate-100 text-slate-700">প্রজেক্টর-রেডি</span>
        <span className="badge bg-slate-100 text-slate-700">প্রিন্ট করা যায়</span>
        <span className="badge bg-slate-100 text-slate-700">হোয়াইটবোর্ড</span>
      </div>

      {/* paper tabs */}
      <div className="mt-7 flex flex-wrap gap-2">
        {data.papers.map((p, idx) => (
          <button
            key={p.id}
            onClick={() => setPaper(idx)}
            className={`rounded-xl border px-5 py-3 text-left transition ${
              idx === paper
                ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                : 'bg-white border-slate-200 text-slate-800 hover:border-brand-400'
            }`}
          >
            <div className="font-semibold text-sm">{plain(p.name)}</div>
            <div className={`text-xs mt-0.5 ${idx === paper ? 'text-white/80' : 'text-slate-500'}`}>
              {plain(p.nameBn)} · {bnNum(p.chapterCount)} অধ্যায়
            </div>
          </button>
        ))}
      </div>

      <input
        className="input mt-6"
        placeholder="অধ্যায় / ইউনিট / বাংলা নাম খুঁজুন …"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {units.length === 0 && (
        <p className="text-center text-slate-500 py-16">কোনো অধ্যায় পাওয়া যায়নি।</p>
      )}

      {units.map((u) => (
        <section key={u.no + u.name} className="mt-9">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 grid place-items-center text-xl shadow-sm">
              {u.em}
            </div>
            <div>
              <div className="text-[11px] font-bold tracking-wider text-amber-600 uppercase">
                {plain(u.no)}
              </div>
              <div className="text-lg font-bold text-slate-900 leading-tight">{plain(u.name)}</div>
              <div className="text-sm text-slate-500">{plain(u.nameBn)}</div>
            </div>
            <span className="ml-auto badge bg-white border border-slate-200 text-slate-600">
              {bnNum(u.chapters.length)} অধ্যায়
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {u.chapters.map((c) => (
              <Link
                key={c.id}
                href={`/decks/${c.id}`}
                className="card hover:border-brand-400 hover:shadow-md transition group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold tracking-wide text-slate-400">
                    {plain(c.tag)}
                  </span>
                  <span
                    className={`badge ml-auto ${LEVEL_CLASS[c.level] || 'bg-slate-100 text-slate-600'}`}
                  >
                    {LEVEL_BN[c.level] || c.level}
                  </span>
                </div>
                <div className="mt-2 font-semibold text-slate-900 leading-snug group-hover:text-brand-700">
                  {plain(c.title)}
                </div>
                <div className="mt-1 text-sm text-emerald-700">{plain(c.titleBn)}</div>

                <div className="mt-3 pt-3 border-t border-dashed border-slate-200 flex items-center gap-3 text-xs text-slate-500">
                  {c.stats?.kind === 'grammar' ? (
                    <span>
                      {bnNum(c.stats.rules)} নিয়ম · {bnNum(c.stats.drills)} অনুশীলন
                    </span>
                  ) : c.stats ? (
                    <span>
                      {bnNum(c.stats.mcq)} MCQ · {bnNum(c.stats.words)} শব্দ
                    </span>
                  ) : null}
                  <span className="ml-auto font-semibold text-brand-700">ক্লাস শুরু →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
