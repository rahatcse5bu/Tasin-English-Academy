/**
 * Static curriculum catalogue.
 *
 * Content lives as JSON under src/data/**. We `import` it (resolveJsonModule)
 * so it is type-checked, copied to dist by nest-cli `assets`, and inlined into
 * the single-file bundle by @vercel/ncc for production.
 *
 * To add a class/subject: drop the JSON in src/data and register it below.
 */
import unit1 from '../data/class_8_english/unit1_content.json';
import unit2 from '../data/class_8_english/unit2_all.json';
import unit3 from '../data/class_8_english/unit3_all.json';
import unit4 from '../data/class_8_english/unit4_all.json';
import unit5 from '../data/class_8_english/unit5_all.json';
import unit6 from '../data/class_8_english/unit6_all.json';
import unit7 from '../data/class_8_english/unit7_all.json';

export interface UnitRaw {
  unit: { id: string; number: string; title: string; bangla_title?: string; lessons: any[] };
  poems?: any[];
}

export interface Unit {
  id: string;
  number: number;
  title: string;
  banglaTitle: string;
  lessons: any[];
  poems: any[];
}

export interface Subject {
  id: string;
  name: string;
  nameBn: string;
  book: string;
  units: Unit[];
}

export interface ClassLevel {
  id: string;
  name: string;
  nameBn: string;
  subjects: Subject[];
}

function normalizeUnit(raw: any): Unit {
  const u = raw.unit;
  return {
    id: u.id,
    number: Number(u.number),
    title: u.title,
    banglaTitle: u.bangla_title || '',
    lessons: u.lessons || [],
    poems: raw.poems || [],
  };
}

const englishUnits: Unit[] = [unit1, unit2, unit3, unit4, unit5, unit6, unit7]
  .map((u) => normalizeUnit(u))
  .sort((a, b) => a.number - b.number);

export const CLASSES: ClassLevel[] = [
  {
    id: 'class-8',
    name: 'Class 8',
    nameBn: 'অষ্টম শ্রেণি',
    subjects: [
      {
        id: 'english',
        name: 'English',
        nameBn: 'ইংরেজি',
        book: 'English For Today',
        units: englishUnits,
      },
    ],
  },
];
