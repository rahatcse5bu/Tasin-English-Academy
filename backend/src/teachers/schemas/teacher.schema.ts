import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Teacher {
  @Prop({ required: true })
  name: string;

  @Prop()
  nameBn?: string;

  @Prop({ required: true })
  designation: string; // e.g., "HSC English Instructor"

  @Prop()
  designationBn?: string;

  @Prop()
  bio?: string;

  @Prop()
  bioBn?: string;

  @Prop()
  photoUrl?: string;

  @Prop({ type: [String], default: [] })
  subjects: string[]; // e.g., ['HSC English 1st', 'HSC English 2nd', 'ICT']

  @Prop()
  qualification?: string;

  @Prop()
  qualificationBn?: string;

  @Prop()
  experienceYears?: number;

  @Prop()
  email?: string;

  @Prop()
  phone?: string;

  @Prop({ default: true })
  active: boolean;

  @Prop({ default: 0 })
  displayOrder: number;
}

export type TeacherDocument = Teacher & Document;
export const TeacherSchema = SchemaFactory.createForClass(Teacher);
