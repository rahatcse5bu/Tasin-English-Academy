/** Shapes returned by the /api/decks endpoints. */

export interface Slide {
  kind: string;
  key: string;
  title: string;
  html: string;
  /** cover slide: render without the standard header/footer chrome */
  bare?: boolean;
  /** the title is Bangla, so use the Bangla font */
  bnTitle?: boolean;
  /** slide carries answers the mentor reveals */
  reveal?: boolean;
}

export interface ChapterMeta {
  id: string;
  title: string;
  titleBn: string;
  tag: string;
  level: 'Easy' | 'Medium' | 'Hard';
  available?: boolean;
  /** lesson within the unit — several chapters may share one */
  lesson?: number | null;
  lessonName?: string | null;
  /** position inside the lesson */
  order?: number;
  minutes?: number | null;
  marks?: string | null;
  answers?: number;
  stats?:
    | { kind: 'passage'; sentences: number; words: number; mcq: number; shortQ: number }
    | { kind: 'grammar'; rules: number; drills: number; board: number; tips: number }
    | null;
}

export interface DeckUnit {
  no: string;
  name: string;
  nameBn: string;
  em: string;
  accent: string;
  order?: number;
  chapters: ChapterMeta[];
}

/** One row of GET /api/decks/units — feeds the "move to unit" dropdown. */
export interface UnitSummary {
  paperId: string;
  paperName: string;
  no: string;
  name: string;
  nameBn: string;
  em: string;
  accent: string;
  order: number;
  chapters: number;
  lessons: number[];
}

export interface DeckPaper {
  id: string;
  name: string;
  nameBn: string;
  blurb: string;
  chapterCount: number;
  units: DeckUnit[];
}

export interface DeckCatalogue {
  brand: { name: string; phone: string; address: string };
  papers: DeckPaper[];
}

export interface FlatChapter extends ChapterMeta {
  paper: string;
  paperName: string;
  unit: string;
  unitName: string;
  unitNameBn: string;
  em: string;
}

/** The full teaching content of one chapter. */
export interface Deck {
  id: string;
  paper?: string;
  paperName?: string;
  unit: string;
  unitName: string;
  lesson?: number | null;
  lessonName?: string | null;
  title: string;
  titleBn?: string;
  lede?: string;
  qType?: string;
  minutes?: number;
  marks?: string;
  objectives?: { t: string; d: string }[];

  /* 1st Paper — passage lessons */
  passage?: { tag: string; s: { en: string; bn: string; no?: number }[] }[];
  words?: any[];
  synant?: any[];
  summaryEn?: string;
  summaryBn?: string;
  summaryTip?: string;
  mcq?: { q: string; opts: string[]; ans: number; why: string }[];
  shortQ?: { q: string; a: string; bn: string }[];
  table?: { headers: string[]; rows: string[][]; note?: string };
  flow?: { title: string; items: (string | { t: string; bn?: string })[] };

  /* 2nd Paper — grammar lessons */
  rules?: any[];
  rulesTitle?: string;
  rulesPerSlide?: number;
  mcqMarks?: string;
  drills?: { title: string; intro?: string; items: { q: string; ans: string; why?: string }[] }[];
  boardQ?: {
    instruction?: string;
    text?: string;
    bank?: string;
    items: { ans: string; why?: string }[];
  };

  /* both */
  extras?: any[];
  tips?: any[];
  recap?: string[];
  homework?: string[];
}

export interface Neighbours {
  prev: FlatChapter | null;
  next: FlatChapter | null;
}
