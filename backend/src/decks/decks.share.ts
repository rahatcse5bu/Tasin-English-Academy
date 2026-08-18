/**
 * Cutting a lesson down to what a student is allowed to receive.
 *
 * Two independent reductions happen here, and both run on the server:
 *
 *   keepSections()  drops the parts of the lesson that were not shared
 *   stripAnswers()  removes every answer when the share is questions-only
 *
 * The second one is the reason this is server-side at all. Hiding answers in
 * the browser would leave them sitting in the JSON for anyone who opens the
 * network tab, which for a question bank means the answers are public.
 */

type Any = Record<string, any>;

/** section name → the content keys that produce those slides */
const SECTION_KEYS: Record<string, string[]> = {
  passage: ['passage'],
  translation: ['passage'], // built from the same source as the passage
  words: ['words'],
  synant: ['synant'],
  summary: ['summaryEn', 'summaryBn', 'summaryTip'],
  mcq: ['mcq'],
  shortq: ['shortQ'],
  table: ['tables', 'table'],
  flow: ['flow'],
  gapfill: ['gapFill'],
  matching: ['matching'],
  ordering: ['ordering'],
  literature: ['literature'],
  rules: ['rules', 'rulesTitle', 'rulesPerSlide'],
  drill: ['drills'],
  board: ['boardQ'],
  extra: ['extras'],
  tips: ['tips'],
  recap: ['recap', 'homework'],
};

/** Everything a chapter can carry that a section could own. */
const ALL_KEYS = [...new Set(Object.values(SECTION_KEYS).flat())];

/**
 * Keep only the content behind the shared sections. Cover and roadmap are
 * always kept — they are the chapter's own title page, not teaching material.
 */
export function keepSections(content: Any, sections: string[]): Any {
  const keep = new Set<string>();
  for (const s of sections || []) for (const k of SECTION_KEYS[s] || []) keep.add(k);

  const out: Any = { ...content };
  for (const k of ALL_KEYS) if (!keep.has(k)) delete out[k];

  // the passage feeds both the passage and the translation slides, so the
  // Bangla line has to go when only the English half was shared
  const set = new Set(sections || []);
  if (set.has('passage') && !set.has('translation') && Array.isArray(out.passage)) {
    out.passage = out.passage.map((p: Any) => ({
      ...p,
      s: (p.s || []).map((x: Any) => ({ ...x, bn: '' })),
    }));
  }
  // and the reverse: translation without the passage slides is still the same
  // content, so nothing to remove — the client simply builds fewer slides
  out.shareSections = sections || [];
  return out;
}

/** Everything after the first `@` in a table cell is the answer. */
function blankCell(cell: unknown): string {
  const s = String(cell ?? '');
  const at = s.indexOf('@');
  return at > -1 ? s.slice(0, at).trimEnd() : s;
}

/**
 * Remove every answer, leaving the questions intact and answerable.
 *
 * Each shape loses something different: an MCQ keeps its options but loses
 * which one is right, a short question keeps the question and loses the model
 * answer, a table keeps its labels and loses what goes in the blanks.
 */
export function stripAnswers(content: Any): Any {
  const d: Any = { ...content };

  if (Array.isArray(d.mcq)) {
    // -1 marks no option correct, so nothing renders as the answer
    d.mcq = d.mcq.map((q: Any) => ({ q: q.q, opts: q.opts, ans: -1 }));
  }

  if (Array.isArray(d.shortQ)) {
    d.shortQ = d.shortQ.map((q: Any) => ({ q: q.q, a: '', bn: '' }));
  }

  const blankTable = (t: Any) => ({
    ...t,
    rows: (t.rows || []).map((r: any[]) => r.map(blankCell)),
  });
  if (Array.isArray(d.tables)) d.tables = d.tables.map(blankTable);
  if (d.table) d.table = blankTable(d.table);

  // box 1 of a flow chart is given; the rest are what the student must supply
  if (d.flow?.items) {
    d.flow = {
      ...d.flow,
      items: d.flow.items.map((it: any, i: number) =>
        i === 0 ? it : { t: '', bn: '' },
      ),
    };
  }

  if (Array.isArray(d.gapFill)) {
    d.gapFill = d.gapFill.map((g: Any) => ({
      ...g,
      items: (g.items || []).map((x: Any) => ({ no: x.no, ans: '', why: '' })),
    }));
  }

  if (d.matching?.items) {
    d.matching = {
      ...d.matching,
      // column A is the question; the match and the finished sentence are not
      items: d.matching.items.map((x: Any) => ({ a: x.a, match: '', full: '' })),
    };
  }

  if (d.ordering) {
    // the jumbled sentences stay; the correct sequence is the answer
    d.ordering = { ...d.ordering, order: [] };
  }

  if (Array.isArray(d.literature)) {
    d.literature = d.literature.map((set: Any) => ({
      ...set,
      items: (set.items || []).map((x: Any) => ({ q: x.q, a: '', bn: '' })),
    }));
  }

  if (Array.isArray(d.drills)) {
    d.drills = d.drills.map((s: Any) => ({
      ...s,
      items: (s.items || []).map((x: Any) => ({ q: x.q, ans: '', why: '' })),
    }));
  }

  if (d.boardQ?.items) {
    d.boardQ = {
      ...d.boardQ,
      items: d.boardQ.items.map((x: Any) => ({ q: x.q, ans: '', why: '' })),
    };
  }

  d.answersHidden = true;
  return d;
}

/** The whole reduction for one student request. */
export function forStudent(content: Any, share: Any): Any {
  const cut = keepSections(content, share?.sections || []);
  return share?.withAnswers ? cut : stripAnswers(cut);
}
