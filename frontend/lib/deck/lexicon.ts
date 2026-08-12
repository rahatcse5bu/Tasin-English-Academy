import type { Deck } from './types';

/**
 * Turns a deck's vocabulary into something the passage can be clicked against.
 *
 * The word slides and the synonym/antonym slides already carry everything a
 * student asks about mid-reading — meaning, pronunciation, Bangla, an example.
 * This joins the two lists by word and adds the sentences where the word
 * actually appears in this passage, so tapping a word in the text can answer
 * "what does it mean *here*" instead of sending the mentor to another slide.
 */

export interface WordEntry {
  /** as printed on the vocabulary slide */
  w: string;
  pos?: string;
  pron?: string;
  bn?: string;
  en?: string;
  ex?: string;
  syn?: string[];
  ant?: string[];
  /** sentences from this passage that use the word, with their Bangla */
  uses: { en: string; bn: string }[];
}

export interface Lexicon {
  /** normalised surface form (including inflections) → entry */
  lookup: Map<string, WordEntry>;
  /** longest entry in words, so the matcher knows how far to look ahead */
  maxLen: number;
  size: number;
}

/** Drop the deck's inline markers so a phrase reads as plain text. */
export function unmark(s: string): string {
  return String(s ?? '')
    .replace(/==([^=]+)==/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Lowercase, curly quotes flattened, surrounding punctuation removed. */
export function norm(s: string): string {
  return String(s ?? '')
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[^a-z0-9'’\- ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Surface forms a reader may meet for one dictionary headword.
 * Deliberately generous rather than clever — a wrong extra key can only ever
 * link a word to a near neighbour, while a missing key makes the word dead.
 */
function variants(word: string): string[] {
  const w = norm(word);
  if (!w) return [];
  const out = new Set<string>([w]);

  // only inflect the last word of a phrase ("drop out of school" → …schools)
  const parts = w.split(' ');
  const head = parts.pop()!;
  const pre = parts.length ? parts.join(' ') + ' ' : '';
  const add = (x: string) => out.add(pre + x);

  add(head + 's');
  add(head + 'es');
  add(head + 'ed');
  add(head + 'd');
  add(head + 'ing');
  add(head + 'ly');

  if (head.endsWith('e')) {
    add(head.slice(0, -1) + 'ing');
    add(head.slice(0, -1) + 'ed');
  }
  if (head.endsWith('y')) {
    add(head.slice(0, -1) + 'ies');
    add(head.slice(0, -1) + 'ied');
  }
  if (head.endsWith('s')) add(head.slice(0, -1));
  if (head.endsWith('es')) add(head.slice(0, -2));
  if (head.endsWith('ed')) {
    add(head.slice(0, -2));
    add(head.slice(0, -1));
  }
  if (head.endsWith('ing')) {
    add(head.slice(0, -3));
    add(head.slice(0, -3) + 'e');
  }

  return [...out].filter(Boolean);
}

export function buildLexicon(deck: Deck): Lexicon {
  const byWord = new Map<string, WordEntry>();

  const entry = (w: string): WordEntry => {
    const k = norm(w);
    let e = byWord.get(k);
    if (!e) {
      e = { w, uses: [] };
      byWord.set(k, e);
    }
    return e;
  };

  for (const w of (deck.words as any[]) || []) {
    if (!w?.w) continue;
    const e = entry(w.w);
    e.w = w.w;
    e.pos = w.pos ?? e.pos;
    e.pron = w.pron ?? e.pron;
    e.bn = w.bn ?? e.bn;
    e.en = w.en ?? e.en;
    e.ex = w.ex ?? e.ex;
  }

  for (const s of (deck.synant as any[]) || []) {
    if (!s?.w) continue;
    const e = entry(s.w);
    e.bn = e.bn || s.bn;
    e.syn = s.syn;
    e.ant = s.ant;
  }

  // where each word is used in this very passage
  const sentences: { en: string; bn: string }[] = [];
  for (const para of (deck.passage as any[]) || []) {
    for (const s of para?.s || []) {
      sentences.push({ en: unmark(s.en), bn: unmark(s.bn) });
    }
  }
  for (const e of byWord.values()) {
    const keys = variants(e.w);
    for (const s of sentences) {
      const hay = ' ' + norm(s.en) + ' ';
      if (keys.some((k) => hay.includes(' ' + k + ' ') || hay.includes(' ' + k))) {
        e.uses.push(s);
        if (e.uses.length === 3) break; // a modal, not a concordance
      }
    }
  }

  // expand to every surface form; never let an inflection shadow a real headword
  const lookup = new Map<string, WordEntry>();
  for (const [k, e] of byWord) lookup.set(k, e);
  for (const e of byWord.values()) {
    for (const v of variants(e.w)) if (!lookup.has(v)) lookup.set(v, e);
  }

  let maxLen = 1;
  for (const k of lookup.keys()) maxLen = Math.max(maxLen, k.split(' ').length);

  return { lookup, maxLen: Math.min(maxLen, 5), size: byWord.size };
}

/* ------------------------------------------------------------------ */
/* HTML linking                                                        */
/* ------------------------------------------------------------------ */

const WORD_RE = /[A-Za-z][A-Za-z'’-]*/g;
const TAG_SPLIT = /(<[^>]*>)/;
const ENTITY_SPLIT = /(&(?:[a-zA-Z]+|#\d+);)/;

function attr(s: string): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/** Wrap known words in one run of plain (already escaped) text. */
function linkRun(text: string, lex: Lexicon): string {
  const tokens: { s: number; e: number; t: string }[] = [];
  WORD_RE.lastIndex = 0;
  for (let m = WORD_RE.exec(text); m; m = WORD_RE.exec(text)) {
    tokens.push({ s: m.index, e: m.index + m[0].length, t: m[0] });
  }
  if (!tokens.length) return text;

  let out = '';
  let at = 0;
  for (let i = 0; i < tokens.length; i++) {
    // longest match wins, so "drop out of school" beats "school"
    for (let len = Math.min(lex.maxLen, tokens.length - i); len >= 1; len--) {
      const key = norm(tokens.slice(i, i + len).map((x) => x.t).join(' '));
      const entry = lex.lookup.get(key);
      if (!entry) continue;

      const from = tokens[i].s;
      const to = tokens[i + len - 1].e;
      out +=
        text.slice(at, from) +
        '<span class="wq" role="button" tabindex="0" data-word="' + attr(key) + '"' +
        (entry.bn ? ' data-bn="' + attr(entry.bn) + '"' : '') + '>' +
        text.slice(from, to) +
        '</span>';
      at = to;
      i += len - 1;
      break;
    }
  }
  return out + text.slice(at);
}

/**
 * Makes every known word in a formatted fragment clickable.
 *
 * This runs while the slide HTML is being built rather than on the rendered
 * page: the slide body is injected with `dangerouslySetInnerHTML`, so React
 * owns that subtree and re-creating it would throw away anything added to the
 * DOM afterwards.
 *
 * Splits on tags first so attributes are never touched, then on entities so a
 * `&amp;` cannot be read as the word "amp".
 */
export function linkHtml(html: string, lex: Lexicon | null): string {
  if (!lex || !lex.size) return html;
  return html
    .split(TAG_SPLIT)
    .map((part) =>
      part.startsWith('<')
        ? part
        : part
            .split(ENTITY_SPLIT)
            .map((bit) => (bit.startsWith('&') ? bit : linkRun(bit, lex)))
            .join(''),
    )
    .join('');
}
