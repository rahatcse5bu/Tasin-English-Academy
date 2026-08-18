'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { plain } from '@/lib/deck/text';
import type { ChapterMeta } from '@/lib/deck/types';

/**
 * Opening a chapter to students.
 *
 * Sections are ticked by name rather than by slide number, because numbering
 * shifts the moment a chapter is edited and a share made last week should not
 * silently start pointing at different slides.
 *
 * The answers switch is not cosmetic: with it off the server strips every
 * answer before responding, so a questions-only share really does travel
 * without them.
 */

const SECTIONS: { key: string; label: string; group: 'read' | 'ask' | 'extra' }[] = [
  { key: 'passage', label: 'প্যাসেজ', group: 'read' },
  { key: 'translation', label: 'বাংলা অনুবাদ', group: 'read' },
  { key: 'words', label: 'শব্দার্থ', group: 'read' },
  { key: 'synant', label: 'Synonym / Antonym', group: 'read' },
  { key: 'summary', label: 'Summary', group: 'read' },
  { key: 'rules', label: 'নিয়ম (Rules)', group: 'read' },

  { key: 'mcq', label: 'MCQ', group: 'ask' },
  { key: 'shortq', label: 'Short Questions', group: 'ask' },
  { key: 'table', label: 'Table', group: 'ask' },
  { key: 'flow', label: 'Flow Chart', group: 'ask' },
  { key: 'gapfill', label: 'Gap Filling', group: 'ask' },
  { key: 'matching', label: 'Matching', group: 'ask' },
  { key: 'ordering', label: 'Re-arrange', group: 'ask' },
  { key: 'literature', label: 'Poems / Stories', group: 'ask' },
  { key: 'drill', label: 'অনুশীলন', group: 'ask' },
  { key: 'board', label: 'বোর্ড প্রশ্ন', group: 'ask' },

  { key: 'extra', label: 'Extras', group: 'extra' },
  { key: 'tips', label: 'Tips', group: 'extra' },
  { key: 'recap', label: 'Recap ও Homework', group: 'extra' },
];

const GROUPS: { id: 'read' | 'ask' | 'extra'; title: string }[] = [
  { id: 'read', title: 'পড়ার অংশ' },
  { id: 'ask', title: 'প্রশ্ন ও অনুশীলন' },
  { id: 'extra', title: 'অতিরিক্ত' },
];

export default function ShareDialog({
  chapter,
  onClose,
  onSaved,
}: {
  chapter: ChapterMeta;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { token } = useAuth();
  const s = chapter.share;

  const [enabled, setEnabled] = useState(!!s?.enabled);
  const [sections, setSections] = useState<string[]>(s?.sections || []);
  const [withAnswers, setWithAnswers] = useState(!!s?.withAnswers);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  const toggle = (k: string) =>
    setSections((v) => (v.includes(k) ? v.filter((x) => x !== k) : [...v, k]));

  const pickGroup = (g: 'read' | 'ask' | 'extra') => {
    const keys = SECTIONS.filter((x) => x.group === g).map((x) => x.key);
    const all = keys.every((k) => sections.includes(k));
    setSections((v) => (all ? v.filter((k) => !keys.includes(k)) : [...new Set([...v, ...keys])]));
  };

  async function save() {
    setBusy(true);
    setErr('');
    try {
      await api(`/decks/${chapter.id}/share`, {
        method: 'PATCH',
        token: token || undefined,
        body: JSON.stringify({ enabled, sections, withAnswers }),
      });
      onSaved();
    } catch (e: any) {
      setErr(e.message || 'সংরক্ষণ করা যায়নি');
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-900">শিক্ষার্থীদের সাথে শেয়ার</h2>
          <p className="text-xs text-slate-500 mt-0.5">{plain(chapter.title)}</p>
        </div>

        <div className="p-5 space-y-4">
          <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 cursor-pointer">
            <input type="checkbox" className="w-4 h-4" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
            <span>
              <span className="font-semibold text-slate-900">শিক্ষার্থীরা এই অধ্যায় দেখতে পাবে</span>
              <span className="block text-xs text-slate-500">
                বন্ধ করলে নিচের নির্বাচন মুছে যায় না — পরে আবার চালু করা যাবে।
              </span>
            </span>
          </label>

          <label
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer ${
              withAnswers ? 'border-amber-300 bg-amber-50' : 'border-slate-200'
            }`}
          >
            <input type="checkbox" className="w-4 h-4" checked={withAnswers} onChange={(e) => setWithAnswers(e.target.checked)} />
            <span>
              <span className="font-semibold text-slate-900">উত্তরসহ দেখাবে</span>
              <span className="block text-xs text-slate-500">
                {withAnswers
                  ? 'শিক্ষার্থী MCQ-র সঠিক উত্তর, ব্যাখ্যা ও মডেল উত্তর সবই দেখতে পাবে।'
                  : 'শুধু প্রশ্ন যাবে — উত্তরগুলো সার্ভার থেকেই বাদ পড়বে, ব্রাউজারে খুঁজেও পাওয়া যাবে না।'}
              </span>
            </span>
          </label>

          <div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-xs font-semibold text-slate-600">কোন অংশগুলো দেখাবে</span>
              <span className="badge bg-slate-100 text-slate-600">{sections.length} নির্বাচিত</span>
            </div>

            {GROUPS.map((g) => (
              <div key={g.id} className="mb-3">
                <button className="text-xs font-semibold text-brand-700 mb-1" onClick={() => pickGroup(g.id)}>
                  {g.title} — সব
                </button>
                <div className="grid sm:grid-cols-2 gap-1.5">
                  {SECTIONS.filter((x) => x.group === g.id).map((x) => (
                    <label
                      key={x.key}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer ${
                        sections.includes(x.key) ? 'border-brand-400 bg-brand-50' : 'border-slate-200'
                      }`}
                    >
                      <input type="checkbox" className="w-3.5 h-3.5" checked={sections.includes(x.key)} onChange={() => toggle(x.key)} />
                      {x.label}
                    </label>
                  ))}
                </div>
              </div>
            ))}

            {enabled && !sections.length && (
              <p className="text-xs text-rose-600">
                কোনো অংশ নির্বাচন করা হয়নি — এভাবে সংরক্ষণ করলে শিক্ষার্থী অধ্যায়টি খুলতে পারবে, কিন্তু ভেতরে কিছুই থাকবে না।
              </p>
            )}
          </div>

          {err && <p className="text-sm text-rose-600">{err}</p>}
        </div>

        <div className="px-5 py-4 border-t border-slate-200 flex gap-2 justify-end">
          <button className="btn-secondary" onClick={onClose} disabled={busy}>বাতিল</button>
          <button className="btn-primary" onClick={save} disabled={busy}>
            {busy ? 'সংরক্ষণ হচ্ছে…' : 'সংরক্ষণ'}
          </button>
        </div>
      </div>
    </div>
  );
}
