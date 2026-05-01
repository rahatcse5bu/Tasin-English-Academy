import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BatchType = 'premium' | 'general';
export type BatchSubject = 'HSC_ENGLISH_1ST' | 'HSC_ENGLISH_2ND' | 'SSC_ENGLISH_1ST' | 'SSC_ENGLISH_2ND' | 'ICT';

@Schema({ _id: false })
export class ScheduleSlot {
  @Prop({ required: true, enum: ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'] })
  day: string;

  @Prop({ required: true })
  startTime: string; // "18:00"

  @Prop({ required: true })
  endTime: string; // "19:30"
}
const ScheduleSlotSchema = SchemaFactory.createForClass(ScheduleSlot);

@Schema({ timestamps: true })
export class Batch {
  @Prop({ required: true })
  name: string; // e.g., "HSC-26 English Premium A"

  @Prop()
  nameBn?: string;

  @Prop({ required: true, unique: true })
  code: string; // short slug, e.g., "HSC26-ENG-P-A"

  @Prop({ required: true, enum: ['premium', 'general'] })
  type: BatchType;

  @Prop({ required: true, enum: ['HSC_ENGLISH_1ST', 'HSC_ENGLISH_2ND', 'SSC_ENGLISH_1ST', 'SSC_ENGLISH_2ND', 'ICT'] })
  subject: BatchSubject;

  @Prop()
  description?: string;

  @Prop()
  descriptionBn?: string;

  @Prop({ type: [Types.ObjectId], ref: 'Teacher', default: [] })
  teachers: Types.ObjectId[];

  @Prop({ required: true })
  monthlyFee: number; // in BDT, 350 - 500

  @Prop({ required: true })
  maxStudents: number; // 10 for premium, 25+ for general

  @Prop({ default: 0 })
  enrolledCount: number;

  @Prop({ type: [ScheduleSlotSchema], default: [] })
  schedule: ScheduleSlot[];

  @Prop()
  gmeetLink?: string; // single recurring meet link for the batch

  @Prop()
  startDate?: Date;

  @Prop()
  endDate?: Date;

  @Prop({ default: 3 })
  freeClassCount: number; // pay after N classes

  @Prop({ default: true })
  active: boolean;
}

export type BatchDocument = Batch & Document;
export const BatchSchema = SchemaFactory.createForClass(Batch);
