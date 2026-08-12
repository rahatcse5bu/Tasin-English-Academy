'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { plain } from '@/lib/deck/text';
import type { ChapterMeta, DeckUnit, UnitSummary } from '@/lib/deck/types';

/**
 * Lets a mentor correct the syllabus mapping from inside the app.
 *
 * Two jobs, because they are genuinely different actions:
 *   "unit"    — renumber / rename a whole unit (Adolescence: Unit 03 → Unit 09).
 *               Every chapter in the unit moves together.
 *   "chapter" — move one chapter into another unit, or give it a lesson number.
 *
 * The server marks anything edited here as `placementLocked`, so a later
 * re-seed refreshes the slide content without undoing the correction.
 */

const ACCENTS = ['navy', 'teal', 'amber', 'rose', 'violet'];
const NEW_UNIT = '__new__';

const field = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none';
const label = 'block text-xs font-semibold text-slate-600 mb-1';

export default function PlacementEditor({
  mode,
  paperId,
  unit,
  chapter,
  units,
  onClose,
  onSaved,
}: {
  mode: 'unit' | 'chapter';
  paperId: string;
  unit: DeckUnit;
  chapter?: ChapterMeta;
  units: UnitSummary[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { token } = useAuth();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // unit mode
  const [no, setNo] = useState(plain(unit.no));
  const [name, setName] = useState(plain(unit.name));
  const [nameBn, setNameBn] = useState(plain(unit.nameBn || ''));
  const [em, setEm] = useState(unit.em || '');
  const [accent, setAccent] = useState(unit.accent || 'navy');

  // chapter mode — which unit to land in
  const key = (u: { no: string; name: string }) => `${u.no}|||${u.name}`;
  const [target, setTarget] = useState(key(unit));
  const [newNo, setNewNo] = useState('');
  const [newName, setNewName] = useState('');
  const [lesson, setLesson] = useState(chapter?.lesson != null ? String(chapter.lesson) : '');
  const [order, setOrder] = useState(String(chapter?.order ?? 0));

  const mine = units.filter((u) => u.paperId === paperId);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  async function save() {
    setBusy(true);
    setErr('');
    try {
      if (mode === 'unit') {
        await api('/decks/unit', {
          method: 'PATCH',
          token: token || undefined,
          body: JSON.stringify({
            paperId,
            unitNo: plain(unit.no),
            unitName: plain(unit.name),
            newNo: no.trim(),
            newName: name.trim(),
            nameBn: nameBn.trim(),
            em,
            accent,
          }),
        });
      } else {
        const creating = target === NEW_UNIT;
        const [tNo, tName] = creating ? [newNo.trim(), newName.trim()] : target.split('|||');
        if (!tNo || !tName) throw new Error('নতুন ইউনিটের নম্বর ও নাম দিন');

        await api(`/decks/${chapter!.id}/placement`, {
          method: 'PATCH',
          token: token || undefined,
          body: JSON.stringify({
            unitNo: tNo,
            unitName: tName,
            lessonNo: lesson.trim() === '' ? null : Number(lesson),
            order: Number(order) || 0,
          }),
        });
      }
      onSaved();
    } catch (e: any) {
      setErr(e.message || 'সংরক্ষণ করা যায়নি');
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-900">
            {mode === 'unit' ? 'ইউনিট সম্পাদনা' : 'অধ্যায়ের ইউনিট / লেসন'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {mode === 'unit'
              ? `${plain(unit.no)} — ${plain(unit.name)} · ${unit.chapters.length}টি অধ্যায় একসাথে বদলাবে`
              : plain(chapter?.title || '')}
          </p>
        </div>

        <div className="p-5 space-y-4">
          {mode === 'unit' ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={label}>ইউনিট নম্বর</label>
                  <input className={field} value={no} onChange={(e) => setNo(e.target.value)} placeholder="Unit 09" />
                </div>
                <div className="col-span-2">
                  <label className={label}>ইউনিটের নাম (English)</label>
                  <input className={field} value={name} onChange={(e) => setName(e.target.value)} />
                </div>
              </div>
              <div>
                <label className={label}>বাংলা নাম</label>
                <input className={field} value={nameBn} onChange={(e) => setNameBn(e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={label}>আইকন</label>
                  <input className={field} value={em} onChange={(e) => setEm(e.target.value)} maxLength={4} />
                </div>
                <div className="col-span-2">
                  <label className={label}>রঙ</label>
                  <select className={field} value={accent} onChange={(e) => setAccent(e.target.value)}>
                    {ACCENTS.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                নম্বর বদলালে লাইব্রেরিতে ইউনিটগুলো আপনাআপনি ক্রমানুসারে সাজবে।
              </p>
            </>
          ) : (
            <>
              <div>
                <label className={label}>ইউনিট</label>
                <select className={field} value={target} onChange={(e) => setTarget(e.target.value)}>
                  {mine.map((u) => (
                    <option key={key(u)} value={key(u)}>
                      {plain(u.no)} — {plain(u.name)}
                    </option>
                  ))}
                  <option value={NEW_UNIT}>+ নতুন ইউনিট…</option>
                </select>
              </div>

              {target === NEW_UNIT && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={label}>নম্বর</label>
                    <input className={field} value={newNo} onChange={(e) => setNewNo(e.target.value)} placeholder="Unit 09" />
                  </div>
                  <div className="col-span-2">
                    <label className={label}>নাম</label>
                    <input className={field} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Adolescence" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={label}>লেসন নম্বর</label>
                  <input
                    className={field}
                    value={lesson}
                    onChange={(e) => setLesson(e.target.value)}
                    inputMode="numeric"
                    placeholder="খালি রাখলে লেসন দেখাবে না"
                  />
                </div>
                <div>
                  <label className={label}>লেসনের ভিতরে ক্রম</label>
                  <input className={field} value={order} onChange={(e) => setOrder(e.target.value)} inputMode="numeric" />
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                একই লেসনে একাধিক প্যাসেজ থাকতে পারে — দুটি অধ্যায়কে একই লেসন নম্বর দিন।
              </p>
            </>
          )}

          {err && <p className="text-sm text-rose-600">{err}</p>}
        </div>

        <div className="px-5 py-4 border-t border-slate-200 flex gap-2 justify-end">
          <button className="btn-secondary" onClick={onClose} disabled={busy}>
            বাতিল
          </button>
          <button className="btn-primary" onClick={save} disabled={busy}>
            {busy ? 'সংরক্ষণ হচ্ছে…' : 'সংরক্ষণ'}
          </button>
        </div>
      </div>
    </div>
  );
}
