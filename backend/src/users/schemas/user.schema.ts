import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserRole = 'admin' | 'teacher' | 'student';

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, enum: ['admin', 'teacher', 'student'], default: 'student' })
  role: UserRole;

  @Prop()
  phone?: string;

  @Prop()
  institution?: string; // school/college name

  /**
   * The class a student sits for. Named `level` since the app was built, and
   * kept that way so existing records and the dashboard keep working; the UI
   * calls it "ক্লাস". Matches the deck `classId` values (SSC, HSC).
   */
  @Prop({ enum: ['SSC', 'HSC', 'Other'] })
  level?: string;

  /** e.g. "2025-26" — which academic session the student was admitted for */
  @Prop()
  session?: string;

  /** the batch as the academy writes it on a form, before enrolment is done */
  @Prop()
  batchName?: string;

  /** admission or roll number the academy uses on paper */
  @Prop()
  studentId?: string;

  @Prop()
  guardianName?: string;

  @Prop()
  guardianPhone?: string;

  /* ---- where the student is from ---- */
  @Prop()
  division?: string;

  @Prop()
  district?: string;

  @Prop()
  upazila?: string;

  @Prop()
  address?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Batch' }], default: [] })
  enrolledBatches: Types.ObjectId[];

  @Prop({ default: true })
  active: boolean;
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);
