import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Exam {
  @Prop({ type: Types.ObjectId, ref: 'Batch', required: true })
  batch: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop()
  titleBn?: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  scheduledAt: Date;

  @Prop({ default: 60 })
  durationMinutes: number;

  @Prop({ default: 100 })
  totalMarks: number;

  @Prop()
  googleFormUrl?: string;

  @Prop({ enum: ['scheduled', 'open', 'closed', 'evaluated'], default: 'scheduled' })
  status: string;
}

export type ExamDocument = Exam & Document;
export const ExamSchema = SchemaFactory.createForClass(Exam);

@Schema({ timestamps: true })
export class ExamResult {
  @Prop({ type: Types.ObjectId, ref: 'Exam', required: true })
  exam: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  student: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Batch', required: true })
  batch: Types.ObjectId;

  @Prop({ required: true })
  marks: number;

  @Prop({ required: true })
  totalMarks: number;

  @Prop()
  rank?: number;

  @Prop()
  remark?: string;
}

export type ExamResultDocument = ExamResult & Document;
export const ExamResultSchema = SchemaFactory.createForClass(ExamResult);
ExamResultSchema.index({ exam: 1, student: 1 }, { unique: true });
