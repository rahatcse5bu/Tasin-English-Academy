'use client';
import { useMemo, useState } from 'react';
import { bnNum } from '@/lib/format';

/* ------------------------------------------------------------------ */
/* Types (loose — content comes straight from the curriculum JSON)     */
/* ------------------------------------------------------------------ */
export interface Lesson {
  id: string;
  number: number | string;
  title: string;
  is_poem?: boolean | string;
  poet?: string;
  author?: string;
  keywords?: string[];
  learn_line?: string;
  minutes?: number | string;
  warmup?: string[];
  reading?: { summary_en?: string; gist_bn?: string; book_page?: string };
  vocab?: any[];
  mcqs?: { q: string; options: string[]; answer_index: number | string; explain?: string }[];
  short_answers?: { q: string; model: string }[];
  true_false?: { statement: string; is_true: boolean | string; correction?: string }[];
  cloze?: { text_with_blanks: string; blanks: string[] };
  table?: { headers: string[]; rows: string[][]; blanks?: string[] };
  match?: { left: string[]; right: string[]; pairs: number[][] };
  summary?: { model?: string; skeleton?: string };
  writing?: { type?: string; prompt?: string; model?: string };
  qa?: { q: string; model: string }[];
}

type TabKey =
  | 'read' | 'vocab' | 'mcq' | 'short' | 'tf' | 'cloze' | 'match' | 'table' | 'summary' | 'writing' | 'qa';

const TAB_META: { key: TabKey; emoji: string; label: string; has: (l: Lesson) => boolean }[] = [
  { key: 'read', emoji: '📖', label: 'Read', has: (l) => !!l.reading?.summary_en || !!l.warmup?.length },
  { key: 'vocab', emoji: '🗂️', label: 'Words', has: (l) => !!l.vocab?.length },
  { key: 'mcq', emoji: '🎯', label: 'Quiz', has: (l) => !!l.mcqs?.length },
  { key: 'short', emoji: '✍️', label: 'Short Q', has: (l) => !!l.short_answers?.length },
  { key: 'tf', emoji: '✅', label: 'True/False', has: (l) => !!l.true_false?.length },
  { key: 'cloze', emoji: '🧩', label: 'Fill Gap', has: (l) => !!l.cloze?.blanks?.length },
  { key: 'match', emoji: '🔗', label: 'Match', has: (l) => !!l.match?.pairs?.length },
  { key: 'table', emoji: '📊', label: 'Table', has: (l) => !!l.table?.rows?.length },
  { key: 'summary', emoji: '📝', label: 'Summary', has: (l) => !!l.summary?.model },
  { key: 'writing', emoji: '🖊️', label: 'Writing', has: (l) => !!l.writing?.model },
  { key: 'qa', emoji: '💬', label: 'Q & A', has: (l) => !!l.qa?.length },
];

const norm = (s: string) =>
  s.trim().toLowerCase().replace(/[.,'’"]/g, '').replace(/\s+/g, ' ');

/* ================================================================== */
export default function LessonStudio({ lesson }: { lesson: Lesson }) {
  const tabs = useMemo(() => TAB_META.filter((t) => t.has(lesson)), [lesson]);
  const [active, setActive] = useState<TabKey>(tabs[0]?.key || 'read');

  // keep the active tab valid when the lesson changes
  const activeValid = tabs.some((t) => t.key === active) ? active : tabs[0]?.key || 'read';

  return (
    <div>
      {/* tab bar */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
        {tabs.map((t) => {
          const on = t.key === activeValid;
          return (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              className={`flex-shrink-0 rounded-xl px-3.5 py-2 text-sm font-semibold transition whitespace-nowrap ${
                on
                  ? 'bg-brand-700 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-brand-300'
              }`}
            >
              <span className="mr-1.5">{t.emoji}</span>
              {t.label}
            </button>
          );
        })}
      </div>

      {/* panel — keyed by lesson+tab so each switch resets local state */}
      <div key={`${lesson.id}-${activeValid}`} className="mt-4 animate-[fadeIn_.3s_ease]">
        {activeValid === 'read' && <ReadPanel lesson={lesson} />}
        {activeValid === 'vocab' && <VocabPanel vocab={lesson.vocab!} />}
        {activeValid === 'mcq' && <QuizPanel mcqs={lesson.mcqs!} />}
        {activeValid === 'short' && <ShortPanel items={lesson.short_answers!} />}
        {activeValid === 'tf' && <TrueFalsePanel items={lesson.true_false!} />}
        {activeValid === 'cloze' && <ClozePanel cloze={lesson.cloze!} />}
        {activeValid === 'match' && <MatchPanel match={lesson.match!} />}
        {activeValid === 'table' && <TablePanel table={lesson.table!} />}
        {activeValid === 'summary' && <SummaryPanel summary={lesson.summary!} />}
        {activeValid === 'writing' && <WritingPanel writing={lesson.writing!} />}
        {activeValid === 'qa' && <ShortPanel items={lesson.qa!} qa />}
      </div>

      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { scrollbar-width: none; }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* READ                                                                */
/* ------------------------------------------------------------------ */
function ReadPanel({ lesson }: { lesson: Lesson }) {
  return (
    <div className="space-y-4">
      {!!lesson.keywords?.length && (
        <div className="flex flex-wrap gap-2">
          {lesson.keywords.map((k) => (
            <span key={k} className="badge bg-amber-50 text-amber-700 border border-amber-200">{k}</span>
          ))}
        </div>
      )}

      {lesson.reading?.summary_en && (
        <div className="card border-l-4 border-l-brand-500">
          <h3 className="text-xs font-bold uppercase tracking-wide text-brand-600 mb-2">📘 What it's about</h3>
          <p className="text-slate-700 leading-relaxed">{lesson.reading.summary_en}</p>
          {lesson.reading.book_page && (
            <div className="mt-3 text-xs text-slate-400">📍 বইয়ের পৃষ্ঠা {bnNum(lesson.reading.book_page)} — মূল লেখা পড়ো।</div>
          )}
        </div>
      )}

      {lesson.reading?.gist_bn && (
        <div className="card bg-teal-50 border-teal-100">
          <h3 className="text-xs font-bold uppercase tracking-wide text-teal-700 mb-2">🟢 বাংলা সারাংশ</h3>
          <p className="text-teal-900 leading-relaxed">{lesson.reading.gist_bn}</p>
        </div>
      )}

      {!!lesson.warmup?.length && (
        <div className="card">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">🤔 ভাবো তো</h3>
          <ul className="space-y-2">
            {lesson.warmup.map((w, i) => (
              <li key={i} className="flex gap-2 text-slate-700">
                <span className="text-brand-500 font-bold flex-shrink-0">{bnNum(i + 1)}.</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* VOCAB — flashcards                                                  */
/* ------------------------------------------------------------------ */
function VocabPanel({ vocab }: { vocab: any[] }) {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const v = vocab[i];
  const go = (d: number) => { setFlipped(false); setI((x) => (x + d + vocab.length) % vocab.length); };

  return (
    <div>
      <div className="flex items-center justify-between mb-2 text-xs font-semibold text-slate-400">
        <span>কার্ড {bnNum(i + 1)} / {bnNum(vocab.length)}</span>
        <span>ট্যাপ করে অর্থ দেখো</span>
      </div>

      <div
        className="relative h-72 cursor-pointer"
        style={{ perspective: '1400px' }}
        onClick={() => setFlipped((f) => !f)}
      >
        <div
          className="relative w-full h-full transition-transform duration-500"
          style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'none' }}
        >
          {/* front */}
          <div
            className="absolute inset-0 rounded-2xl bg-brand-800 text-white flex flex-col items-center justify-center text-center p-6 shadow-lg"
            style={{ backfaceVisibility: 'hidden' }}
          >
            {v.pos && <span className="text-xs tracking-widest uppercase text-amber-300 font-bold">{v.pos}</span>}
            <span className="text-4xl sm:text-5xl font-extrabold my-3">{v.word}</span>
            <span className="text-sm text-brand-200">তাপ দাও → অর্থ দেখো</span>
          </div>
          {/* back */}
          <div
            className="absolute inset-0 rounded-2xl bg-white border border-slate-200 p-6 shadow-lg overflow-auto"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="font-bold text-lg text-slate-900">{v.word}</div>
            {v.bangla && <div className="text-xl text-brand-700 font-semibold mb-2">{v.bangla}</div>}
            {v.meaning_en && <p className="text-sm text-slate-600 mb-3">{v.meaning_en}</p>}
            <div className="flex flex-wrap gap-2 mb-3">
              {v.synonym && <span className="badge bg-teal-50 text-teal-700">syn: {v.synonym}</span>}
              {v.antonym && v.antonym !== '—' && <span className="badge bg-rose-50 text-rose-600">ant: {v.antonym}</span>}
            </div>
            {v.example && (
              <p className="text-sm italic text-slate-500 border-l-2 border-amber-400 pl-3">"{v.example}"</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <button onClick={() => go(-1)} className="flex-1 btn-secondary">‹ আগের</button>
        <button onClick={() => go(1)} className="flex-1 btn-primary">পরের ›</button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* MCQ QUIZ                                                            */
/* ------------------------------------------------------------------ */
function QuizPanel({ mcqs }: { mcqs: Lesson['mcqs'] & {} }) {
  const [qi, setQi] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);

  if (qi >= mcqs.length) {
    const pct = Math.round((score / mcqs.length) * 100);
    const badge = pct === 100 ? '🏆 দুর্দান্ত' : pct >= 70 ? '⭐ ভালো' : '📚 আরও চেষ্টা';
    const msg = pct === 100 ? 'পারফেক্ট! এই পাঠের MCQ তুমি আয়ত্ত করেছ।'
      : pct >= 70 ? 'প্রায় হয়ে গেছে — ভুলগুলো দেখে আবার চেষ্টা করো।'
      : 'নোট আবার পড়ে ফিরে এসো।';
    return (
      <div className="card text-center py-8">
        <div className="text-5xl font-extrabold text-brand-700">{bnNum(score)}/{bnNum(mcqs.length)}</div>
        <div className="badge bg-teal-600 text-white my-4">{badge}</div>
        <p className="text-slate-600 mb-5">{msg}</p>
        <button
          className="btn-secondary"
          onClick={() => { setQi(0); setScore(0); setStreak(0); setPicked(null); }}
        >
          আবার চেষ্টা করো
        </button>
      </div>
    );
  }

  const Q = mcqs[qi];
  const answer = Number(Q.answer_index);
  const answered = picked !== null;

  const pick = (i: number) => {
    if (answered) return;
    setPicked(i);
    if (i === answer) { setScore((s) => s + 1); setStreak((s) => s + 1); }
    else setStreak(0);
  };
  const next = () => { setQi((q) => q + 1); setPicked(null); };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4 text-xs font-semibold">
        <span className="text-slate-400">প্রশ্ন {bnNum(qi + 1)} / {bnNum(mcqs.length)}</span>
        <span className="text-amber-600">🔥 {bnNum(streak)} · {bnNum(score)} ✓</span>
      </div>
      <div className="font-bold text-lg text-slate-900 mb-4">{Q.q}</div>
      <div className="space-y-2.5">
        {Q.options.map((o, i) => {
          let cls = 'border-slate-200 hover:border-brand-400';
          if (answered && i === answer) cls = 'border-teal-500 bg-teal-50 text-teal-800 font-semibold';
          else if (answered && i === picked) cls = 'border-rose-400 bg-rose-50 text-rose-700';
          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => pick(i)}
              className={`block w-full text-left rounded-xl border px-4 py-3 transition ${cls}`}
            >
              {o}
            </button>
          );
        })}
      </div>
      {answered && Q.explain && (
        <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          💡 {Q.explain}
        </div>
      )}
      <button disabled={!answered} onClick={next} className="btn-primary w-full mt-4 disabled:opacity-40">
        পরের ›
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SHORT ANSWERS / Q&A — reveal model                                  */
/* ------------------------------------------------------------------ */
function ShortPanel({ items, qa }: { items: { q: string; model: string }[]; qa?: boolean }) {
  const [open, setOpen] = useState<Record<number, boolean>>({});
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i} className="card">
          <div className="flex gap-2 font-semibold text-slate-900">
            <span className="text-brand-600 flex-shrink-0">{qa ? '💬' : `প্র${bnNum(i + 1)}.`}</span>
            <span>{it.q}</span>
          </div>
          {open[i] ? (
            <p className="mt-3 text-slate-700 bg-slate-50 rounded-lg p-3 border border-slate-100 leading-relaxed">
              {it.model}
            </p>
          ) : (
            <button
              onClick={() => setOpen((o) => ({ ...o, [i]: true }))}
              className="mt-3 text-sm font-medium text-brand-700 hover:underline"
            >
              উত্তর দেখাও →
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* TRUE / FALSE                                                        */
/* ------------------------------------------------------------------ */
function TrueFalsePanel({ items }: { items: Lesson['true_false'] & {} }) {
  const [ans, setAns] = useState<Record<number, boolean>>({});
  const truth = (v: any) => v === true || v === 'True' || v === 'true';
  return (
    <div className="space-y-3">
      {items.map((it, i) => {
        const picked = ans[i];
        const correct = truth(it.is_true);
        const done = picked !== undefined;
        return (
          <div key={i} className="card">
            <p className="font-medium text-slate-800">{it.statement}</p>
            <div className="flex gap-2 mt-3">
              {[true, false].map((val) => {
                const isPick = picked === val;
                let cls = 'border-slate-200 text-slate-600 hover:border-brand-300';
                if (done && val === correct) cls = 'border-teal-500 bg-teal-50 text-teal-700 font-semibold';
                else if (done && isPick && val !== correct) cls = 'border-rose-400 bg-rose-50 text-rose-700';
                return (
                  <button
                    key={String(val)}
                    disabled={done}
                    onClick={() => setAns((a) => ({ ...a, [i]: val }))}
                    className={`flex-1 rounded-lg border px-4 py-2 text-sm font-semibold transition ${cls}`}
                  >
                    {val ? '✔ True' : '✗ False'}
                  </button>
                );
              })}
            </div>
            {done && (
              <div
                className={`mt-3 text-sm rounded-lg px-3 py-2 ${
                  picked === correct ? 'bg-teal-50 text-teal-700' : 'bg-rose-50 text-rose-700'
                }`}
              >
                {picked === correct ? 'সঠিক! ' : 'ভুল — '}
                {it.correction && <span className="text-slate-600">{it.correction}</span>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* CLOZE — fill the gaps                                               */
/* ------------------------------------------------------------------ */
function ClozePanel({ cloze }: { cloze: { text_with_blanks: string; blanks: string[] } }) {
  const [vals, setVals] = useState<string[]>(() => cloze.blanks.map(() => ''));
  const [checked, setChecked] = useState(false);

  // split "...(1)____..." into text + numbered blank slots
  const parts = useMemo(() => cloze.text_with_blanks.split(/\(\d+\)_+/g), [cloze.text_with_blanks]);
  const correctCount = vals.filter((v, i) => checked && norm(v) === norm(cloze.blanks[i])).length;

  return (
    <div className="card">
      <p className="leading-[2.6] text-slate-700">
        {parts.map((seg, i) => (
          <span key={i}>
            {seg}
            {i < cloze.blanks.length && (
              <input
                value={vals[i]}
                onChange={(e) => { const n = [...vals]; n[i] = e.target.value; setVals(n); setChecked(false); }}
                className={`inline-block w-28 text-center mx-1 px-2 py-0.5 rounded-md border-b-2 bg-amber-50/60 focus:outline-none ${
                  !checked ? 'border-amber-400'
                    : norm(vals[i]) === norm(cloze.blanks[i]) ? 'border-teal-500 bg-teal-50 text-teal-700 font-semibold'
                    : 'border-rose-400 bg-rose-50'
                }`}
                placeholder={`(${i + 1})`}
              />
            )}
          </span>
        ))}
      </p>
      <button onClick={() => setChecked(true)} className="btn-primary w-full mt-5">উত্তর মিলাও</button>
      {checked && (
        <div className="mt-3 text-center text-sm font-semibold text-slate-600">
          {bnNum(correctCount)}/{bnNum(cloze.blanks.length)} সঠিক
          {correctCount < cloze.blanks.length && (
            <details className="mt-2 text-left">
              <summary className="cursor-pointer text-brand-700">সঠিক উত্তর দেখাও</summary>
              <div className="mt-2 flex flex-wrap gap-2">
                {cloze.blanks.map((b, i) => (
                  <span key={i} className="badge bg-slate-100 text-slate-700">({bnNum(i + 1)}) {b}</span>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* MATCH                                                               */
/* ------------------------------------------------------------------ */
function MatchPanel({ match }: { match: { left: string[]; right: string[]; pairs: number[][] } }) {
  const answerFor = useMemo(() => {
    const m: Record<number, number> = {};
    match.pairs.forEach(([l, r]) => (m[l] = r));
    return m;
  }, [match.pairs]);

  const [selL, setSelL] = useState<number | null>(null);
  const [made, setMade] = useState<Record<number, number>>({}); // leftIdx -> rightIdx
  const usedRight = new Set(Object.values(made));

  const choose = (side: 'l' | 'r', idx: number) => {
    if (side === 'l') { setSelL(idx); return; }
    if (selL === null || usedRight.has(idx)) return;
    setMade((m) => ({ ...m, [selL]: idx }));
    setSelL(null);
  };

  const allDone = Object.keys(made).length === match.left.length;
  const correct = Object.entries(made).filter(([l, r]) => answerFor[+l] === r).length;

  return (
    <div className="card">
      <p className="text-xs font-semibold text-slate-400 mb-3">বাঁ দিক থেকে একটি বেছে নাও, তারপর ডান দিক থেকে মিলাও</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {match.left.map((l, i) => {
            const matchedR = made[i];
            const done = matchedR !== undefined;
            const right = done ? answerFor[i] === matchedR : null;
            let cls = 'border-slate-200';
            if (selL === i) cls = 'border-brand-500 bg-brand-50';
            else if (done && right) cls = 'border-teal-500 bg-teal-50';
            else if (done && !right) cls = 'border-rose-400 bg-rose-50';
            return (
              <button key={i} onClick={() => choose('l', i)} disabled={done}
                className={`block w-full text-left text-sm rounded-lg border px-3 py-2.5 transition ${cls}`}>
                {l}
              </button>
            );
          })}
        </div>
        <div className="space-y-2">
          {match.right.map((r, i) => (
            <button key={i} onClick={() => choose('r', i)} disabled={usedRight.has(i)}
              className={`block w-full text-left text-sm rounded-lg border px-3 py-2.5 transition ${
                usedRight.has(i) ? 'border-slate-200 bg-slate-100 text-slate-400' : 'border-slate-200 hover:border-brand-400'
              }`}>
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={() => { setMade({}); setSelL(null); }} className="btn-secondary flex-1 text-sm">রিসেট</button>
      </div>
      {allDone && (
        <div className="mt-3 text-center text-sm font-semibold text-slate-600">
          {bnNum(correct)}/{bnNum(match.left.length)} সঠিক মিল
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* TABLE — tap a row to reveal its answer                              */
/* ------------------------------------------------------------------ */
function TablePanel({ table }: { table: { headers: string[]; rows: string[][] } }) {
  const [open, setOpen] = useState<Record<number, boolean>>({});
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500 border-b border-slate-200">
            {table.headers.map((h, i) => <th key={i} className="py-2 pr-3 font-semibold">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => (
            <tr key={i} className="border-b border-slate-100 last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="py-2.5 pr-3 align-top">
                  {j === 0 ? (
                    <span className="font-medium text-slate-800">{cell}</span>
                  ) : open[i] ? (
                    <span className="text-teal-700">{cell}</span>
                  ) : (
                    <button onClick={() => setOpen((o) => ({ ...o, [i]: true }))}
                      className="text-brand-600 text-xs font-medium hover:underline">দেখাও</button>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SUMMARY                                                             */
/* ------------------------------------------------------------------ */
function SummaryPanel({ summary }: { summary: { model?: string; skeleton?: string } }) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-4">
      {summary.skeleton && (
        <div className="card">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">🧱 কাঠামো (নিজে ভরো)</h3>
          <p className="text-slate-700 leading-relaxed whitespace-pre-line">{summary.skeleton}</p>
        </div>
      )}
      {summary.model && (
        <div className="card border-l-4 border-l-teal-500">
          <h3 className="text-xs font-bold uppercase tracking-wide text-teal-700 mb-2">✅ মডেল সারাংশ</h3>
          {show ? (
            <p className="text-slate-700 leading-relaxed">{summary.model}</p>
          ) : (
            <button onClick={() => setShow(true)} className="text-sm font-medium text-brand-700 hover:underline">
              মডেল উত্তর দেখাও →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* WRITING                                                             */
/* ------------------------------------------------------------------ */
function WritingPanel({ writing }: { writing: { type?: string; prompt?: string; model?: string } }) {
  const [text, setText] = useState('');
  const [show, setShow] = useState(false);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return (
    <div className="space-y-4">
      <div className="card">
        {writing.type && <span className="badge bg-brand-50 text-brand-700 mb-2">{writing.type}</span>}
        <p className="font-semibold text-slate-900">{writing.prompt}</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={7}
          placeholder="এখানে তোমার উত্তর লেখো..."
          className="input mt-3 resize-y leading-relaxed"
        />
        <div className="text-right text-xs text-slate-400 mt-1">{bnNum(words)} শব্দ</div>
      </div>
      {writing.model && (
        <div className="card border-l-4 border-l-teal-500">
          <h3 className="text-xs font-bold uppercase tracking-wide text-teal-700 mb-2">✅ মডেল রচনা</h3>
          {show ? (
            <p className="text-slate-700 leading-relaxed whitespace-pre-line">{writing.model}</p>
          ) : (
            <button onClick={() => setShow(true)} className="text-sm font-medium text-brand-700 hover:underline">
              মডেল উত্তর দেখাও →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
