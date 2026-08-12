import { Injectable, NotFoundException } from '@nestjs/common';
import { CLASSES, ClassLevel, Subject, Unit } from './learning.data';

/** Count the interactive activities available in a lesson (for UI badges). */
function lessonActivityCount(l: any): number {
  let n = 0;
  if (l.reading?.summary_en) n++;
  if (l.vocab?.length) n++;
  if (l.mcqs?.length) n++;
  if (l.short_answers?.length) n++;
  if (l.true_false?.length) n++;
  if (l.cloze?.blanks?.length) n++;
  if (l.match?.pairs?.length) n++;
  if (l.table?.rows?.length) n++;
  if (l.summary?.model) n++;
  if (l.writing?.model) n++;
  if (l.qa?.length) n++;
  return n;
}

function lessonSummary(l: any) {
  return {
    id: l.id,
    number: Number(l.number),
    title: l.title,
    isPoem: l.is_poem === true || l.is_poem === 'true',
    poet: l.poet || l.author || null,
    keywords: l.keywords || [],
    learnLine: l.learn_line || '',
    minutes: Number(l.minutes) || null,
    activities: lessonActivityCount(l),
  };
}

function unitSummary(u: Unit) {
  return {
    id: u.id,
    number: u.number,
    title: u.title,
    banglaTitle: u.banglaTitle,
    lessonCount: u.lessons.length,
    poemCount: u.poems.length,
    minutes: u.lessons.reduce((s, l) => s + (Number(l.minutes) || 0), 0),
    lessons: u.lessons.map(lessonSummary),
  };
}

function subjectSummary(s: Subject) {
  return {
    id: s.id,
    name: s.name,
    nameBn: s.nameBn,
    book: s.book,
    unitCount: s.units.length,
    lessonCount: s.units.reduce((n, u) => n + u.lessons.length, 0),
  };
}

@Injectable()
export class LearningService {
  private findClass(classId: string): ClassLevel {
    const c = CLASSES.find((x) => x.id === classId);
    if (!c) throw new NotFoundException('Class not found');
    return c;
  }

  private findSubject(classId: string, subjectId: string): Subject {
    const c = this.findClass(classId);
    const s = c.subjects.find((x) => x.id === subjectId);
    if (!s) throw new NotFoundException('Subject not found');
    return s;
  }

  classes() {
    return CLASSES.map((c) => ({
      id: c.id,
      name: c.name,
      nameBn: c.nameBn,
      subjects: c.subjects.map(subjectSummary),
    }));
  }

  getClass(classId: string) {
    const c = this.findClass(classId);
    return {
      id: c.id,
      name: c.name,
      nameBn: c.nameBn,
      subjects: c.subjects.map(subjectSummary),
    };
  }

  getSubject(classId: string, subjectId: string) {
    const c = this.findClass(classId);
    const s = this.findSubject(classId, subjectId);
    return {
      class: { id: c.id, name: c.name, nameBn: c.nameBn },
      id: s.id,
      name: s.name,
      nameBn: s.nameBn,
      book: s.book,
      units: s.units.map(unitSummary),
    };
  }

  getUnit(classId: string, subjectId: string, unitId: string) {
    const c = this.findClass(classId);
    const s = this.findSubject(classId, subjectId);
    const u = s.units.find((x) => x.id === unitId || String(x.number) === unitId);
    if (!u) throw new NotFoundException('Unit not found');
    return {
      class: { id: c.id, name: c.name, nameBn: c.nameBn },
      subject: { id: s.id, name: s.name, nameBn: s.nameBn, book: s.book },
      id: u.id,
      number: u.number,
      title: u.title,
      banglaTitle: u.banglaTitle,
      lessons: u.lessons,
      poems: u.poems,
    };
  }
}
