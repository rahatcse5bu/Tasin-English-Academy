import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ResourceKind = 'lecture_sheet' | 'tips' | 'hack' | 'note' | 'suggestion' | 'best_practice';

@Schema({ timestamps: true })
export class Resource {
  @Prop({ required: true })
  title: string;

  @Prop()
  titleBn?: string;

  @Prop({ required: true, enum: ['lecture_sheet', 'tips', 'hack', 'note', 'suggestion', 'best_practice'] })
  kind: ResourceKind;

  @Prop({ enum: ['SSC', 'HSC', 'BOTH'], default: 'BOTH' })
  level: string;

  @Prop()
  subject?: string;

  @Prop()
  body?: string; // Markdown / rich text content

  @Prop()
  bodyBn?: string;

  @Prop()
  fileUrl?: string;

  @Prop({ type: Types.ObjectId, ref: 'Batch' })
  batch?: Types.ObjectId; // optional batch-scoped resource

  @Prop({ default: true })
  isPublic: boolean; // public visitor view vs students-only

  @Prop({ type: [String], default: [] })
  tags: string[];
}

export type ResourceDocument = Resource & Document;
export const ResourceSchema = SchemaFactory.createForClass(Resource);
