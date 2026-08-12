import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Deck as DeckContent, DECKS, MANIFEST } from './decks.data';
import { Deck as DeckDoc, DeckDocument } from './schemas/deck.schema';
import { seedDecks } from './decks.seed';
import { ContentDto, PlacementDto, UnitDto } from './decks.dto';

/**
 * How many things a mentor can actually teach from this chapter.
 * Passage lessons and grammar lessons advertise different numbers, so the
 * catalogue cards can show something meaningful for both.
 */
/** A chapter may carry one legacy `table` or several in `tables`. */
function allTables(d: DeckContent): { headers: string[]; rows: string[][] }[] {
  if (d.tables && d.tables.length) return d.tables;
  return d.table ? [d.table] : [];
}

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
    tables: allTables(d).length,
  };
}

/** Every answer in the deck is revealed one at a time, so it is worth counting. */
function answerCount(d: DeckContent): number {
  let n = 0;
  n += (d.mcq || []).length;
  n += (d.shortQ || []).length;
  n += (d.drills || []).reduce((s, x) => s + x.items.length, 0);
  n += d.boardQ ? d.boardQ.items.length : 0;
  for (const t of allTables(d)) {
    n += t.rows.reduce((s, row) => s + row.filter((c) => String(c ?? '').includes('@')).length, 0);
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

  /**
   * Every chapter a mentor may see. The whole /decks section is staff-only, so
   * hidden chapters are included and flagged rather than filtered out — a
   * chapter you cannot see is a chapter you cannot un-hide. Deleted ones are
   * excluded unless explicitly asked for.
   */
  private async published(opts: { deleted?: boolean } = {}) {
    return this.model
      .find({ isDeleted: opts.deleted ? true : { $ne: true } })
      .sort({ paperOrder: 1, unitOrder: 1, lessonNo: 1, order: 1 })
      .lean();
  }

  /** The library: papers → units → chapters, each with teaching counts. */
  async catalogue(deleted = false) {
    const docs = await this.published({ deleted });

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
          order: d.unitOrder,
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
        lesson: d.lessonNo ?? null,
        lessonName: d.lessonName ?? null,
        order: d.order,
        available: true,
        hidden: d.isPublished === false,
        deleted: d.isDeleted === true,
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
      lesson: d.lessonNo ?? null,
      em: d.unitEm,
    }));
  }

  /** The full teaching content of one chapter. */
  async get(id: string): Promise<DeckContent> {
    const d = await this.model.findOne({ slug: id, isDeleted: { $ne: true } }).lean();
    if (!d) {
      // a chapter can exist in the bundle but not yet in the DB (fresh deploy)
      if (DECKS[id]) return DECKS[id];
      throw new NotFoundException('Deck not found');
    }
    // the placement lives on the document, so a teacher's correction shows up in
    // the deck's breadcrumb and cover without the content JSON being rewritten
    return {
      ...(d.content as DeckContent),
      unit: d.unitNo,
      unitName: d.unitName,
      lesson: d.lessonNo,
      lessonName: d.lessonName,
      paperName: d.paperName,
    } as DeckContent;
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

  /* ------------------------------------------------------------------
     Placement editing — a mentor fixes which unit / lesson a chapter sits in
     ------------------------------------------------------------------ */

  /** "Unit 09" → 9, "Extra 01" → 1 but always after the numbered units. */
  private static rank(unitNo: string): [number, number] {
    const n = /(\d+)/.exec(unitNo || '');
    return [/^extra/i.test(unitNo || '') ? 1 : 0, n ? Number(n[1]) : 0];
  }

  /**
   * Renumber `unitOrder` across a paper so the library lists units in ascending
   * unit number. Units whose `no` carries no number (2nd Paper uses "Part A")
   * all rank equal and keep their current relative order.
   */
  private async resequence(paperId: string) {
    const docs = await this.model.find({ paperId }).select('unitNo unitName unitOrder').lean();

    const units: { no: string; name: string; order: number }[] = [];
    for (const d of docs) {
      if (!units.some((u) => u.no === d.unitNo && u.name === d.unitName)) {
        units.push({ no: d.unitNo, name: d.unitName, order: d.unitOrder ?? 0 });
      }
    }

    units.sort((a, b) => {
      const [ax, an] = DecksService.rank(a.no);
      const [bx, bn] = DecksService.rank(b.no);
      return ax - bx || an - bn || a.order - b.order; // stable for "Part A" style
    });

    await Promise.all(
      units.map((u, i) =>
        this.model.updateMany({ paperId, unitNo: u.no, unitName: u.name }, { $set: { unitOrder: i } }),
      ),
    );
    return units.length;
  }

  /** The units that currently exist — feeds the "move to unit" dropdown. */
  async units() {
    const docs = await this.model
      .find()
      .select('paperId paperName unitNo unitName unitNameBn unitEm unitAccent unitOrder lessonNo')
      .sort({ paperOrder: 1, unitOrder: 1 })
      .lean();

    const out: any[] = [];
    for (const d of docs) {
      let u = out.find((x) => x.paperId === d.paperId && x.no === d.unitNo && x.name === d.unitName);
      if (!u) {
        u = {
          paperId: d.paperId,
          paperName: d.paperName,
          no: d.unitNo,
          name: d.unitName,
          nameBn: d.unitNameBn ?? '',
          em: d.unitEm ?? '',
          accent: d.unitAccent ?? 'navy',
          order: d.unitOrder ?? 0,
          chapters: 0,
          lessons: [] as number[],
        };
        out.push(u);
      }
      u.chapters++;
      if (d.lessonNo != null && !u.lessons.includes(d.lessonNo)) u.lessons.push(d.lessonNo);
    }
    out.forEach((u) => u.lessons.sort((a: number, b: number) => a - b));
    return out;
  }

  /**
   * Move one chapter: change its unit and/or its lesson number.
   *
   * Only the supplied fields change. If the target unit already exists its
   * name/emoji/accent and `unitOrder` are inherited, so a chapter dragged into
   * "Unit 09" lands beside its siblings instead of creating a twin unit.
   */
  async setPlacement(slug: string, dto: PlacementDto) {
    const deck: any = await this.model.findOne({ slug });
    if (!deck) throw new NotFoundException('Deck not found');

    if (dto.unitNo !== undefined || dto.unitName !== undefined) {
      const no = dto.unitNo ?? deck.unitNo;
      const name = dto.unitName ?? deck.unitName;

      const sibling: any = await this.model
        .findOne({ paperId: deck.paperId, unitNo: no, unitName: name, slug: { $ne: slug } })
        .select('unitNameBn unitEm unitAccent unitOrder')
        .lean();

      deck.unitNo = no;
      deck.unitName = name;
      deck.unitNameBn = dto.unitNameBn ?? sibling?.unitNameBn ?? deck.unitNameBn;
      deck.unitEm = dto.unitEm ?? sibling?.unitEm ?? deck.unitEm;
      deck.unitAccent = dto.unitAccent ?? sibling?.unitAccent ?? deck.unitAccent;
      if (sibling) deck.unitOrder = sibling.unitOrder;
    } else {
      if (dto.unitNameBn !== undefined) deck.unitNameBn = dto.unitNameBn;
      if (dto.unitEm !== undefined) deck.unitEm = dto.unitEm;
      if (dto.unitAccent !== undefined) deck.unitAccent = dto.unitAccent;
    }

    if (dto.unitOrder !== undefined) deck.unitOrder = dto.unitOrder;
    if (dto.lessonNo !== undefined) deck.lessonNo = dto.lessonNo === null ? undefined : dto.lessonNo;
    if (dto.lessonName !== undefined) deck.lessonName = dto.lessonName || undefined;
    if (dto.order !== undefined) deck.order = dto.order;
    if (dto.isPublished !== undefined) deck.isPublished = dto.isPublished;

    deck.placementLocked = true; // survive the next re-seed
    await deck.save();
    await this.resequence(deck.paperId);

    this.logger.log(`placement: ${slug} → ${deck.unitNo} / lesson ${deck.lessonNo ?? '-'}`);
    return this.model.findOne({ slug }).select('-content').lean();
  }

  /**
   * Rename or renumber a whole unit in one go — the case that actually comes up
   * ("Adolescence is Unit 09, not Unit 03"). Unit fields are denormalised onto
   * every chapter, so all of them must move together.
   */
  async setUnit(dto: UnitDto) {
    const filter = { paperId: dto.paperId, unitNo: dto.unitNo, unitName: dto.unitName };
    const found = await this.model.countDocuments(filter);
    if (!found) throw new NotFoundException('Unit not found');

    const set: Record<string, any> = { placementLocked: true };
    if (dto.newNo !== undefined) set.unitNo = dto.newNo;
    if (dto.newName !== undefined) set.unitName = dto.newName;
    if (dto.nameBn !== undefined) set.unitNameBn = dto.nameBn;
    if (dto.em !== undefined) set.unitEm = dto.em;
    if (dto.accent !== undefined) set.unitAccent = dto.accent;

    const { modifiedCount } = await this.model.updateMany(filter, { $set: set });
    await this.resequence(dto.paperId);

    this.logger.log(`unit: ${dto.unitNo} "${dto.unitName}" → ${set.unitNo ?? dto.unitNo} (${modifiedCount} chapters)`);
    return { chapters: modifiedCount, unitNo: set.unitNo ?? dto.unitNo };
  }

  /* ------------------------------------------------------------------
     Content editing — a mentor adds questions, table rows, a summary
     ------------------------------------------------------------------ */

  /**
   * Replace the sections a mentor maintains: short questions, MCQ, the
   * information-transfer table and the summary (English + Bangla).
   *
   * Only the keys present in the request are touched — the passage, the
   * sentence-wise Bangla and the vocabulary stay exactly as they were, since
   * those are transcribed from the book and are not a mentor's to change here.
   * Sending an empty array for a section clears it.
   */
  async setContent(slug: string, dto: ContentDto) {
    const deck: any = await this.model.findOne({ slug });
    if (!deck) throw new NotFoundException('Deck not found');

    const content = { ...(deck.content as any) };
    const text = (v?: string) => (v === undefined ? undefined : v.trim());

    for (const k of ['summaryEn', 'summaryBn', 'summaryTip'] as const) {
      const v = text(dto[k]);
      if (v === undefined) continue;
      v ? (content[k] = v) : delete content[k];
    }

    if (dto.shortQ) {
      content.shortQ = dto.shortQ.map((x) => ({
        q: x.q.trim(),
        a: x.a.trim(),
        ...(x.bn?.trim() ? { bn: x.bn.trim() } : {}),
      }));
      if (!content.shortQ.length) delete content.shortQ;
    }

    if (dto.mcq) {
      content.mcq = dto.mcq.map((x) => ({
        q: x.q.trim(),
        opts: x.opts.map((o) => String(o).trim()),
        // a correct index past the end of the option list would hide the answer
        ans: Math.min(x.ans, x.opts.length - 1),
        ...(x.why?.trim() ? { why: x.why.trim() } : {}),
      }));
      if (!content.mcq.length) delete content.mcq;
    }

    if (dto.tables) {
      const tables = dto.tables
        .map((t) => {
          const headers = t.headers.map((h) => String(h).trim());
          const rows = (t.rows || [])
            // pad/trim so every row lines up with the header count
            .map((r) => headers.map((_, i) => String((r as any)?.[i] ?? '').trim()))
            .filter((r) => r.some(Boolean));
          return {
            ...(t.title?.trim() ? { title: t.title.trim() } : {}),
            headers,
            rows,
            ...(t.note?.trim() ? { note: t.note.trim() } : {}),
          };
        })
        .filter((t) => t.rows.length);

      // one shape from here on; the legacy single `table` is folded in
      delete content.table;
      if (tables.length) content.tables = tables;
      else delete content.tables;
    }

    if (dto.passage) {
      content.passage = dto.passage
        .map((p) => ({
          tag: p.tag?.trim() || '',
          s: (p.s || [])
            .filter((x) => x.en?.trim())
            .map((x) => ({
              en: x.en.trim(),
              bn: (x.bn || '').trim(),
              ...(x.no ? { no: x.no } : {}),
            })),
        }))
        .filter((p) => p.s.length);
      if (!content.passage.length) delete content.passage;
    }

    if (dto.words) {
      content.words = dto.words
        .filter((w) => w.w?.trim())
        .map((w) => ({
          w: w.w.trim(),
          ...(w.pos?.trim() ? { pos: w.pos.trim() } : {}),
          ...(w.pron?.trim() ? { pron: w.pron.trim() } : {}),
          ...(w.bn?.trim() ? { bn: w.bn.trim() } : {}),
          ...(w.en?.trim() ? { en: w.en.trim() } : {}),
          ...(w.ex?.trim() ? { ex: w.ex.trim() } : {}),
        }));
      if (!content.words.length) delete content.words;
    }

    if (dto.synant) {
      const list = (a?: string[]) => (a || []).map((x) => String(x).trim()).filter(Boolean);
      content.synant = dto.synant
        .filter((x) => x.w?.trim())
        .map((x) => ({
          w: x.w.trim(),
          ...(x.bn?.trim() ? { bn: x.bn.trim() } : {}),
          syn: list(x.syn),
          ant: list(x.ant),
        }));
      if (!content.synant.length) delete content.synant;
    }

    if (dto.flow) {
      const items = (dto.flow.items || [])
        .filter((x) => x.t?.trim())
        .map((x) => ({ t: x.t.trim(), ...(x.bn?.trim() ? { bn: x.bn.trim() } : {}) }));
      if (items.length >= 2) {
        content.flow = { title: dto.flow.title?.trim() || content.flow?.title || '', items };
      } else {
        delete content.flow;
      }
    }

    deck.content = content;
    deck.markModified('content'); // Mixed: mongoose cannot see inside it
    deck.contentLocked = true; // survive the next re-seed
    await deck.save();

    this.logger.log(
      `content: ${slug} — ${(content.shortQ || []).length} shortQ, ${(content.mcq || []).length} MCQ, ` +
        `${(content.tables || []).length} tables`,
    );
    return { slug, stats: stats(content), answers: answerCount(content) };
  }

  /* ------------------------------------------------------------------
     Hiding and removing a chapter
     ------------------------------------------------------------------ */

  /** Take a chapter out of the class list, or put it back. */
  async setVisible(slug: string, isPublished: boolean) {
    const d = await this.model.findOneAndUpdate(
      { slug },
      { $set: { isPublished, placementLocked: true } },
      { new: true },
    );
    if (!d) throw new NotFoundException('Deck not found');
    this.logger.log(`visibility: ${slug} → ${isPublished ? 'visible' : 'hidden'}`);
    return { slug, isPublished };
  }

  /**
   * Remove a chapter. Soft, on purpose: the chapter still exists in the bundled
   * JSON, so a hard delete would simply reappear at the next `seed:decks` — and
   * a mentor who removes the wrong lesson gets it back with one click.
   */
  async remove(slug: string) {
    const d = await this.model.findOneAndUpdate(
      { slug },
      { $set: { isDeleted: true, isPublished: false, placementLocked: true, contentLocked: true } },
      { new: true },
    );
    if (!d) throw new NotFoundException('Deck not found');
    this.logger.log(`removed: ${slug}`);
    return { slug, deleted: true };
  }

  async restore(slug: string) {
    const d = await this.model.findOneAndUpdate(
      { slug },
      { $set: { isDeleted: false, isPublished: true } },
      { new: true },
    );
    if (!d) throw new NotFoundException('Deck not found');
    this.logger.log(`restored: ${slug}`);
    return { slug, deleted: false };
  }

  /** Admin/ops: re-import the bundled JSON into Mongo. */
  async reseed(wipe = false) {
    return seedDecks(this.model as any, { wipe, log: (m) => this.logger.log(m) });
  }
}
