'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Protected from '@/components/Protected';
import { plain } from '@/lib/deck/text';
import type { Deck } from '@/lib/deck/types';

/**
 * Content editor for one chapter.
 *
 * Everything a mentor keeps refining after class: the passage and its
 * highlights, the vocabulary the clickable words are drawn from, short
 * questions, MCQ, any number of information-transfer tables, the flow chart and
 * the summary.
 *
 * Saving marks the chapter `contentLocked`, so a later `npm run seed:decks`
 * refreshes every other chapter and leaves this one exactly as the mentor left it.
 */

type ShortQ = { q: string; a: string; bn?: string };
type Mcq = { q: string; opts: string[]; ans: number; why?: string };
type Table = { title?: string; headers: string[]; rows: string[][]; note?: string };
type Sentence = { en: string; bn?: string; no?: number };
type Para = { tag?: string; s: Sentence[] };
type Word = { w: string; pos?: string; pron?: string; bn?: string; en?: string; ex?: string };
type SynAnt = { w: string; bn?: string; syn?: string[]; ant?: string[] };
type Flow = { title?: string; items: { t: string; bn?: string }[] };

const input =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none';
const label = 'block text-xs font-semibold text-slate-600 mb-1';

function Section({
  title,
  hint,
  count,
  children,
}: {
  title: string;
  hint?: string;
  count?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card mt-6">
      <div className="flex items-baseline gap-3 flex-wrap">
        <h2 className="font-bold text-slate-900">{title}</h2>
        {count && <span className="badge bg-slate-100 text-slate-600">{count}</span>}
      </div>
      {hint && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function DeckEditor() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const router = useRouter();

  const [deck, setDeck] = useState<Deck | null>(null);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState('');

  const [summaryEn, setSummaryEn] = useState('');
  const [summaryBn, setSummaryBn] = useState('');
  const [summaryTip, setSummaryTip] = useState('');
  const [shortQ, setShortQ] = useState<ShortQ[]>([]);
  const [mcq, setMcq] = useState<Mcq[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [passage, setPassage] = useState<Para[]>([]);
  const [words, setWords] = useState<Word[]>([]);
  const [synant, setSynant] = useState<SynAnt[]>([]);
  const [flow, setFlow] = useState<Flow>({ title: '', items: [] });

  useEffect(() => {
    if (!token) return;
    api<Deck>(`/decks/${id}`, { token })
      .then((d) => {
        setDeck(d);
        setSummaryEn(plain(d.summaryEn || ''));
        setSummaryBn(plain(d.summaryBn || ''));
        setSummaryTip(plain((d as any).summaryTip || ''));
        setShortQ(((d.shortQ as ShortQ[]) || []).map((x) => ({ ...x })));
        setMcq(((d.mcq as Mcq[]) || []).map((x) => ({ ...x, opts: [...x.opts] })));
        const list: Table[] = (d as any).tables?.length
          ? (d as any).tables
          : (d as any).table
            ? [(d as any).table]
            : [];
        setTables(list.map((t) => ({ ...t, headers: [...t.headers], rows: t.rows.map((r) => [...r]) })));
        setPassage(((d.passage as Para[]) || []).map((p) => ({ ...p, s: p.s.map((x) => ({ ...x })) })));
        setWords(((d.words as Word[]) || []).map((w) => ({ ...w })));
        setSynant(((d.synant as SynAnt[]) || []).map((x) => ({ ...x, syn: [...(x.syn || [])], ant: [...(x.ant || [])] })));
        const f = (d as any).flow as Flow | undefined;
        setFlow(
          f
            ? { title: f.title || '', items: f.items.map((it: any) => (typeof it === 'string' ? { t: it } : { ...it })) }
            : { title: '', items: [] },
        );
      })
      .catch((e) => setErr(e.message || 'অধ্যায়টি লোড করা যায়নি'));
  }, [id, token]);

  const blanks = useMemo(
    () => tables.reduce((n, t) => n + t.rows.reduce((m, r) => m + r.filter((c) => c.includes('@')).length, 0), 0),
    [tables],
  );
  const marks = useMemo(
    () => passage.reduce((n, p) => n + p.s.reduce((m, x) => m + (x.en.match(/==[^=]+==/g) || []).length, 0), 0),
    [passage],
  );

  const patchTable = (ti: number, patch: Partial<Table>) =>
    setTables(tables.map((t, i) => (i === ti ? { ...t, ...patch } : t)));

  async function save() {
    setSaving(true);
    setErr('');
    setSaved('');
    try {
      const clean = <T,>(list: T[], ok: (x: T) => boolean) => list.filter(ok);
      const res = await api<{ answers: number }>(`/decks/${id}/content`, {
        method: 'PATCH',
        token: token || undefined,
        body: JSON.stringify({
          summaryEn,
          summaryBn,
          summaryTip,
          shortQ: clean(shortQ, (x) => !!x.q.trim() && !!x.a.trim()),
          mcq: clean(mcq, (x) => !!x.q.trim() && x.opts.filter((o) => o.trim()).length >= 2),
          tables: tables
            .filter((t) => t.headers.filter(Boolean).length >= 2)
            .map((t) => ({ title: t.title, headers: t.headers, rows: t.rows, note: t.note })),
          passage: passage
            .map((p) => ({ tag: p.tag, s: p.s.filter((x) => x.en.trim()) }))
            .filter((p) => p.s.length),
          words: words.filter((w) => w.w.trim()),
          synant: synant.filter((x) => x.w.trim()),
          flow: flow.items.filter((x) => x.t.trim()).length >= 2
            ? { title: flow.title, items: flow.items.filter((x) => x.t.trim()) }
            : undefined,
        }),
      });
      setSaved(`সংরক্ষিত — এখন ক্লাসে ${res.answers}টি উত্তর একটি একটি করে দেখানো যাবে।`);
    } catch (e: any) {
      setErr(e.message || 'সংরক্ষণ করা যায়নি');
    } finally {
      setSaving(false);
    }
  }

  if (err && !deck) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-500">{err}</p>
        <Link href="/decks" className="btn-secondary mt-4">
          ← সব অধ্যায়
        </Link>
      </div>
    );
  }

  if (!deck) {
    return <div className="max-w-4xl mx-auto px-4 py-16 text-slate-400">লোড হচ্ছে…</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-28">
      <Link href={`/decks/${id}`} className="text-sm text-brand-700 font-semibold">
        ← ক্লাসে ফিরে যান
      </Link>
      <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
        {plain(deck.title)}
      </h1>
      <p className="text-sm text-slate-500 mt-1">
        {plain(deck.unit)} · {plain(deck.unitName)} — কনটেন্ট সম্পাদনা
      </p>
      <p className="mt-3 text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed">
        সংরক্ষণ করলে এই অধ্যায়ের কনটেন্ট আর re-seed-এ মুছবে না। প্যাসেজে
        <b> ==দুই সমান চিহ্নের ভিতরে== </b> লেখা অংশটুকু হাইলাইট হয়, আর শব্দার্থে যে শব্দগুলো
        আছে সেগুলো প্যাসেজে ক্লিক করলেই অর্থ দেখাবে।
      </p>

      {/* ---------------- summary ---------------- */}
      <Section
        title="Summary ও বাংলা অর্থ"
        hint="**গাঢ়**, ==হাইলাইট== আর *ইটালিক* লেখা যায়। বাংলা অংশটি স্লাইডে ডান পাশে দেখাবে।"
      >
        <label className={label}>EN — Model Summary</label>
        <textarea
          className={input}
          rows={6}
          value={summaryEn}
          onChange={(e) => setSummaryEn(e.target.value)}
          placeholder="One paragraph, in the student's own words…"
        />
        <label className={`${label} mt-4`}>বাংলা — অর্থ</label>
        <textarea
          className={`${input} bn`}
          rows={6}
          value={summaryBn}
          onChange={(e) => setSummaryBn(e.target.value)}
          placeholder="সারাংশের বাংলা অর্থ…"
        />
        <label className={`${label} mt-4`}>পরীক্ষার টিপ (ঐচ্ছিক)</label>
        <textarea
          className={input}
          rows={2}
          value={summaryTip}
          onChange={(e) => setSummaryTip(e.target.value)}
        />
      </Section>

      {/* ---------------- short questions ---------------- */}
      <Section
        title="Short Questions (১-খ)"
        count={`${shortQ.length}টি`}
        hint="প্রতিটি উত্তর ক্লাসে একটি একটি করে খুলবে — ইংরেজি উত্তরের সাথে বাংলাটাও দিন।"
      >
        {shortQ.map((x, n) => (
          <div key={n} className="border border-slate-200 rounded-xl p-4 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="badge bg-brand-50 text-brand-700">প্রশ্ন {n + 1}</span>
              <button
                className="ml-auto text-xs text-rose-600 font-semibold"
                onClick={() => setShortQ(shortQ.filter((_, i) => i !== n))}
              >
                মুছুন
              </button>
            </div>
            <input
              className={input}
              value={x.q}
              placeholder="Question…"
              onChange={(e) =>
                setShortQ(shortQ.map((y, i) => (i === n ? { ...y, q: e.target.value } : y)))
              }
            />
            <textarea
              className={`${input} mt-2`}
              rows={3}
              value={x.a}
              placeholder="Answer in English…"
              onChange={(e) =>
                setShortQ(shortQ.map((y, i) => (i === n ? { ...y, a: e.target.value } : y)))
              }
            />
            <textarea
              className={`${input} mt-2 bn`}
              rows={2}
              value={x.bn || ''}
              placeholder="বাংলা অর্থ…"
              onChange={(e) =>
                setShortQ(shortQ.map((y, i) => (i === n ? { ...y, bn: e.target.value } : y)))
              }
            />
          </div>
        ))}
        <button
          className="btn-secondary"
          onClick={() => setShortQ([...shortQ, { q: '', a: '', bn: '' }])}
        >
          + প্রশ্ন যোগ করুন
        </button>
      </Section>

      {/* ---------------- MCQ ---------------- */}
      <Section
        title="MCQ (১-ক)"
        count={`${mcq.length}টি`}
        hint="সঠিক উত্তরের পাশের বোতামে ক্লিক করুন। ব্যাখ্যাটি উত্তর খোলার পরে দেখাবে।"
      >
        {mcq.map((x, n) => (
          <div key={n} className="border border-slate-200 rounded-xl p-4 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="badge bg-brand-50 text-brand-700">MCQ {n + 1}</span>
              <button
                className="ml-auto text-xs text-rose-600 font-semibold"
                onClick={() => setMcq(mcq.filter((_, i) => i !== n))}
              >
                মুছুন
              </button>
            </div>
            <input
              className={input}
              value={x.q}
              placeholder="Question…"
              onChange={(e) => setMcq(mcq.map((y, i) => (i === n ? { ...y, q: e.target.value } : y)))}
            />
            <div className="mt-2 grid sm:grid-cols-2 gap-2">
              {x.opts.map((o, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <button
                    onClick={() => setMcq(mcq.map((y, i) => (i === n ? { ...y, ans: oi } : y)))}
                    className={`w-7 h-7 flex-none rounded-lg text-xs font-bold border ${
                      x.ans === oi
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-white border-slate-300 text-slate-500'
                    }`}
                    title="সঠিক উত্তর"
                  >
                    {'abcdef'[oi]}
                  </button>
                  <input
                    className={input}
                    value={o}
                    onChange={(e) =>
                      setMcq(
                        mcq.map((y, i) =>
                          i === n
                            ? { ...y, opts: y.opts.map((z, zi) => (zi === oi ? e.target.value : z)) }
                            : y,
                        ),
                      )
                    }
                  />
                </div>
              ))}
            </div>
            <textarea
              className={`${input} mt-2 bn`}
              rows={2}
              value={x.why || ''}
              placeholder="কেন এটাই উত্তর…"
              onChange={(e) =>
                setMcq(mcq.map((y, i) => (i === n ? { ...y, why: e.target.value } : y)))
              }
            />
          </div>
        ))}
        <button
          className="btn-secondary"
          onClick={() => setMcq([...mcq, { q: '', opts: ['', '', '', ''], ans: 0, why: '' }])}
        >
          + MCQ যোগ করুন
        </button>
      </Section>

      {/* ---------------- tables ---------------- */}
      <Section
        title="Information Transfer Tables"
        count={`${tables.length} টেবিল · ${blanks} ফাঁকা`}
        hint={
          'যে অংশটুকু ক্লাসে উত্তর হিসেবে খুলবে তার আগে @ দিন — যেমন "(i) @his people\'s emancipation"। ' +
          'প্রতিটি ফাঁকা আলাদা করে খুলবে (R = পরেরটি, Shift+R = আগেরটি লুকাও)। একাধিক টেবিল দিলে প্রতিটি আলাদা স্লাইড হবে।'
        }
      >
        {tables.map((table, ti) => {
          const cols = table.headers.length;
          return (
            <div key={ti} className="border border-slate-200 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="badge bg-brand-50 text-brand-700">টেবিল {ti + 1}</span>
                <input
                  className={`${input} max-w-xs`}
                  value={table.title || ''}
                  placeholder="টেবিলের নাম (ঐচ্ছিক)"
                  onChange={(e) => patchTable(ti, { title: e.target.value })}
                />
                <button
                  className="ml-auto text-xs text-rose-600 font-semibold"
                  onClick={() => setTables(tables.filter((_, i) => i !== ti))}
                >
                  টেবিল মুছুন
                </button>
              </div>

              <label className={label}>কলামের শিরোনাম</label>
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.max(cols, 1)}, minmax(0,1fr))` }}>
                {table.headers.map((h, ci) => (
                  <input
                    key={ci}
                    className={input}
                    value={h}
                    placeholder={`কলাম ${ci + 1}`}
                    onChange={(e) =>
                      patchTable(ti, { headers: table.headers.map((y, i) => (i === ci ? e.target.value : y)) })
                    }
                  />
                ))}
              </div>
              <div className="flex gap-3 mt-2">
                <button
                  className="text-xs text-brand-700 font-semibold"
                  onClick={() =>
                    patchTable(ti, {
                      headers: [...table.headers, ''],
                      rows: table.rows.map((r) => [...r, '']),
                    })
                  }
                >
                  + কলাম
                </button>
                {cols > 2 && (
                  <button
                    className="text-xs text-rose-600 font-semibold"
                    onClick={() =>
                      patchTable(ti, {
                        headers: table.headers.slice(0, -1),
                        rows: table.rows.map((r) => r.slice(0, -1)),
                      })
                    }
                  >
                    − কলাম
                  </button>
                )}
              </div>

              <div className="mt-4 space-y-2">
                {table.rows.map((r, ri) => (
                  <div key={ri} className="flex gap-2 items-start">
                    <span className="badge bg-slate-100 text-slate-500 mt-2">{ri + 1}</span>
                    <div
                      className="grid gap-2 flex-1"
                      style={{ gridTemplateColumns: `repeat(${Math.max(cols, 1)}, minmax(0,1fr))` }}
                    >
                      {Array.from({ length: cols }).map((_, ci) => (
                        <input
                          key={ci}
                          className={`${input} ${(r[ci] || '').includes('@') ? 'bg-amber-50' : ''}`}
                          value={r[ci] || ''}
                          onChange={(e) =>
                            patchTable(ti, {
                              rows: table.rows.map((y, i) =>
                                i === ri
                                  ? Array.from({ length: cols }).map((__, k) => (k === ci ? e.target.value : y[k] || ''))
                                  : y,
                              ),
                            })
                          }
                        />
                      ))}
                    </div>
                    <button
                      className="text-xs text-rose-600 font-semibold mt-2"
                      onClick={() => patchTable(ti, { rows: table.rows.filter((_, i) => i !== ri) })}
                    >
                      মুছুন
                    </button>
                  </div>
                ))}
              </div>

              <button
                className="btn-secondary mt-3"
                onClick={() => patchTable(ti, { rows: [...table.rows, Array(Math.max(cols, 1)).fill('')] })}
              >
                + সারি যোগ করুন
              </button>

              <label className={`${label} mt-4`}>টেবিলের নিচের নোট (ঐচ্ছিক)</label>
              <textarea
                className={`${input} bn`}
                rows={2}
                value={table.note || ''}
                onChange={(e) => patchTable(ti, { note: e.target.value })}
              />
            </div>
          );
        })}

        <button
          className="btn-secondary"
          onClick={() => setTables([...tables, { title: '', headers: ['', '', ''], rows: [], note: '' }])}
        >
          + নতুন টেবিল যোগ করুন
        </button>
      </Section>

      {/* ---------------- flow chart ---------------- */}
      <Section
        title="Flow Chart"
        count={`${flow.items.length} ঘর`}
        hint="১ নম্বর ঘর ক্লাসে আগে থেকেই দেখা যায়; বাকিগুলো একটি একটি করে খুলবে। কমপক্ষে ২টি ঘর দিন।"
      >
        <label className={label}>ফ্লো-চার্টের শিরোনাম</label>
        <input
          className={input}
          value={flow.title || ''}
          onChange={(e) => setFlow({ ...flow, title: e.target.value })}
          placeholder="How Mandela changed South Africa"
        />
        <div className="mt-3 space-y-2">
          {flow.items.map((it, n) => (
            <div key={n} className="flex gap-2 items-start">
              <span className={`badge mt-2 ${n === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {n + 1}
                {n === 0 ? ' · দেওয়া' : ''}
              </span>
              <div className="flex-1 space-y-2">
                <input
                  className={input}
                  value={it.t}
                  placeholder="ছোট phrase…"
                  onChange={(e) =>
                    setFlow({ ...flow, items: flow.items.map((y, i) => (i === n ? { ...y, t: e.target.value } : y)) })
                  }
                />
                <input
                  className={`${input} bn`}
                  value={it.bn || ''}
                  placeholder="বাংলা (ঐচ্ছিক)"
                  onChange={(e) =>
                    setFlow({ ...flow, items: flow.items.map((y, i) => (i === n ? { ...y, bn: e.target.value } : y)) })
                  }
                />
              </div>
              <button
                className="text-xs text-rose-600 font-semibold mt-2"
                onClick={() => setFlow({ ...flow, items: flow.items.filter((_, i) => i !== n) })}
              >
                মুছুন
              </button>
            </div>
          ))}
        </div>
        <button
          className="btn-secondary mt-3"
          onClick={() => setFlow({ ...flow, items: [...flow.items, { t: '', bn: '' }] })}
        >
          + ঘর যোগ করুন
        </button>
      </Section>

      {/* ---------------- passage & highlights ---------------- */}
      <Section
        title="প্যাসেজ ও হাইলাইট"
        count={`${passage.length} অনুচ্ছেদ · ${marks} হাইলাইট`}
        hint="যে অংশ হাইলাইট করতে চান তার দুই পাশে == বসান — যেমন ==shackles of apartheid==। **গাঢ়** আর *ইটালিক*ও চলে। প্রতিটি বাক্যের নিচে তার বাংলা অর্থ।"
      >
        {passage.map((para, pi) => (
          <div key={pi} className="border border-slate-200 rounded-xl p-4 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <input
                className={`${input} max-w-md`}
                value={para.tag || ''}
                placeholder={`Paragraph ${pi + 1} — শিরোনাম`}
                onChange={(e) =>
                  setPassage(passage.map((y, i) => (i === pi ? { ...y, tag: e.target.value } : y)))
                }
              />
              <button
                className="ml-auto text-xs text-rose-600 font-semibold"
                onClick={() => setPassage(passage.filter((_, i) => i !== pi))}
              >
                অনুচ্ছেদ মুছুন
              </button>
            </div>
            {para.s.map((sen, si) => {
              const patchS = (patch: Partial<Sentence>) =>
                setPassage(
                  passage.map((y, i) =>
                    i === pi ? { ...y, s: y.s.map((z, j) => (j === si ? { ...z, ...patch } : z)) } : y,
                  ),
                );
              return (
                <div key={si} className="flex gap-2 items-start mt-2">
                  <span className="badge bg-slate-100 text-slate-500 mt-2">{si + 1}</span>
                  <div className="flex-1 space-y-2">
                    <textarea
                      className={input}
                      rows={2}
                      value={sen.en}
                      onChange={(e) => patchS({ en: e.target.value })}
                    />
                    <textarea
                      className={`${input} bn`}
                      rows={2}
                      value={sen.bn || ''}
                      placeholder="বাংলা অর্থ…"
                      onChange={(e) => patchS({ bn: e.target.value })}
                    />
                  </div>
                  <button
                    className="text-xs text-rose-600 font-semibold mt-2"
                    onClick={() =>
                      setPassage(
                        passage.map((y, i) => (i === pi ? { ...y, s: y.s.filter((_, j) => j !== si) } : y)),
                      )
                    }
                  >
                    মুছুন
                  </button>
                </div>
              );
            })}
            <button
              className="btn-secondary mt-3"
              onClick={() =>
                setPassage(passage.map((y, i) => (i === pi ? { ...y, s: [...y.s, { en: '', bn: '' }] } : y)))
              }
            >
              + বাক্য যোগ করুন
            </button>
          </div>
        ))}
        <button
          className="btn-secondary"
          onClick={() => setPassage([...passage, { tag: '', s: [{ en: '', bn: '' }] }])}
        >
          + অনুচ্ছেদ যোগ করুন
        </button>
      </Section>

      {/* ---------------- vocabulary ---------------- */}
      <Section
        title="শব্দার্থ (Vocabulary)"
        count={`${words.length} শব্দ`}
        hint="এই তালিকার শব্দগুলোই প্যাসেজে ক্লিক করা যায় — শব্দ যোগ করলে সেটি প্যাসেজেও ক্লিকযোগ্য হয়ে যাবে।"
      >
        {words.map((w, n) => {
          const patchW = (patch: Partial<Word>) =>
            setWords(words.map((y, i) => (i === n ? { ...y, ...patch } : y)));
          return (
            <div key={n} className="border border-slate-200 rounded-xl p-3 mb-2">
              <div className="grid sm:grid-cols-3 gap-2">
                <input className={input} value={w.w} placeholder="word" onChange={(e) => patchW({ w: e.target.value })} />
                <input className={input} value={w.pos || ''} placeholder="noun / verb…" onChange={(e) => patchW({ pos: e.target.value })} />
                <input className={input} value={w.pron || ''} placeholder="/prəˌnʌnsiˈeɪʃn/" onChange={(e) => patchW({ pron: e.target.value })} />
              </div>
              <input className={`${input} mt-2 bn`} value={w.bn || ''} placeholder="বাংলা অর্থ" onChange={(e) => patchW({ bn: e.target.value })} />
              <input className={`${input} mt-2`} value={w.en || ''} placeholder="English meaning" onChange={(e) => patchW({ en: e.target.value })} />
              <div className="flex gap-2 mt-2">
                <input className={input} value={w.ex || ''} placeholder="example…" onChange={(e) => patchW({ ex: e.target.value })} />
                <button className="text-xs text-rose-600 font-semibold flex-none" onClick={() => setWords(words.filter((_, i) => i !== n))}>
                  মুছুন
                </button>
              </div>
            </div>
          );
        })}
        <button className="btn-secondary" onClick={() => setWords([...words, { w: '' }])}>
          + শব্দ যোগ করুন
        </button>
      </Section>

      {/* ---------------- synonyms / antonyms ---------------- */}
      <Section
        title="Synonym / Antonym"
        count={`${synant.length} শব্দ`}
        hint="কমা দিয়ে আলাদা করুন। এগুলো শব্দের কার্ডেও দেখাবে, আর সেখান থেকে ক্লিক করে অন্য শব্দে যাওয়া যাবে।"
      >
        {synant.map((x, n) => {
          const patchX = (patch: Partial<SynAnt>) =>
            setSynant(synant.map((y, i) => (i === n ? { ...y, ...patch } : y)));
          const csv = (v: string) => v.split(',').map((z) => z.trim()).filter(Boolean);
          return (
            <div key={n} className="border border-slate-200 rounded-xl p-3 mb-2">
              <div className="flex gap-2">
                <input className={input} value={x.w} placeholder="word" onChange={(e) => patchX({ w: e.target.value })} />
                <input className={`${input} bn`} value={x.bn || ''} placeholder="বাংলা" onChange={(e) => patchX({ bn: e.target.value })} />
                <button className="text-xs text-rose-600 font-semibold flex-none" onClick={() => setSynant(synant.filter((_, i) => i !== n))}>
                  মুছুন
                </button>
              </div>
              <input
                className={`${input} mt-2`}
                value={(x.syn || []).join(', ')}
                placeholder="synonyms: restraints, fetters, chains"
                onChange={(e) => patchX({ syn: csv(e.target.value) })}
              />
              <input
                className={`${input} mt-2`}
                value={(x.ant || []).join(', ')}
                placeholder="antonyms: freedom, liberty"
                onChange={(e) => patchX({ ant: csv(e.target.value) })}
              />
            </div>
          );
        })}
        <button className="btn-secondary" onClick={() => setSynant([...synant, { w: '', syn: [], ant: [] }])}>
          + যোগ করুন
        </button>
      </Section>

      {/* ---------------- save bar ---------------- */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-slate-200 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="text-sm min-w-0 flex-1">
            {err && <span className="text-rose-600">{err}</span>}
            {saved && <span className="text-emerald-700">{saved}</span>}
          </div>
          <button className="btn-secondary" onClick={() => router.push(`/decks/${id}`)}>
            বাতিল
          </button>
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? 'সংরক্ষণ হচ্ছে…' : 'সংরক্ষণ করুন'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DeckEditPage() {
  return (
    <Protected roles={['teacher', 'admin']}>
      <DeckEditor />
    </Protected>
  );
}
