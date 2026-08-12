'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Protected from '@/components/Protected';
import { bnNum } from '@/lib/format';
import { plain } from '@/lib/deck/text';
import PlacementEditor from '@/components/decks/PlacementEditor';
import type { ChapterMeta, DeckCatalogue, DeckUnit, UnitSummary } from '@/lib/deck/types';

const LEVEL_BN: Record<string, string> = { Easy: 'সহজ', Medium: 'মাঝারি', Hard: 'কঠিন' };
const LEVEL_CLASS: Record<string, string> = {
  Easy: 'bg-emerald-50 text-emerald-700',
  Medium: 'bg-amber-50 text-amber-700',
  Hard: 'bg-rose-50 text-rose-700',
};

function DecksLibrary() {
  const { token } = useAuth();
  const [data, setData] = useState<DeckCatalogue | null>(null);
  const [err, setErr] = useState(false);
  const [paper, setPaper] = useState(0);
  const [q, setQ] = useState('');

  // syllabus editing — staff correct which unit / lesson a chapter belongs to
  const [edit, setEdit] = useState(false);
  const [unitList, setUnitList] = useState<UnitSummary[]>([]);
  const [editing, setEditing] = useState<
    { mode: 'unit' | 'chapter'; unit: DeckUnit; chapter?: ChapterMeta } | null
  >(null);
  const [bin, setBin] = useState(false); // show removed chapters instead
  const [busy, setBusy] = useState('');

  const reload = () => {
    if (!token) return;
    api<DeckCatalogue>(bin ? '/decks?deleted=1' : '/decks', { token })
      .then(setData)
      .catch(() => setErr(true));
    api<UnitSummary[]>('/decks/units', { token }).then(setUnitList).catch(() => {});
  };

  /** Hide, remove or bring back one chapter. */
  const act = async (c: ChapterMeta, what: 'hide' | 'show' | 'remove' | 'restore') => {
    if (what === 'remove' && !confirm(`"${plain(c.title)}" ক্লাসের তালিকা থেকে সরানো হবে। পরে ফিরিয়ে আনা যাবে।`))
      return;
    setBusy(c.id);
    try {
      if (what === 'remove') await api(`/decks/${c.id}`, { method: 'DELETE', token: token || undefined });
      else if (what === 'restore') await api(`/decks/${c.id}/restore`, { method: 'PATCH', token: token || undefined });
      else
        await api(`/decks/${c.id}/visible`, {
          method: 'PATCH',
          token: token || undefined,
          body: JSON.stringify({ isPublished: what === 'show' }),
        });
      reload();
    } finally {
      setBusy('');
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, bin]);

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

  /** A unit's chapters grouped by lesson; units without lessons yield one group. */
  const lessons = (u: DeckUnit) => {
    const groups: { lesson: number | null; chapters: ChapterMeta[] }[] = [];
    for (const c of u.chapters) {
      const key = c.lesson ?? null;
      const g = groups.find((x) => x.lesson === key);
      g ? g.chapters.push(c) : groups.push({ lesson: key, chapters: [c] });
    }
    return groups;
  };

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
        {edit && (
          <button
            onClick={() => setBin(!bin)}
            className={`badge transition ${
              bin ? 'bg-rose-600 text-white' : 'bg-white border border-slate-300 text-slate-600 hover:border-rose-400'
            }`}
          >
            {bin ? '← ক্লাসের তালিকায় ফিরুন' : '🗑 মুছে ফেলা অধ্যায়'}
          </button>
        )}
        <button
          onClick={() => setEdit(!edit)}
          className={`badge transition ${
            edit ? 'bg-brand-600 text-white' : 'bg-white border border-slate-300 text-slate-600 hover:border-brand-400'
          }`}
        >
          {edit ? '✓ সিলেবাস সম্পাদনা চালু' : '✎ সিলেবাস সম্পাদনা'}
        </button>
      </div>

      {edit && (
        <p className="mt-3 text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed">
          ইউনিটের নম্বর/নাম বদলাতে ইউনিট শিরোনামের পাশের <b>✎</b>, আর কোনো অধ্যায়কে অন্য ইউনিট
          বা লেসনে সরাতে কার্ডের <b>✎</b> চাপুন। পরিবর্তন সব শিক্ষকের জন্য সাথে সাথে কার্যকর হবে।
        </p>
      )}

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
            {edit && (
              <button
                onClick={() => setEditing({ mode: 'unit', unit: u })}
                className="badge bg-white border border-brand-300 text-brand-700 hover:bg-brand-50"
                title="ইউনিট নম্বর / নাম বদলান"
              >
                ✎ ইউনিট
              </button>
            )}
          </div>

          {lessons(u).map((g) => (
            <div key={g.lesson ?? 'none'} className="mt-4">
              {g.lesson != null && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge bg-brand-50 text-brand-700 border border-brand-200">
                    লেসন {bnNum(g.lesson)}
                  </span>
                  <span className="text-xs text-slate-400">
                    {plain(g.chapters[0].lessonName || '')}
                  </span>
                  <span className="flex-1 border-t border-dashed border-slate-200" />
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {g.chapters.map((c) => (
                  <div key={c.id} className="relative">
                    {edit && (
                      <div className="absolute top-2 right-2 z-10 flex gap-1">
                        {bin ? (
                          <button
                            onClick={() => act(c, 'restore')}
                            disabled={busy === c.id}
                            className="h-7 px-2 rounded-lg bg-white border border-emerald-300 text-emerald-700 text-xs shadow-sm hover:bg-emerald-50"
                            title="ফিরিয়ে আনুন"
                          >
                            ↩ ফিরিয়ে আনুন
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditing({ mode: 'chapter', unit: u, chapter: c })}
                              className="w-7 h-7 rounded-lg bg-white border border-brand-300 text-brand-700 text-xs shadow-sm hover:bg-brand-50"
                              title="ইউনিট / লেসন বদলান"
                            >
                              ✎
                            </button>
                            <button
                              onClick={() => act(c, c.hidden ? 'show' : 'hide')}
                              disabled={busy === c.id}
                              className="w-7 h-7 rounded-lg bg-white border border-slate-300 text-slate-600 text-xs shadow-sm hover:bg-slate-50"
                              title={c.hidden ? 'ক্লাসের তালিকায় দেখান' : 'ক্লাসের তালিকা থেকে লুকান'}
                            >
                              {c.hidden ? '🙈' : '👁'}
                            </button>
                            <button
                              onClick={() => act(c, 'remove')}
                              disabled={busy === c.id}
                              className="w-7 h-7 rounded-lg bg-white border border-rose-300 text-rose-600 text-xs shadow-sm hover:bg-rose-50"
                              title="অধ্যায়টি সরান"
                            >
                              🗑
                            </button>
                          </>
                        )}
                      </div>
                    )}
                    <Link
                      href={`/decks/${c.id}`}
                      className={`card block h-full hover:border-brand-400 hover:shadow-md transition group ${
                        c.hidden || c.deleted ? 'opacity-60 border-dashed' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold tracking-wide text-slate-400">
                          {plain(c.tag)}
                        </span>
                        <span
                          className={`badge ml-auto ${edit ? 'mr-8' : ''} ${
                            LEVEL_CLASS[c.level] || 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {LEVEL_BN[c.level] || c.level}
                        </span>
                      </div>
                      <div className="mt-2 font-semibold text-slate-900 leading-snug group-hover:text-brand-700">
                        {plain(c.title)}
                      </div>
                      <div className="mt-1 text-sm text-emerald-700">{plain(c.titleBn)}</div>
                      {c.hidden && !c.deleted && (
                        <div className="mt-2 badge bg-slate-100 text-slate-600">লুকানো — ক্লাসের তালিকায় নেই</div>
                      )}

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
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      ))}

      {editing && (
        <PlacementEditor
          mode={editing.mode}
          paperId={active.id}
          unit={editing.unit}
          chapter={editing.chapter}
          units={unitList}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

export default function DecksPage() {
  // teaching slides — mentors and admins only
  return (
    <Protected roles={['teacher', 'admin']}>
      <DecksLibrary />
    </Protected>
  );
}
