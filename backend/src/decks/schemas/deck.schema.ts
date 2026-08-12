import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

/**
 * One HSC slide-deck chapter.
 *
 * The catalogue (papers → units → chapters) is derived by grouping these documents,
 * so there is a single collection to seed and to edit. Paper/unit fields are
 * denormalised onto each chapter for that reason.
 *
 * `content` holds the whole teaching payload — passage + sentence-wise Bangla + MCQ +
 * table for a 1st Paper lesson, or rules + drills + boardQ for a 2nd Paper grammar
 * lesson. Its shape differs per lesson type, so it is stored as Mixed.
 */
@Schema({ timestamps: true, collection: 'decks' })
export class Deck {
  /** URL id, e.g. `connectors` — this is what /decks/:id uses. */
  @Prop({ required: true, unique: true, index: true })
  slug: string;

  /* ---- paper ---- */
  @Prop({ required: true, index: true })
  paperId: string; // paper1 | paper2

  @Prop({ required: true })
  paperName: string; // English 1st Paper

  @Prop()
  paperNameBn?: string;

  @Prop()
  paperBlurb?: string;

  @Prop({ default: 0 })
  paperOrder: number;

  /* ---- unit ---- */
  @Prop({ required: true })
  unitNo: string; // Unit 03

  @Prop({ required: true })
  unitName: string;

  @Prop()
  unitNameBn?: string;

  @Prop()
  unitEm?: string;

  @Prop()
  unitAccent?: string;

  @Prop({ default: 0 })
  unitOrder: number;

  /* ---- lesson ---- */
  /** lesson within the unit; two passages may share one lesson number */
  @Prop()
  lessonNo?: number;

  @Prop()
  lessonName?: string;

  /**
   * Set when a teacher edits the placement from the app. The seeder then leaves
   * unit/lesson alone on re-import so a manual correction survives `npm run seed`.
   */
  @Prop({ default: false })
  placementLocked: boolean;

  /* ---- chapter ---- */
  @Prop({ required: true })
  title: string;

  @Prop()
  titleBn?: string;

  @Prop()
  tag?: string;

  @Prop({ enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' })
  level: string;

  @Prop()
  minutes?: number;

  @Prop()
  marks?: string;

  /** order within the unit */
  @Prop({ default: 0 })
  order: number;

  /** hide a chapter from the public library without deleting it */
  @Prop({ default: true })
  isPublished: boolean;

  /** the full teaching content — shape depends on the lesson type */
  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  content: Record<string, any>;
}

export type DeckDocument = Deck & Document;
export const DeckSchema = SchemaFactory.createForClass(Deck);

// the library lists chapters paper → unit → chapter, so index that path
DeckSchema.index({ paperOrder: 1, unitOrder: 1, lessonNo: 1, order: 1 });
