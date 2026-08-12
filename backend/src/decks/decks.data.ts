/**
 * HSC English slide decks (1st & 2nd Paper).
 *
 * Content lives as JSON under src/data/hsc_decks/**. Each file is one chapter —
 * a 1st Paper passage lesson (passage + sentence-wise Bangla + MCQ + table …) or a
 * 2nd Paper grammar lesson (rules + drills + solved board question).
 *
 * They are `import`ed rather than read from disk so they are type-checked, copied to
 * dist by the nest-cli `assets` rule, and inlined into the production bundle — exactly
 * like the Class-8 catalogue in ../learning/learning.data.ts.
 *
 * To add a chapter: drop `<id>.json` in src/data/hsc_decks, add it to manifest.json,
 * then re-run `npm run decks:index` (or add the two lines below by hand).
 */
import manifestJson from "../data/hsc_decks/manifest.json";
import d_adolescence_stages from "../data/hsc_decks/adolescence-stages.json";
import d_adolescents_core_resource from "../data/hsc_decks/adolescents-core-resource.json";
import d_affirmative_negative from "../data/hsc_decks/affirmative-negative.json";
import d_alex_romania from "../data/hsc_decks/alex-romania.json";
import d_application_email from "../data/hsc_decks/application-email.json";
import d_article_gap_filling from "../data/hsc_decks/article-gap-filling.json";
import d_artificial_intelligence from "../data/hsc_decks/artificial-intelligence.json";
import d_ash_shatt_camp from "../data/hsc_decks/ash-shatt-camp.json";
import d_beauty_is from "../data/hsc_decks/beauty-is.json";
import d_bullying from "../data/hsc_decks/bullying.json";
import d_college_students_flood from "../data/hsc_decks/college-students-flood.json";
import d_completing_sentences from "../data/hsc_decks/completing-sentences.json";
import d_completing_story from "../data/hsc_decks/completing-story.json";
import d_composition_essay from "../data/hsc_decks/composition-essay.json";
import d_connectors from "../data/hsc_decks/connectors.json";
import d_dialogue_writing from "../data/hsc_decks/dialogue-writing.json";
import d_dreams_psychology from "../data/hsc_decks/dreams-psychology.json";
import d_ecotourism from "../data/hsc_decks/ecotourism.json";
import d_education_aims from "../data/hsc_decks/education-aims.json";
import d_education_gives from "../data/hsc_decks/education-gives.json";
import d_elizabeth_voyage from "../data/hsc_decks/elizabeth-voyage.json";
import d_graph_chart from "../data/hsc_decks/graph-chart.json";
import d_greta_thunberg from "../data/hsc_decks/greta-thunberg.json";
import d_i_have_a_dream from "../data/hsc_decks/i-have-a-dream.json";
import d_kalsindur_girls from "../data/hsc_decks/kalsindur-girls.json";
import d_khorshed_village from "../data/hsc_decks/khorshed-village.json";
import d_leela_nag from "../data/hsc_decks/leela-nag.json";
import d_man_social_animal from "../data/hsc_decks/man-social-animal.json";
import d_mandela_statement from "../data/hsc_decks/mandela-statement.json";
import d_marie_curie from "../data/hsc_decks/marie-curie.json";
import d_meditation from "../data/hsc_decks/meditation.json";
import d_modifiers from "../data/hsc_decks/modifiers.json";
import d_mujtaba_ali from "../data/hsc_decks/mujtaba-ali.json";
import d_nadera_begum from "../data/hsc_decks/nadera-begum.json";
import d_narrative_style from "../data/hsc_decks/narrative-style.json";
import d_negro_not_free from "../data/hsc_decks/negro-not-free.json";
import d_nelson_mandela from "../data/hsc_decks/nelson-mandela.json";
import d_nishat_mazumder from "../data/hsc_decks/nishat-mazumder.json";
import d_old_man_at_the_bridge from "../data/hsc_decks/old-man-at-the-bridge.json";
import d_paragraph_writing from "../data/hsc_decks/paragraph-writing.json";
import d_polite_words_machine from "../data/hsc_decks/polite-words-machine.json";
import d_preposition_gap_filling from "../data/hsc_decks/preposition-gap-filling.json";
import d_punctuation from "../data/hsc_decks/punctuation.json";
import d_report_writing from "../data/hsc_decks/report-writing.json";
import d_right_form_verbs from "../data/hsc_decks/right-form-verbs.json";
import d_shilpi_early_marriage from "../data/hsc_decks/shilpi-early-marriage.json";
import d_substitution_table from "../data/hsc_decks/substitution-table.json";
import d_synonym_antonym_2nd from "../data/hsc_decks/synonym-antonym-2nd.json";
import d_the_orphanage from "../data/hsc_decks/the-orphanage.json";
import d_transformation_sentences from "../data/hsc_decks/transformation-sentences.json";
import d_voice_change from "../data/hsc_decks/voice-change.json";
import d_when_a_girl_gets_married from "../data/hsc_decks/when-a-girl-gets-married.json";

/** One reveal-able answer inside a drill or a solved board question. */
export interface DeckAnswer { q?: string; ans: string; why?: string }

export interface DeckChapterMeta {
  id: string; title: string; titleBn: string; tag: string; level: "Easy" | "Medium" | "Hard";
  /** lesson within the unit — several chapters may share one */
  lesson?: number; lessonName?: string;
}
export interface DeckUnit {
  no: string; name: string; nameBn: string; em: string; accent: string; chapters: DeckChapterMeta[];
}
export interface DeckPaper {
  id: string; name: string; nameBn: string; blurb: string; units: DeckUnit[];
}
export interface DeckManifest {
  brand: { name: string; phone: string; address: string };
  papers: DeckPaper[];
}

/** The full teaching content of one chapter. Shape differs by lesson type. */
export interface Deck {
  id: string; paper: string; paperName: string;
  unit: string; unitName: string; lesson?: number; lessonName?: string;
  title: string; titleBn: string;
  lede?: string; qType?: string; minutes?: number; marks?: string;
  objectives?: { t: string; d: string }[];
  /* 1st Paper — passage lessons */
  passage?: { tag: string; s: { en: string; bn: string }[] }[];
  words?: any[]; synant?: any[];
  summaryEn?: string; summaryBn?: string; summaryTip?: string;
  mcq?: { q: string; opts: string[]; ans: number; why: string }[];
  shortQ?: { q: string; a: string; bn: string }[];
  table?: { headers: string[]; rows: string[][]; note?: string };
  /** a chapter may drill more than one information-transfer table */
  tables?: { title?: string; headers: string[]; rows: string[][]; note?: string }[];
  flow?: { title: string; items: any[] };
  /* 2nd Paper — grammar lessons */
  rules?: any[]; rulesTitle?: string; rulesPerSlide?: number; mcqMarks?: string;
  drills?: { title: string; intro?: string; items: DeckAnswer[] }[];
  boardQ?: { instruction?: string; text?: string; bank?: string; items: DeckAnswer[] };
  /* both */
  extras?: any[]; tips?: any[]; recap?: string[]; homework?: string[];
}

export const MANIFEST = manifestJson as unknown as DeckManifest;

export const DECKS: Record<string, Deck> = {
  "adolescence-stages": d_adolescence_stages as unknown as Deck,
  "adolescents-core-resource": d_adolescents_core_resource as unknown as Deck,
  "affirmative-negative": d_affirmative_negative as unknown as Deck,
  "alex-romania": d_alex_romania as unknown as Deck,
  "application-email": d_application_email as unknown as Deck,
  "article-gap-filling": d_article_gap_filling as unknown as Deck,
  "artificial-intelligence": d_artificial_intelligence as unknown as Deck,
  "ash-shatt-camp": d_ash_shatt_camp as unknown as Deck,
  "beauty-is": d_beauty_is as unknown as Deck,
  "bullying": d_bullying as unknown as Deck,
  "college-students-flood": d_college_students_flood as unknown as Deck,
  "completing-sentences": d_completing_sentences as unknown as Deck,
  "completing-story": d_completing_story as unknown as Deck,
  "composition-essay": d_composition_essay as unknown as Deck,
  "connectors": d_connectors as unknown as Deck,
  "dialogue-writing": d_dialogue_writing as unknown as Deck,
  "dreams-psychology": d_dreams_psychology as unknown as Deck,
  "ecotourism": d_ecotourism as unknown as Deck,
  "education-aims": d_education_aims as unknown as Deck,
  "education-gives": d_education_gives as unknown as Deck,
  "elizabeth-voyage": d_elizabeth_voyage as unknown as Deck,
  "graph-chart": d_graph_chart as unknown as Deck,
  "greta-thunberg": d_greta_thunberg as unknown as Deck,
  "i-have-a-dream": d_i_have_a_dream as unknown as Deck,
  "kalsindur-girls": d_kalsindur_girls as unknown as Deck,
  "khorshed-village": d_khorshed_village as unknown as Deck,
  "leela-nag": d_leela_nag as unknown as Deck,
  "man-social-animal": d_man_social_animal as unknown as Deck,
  "mandela-statement": d_mandela_statement as unknown as Deck,
  "marie-curie": d_marie_curie as unknown as Deck,
  "meditation": d_meditation as unknown as Deck,
  "modifiers": d_modifiers as unknown as Deck,
  "mujtaba-ali": d_mujtaba_ali as unknown as Deck,
  "nadera-begum": d_nadera_begum as unknown as Deck,
  "narrative-style": d_narrative_style as unknown as Deck,
  "negro-not-free": d_negro_not_free as unknown as Deck,
  "nelson-mandela": d_nelson_mandela as unknown as Deck,
  "nishat-mazumder": d_nishat_mazumder as unknown as Deck,
  "old-man-at-the-bridge": d_old_man_at_the_bridge as unknown as Deck,
  "paragraph-writing": d_paragraph_writing as unknown as Deck,
  "polite-words-machine": d_polite_words_machine as unknown as Deck,
  "preposition-gap-filling": d_preposition_gap_filling as unknown as Deck,
  "punctuation": d_punctuation as unknown as Deck,
  "report-writing": d_report_writing as unknown as Deck,
  "right-form-verbs": d_right_form_verbs as unknown as Deck,
  "shilpi-early-marriage": d_shilpi_early_marriage as unknown as Deck,
  "substitution-table": d_substitution_table as unknown as Deck,
  "synonym-antonym-2nd": d_synonym_antonym_2nd as unknown as Deck,
  "the-orphanage": d_the_orphanage as unknown as Deck,
  "transformation-sentences": d_transformation_sentences as unknown as Deck,
  "voice-change": d_voice_change as unknown as Deck,
  "when-a-girl-gets-married": d_when_a_girl_gets_married as unknown as Deck,
};
