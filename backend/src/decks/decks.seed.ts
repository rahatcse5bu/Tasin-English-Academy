import { Model } from 'mongoose';
import { DECKS, MANIFEST } from './decks.data';

/**
 * Loads the bundled chapter JSON into the `decks` collection.
 *
 * Idempotent: each chapter is upserted by `slug`, so running it again refreshes
 * the content without creating duplicates and without touching `isPublished`
 * (an admin may have hidden a chapter deliberately).
 *
 * Used by `npm run seed` and by `npm run seed:decks`.
 */
export async function seedDecks(
  /** works with both a Nest-injected model and a plain mongoose model */
  model: Model<any>,
  opts: { wipe?: boolean; log?: (m: string) => void } = {},
) {
  const log = opts.log || (() => {});

  if (opts.wipe) {
    const { deletedCount } = await model.deleteMany({});
    log(`Decks: wiped ${deletedCount} existing`);
  }

  let created = 0;
  let updated = 0;

  for (let p = 0; p < MANIFEST.papers.length; p++) {
    const paper = MANIFEST.papers[p];
    for (let u = 0; u < paper.units.length; u++) {
      const unit = paper.units[u];
      for (let c = 0; c < unit.chapters.length; c++) {
        const meta = unit.chapters[c];
        const content = DECKS[meta.id];
        if (!content) {
          log(`Decks: no content for "${meta.id}" — skipped`);
          continue;
        }

        const doc = {
          paperId: paper.id,
          paperName: paper.name,
          paperNameBn: paper.nameBn,
          paperBlurb: paper.blurb,
          paperOrder: p,

          unitNo: unit.no,
          unitName: unit.name,
          unitNameBn: unit.nameBn,
          unitEm: unit.em,
          unitAccent: unit.accent,
          unitOrder: u,

          title: meta.title,
          titleBn: meta.titleBn,
          tag: meta.tag,
          level: meta.level,
          minutes: content.minutes,
          marks: content.marks,
          order: c,
          content,
        };

        const existing = await model.findOne({ slug: meta.id }).select('_id').lean();
        await model.updateOne(
          { slug: meta.id },
          { $set: doc, $setOnInsert: { slug: meta.id, isPublished: true } },
          { upsert: true },
        );
        existing ? updated++ : created++;
      }
    }
  }

  const total = await model.countDocuments();
  log(`Decks: ${created} created, ${updated} updated — ${total} in collection`);
  return { created, updated, total };
}
