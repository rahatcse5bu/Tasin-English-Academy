import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Deck as DeckContent, DECKS, MANIFEST } from './decks.data';
import { Deck as DeckDoc, DeckDocument } from './schemas/deck.schema';
import { seedDecks } from './decks.seed';

/**
 * How many things a mentor can actually teach from this chapter.
 * Passage lessons and grammar lessons advertise different numbers, so the
 * catalogue cards can show something meaningful for both.
 */
function stats(d: DeckContent) {
  if (d.rules) {
    return {
      kind: 'grammar' as const,
      rules: d.rules.length,
      drills: (d.drills || []).reduce((n, s) => n + s.items.length, 0),
      board: d.boardQ ? d.boardQ.items.length : 0,
      tips: (d.tips || []).length,
    };
  }
  return {
    kind: 'passage' as const,
    sentences: (d.passage || []).reduce((n, p) => n + (p.s || []).length, 0),
    words: (d.words || []).length,
    mcq: (d.mcq || []).length,
    shortQ: (d.shortQ || []).length,
  };
}

/** Every answer in the deck is revealed one at a time, so it is worth counting. */
function answerCount(d: DeckContent): number {
  let n = 0;
  n += (d.mcq || []).length;
  n += (d.shortQ || []).length;
  n += (d.drills || []).reduce((s, x) => s + x.items.length, 0);
  n += d.boardQ ? d.boardQ.items.length : 0;
  if (d.table) {
    n += d.table.rows.reduce(
      (s, row) => s + row.filter((c) => String(c ?? '').includes('@')).length,
      0,
    );
  }
  if (d.flow) n += Math.max(0, d.flow.items.length - 1); // box 1 is given
  return n;
}

@Injectable()
export class DecksService implements OnModuleInit {
  private readonly logger = new Logger(DecksService.name);

  constructor(@InjectModel(DeckDoc.name) private model: Model<DeckDocument>) {}

  /**
   * Decks are study content, not user data — an empty collection means the app was
   * deployed without seeding. Rather than serve an empty library, load the bundled
   * JSON on first boot. Explicit re-seeds go through `npm run seed:decks`.
   */
  async onModuleInit() {
    const n = await this.model.countDocuments();
    if (n === 0) {
      this.logger.log('decks collection empty — seeding from bundled JSON…');
      await seedDecks(this.model as any, { log: (m) => this.logger.log(m) });
    }
  }

  private async published() {
    return this.model
      .find({ isPublished: true })
      .sort({ paperOrder: 1, unitOrder: 1, order: 1 })
      .lean();
  }

  /** The library: papers → units → chapters, each with teaching counts. */
  async catalogue() {
    const docs = await this.published();

    const papers: any[] = [];
    for (const d of docs) {
      let paper = papers.find((p) => p.id === d.paperId);
      if (!paper) {
        paper = {
          id: d.paperId,
          name: d.paperName,
          nameBn: d.paperNameBn,
          blurb: d.paperBlurb,
          chapterCount: 0,
          units: [],
        };
        papers.push(paper);
      }
      let unit = paper.units.find((u: any) => u.no === d.unitNo && u.name === d.unitName);
      if (!unit) {
        unit = {
          no: d.unitNo,
          name: d.unitName,
          nameBn: d.unitNameBn,
          em: d.unitEm,
          accent: d.unitAccent,
          chapters: [],
        };
        paper.units.push(unit);
      }
      const content = d.content as DeckContent;
      unit.chapters.push({
        id: d.slug,
        title: d.title,
        titleBn: d.titleBn,
        tag: d.tag,
        level: d.level,
        available: true,
        minutes: d.minutes ?? null,
        marks: d.marks ?? null,
        answers: answerCount(content),
        stats: stats(content),
      });
      paper.chapterCount++;
    }

    return { brand: MANIFEST.brand, papers };
  }

  /** Flat list — handy for search boxes and for prerendering routes. */
  async index() {
    const docs = await this.published();
    return docs.map((d) => ({
      id: d.slug,
      title: d.title,
      titleBn: d.titleBn,
      tag: d.tag,
      level: d.level,
      paper: d.paperId,
      paperName: d.paperName,
      unit: d.unitNo,
      unitName: d.unitName,
      unitNameBn: d.unitNameBn,
      em: d.unitEm,
    }));
  }

  /** The full teaching content of one chapter. */
  async get(id: string): Promise<DeckContent> {
    const d = await this.model.findOne({ slug: id, isPublished: true }).lean();
    if (!d) {
      // a chapter can exist in the bundle but not yet in the DB (fresh deploy)
      if (DECKS[id]) return DECKS[id];
      throw new NotFoundException('Deck not found');
    }
    return d.content as DeckContent;
  }

  /** Previous / next chapter within the same paper, for in-deck navigation. */
  async neighbours(id: string) {
    const flat = await this.index();
    const i = flat.findIndex((c) => c.id === id);
    if (i < 0) throw new NotFoundException('Deck not found');
    const samePaper = flat.filter((c) => c.paper === flat[i].paper);
    const j = samePaper.findIndex((c) => c.id === id);
    return {
      prev: j > 0 ? samePaper[j - 1] : null,
      next: j < samePaper.length - 1 ? samePaper[j + 1] : null,
    };
  }

  /** Admin/ops: re-import the bundled JSON into Mongo. */
  async reseed(wipe = false) {
    return seedDecks(this.model as any, { wipe, log: (m) => this.logger.log(m) });
  }
}
