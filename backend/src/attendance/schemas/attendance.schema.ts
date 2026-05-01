import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AttendanceStatus = 'present' | 'absent' | 'late';

@Schema({ timestamps: true })
export class Attendance {
  @Prop({ type: Types.ObjectId, ref: 'ClassSession', required: true })
  classSession: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Batch', required: true })
  batch: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  student: Types.ObjectId;

  @Prop({ required: true, enum: ['present', 'absent', 'late'], default: 'absent' })
  status: AttendanceStatus;

  @Prop()
  markedBy?: string;

  @Prop()
  remark?: string;
}

export type AttendanceDocument = Attendance & Document;
export const AttendanceSchema = SchemaFactory.createForClass(Attendance);
AttendanceSchema.index({ classSession: 1, student: 1 }, { unique: true });
