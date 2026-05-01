import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserRole = 'admin' | 'student';

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, enum: ['admin', 'student'], default: 'student' })
  role: UserRole;

  @Prop()
  phone?: string;

  @Prop()
  institution?: string; // school/college name

  @Prop({ enum: ['SSC', 'HSC', 'Other'] })
  level?: string;

  @Prop()
  address?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Batch' }], default: [] })
  enrolledBatches: Types.ObjectId[];

  @Prop({ default: true })
  active: boolean;
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);
