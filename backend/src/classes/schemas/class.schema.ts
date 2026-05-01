import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class ClassSession {
  @Prop({ type: Types.ObjectId, ref: 'Batch', required: true })
  batch: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop()
  titleBn?: string;

  @Prop()
  topic?: string;

  @Prop()
  topicBn?: string;

  @Prop({ required: true })
  scheduledAt: Date;

  @Prop({ default: 90 })
  durationMinutes: number;

  @Prop()
  gmeetLink?: string; // override per-class link if provided

  @Prop({ type: Types.ObjectId, ref: 'Teacher' })
  teacher?: Types.ObjectId;

  @Prop({ enum: ['scheduled', 'live', 'completed', 'cancelled'], default: 'scheduled' })
  status: string;

  @Prop()
  recordingUrl?: string;

  @Prop()
  notes?: string;
}

export type ClassSessionDocument = ClassSession & Document;
export const ClassSessionSchema = SchemaFactory.createForClass(ClassSession);
