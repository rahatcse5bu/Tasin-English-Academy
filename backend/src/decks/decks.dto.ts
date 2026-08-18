import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

const ACCENTS = ['navy', 'teal', 'amber', 'rose', 'violet'];

/**
 * Move one chapter to a different unit / lesson.
 * Every field is optional — only what is sent gets changed.
 */
export class PlacementDto {
  /** e.g. "Unit 09", "Extra 01", "Part A" */
  @IsOptional() @IsString() @IsNotEmpty()
  unitNo?: string;

  @IsOptional() @IsString() @IsNotEmpty()
  unitName?: string;

  @IsOptional() @IsString()
  unitNameBn?: string;

  @IsOptional() @IsString()
  unitEm?: string;

  @IsOptional() @IsIn(ACCENTS)
  unitAccent?: string;

  @IsOptional() @IsInt() @Min(0)
  unitOrder?: number;

  /** lesson within the unit; send null to clear it */
  @IsOptional() @IsInt() @Min(1) @Max(99)
  lessonNo?: number | null;

  @IsOptional() @IsString()
  lessonName?: string;

  /** position of this chapter inside its lesson */
  @IsOptional() @IsInt() @Min(0)
  order?: number;

  @IsOptional() @IsBoolean()
  isPublished?: boolean;
}

/** Rename or renumber a whole unit — all of its chapters move together. */
export class UnitDto {
  @IsString() @IsNotEmpty()
  paperId!: string;

  /** the unit as it is now — used to find the chapters */
  @IsString() @IsNotEmpty()
  unitNo!: string;

  @IsString() @IsNotEmpty()
  unitName!: string;

  @IsOptional() @IsString() @IsNotEmpty()
  newNo?: string;

  @IsOptional() @IsString() @IsNotEmpty()
  newName?: string;

  @IsOptional() @IsString()
  nameBn?: string;

  @IsOptional() @IsString()
  em?: string;

  @IsOptional() @IsIn(ACCENTS)
  accent?: string;
}


/* ------------------------------------------------------------------ */
/* Teaching content — the parts a mentor keeps adding to               */
/* ------------------------------------------------------------------ */

/** One short question (প্রশ্ন ১-খ): answer in English, then in Bangla. */
export class ShortQDto {
  @IsString() @IsNotEmpty()
  q!: string;

  @IsString() @IsNotEmpty()
  a!: string;

  @IsOptional() @IsString()
  bn?: string;
}

/** One multiple-choice question (প্রশ্ন ১-ক). */
export class McqDto {
  @IsString() @IsNotEmpty()
  q!: string;

  @IsArray() @ArrayMinSize(2) @ArrayMaxSize(6) @IsString({ each: true })
  opts!: string[];

  /** index into `opts` */
  @IsInt() @Min(0) @Max(5)
  ans!: number;

  @IsOptional() @IsString()
  why?: string;
}

/**
 * The information-transfer table. A cell may hide its answer behind `@`:
 * `"(i) @his people's emancipation"` prints the label and reveals the rest
 * on the mentor's cue, one cell at a time.
 */
export class TableDto {
  /** shown on the slide when a chapter has more than one table */
  @IsOptional() @IsString()
  title?: string;

  @IsArray() @ArrayMinSize(2) @ArrayMaxSize(8) @IsString({ each: true })
  headers!: string[];

  @IsArray() @ArrayMaxSize(40)
  rows!: string[][];

  @IsOptional() @IsString()
  note?: string;
}

/** One sentence of the passage: English, its Bangla, and the printed number. */
export class SentenceDto {
  @IsString() @IsNotEmpty()
  en!: string;

  @IsOptional() @IsString()
  bn?: string;

  @IsOptional() @IsInt() @Min(1)
  no?: number;
}

/** One paragraph of the passage. */
export class ParaDto {
  @IsOptional() @IsString()
  tag?: string;

  @IsArray() @ArrayMaxSize(40)
  @ValidateNested({ each: true }) @Type(() => SentenceDto)
  s!: SentenceDto[];
}

/** One vocabulary entry — this is also what the clickable words in the passage show. */
export class WordDto {
  @IsString() @IsNotEmpty()
  w!: string;

  @IsOptional() @IsString() pos?: string;
  @IsOptional() @IsString() pron?: string;
  @IsOptional() @IsString() bn?: string;
  @IsOptional() @IsString() en?: string;
  @IsOptional() @IsString() ex?: string;
}

/** Synonyms and antonyms for one headword. */
export class SynAntDto {
  @IsString() @IsNotEmpty()
  w!: string;

  @IsOptional() @IsString() bn?: string;

  @IsOptional() @IsArray() @ArrayMaxSize(10) @IsString({ each: true })
  syn?: string[];

  @IsOptional() @IsArray() @ArrayMaxSize(10) @IsString({ each: true })
  ant?: string[];
}

export class FlowItemDto {
  @IsString() @IsNotEmpty()
  t!: string;

  @IsOptional() @IsString()
  bn?: string;
}

/** The flow chart. Box 1 is given; the rest are revealed one at a time. */
export class FlowDto {
  @IsOptional() @IsString()
  title?: string;

  @IsArray() @ArrayMinSize(2) @ArrayMaxSize(12)
  @ValidateNested({ each: true }) @Type(() => FlowItemDto)
  items!: FlowItemDto[];
}

/**
 * Edit the teaching content of one chapter. Only the sections sent are
 * replaced, so the passage and vocabulary are never touched by accident.
 */
/* ------------------------------------------------------------------ */
/* 2nd Paper — grammar lessons                                         */
/* ------------------------------------------------------------------ */

/** One numbered grammar rule, as it appears on a rules slide. */
export class RuleDto {
  /** the printed number, e.g. "01" — kept as text so "05(a)" also works */
  @IsOptional() @IsString()
  no?: string;

  /** short category chip, e.g. "Base", "Exc→Ass" */
  @IsOptional() @IsString()
  tag?: string;

  @IsString() @IsNotEmpty()
  name!: string;

  /** the rule itself, in Bangla */
  @IsOptional() @IsString()
  bn?: string;

  /** label above the formula box, e.g. "RULE", "STRUCTURE" */
  @IsOptional() @IsString()
  formulaLabel?: string;

  @IsOptional() @IsString()
  formula?: string;

  /** worked example; ==…== marks the part the answer turns on */
  @IsOptional() @IsString()
  ex?: string;

  @IsOptional() @IsString()
  note?: string;
}

/** One question inside a practice set or a solved board question. */
export class AnswerDto {
  @IsOptional() @IsString()
  q?: string;

  @IsString() @IsNotEmpty()
  ans!: string;

  @IsOptional() @IsString()
  why?: string;
}

/** A practice set — the answers open one at a time in class. */
export class DrillDto {
  @IsString() @IsNotEmpty()
  title!: string;

  @IsOptional() @IsString()
  intro?: string;

  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(40)
  @ValidateNested({ each: true }) @Type(() => AnswerDto)
  items!: AnswerDto[];
}

/** The solved board question at the end of a grammar lesson. */
export class BoardQDto {
  @IsOptional() @IsString()
  instruction?: string;

  /** a passage or paragraph the questions are set on */
  @IsOptional() @IsString()
  text?: string;

  /** word bank printed above the questions */
  @IsOptional() @IsString()
  bank?: string;

  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(40)
  @ValidateNested({ each: true }) @Type(() => AnswerDto)
  items!: AnswerDto[];
}

export class ContentDto {
  @IsOptional() @IsString()
  summaryEn?: string;

  @IsOptional() @IsString()
  summaryBn?: string;

  @IsOptional() @IsString()
  summaryTip?: string;

  @IsOptional() @IsArray() @ArrayMaxSize(60)
  @ValidateNested({ each: true }) @Type(() => ShortQDto)
  shortQ?: ShortQDto[];

  @IsOptional() @IsArray() @ArrayMaxSize(60)
  @ValidateNested({ each: true }) @Type(() => McqDto)
  mcq?: McqDto[];

  /**
   * Information-transfer tables. A chapter may drill several, so this replaces
   * the whole set; sending an empty array removes them all.
   */
  @IsOptional() @IsArray() @ArrayMaxSize(8)
  @ValidateNested({ each: true }) @Type(() => TableDto)
  tables?: TableDto[];

  @IsOptional() @IsArray() @ArrayMaxSize(12)
  @ValidateNested({ each: true }) @Type(() => ParaDto)
  passage?: ParaDto[];

  @IsOptional() @IsArray() @ArrayMaxSize(80)
  @ValidateNested({ each: true }) @Type(() => WordDto)
  words?: WordDto[];

  @IsOptional() @IsArray() @ArrayMaxSize(80)
  @ValidateNested({ each: true }) @Type(() => SynAntDto)
  synant?: SynAntDto[];

  @IsOptional() @ValidateNested() @Type(() => FlowDto)
  flow?: FlowDto;

  /* ---- 2nd Paper ---- */

  @IsOptional() @IsString()
  rulesTitle?: string;

  /** how many rules share one slide; 1 or 2 reads best on a projector */
  @IsOptional() @IsInt() @Min(1) @Max(4)
  rulesPerSlide?: number;

  @IsOptional() @IsArray() @ArrayMaxSize(60)
  @ValidateNested({ each: true }) @Type(() => RuleDto)
  rules?: RuleDto[];

  @IsOptional() @IsArray() @ArrayMaxSize(12)
  @ValidateNested({ each: true }) @Type(() => DrillDto)
  drills?: DrillDto[];

  @IsOptional() @ValidateNested() @Type(() => BoardQDto)
  boardQ?: BoardQDto;
}


/**
 * Which parts of a lesson a student may see. Section names, not slide numbers:
 * a chapter edited tomorrow keeps the same sections but not the same numbering.
 */
export const SHARE_SECTIONS = [
  'passage', 'translation', 'words', 'synant', 'summary',
  'mcq', 'shortq', 'table', 'flow',
  'gapfill', 'matching', 'ordering', 'literature',
  'rules', 'drill', 'board',
  'extra', 'tips', 'recap',
] as const;

export class ShareDto {
  @IsBoolean()
  enabled!: boolean;

  @IsOptional() @IsArray() @ArrayMaxSize(20)
  @IsIn(SHARE_SECTIONS as unknown as string[], { each: true })
  sections?: string[];

  /** false → the server removes every answer before responding */
  @IsOptional() @IsBoolean()
  withAnswers?: boolean;
}
