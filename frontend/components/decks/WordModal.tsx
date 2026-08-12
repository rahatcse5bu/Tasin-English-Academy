'use client';

import { useEffect } from 'react';
import type { WordEntry } from '@/lib/deck/lexicon';

/**
 * The word card a mentor opens by tapping a word inside the passage.
 *
 * Order is deliberate: Bangla first, because that is what the question in the
 * room actually is, then the English definition, then how the word behaves
 * (synonyms/antonyms), and last the sentences — the deck's own example plus the
 * lines of this passage that use it, so the word is answered in context.
 */
export default function WordModal({
  entry,
  onClose,
  onPick,
}: {
  entry: WordEntry;
  onClose: () => void;
  /** jump to another word from the synonym / antonym chips */
  onPick?: (word: string) => void;
}) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', key, true);
    return () => window.removeEventListener('keydown', key, true);
  }, [onClose]);

  const chips = (list: string[] | undefined, tone: string) =>
    (list || []).map((s) => (
      <button
        key={s}
        className={`wm-chip ${tone}`}
        onClick={() => onPick?.(s)}
        title="এই শব্দটি দেখুন"
      >
        {s}
      </button>
    ));

  return (
    <div className="wm-back" onClick={onClose}>
      <div
        className="wm"
        role="dialog"
        aria-modal="true"
        aria-label={entry.w}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="wm-head">
          <div>
            <div className="wm-word">{entry.w}</div>
            <div className="wm-meta">
              {entry.pos && <span className="wm-pos">{entry.pos}</span>}
              {entry.pron && <span className="wm-pron">{entry.pron}</span>}
            </div>
          </div>
          <button className="wm-x" onClick={onClose} aria-label="বন্ধ">
            ✕
          </button>
        </header>

        <div className="wm-body">
          {entry.bn && (
            <section className="wm-bn">
              <h4>বাংলা অর্থ</h4>
              <p className="bn">{entry.bn}</p>
            </section>
          )}

          {entry.en && (
            <section>
              <h4>Meaning</h4>
              <p>{entry.en}</p>
            </section>
          )}

          {(entry.syn?.length || entry.ant?.length) && (
            <section className="wm-sa">
              {!!entry.syn?.length && (
                <div>
                  <h4>Synonyms</h4>
                  <div className="wm-chips">{chips(entry.syn, 'syn')}</div>
                </div>
              )}
              {!!entry.ant?.length && (
                <div>
                  <h4>Antonyms</h4>
                  <div className="wm-chips">{chips(entry.ant, 'ant')}</div>
                </div>
              )}
            </section>
          )}

          {entry.ex && (
            <section>
              <h4>Example</h4>
              <p className="wm-ex">“{entry.ex}”</p>
            </section>
          )}

          {!!entry.uses.length && (
            <section>
              <h4>এই প্যাসেজে</h4>
              {entry.uses.map((u, n) => (
                <div className="wm-use" key={n}>
                  <p>{u.en}</p>
                  <p className="bn">{u.bn}</p>
                </div>
              ))}
            </section>
          )}
        </div>

        <footer className="wm-foot">
          প্যাসেজের যেকোনো আন্ডারলাইন করা শব্দে ক্লিক করুন · <kbd>Esc</kbd> দিয়ে বন্ধ
        </footer>
      </div>
    </div>
  );
}
